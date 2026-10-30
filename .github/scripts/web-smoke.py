import argparse
import functools
import hashlib
import http.server
import json
import os
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urljoin

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url')
args = parser.parse_args()
root = Path.cwd()
expected = json.loads((root / 'web-release.json').read_text())
stage = 'start'
server = None
report = {'version': '5.0.0', 'authenticated': 'not_run_missing_credentials', 'stock_writes': False}

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

try:
    if args.url:
        assert args.url == 'https://samkruw.github.io/Zerostock/'
        url = args.url
    else:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(root)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as playwright:
        options = {'headless': True}
        if os.environ.get('ZS_CHROMIUM_PATH'):
            options['executable_path'] = os.environ['ZS_CHROMIUM_PATH']
        if os.environ.get('HTTPS_PROXY'):
            options['proxy'] = {'server': os.environ['HTTPS_PROXY'], 'bypass': '127.0.0.1,localhost'}
        browser = playwright.chromium.launch(**options)
        for label, viewport in [('desktop', {'width': 1440, 'height': 1000}), ('mobile', {'width': 393, 'height': 852})]:
            context = browser.new_context(viewport=viewport, locale='de-CH', is_mobile=label == 'mobile', has_touch=label == 'mobile')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda _: errors.append(True))
            stage = label + ':published-assets'
            deadline = time.monotonic() + (300 if args.url else 10)
            while True:
                try:
                    response = context.request.get(urljoin(url, 'web-release.json') + '?qa=' + expected['source_commit'], timeout=20000)
                    assert response.ok and response.json() == expected
                    break
                except Exception:
                    if time.monotonic() >= deadline:
                        raise AssertionError('Expected V5 deployment was not available within the readiness deadline')
                    time.sleep(10)
            for name, digest in expected['files'].items():
                response = context.request.get(urljoin(url, name) + '?qa=' + expected['source_commit'])
                assert response.ok and hashlib.sha256(response.body()).hexdigest() == digest
            stage = label + ':firebase-bootstrap'
            page.goto(url, wait_until='networkidle')
            page.locator('#authLogin.active').wait_for(timeout=45000)
            assert page.locator('#gateLoginError').inner_text() == ''
            assert page.evaluate('Boolean(S.firebase?.auth)')
            assert page.evaluate('S.firebase.auth.app.options.projectId') == 'zerostock-c5f5f'
            assert page.locator('meta[name="app-version"]').get_attribute('content') == '5.0.0'
            assert page.evaluate('ZeroStockUpdates.currentVersion()') == '5.0.0'
            assert page.evaluate('ZeroStockUpdates.isNewer("5.0.0", "5.0.0-rc.1")')
            stage = label + ':service-worker'
            page.wait_for_function('Boolean(navigator.serviceWorker.controller)', timeout=45000)
            assert 'zerostock-v5.0.0' in page.evaluate('caches.keys()')
            stage = label + ':login-validation'
            page.locator('#gateLogin').click()
            assert 'E-Mail und Passwort' in page.locator('#gateLoginError').inner_text()
            assert not errors
            report[label] = 'passed'
            if label == 'desktop' and os.environ.get('ZEROSTOCK_TEST_EMAIL') and os.environ.get('ZEROSTOCK_TEST_PASSWORD'):
                stage = 'authenticated-login'
                page.locator('#gateEmail').fill(os.environ['ZEROSTOCK_TEST_EMAIL'])
                page.locator('#gatePassword').fill(os.environ['ZEROSTOCK_TEST_PASSWORD'])
                page.locator('#gateLogin').click()
                page.wait_for_function('Boolean(S.user) && !document.getElementById("appShell").classList.contains("locked")', timeout=45000)
                page.wait_for_function('S.connected === true', timeout=45000)
                stage = 'authorized-data-read'
                assert page.evaluate('''async () => {
                    const F=S.firebase;
                    const paths=S.user.role==='customer'?['instructions','customerSummary']:['cartons','instructions','movements'];
                    for (const path of paths) await F.get(F.ref(S.db,path));
                    return true;
                }''')
                report['authenticated'] = 'login_and_role_reads_passed'
            context.close()
        browser.close()
    print('::notice::Web smoke: ' + json.dumps(report, separators=(',', ':')))
except Exception as error:
    # Do not print exception call logs: a form-fill traceback can contain credentials.
    print(f'::error::Web smoke failed at {stage} ({type(error).__name__}); private form values and tokens suppressed.')
    sys.exit(1)
finally:
    if server:
        server.shutdown()
