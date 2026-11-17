/* 콘텐츠 1: 기본 정보, 시간표, 사전 준비, 시작 준비 */
var META = {
  title: 'Agentic AI 핸즈온 학습 가이드',
  sub: '승승장구몰 Planner–Worker · 1일 8시간 실습',
  key: 'agentic-lms-v1'
};

/* 시간표: 덱 3장. 50분 수업 + 10분 휴식, 8교시 뒤 17:40~18:00 정리·Q&A */
var SLOTS = [
  {n:'1교시', s:'09:00', e:'09:50', steps:['01','02'], out:'환경 점검 완료, 상담원 페르소나 설정'},
  {n:'2교시', s:'10:00', e:'10:50', steps:['02','03'], out:'상품 검색 Tool 및 함수 선언부'},
  {n:'3교시', s:'11:00', e:'11:50', steps:['04','05'], out:'직접 구현한 ReAct 반복 루프'},
  {n:'점심', s:'11:50', e:'13:00', steps:[], out:'점심식사 70분 (기관 일정에 따라 조정될 수 있음)', lunch:true},
  {n:'4교시', s:'13:00', e:'13:50', steps:['05','06'], out:'LangChain 기반 단일 Tool 에이전트'},
  {n:'5교시', s:'14:00', e:'14:50', steps:['06','07'], out:'상태 기반 분기 그래프'},
  {n:'6교시', s:'15:00', e:'15:50', steps:['07','08'], out:'역할별 Worker 3종 구현'},
  {n:'7교시', s:'16:00', e:'16:50', steps:['08'], out:'Planner–Worker 통합 에이전트'},
  {n:'8교시', s:'17:00', e:'17:40', steps:['08','09'], out:'최종 시나리오 시연 및 실무 설계서'},
  {n:'정리', s:'17:40', e:'18:00', steps:[], out:'정리와 Q&A', wrap:true}
];

var GOALS = [
  ['Gemini API로 상담원의 페르소나(말투)와 대화 기억을 직접 구현한다','단계 02 실행 결과'],
  ['모델은 함수 호출을 제안하고, 실제 실행은 내 코드가 담당하는 구조를 코드로 설명한다','단계 03 함수 인자·결과 JSON'],
  ['ReAct 루프를 직접 구현하고, LangChain의 create_agent 구조와 비교·대응시킨다','단계 04~05 실행 로그'],
  ['LangGraph로 상태(State)·조건부 분기·멀티턴 대화를 구성한다','단계 06 노드 전후 State 변화'],
  ['Planner–Worker 아키텍처를 완성하고 핵심 시나리오로 동작을 검증한다','단계 07~09 시나리오 테스트'],
  ['내 실무 과제 1건에 대한 에이전트 설계서를 작성하고 설계 근거를 설명한다','설계 시트 및 루브릭 점검']
];

var ASSIGNMENTS = [
  {n:'과제 1', steps:'02 ~ 05', out:'외부 도구를 호출해 응답하는 쇼핑 질의 에이전트'},
  {n:'과제 2', steps:'06 ~ 07', out:'상태(State) 관리와 조건부 분기가 적용된 Worker 워크플로'},
  {n:'과제 3', steps:'08 ~ 09', out:'복합 요청을 분해·검증·실행하는 Planner–Worker 통합 시스템'}
];

/* LLM 제공자별 .env 변수 이름. 가이드의 키·모델 안내는 모두 이 표를 쓴다.
   Gemini는 핸즈온 코드의 값이다. OpenAI 이름은 핸즈온 코드가 정해지기 전의 임시값이므로
   확인이 필요하다. 코드와 맞춘 뒤에는 이 표만 고친다. */
var LLM = {
  gemini: {name:'Gemini', key:'GEMINI_API_KEY', model:'GEMINI_MODEL'},
  openai: {name:'OpenAI', key:'OPENAI_API_KEY', model:'OPENAI_MODEL'}
};

