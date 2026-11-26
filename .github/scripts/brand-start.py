"""Check that the first launch plays to completion on the actual web/app assets."""
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


OBSERVE_START = """
  window.startAudit = {shown: false, started: 0, ended: 0};
  new MutationObserver(() => {
    const screen = document.getElementById('launchScreen');
    if (!screen) return;
    if (screen.open) {
      startAudit.shown = true;
      if (screen.classList.contains('playing') && !startAudit.started) {
        startAudit.started = performance.now();
        startAudit.motion = getComputedStyle(screen.querySelector('.launchBase')).animationName;
        startAudit.backdrop = getComputedStyle(screen.querySelector('.launchBackdrop')).animationName;
      }
    } else if (startAudit.started && !startAudit.ended) {
      startAudit.ended = performance.now();
    }
  }).observe(document, {subtree:true, childList:true, attributes:true, attributeFilter:['open','class']});
"""


def wait_for_completion(page, reduced=False):
    page.wait_for_function('window.startAudit.ended > 0', timeout=7000)
    audit = page.evaluate('window.startAudit')
    assert audit['ended'] - audit['started'] >= 1500, audit
    assert audit['motion'] == ('none' if reduced else 'launchAssemble')
    assert audit['backdrop'] == 'none'
    assert page.locator('#launchScreen').is_hidden()


def test_launch(browser, base, viewport, phone):
    context = browser.new_context(viewport=viewport, has_touch=phone, is_mobile=phone,
                                  locale='de-CH', service_workers='block')
    external_requests = []
    def route_request(route):
        if urlsplit(route.request.url).netloc == urlsplit(base).netloc:
            route.continue_()
        else:
            external_requests.append(route.request.url)
            route.abort()
    context.route('**/*', route_request)
    context.add_init_script(OBSERVE_START)
    page = context.new_page()
    page.goto(base, wait_until='commit')
    modal = page.locator('#launchScreen:modal')
    modal.wait_for()
    assert 'firebase' not in modal.inner_text().lower()

    # An interrupted launch must not count as a completed session.
    page.reload(wait_until='commit')
    modal.wait_for()
    assert modal.locator('button, a, input, [role="button"]').count() == 0
    if phone:
        page.touchscreen.tap(20, 120)
    page.mouse.click(20, 120)
    for key in ['Escape', 'Tab', 'Enter', 'Space']:
        page.keyboard.press(key)
        assert modal.is_visible(), f'{key} dismissed the launch'
    assert not page.evaluate("Boolean(document.activeElement.closest('#authGate, #appShell, #mobileBottom'))")
    wait_for_completion(page)
    page.locator('#authLogin.active').wait_for()
    assert page.evaluate("S.firebase.auth.app.options.projectId === 'zerostock-c5f5f'")
    assert not any('gstatic.com/firebasejs' in url for url in external_requests)
    page.locator('#gateEmail').click()
    assert page.locator('#gateEmail').evaluate('el => el === document.activeElement')

    page.reload(wait_until='domcontentloaded')
    assert not page.evaluate('startAudit.shown')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
    context.close()

    # A fresh label link keeps its destination. Reduced motion shows a static mark
    # for the same interval and receives the same modal input protection.
    context = browser.new_context(viewport=viewport, reduced_motion='reduce', service_workers='block')
    context.route('**/*',route_request)
    context.add_init_script(OBSERVE_START)
    page = context.new_page()
    page.goto(base + '?box=example-label', wait_until='commit')
    page.locator('#launchScreen:modal').wait_for()
    page.keyboard.press('Escape')
    assert page.locator('#launchScreen:modal').is_visible()
    wait_for_completion(page, reduced=True)
    assert page.evaluate("new URLSearchParams(location.search).get('box')") == 'example-label'
    context.close()


def test_sign_in_messages(browser, base):
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    context.add_init_script(OBSERVE_START)
    held = []
    context.route('**/native-firebase.js', lambda route: held.append(route))
    page = context.new_page()
    page.goto(base, wait_until='commit')
    wait_for_completion(page)
    assert len(held) == 1
    assert page.locator('#authLoading:visible').inner_text() == 'Anmeldung wird vorbereitet …'
    held.pop().continue_()
    page.locator('#authLogin.active').wait_for()

    # Exercise the actual access-check failure and retry without a production account.
    page.evaluate("""async () => {
      const user = {uid: 'fixture'};
      S.firebase = {auth: {currentUser: user}, getDatabase() {throw Error('Firebase SDK fixture');}};
      await connectDb(user);
    }""")
    access = page.locator('#authNoRole:visible')
    assert 'Zugriff derzeit nicht möglich' in access.inner_text()
    page.locator('#gateRetryRole').click()
    assert not any(word in access.inner_text().lower() for word in ('sdk', 'firebase', 'uid', 'fixture'))
    context.close()

    context = browser.new_context(service_workers='block')
    context.add_init_script("localStorage.setItem('zs-lang', 'en')")
    context.route('**/native-firebase.js', lambda route: route.abort())
    context.route('https://www.gstatic.com/**', lambda route: route.abort())
    page = context.new_page()
    page.goto(base, wait_until='domcontentloaded')
    page.locator('#launchScreen').wait_for(state='hidden')
    message = page.locator('#gateLoginError:visible').inner_text()
    assert 'Check your connection' in message and 'firebase' not in message.lower() and 'sdk' not in message.lower()
    context.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    args = parser.parse_args()
    handler = functools.partial(QuietHandler, directory=str(args.root))
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server, sync_playwright() as p:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        browser = p.chromium.launch(executable_path=os.environ.get('ZS_CHROMIUM_PATH'), headless=True)
        for width, height in [(360, 780), (1440, 960)]:
            test_launch(browser, f'http://127.0.0.1:{server.server_port}/',
                        {'width': width, 'height': height}, width < 500)
        test_sign_in_messages(browser, f'http://127.0.0.1:{server.server_port}/')
        browser.close()
        server.shutdown()
    print('Startup, input isolation, label links, reduced motion and sign-in messages passed.')
