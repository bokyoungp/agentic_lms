# 프로젝트 개요

SKALA 1일 교육 "Agentic AI 핸즈온 (승승장구몰 Planner-Worker)"용 학습 가이드(LMS 역할)와, 그 위에 붙는 AI 도우미 에이전트 서버이다.
수강자 약 20명, 강사 1명(보조 없음), 네트워크가 불안정할 수 있는 교실이 전제이다. 수강자가 막힌 부분을 스스로 풀게 돕는 것이 목적이다.
이 프로젝트는 수강자에게 보여 줄 샘플 코드이기도 하다. 코드는 수업 내용(Function Calling, ReAct 루프, Worker 분리, 검증)과 대응되게 읽기 쉽게 유지한다.

# 구조

- `src/content1.js` 일정, 사전 준비, 시작 준비 / `content2.js` 단계 01~09(개념, TODO와 3단계 힌트, 확인 기준, 막힘 예측, 퀴즈) / `content3.js` 증상 42건, 진단 트리, 설계 시트, 루브릭
- `src/app.js` 라우터와 화면 / `src/bot_part.js` AI 도우미 패널(빌드 때 app.js의 `/*BOT*/` 자리에 끼워진다) / `src/style.css`
- `build.py` 위 파일을 합쳐 `out/index.html`(외부 의존 없는 단일 파일)을 만들고, `src/export_kb.js`로 `server/kb.json`을 만든다
- `server/` 표준 라이브러리만 쓰는 Python 서버. `tools.py`(조회 도구, 힌트 공개 규칙) / `agent.py`(판단-행동-관찰 루프, 도움 모드 판정, 최종 검증) / `llm.py`(OpenAI, Anthropic, mock 어댑터와 설정) / `bot_server.py`(HTTP, 제한, 로그, 강사 설정) / `admin.html`
- `tests/` playwright 기반 시험. `package.py`는 핸즈온 폴더의 `guide/`로 복사한다

# 명령

- 빌드: `python build.py` (Node 필요)
- 서버 실행: `python server/bot_server.py` (기본 포트 8787, 제공자 기본값 mock)
- 전체 시험: `python tests/run_all.py` (`pip install -r requirements-dev.txt` 후 `playwright install chromium`. 크롬 경로를 쓰려면 환경변수 `CHROME_PATH`)
- 핸즈온에 반영: `python package.py <핸즈온 폴더>`

콘텐츠나 코드를 고친 뒤에는 반드시 빌드하고 전체 시험을 돌린다. 시험이 설정과 로그를 건드리지 않도록 `BOT_DATA_DIR`을 쓴다.

# 지켜야 할 원칙

- 가이드는 오프라인 단일 HTML이다. 외부 CDN, 외부 폰트, 외부 요청을 넣지 않는다. localStorage는 try/catch로 감싼다.
- 모든 사용자 노출 문구는 한국어 평서체(~다)이고 이모지를 쓰지 않는다. 확실하지 않은 정보는 "확인이 필요하다"로 표시한다.
- API 키는 서버에만 둔다. 브라우저로 보내거나 로그에 남기지 않는다. `.env`, `logs/`, `bot_config.json`은 커밋하지 않는다.
- 힌트 공개 규칙, 키 마스킹, 호출 제한 같은 규칙은 프롬프트가 아니라 코드(`tools.py`, `agent.py`, `bot_server.py`)가 지킨다.
- 에이전트 응답은 정답 코드를 통째로 주지 않는다. 열린 힌트 단계까지만 안내한다.
- 증상 DB의 `src`가 '예측'인 항목은 강사 확인 전 항목이다. 확인 없이 '가이드'로 바꾸지 않는다.
- 증상 ID를 바꾸거나 지우면 `content2.js`의 `top`, `content3.js`의 `TREE` 참조도 함께 맞춘다.
- 수업 내용은 코드가 기준이다. 자료 사이에 값이 다르면(예: Intent 값 3개와 4개, `errors`와 `problems`) 핸즈온 코드에 맞춘다.
- OpenAI 기본 모델명은 임시값이다. 사용 전 확인이 필요하다.

# 남은 작업

1. 실제 OpenAI/Claude 키로 같은 질문 비교 시험(강사 설정 화면의 연결 시험 사용)
2. 강사 검토함: 근거 부족, 15분 이상, 환경 문제일 때 AI 초안을 저장하고 강사가 고쳐 개별로 전달(초안/전달됨 상태 분리)
3. 공통 보충 설명: 질문 로그 집계로 투사 화면의 공통 막힘 Top 3를 대체
4. 오후 자료(피드백, 웹훅 전달, 환경 복구) 반영은 자료 확인 후 결정
5. 단계별 시각이 정해지면 "현재 단계" 표시를 교시 기준에서 바꾼다
