"""Render real app views with in-memory fixtures and all external traffic blocked.

This tests visual readability, not Firebase authentication or stock operations.
Requires the same Playwright installation as web-smoke.py.
"""
import argparse
import functools
import http.server
import json
import os
import threading
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, default=Path.cwd())
parser.add_argument('--screenshots', type=Path)
args = parser.parse_args()


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


server = http.server.ThreadingHTTPServer(
    ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(args.root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'
failures = []
checks = 0

# Removing the legacy theme must restore readable text on the actual rendered
# cards/headers. Check computed colors, including inherited and gradient surfaces.
contrast = r"""selector => {
    const rgba = value => {
        const n = value.match(/[\d.]+/g).map(Number);
        return [n[0], n[1], n[2], n[3] ?? 1];
    };
    const mix = (a,b) => a.slice(0,3).map((v,i) => v*a[3]+b[i]*(1-a[3]));
    const background = e => {
        if (!e) return [6,11,20];
        const s=getComputedStyle(e), under=background(e.parentElement);
        const stops=s.backgroundImage.match(/rgba?\([^)]*\)/g);
        return mix(rgba(stops?.[0] || s.backgroundColor), under);
    };
    const luminance = rgb => rgb.map(v => v/255).map(v =>
        v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4)
        .reduce((n,v,i) => n+v*[.2126,.7152,.0722][i],0);
    return [...document.querySelectorAll(selector)].filter(e =>
        e.getClientRects().length && getComputedStyle(e).visibility!=='hidden'
    ).map(e => {
        const s=getComputedStyle(e), bg=background(e);
        const fg=mix(rgba(s.color), bg);
        const a=luminance(fg), b=luminance(bg);
        return {text:e.textContent.trim().slice(0,70),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
}"""

try:
    with sync_playwright() as p:
        options = {'headless': True}
        if os.environ.get('ZS_CHROMIUM_PATH'):
            options['executable_path'] = os.environ['ZS_CHROMIUM_PATH']
        browser = p.chromium.launch(**options)
        for label, width, height in [('phone',393,800), ('small-phone',360,740),
                                     ('tablet',768,1024), ('desktop',1440,1000),
                                     ('landscape',852,393), ('android-insets',393,800)]:
            context = browser.new_context(viewport={'width':width,'height':height},
                                          locale='de-CH', service_workers='block')
            context.route('**/*', lambda route: route.continue_()
                          if urlsplit(route.request.url).netloc == urlsplit(url).netloc
                          else route.abort())
            page = context.new_page()
            page.goto(url, wait_until='networkidle')
            page.locator('#authLogin.active').wait_for()
            if label == 'android-insets':
                page.evaluate("""() => {
                    document.documentElement.style.setProperty('--safe-area-inset-top','32px');
                    document.documentElement.style.setProperty('--safe-area-inset-bottom','24px');
                }""")
            page.evaluate("""async () => {
                S.firebase=null; S.db=null; S.connected=false;
                S.user={uid:'local-ui-fixture',name:'UI Prüfung',role:'admin'};
                S.cartons=[
                    {id:'fixture-a',article:'1094',name:'Karton klein',location:'01-10',stock:104,min:10,warn:15},
                    {id:'fixture-b',article:'0970',name:'Versandkarton mit langer Bezeichnung',location:'01-00',stock:221,min:200,warn:250},
                    {id:'fixture-c',article:'1182',name:'Karton gross',location:'02-10',stock:3,min:10,warn:15}];
                S.instructions=[{id:'fixture-instruction',name:'TINST Beispiel',description:'Lokale UI Prüfung',version:'1.0',active:true,materials:[{cartonId:'fixture-a',qty:2}]}];
                S.movements=[]; unlock(); render(); await renderTasks();
            }""")
            for view in ['more', 'tasks', 'cartons', 'planner', 'settings', 'dashboard']:
                page.evaluate('(view) => show(view)', view)
                selected = f'#{view}View'
                results = page.evaluate(contrast, selected+' .ph h3, '+selected+' .ph small, '+
                    selected+' td, '+selected+' .moreMenu b, '+selected+' .moreMenu small, '+
                    selected+' .taskCard b, '+selected+' .taskCard small, '+
                    selected+' .taskStat small, '+selected+' .card strong, '+
                    selected+' .result b, '+selected+' .note')
                checks += len(results)
                for result in results:
                    if result['ratio'] < 4.5:
                        failures.append(f"{label}/{view}: contrast {result['ratio']:.2f}: {result['text']}")
                if view == 'more':
                    separated = page.locator('.moreMenu button').first.evaluate("""e => {
                        const b=e.querySelector('b').getBoundingClientRect();
                        const s=e.querySelector('small').getBoundingClientRect();
                        return s.top >= b.bottom-1;
                    }""")
                    checks += 1
                    if not separated:
                        failures.append(label+': menu title and description run together')
                if view == 'cartons':
                    page.locator('#cartonSearch').fill('Karton klein')
                    assert page.locator('#cartonRows tr').count() == 1
                    page.locator('#cartonSearch').fill('')
                    assert page.locator('#cartonRows tr').count() == 3
                    checks += 2
                if page.evaluate('document.documentElement.scrollWidth > innerWidth+1'):
                    failures.append(label+'/'+view+': page overflows horizontally')
                checks += 1
                if args.screenshots and label in ['phone','desktop'] and view in ['more','tasks','cartons']:
                    args.screenshots.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(args.screenshots / f'{label}-{view}.png'), full_page=True)
            page.evaluate("show('cartons'); document.getElementById('installBar').classList.add('show')")
            checks += 1
            if page.locator('#installBar').evaluate("e => getComputedStyle(e).position") == 'fixed':
                failures.append(label+': installation prompt floats over the working area')
            page.locator('#installDismiss').click()
            assert not page.locator('#installBar').is_visible()
            checks += 1
            if label == 'android-insets':
                checks += 1
                if page.locator('.mobileBrand').bounding_box()['y'] < 32:
                    failures.append('Android: header overlaps status-bar inset')
            if label == 'desktop':
                checks += 1
                rail = page.locator('aside').bounding_box()
                icon = page.locator('#nav button span:last-child').first.bounding_box()
                if icon['x']+icon['width'] > rail['x']+rail['width']:
                    failures.append('Desktop: navigation icons clipped by collapsed sidebar')
            context.close()
        browser.close()
finally:
    server.shutdown()

print(json.dumps({'checks':checks,'failures':len(failures),'external_traffic':'blocked',
                  'authentication':'not_tested','stock_writes':False}))
for failure in failures[:30]:
    print(failure)
raise SystemExit(1 if failures else 0)