/* 사전 준비 */
var PREWORK = {
  env: [
    {id:'pw-env-1', t:'Python 3.10 이상과 VS Code를 준비한다', d:'설치 권한이 없으면 담당자에게 문의한다. 대체 환경(Google Colab, GitHub Codespaces)은 인터넷 연결이 필요하다.'},
    {id:'pw-env-2', t:'실습 폴더를 VS Code로 열고 가상환경을 만든다', d:'Windows: python -m venv .venv 후 .venv\\Scripts\\activate / macOS·Linux: python3 -m venv .venv 후 source .venv/bin/activate. 활성화되면 터미널 줄 앞에 (.venv)가 보인다.', cmd:[['Windows','python -m venv .venv\n.venv\\Scripts\\activate'],['macOS / Linux','python3 -m venv .venv\nsource .venv/bin/activate']]},
    {id:'pw-env-3', t:'필수 패키지를 설치한다', d:'requirements.txt에 고정된 버전으로만 설치한다. 인터넷의 구버전 예제와 섞지 않는다.', cmd:[['공통','pip install -r requirements.txt']]},
    {id:'pw-env-4', t:'.env.example을 .env로 복사하고 API 키를 넣는다', d:LLM.gemini.key+'= 뒤에 교육기관이 발급한 키를 붙여넣는다. OpenAI 키를 쓰는 경우에는 '+LLM.openai.key+'= 뒤에 넣고 모델은 '+LLM.openai.model+'로 맞춘다 (변수 이름과 제공자를 고르는 방법은 핸즈온 코드와 맞춰야 하므로 확인이 필요하다). 따옴표와 공백은 넣지 않는다. .env는 다른 사람에게 보내거나 공유 폴더에 올리지 않는다.', cmd:[['Windows','copy .env.example .env'],['macOS / Linux','cp .env.example .env']]},
    {id:'pw-env-5', t:'python check_env.py를 실행해 모두 [OK]인지 확인한다', d:'모두 [OK]이면 --ping으로 키가 실제로 통신하는지 한 번 더 확인한다. [확인 필요]가 있으면 아래 \'check_env 결과 읽기\'를 본다.', cmd:[['공통','python check_env.py\npython check_env.py --ping']]}
  ],
  diag: [
    {id:'pw-diag-1', q:'order = {"id": "ORD-1", "items": [{"name": "A"}, {"name": "B"}]} 일 때 print([i["name"] for i in order["items"]])의 출력은?'},
    {id:'pw-diag-2', q:'기본값이 있는 인자(def f(x, limit=3):)를 호출할 때 limit을 생략하면 어떻게 되는가?'},
    {id:'pw-diag-3', q:'JSON 파일을 읽어 파이썬 딕셔너리로 바꾸는 코드를 써 본다. (json 모듈 사용 가능)'},
    {id:'pw-diag-4', q:'try / except는 어떤 상황에서 쓰는가? 한 문장으로 설명해 본다.'},
    {id:'pw-diag-5', q:'ChatGPT·Gemini 같은 LLM을 업무에 써 본 경험을 한두 줄로 적는다. (없으면 "없음")'}
  ],
  pydantic: {
    code: 'from typing import Literal, Optional\nfrom pydantic import BaseModel, Field\n\nclass Intent(BaseModel):\n    intent: Literal["product_search", "order_status", "other"]   # 허용된 값만 가능\n    keywords: list[str]                                          # 문자열 목록\n    note: Optional[str] = Field(default=None, description="없어도 되는 값")\n\nok = Intent(intent="order_status", keywords=["ORD-1001"])\nprint(ok.model_dump())                    # 딕셔너리로\nprint(Intent.model_validate_json(\'{"intent": "other", "keywords": []}\'))   # JSON 문자열을 객체로\ntry:\n    Intent(intent="refund", keywords=[])  # 허용되지 않은 값 -> ValidationError\nexcept Exception as e:\n    print(type(e).__name__)',
    tries: [
      {id:'pw-py-1', t:'Literal에 허용값을 하나 더 추가해 본다'},
      {id:'pw-py-2', t:'일부러 잘못된 값을 넣어 오류 메시지를 읽어 본다'},
      {id:'pw-py-3', t:'Optional 필드를 빼고 인스턴스를 만들어 본다'}
    ],
    note: '단계 02에서는 이 예시에 policy 값을 더한 4개 값(product_search, order_status, policy, other)을 쓴다. 허용값을 늘려 보는 첫 번째 연습이 그대로 단계 02의 TODO 3이 된다.'
  },
  envRead: [
    ['[확인 필요] Python 3.10 이상','Python 버전이 낮다. 3.10 이상을 설치하거나 python3 명령으로 다시 확인한다.','env_py'],
    ['[확인 필요] (패키지명) 설치','가상환경이 켜져 있는지 보고 pip install -r requirements.txt를 다시 실행한다.','env_pkg'],
    ['[확인 필요] import langchain.agents 등','패키지 버전이 requirements.txt와 다르다. 같은 명령으로 다시 설치한다.','env_import_create_agent'],
    ['[확인 필요] .env 파일 존재','.env.example을 복사해 .env를 만든다.','env_cfg_sys'],
    ['[확인 필요] '+LLM.gemini.key+' 설정','.env의 '+LLM.gemini.key+'= 뒤에 키를 넣는다. OpenAI를 쓰면 '+LLM.openai.key+'= 뒤에 넣는다. 따옴표와 공백을 넣지 않는다.','env_key'],
    ['[확인 필요] data/*.json','실습 폴더 전체가 복사되었는지, 폴더를 VS Code 최상위로 열었는지 확인한다.','path_config'],
    ['[확인 필요] LLM 호출 (404)','.env의 '+LLM.gemini.model+'(OpenAI는 '+LLM.openai.model+')을 강사가 알려 준 모델 이름으로 바꾼다.','env_model404'],
    ['[확인 필요] LLM 호출 (429)','잠시 뒤 다시 해 보고, 계속되면 도움을 요청한다.','env_429']
  ],
  fallback: [
    ['설치 권한이 없다','Google Colab 또는 GitHub Codespaces를 쓸 수 있다. 인터넷 연결이 필요하므로, 교육장 네트워크 상황을 강사에게 먼저 확인한다.'],
    ['인터넷 없이 실습해야 한다','LLM_MODE=replay로 단계 06~09는 키와 네트워크 없이 실행할 수 있다. 단계 02~05는 실제 LLM 호출이 필요해 실행할 수 없으므로 강사의 시연과 가이드의 기대 출력으로 따라간다.'],
    ['키를 아직 받지 못했다','replay로 단계 06~09를 먼저 진행할 수 있다. 02~05는 키가 있어야 한다. 도움 요청 카드로 강사에게 알린다.']
  ]
};

