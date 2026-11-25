"""Exercise the cold-start presentation in the actual Web/Android assets."""
import argparse
import functools
import http.server
import os
import threading
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def test_launch(browser, base, width, height):
    context = browser.new_context(viewport={'width': width, 'height': height}, service_workers='block')
    context.route('**/*',lambda route: route.continue_() if urlsplit(route.request.url).netloc == urlsplit(base).netloc else route.abort())
    context.add_init_script("""
        window.launchObservations = [];
        new MutationObserver(() => {
          const screen=document.getElementById('launchScreen');
          if (!screen || screen.hidden || window.launchObservations.length) return;
          window.launchObservations = [...screen.querySelectorAll('.launchPart')].map(part=>getComputedStyle(part).animationName);
        }).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    """)
    page = context.new_page()
    page.goto(base,wait_until='commit')
    page.locator('#launchSkip').wait_for()
    assert page.evaluate('window.launchObservations.join()') == 'launchBase,launchBridge,launchUpper'
    assert page.locator('#launchSkip').bounding_box()['height'] >= 44
    page.locator('#launchScreen').wait_for(state='hidden',timeout=4000)
    assert page.locator('#authLogin.active').is_visible()
    page.reload(wait_until='domcontentloaded')
    assert page.locator('#launchScreen').is_hidden()
    assert page.evaluate('window.launchObservations.length') == 0
    page.evaluate("sessionStorage.removeItem('zs-launch-shown')")
    page.goto(base+'?box=example-label',wait_until='domcontentloaded')
    assert page.locator('#launchScreen').is_hidden()
    assert page.evaluate('window.launchObservations.length') == 0
    page.emulate_media(reduced_motion='reduce')
    page.goto(base,wait_until='domcontentloaded')
    assert page.locator('#launchScreen').is_hidden()
    assert page.evaluate('window.launchObservations.length') == 0
    page.emulate_media(reduced_motion='no-preference')
    page.reload(wait_until='commit')
    page.locator('#launchSkip').click()
    assert page.locator('#launchScreen').is_hidden()
    page.evaluate("sessionStorage.removeItem('zs-launch-shown')")
    page.reload(wait_until='commit')
    page.locator('#launchSkip').wait_for()
    page.keyboard.press('Escape')
    assert page.locator('#launchScreen').is_hidden()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    context.close()


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    args=parser.parse_args()
    handler=functools.partial(QuietHandler,directory=str(args.root))
    with http.server.ThreadingHTTPServer(('127.0.0.1',0),handler) as server, sync_playwright() as p:
        thread=threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        browser=p.chromium.launch(executable_path=os.environ.get('ZS_CHROMIUM_PATH'),headless=True)
        for width,height in [(360,780),(1440,960)]:
            test_launch(browser,f'http://127.0.0.1:{server.server_port}/',width,height)
        browser.close()
        server.shutdown()
    print('Brand startup passed on mobile and desktop, including reduced motion, skip, session reload and direct shelf links.')
