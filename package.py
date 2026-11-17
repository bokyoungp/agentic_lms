#!/usr/bin/env python3
"""핸즈온 폴더에 가이드와 도우미 서버를 복사한다.
사용:  python package.py <핸즈온 폴더>      예) python package.py ../agentic-ai-handson
결과:  <핸즈온 폴더>/guide/index.html, <핸즈온 폴더>/guide/server/*"""
import shutil, subprocess, sys
from pathlib import Path
root = Path(__file__).resolve().parent
if len(sys.argv) != 2: sys.exit(__doc__)
dest = Path(sys.argv[1]).resolve() / 'guide'
subprocess.run([sys.executable, str(root / 'build.py')], check=True)
(dest / 'server').mkdir(parents=True, exist_ok=True)
shutil.copy(root / 'out' / 'index.html', dest / 'index.html')
for f in ['bot_server.py', 'agent.py', 'llm.py', 'tools.py', 'admin.html', 'kb.json', '.env.example', 'README.md']:
    shutil.copy(root / 'server' / f, dest / 'server' / f)
print('복사 완료:', dest)
