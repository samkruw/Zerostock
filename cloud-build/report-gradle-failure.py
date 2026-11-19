"""Publish a bounded Gradle failure summary as GitHub Actions annotations."""
import re
import sys
from pathlib import Path

lines = Path(sys.argv[1]).read_text(errors='replace').splitlines()
summary = []
capture = False
for line in lines:
    line = re.sub(r'\x1b\[[0-9;]*m', '', line)
    if '* What went wrong:' in line:
        capture = True
        continue
    if capture and line.startswith('* Try:'):
        break
    if capture and line.strip():
        summary.append(line)
if not summary:
    summary = [line for line in lines if re.search(r'exception|error|failure|could not', line, re.I)][-10:]
for line in summary[:12] or ['No Gradle failure summary was emitted; inspect the build log.']:
    message = line[:500].replace('%', '%25').replace('\r', '%0D')
    print('::error::Native Gradle: ' + message)