/* 시작 준비 */
var START = {
  checks: [
    {id:'st-1', t:'가상환경이 켜져 있다 ((.venv) 표시)'},
    {id:'st-2', t:'python check_env.py 결과가 모두 [OK]다'},
    {id:'st-3', t:'python check_env.py --ping 결과가 [OK]다 (단계 02 이후 필요)'},
    {id:'st-4', t:'.env의 모델 이름('+LLM.gemini.model+', OpenAI는 '+LLM.openai.model+')을 강사가 안내한 이름으로 맞췄다'},
    {id:'st-5', t:'.env 파일을 화면에 띄우거나 다른 사람에게 보내지 않기로 했다'},
    {id:'st-6', t:'이 가이드와 터미널·에디터를 한 화면에 나란히 둘 수 있게 창을 정리했다'},
    {id:'st-7', t:'상태 표시(상단 색 띠) 규칙과 스티커 신호를 이해했다'}
  ],
  ladder: [
    ['1층','스스로 해결','증상 검색, 진단 트리, 힌트를 단계별로 연다','5~7분'],
    ['2층','짝과 확인','짝과 화면을 비교하고, 먼저 끝난 사람(파란 상태)에게 묻는다','3분'],
    ['3층','체크포인트 합류','solution 파일과 내 코드를 비교하거나 교체해 다음 단계에 합류한다','바로'],
    ['4층','강사 호출','도움 요청 카드를 작성하고 스티커를 붙여 기다린다','필요할 때']
  ],
  signals: [
    ['working','진행 중','노란색','정상 진행 중. 호출하지 않는다.'],
    ['stuck','스스로 해결 중','주황색','막혔지만 1~2층을 시도하는 중. 강사는 방문하지 않는다.'],
    ['help','도움 필요','빨간색','1~3층을 거쳤고 강사가 필요하다. 도움 요청 카드를 함께 둔다.'],
    ['done','단계 완료','초록색','현재 단계의 확인 기준을 모두 통과했다.'],
    ['helper','도와줄 수 있음','파란색','먼저 끝나서 옆 사람을 도울 수 있다. 정답 코드를 대신 쓰지 않고 질문으로 돕는다.']
  ],
  tools: [
    ['도움 요청 신호','스티커를 붙여 알리면 강사가 자리로 찾아가 화면을 함께 확인한다. 같은 지점에서 여러 명이 막히면 전체 화면으로 해결 방법을 공유한다. (신호 체계는 수업 시작 때 강사가 정한다)'],
    ['체크포인트 코드','solution 폴더의 파일은 모두 배포되어 있다. 코드가 꼬이면 해당 단계의 solution 파일과 비교하거나 교체해 다음 단계에 합류할 수 있다. 먼저 힌트와 비교를 시도하는 것을 권한다.'],
    ['replay 모드','LLM_MODE=replay로 설정하면 저장된 모델 응답으로 단계 06~09를 키와 네트워크 없이 실행한다. 단계 02~05는 사용할 수 없다.'],
    ['보충 카드','타입 힌트·데코레이터(단계 05 직전), TypedDict·Annotated(단계 06 직전)는 해당 실습 직전에 3~5분간 짚는다. 이 가이드의 각 단계 페이지에도 들어 있다.']
  ],
  replaySentences: [
    '10만 원 이하 운동화 2개 추천해줘',
    'ORD-1001 배송 상태 알려줘',
    'ORD-1001 배송 확인하고 10만 원 이하 운동화 2개 추천해줘',
    'ORD-9999 주문 조회해줘',
    '반품은 어떻게 해?'
  ],
  folders: [
    ['starter/','빈칸(TODO)이 있는 시작 코드. 여기서 작업한다. 힌트는 02~03 상, 04~06 중, 07~08 하 수준'],
    ['solution/','정답이자 체크포인트'],
    ['broken/','의도적으로 오류가 있는 예제 4종(03, 04, 06, 08). 실행하기 전에 결과를 먼저 예측한다'],
    ['tests/run_scenarios.py','5가지 시나리오 자동 점검 (단계 08~09)'],
    ['design_sheet/','설계 시트 양식, 예시, 루브릭 (이 가이드의 설계 시트 화면에서도 작성 가능)'],
    ['data/, tools.py','모의 데이터(상품·주문·정책)와 조회 함수. 조회 기능만 사용한다'],
    ['replay/, replay.py','LLM 응답을 저장해 재생하는 오프라인 비상용 모드'],
    ['declarations.py, lc_tools.py, workers.py','체크포인트 모듈. 단계 03, 05, 07의 결과물이다']
  ],
  made: {
    request: 'ORD-1001 배송 확인하고 10만 원 이하 운동화 2개 추천해줘',
    steps: ['Planner가 복합 요청을 2개의 독립된 작업으로 분해한다: ① 주문 조회 ② 상품 추천','Worker가 맡은 작업을 독립적으로 실행한다: Order Worker · Product Worker','Synthesizer가 결과를 취합해 정해진 양식으로 응답한다'],
    answer: '[주문] ORD-1001: 배송 중 (도착 예정 2026-11-18)\n[추천] 에어러너 라이트 운동화 69,000원 (평점 4.5); 데일리 쿠션 러닝화 89,000원 (평점 4.3)'
  }
};
