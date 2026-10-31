import argparse
import hashlib
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path

APK_URL = 'https://github.com/samkruw/Zerostock/releases/download/v5.0.2/ZeroStock-v5.0.2.apk'
APK_SHA = '848989395eb783869d0b0b94895dab3242bb45ce03e06551dc075473b05fee9d'
parser = argparse.ArgumentParser()
parser.add_argument('--apk', type=Path)
args = parser.parse_args()
root = Path.cwd()
manifest = json.loads((root / 'web-release.json').read_text())
assert manifest['version'] == '5.0.2'
assert manifest['source_apk'] == APK_URL and manifest['source_apk_sha256'] == APK_SHA
with tempfile.TemporaryDirectory(prefix='zerostock-web-assets-') as temporary:
    apk = args.apk or Path(temporary) / 'release.apk'
    if args.apk is None:
        subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', '--max-time', '60', APK_URL, '-o', str(apk)], check=True)
    assert hashlib.sha256(apk.read_bytes()).hexdigest() == APK_SHA
    expected = {}
    with zipfile.ZipFile(apk) as archive:
        for info in archive.infolist():
            if info.filename.startswith('assets/public/') and not info.is_dir():
                name = info.filename.removeprefix('assets/public/')
                data = archive.read(info)
                digest = hashlib.sha256(data).hexdigest()
                assert (root / name).read_bytes() == data, f'Web/APK mismatch: {name}'
                expected[name] = digest
    assert manifest['files'] == expected
assert (root / '.nojekyll').exists()
assert 'content="5.0.2"' in (root / 'index.html').read_text()
print(f'Canonical V5 web assets verified: {len(expected)} files, identical to the signed Final APK.')
