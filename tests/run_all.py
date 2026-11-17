#!/usr/bin/env python3
"""전체 시험: 서버(도구, 어댑터, 제한) -> 도우미 패널 UI -> 정적 가이드 UI. 하나라도 FAIL이면 종료 코드 1."""
import os, subprocess, sys
from pathlib import Path
here = Path(__file__).resolve().parent
bad = 0
# 한국어 Windows(cp949)에서도 자식 프로세스의 한글 출력을 읽을 수 있게 UTF-8로 맞춘다.
env = dict(os.environ, PYTHONUTF8='1')
for name in ['server_test.py', 'bot_ui.py', 'ui_static.py']:
    print('=== ' + name, flush=True)
    r = subprocess.run([sys.executable, str(here / name)], capture_output=True, text=True, encoding='utf-8', errors='replace', env=env)
    out = r.stdout + r.stderr
    fails = [l for l in out.splitlines() if l.startswith('FAIL') or 'Traceback' in l or l.startswith('ERRORS: [(') or 'page errors: [\'' in l]
    print('PASS %d건' % (sum(1 for l in out.splitlines() if l.startswith('PASS')) or sum(1 for l in out.splitlines() if l.startswith('ERRORS: []'))), '| 실패:', fails or '없음')
    if fails or r.returncode: bad = 1; print(out[-1500:])
sys.exit(bad)
