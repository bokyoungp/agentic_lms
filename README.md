# agentic-lms

Agentic AI 핸즈온 학습 가이드와 AI 도우미 서버. 개발 방법과 원칙은 `CLAUDE.md`를 본다.

    python build.py                         # out/index.html, server/kb.json 생성
    python server/bot_server.py             # 도우미 서버 (http://127.0.0.1:8787/, 설정: /admin)
    pip install -r requirements-dev.txt && playwright install chromium
    python tests/run_all.py                 # 전체 시험
    python package.py ../agentic-ai-handson # 핸즈온 폴더에 guide/ 복사
