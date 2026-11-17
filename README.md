# agentic-lms

Agentic AI 핸즈온 학습 가이드와 AI 도우미 서버. 개발 방법과 원칙은 `CLAUDE.md`를 본다.

    uv sync                                       # .venv 생성과 시험용 패키지 설치
    uv run playwright install chromium            # 시험용 브라우저 (처음 한 번)
    uv run python build.py                        # out/index.html, server/kb.json 생성
    uv run python server/bot_server.py            # 도우미 서버 (http://127.0.0.1:8787/, 설정: /admin)
    uv run python tests/run_all.py                # 전체 시험
    uv run python package.py ../agentic-ai-handson   # 핸즈온 폴더에 guide/ 복사
