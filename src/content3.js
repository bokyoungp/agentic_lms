/* 콘텐츠 3: 증상 DB, 진단 트리, 설계 시트, 루브릭, 수업 이후, 강사용 */
var SYMPTOMS = [
 /* 환경 */
 {id:'env_py', step:['01'], title:'python 명령을 찾을 수 없다 / Python 버전이 낮다', sig:['not recognized','command not found','python3','3.9','3.8'], kw:['python','파이썬','버전','명령','찾을 수 없'], cause:'Python이 설치되지 않았거나 PATH에 없다. macOS·Linux는 명령이 python3일 수 있다. 버전이 3.10 미만일 수 있다.', fix:['python --version (또는 python3 --version)으로 버전을 확인한다','3.10 미만이면 3.10 이상을 설치한다. 설치 권한이 없으면 도움을 요청한다','macOS·Linux에서는 python 대신 python3를 쓴다'], src:'예측'},
 {id:'env_ps', step:['01'], title:'Windows PowerShell에서 가상환경 활성화(.venv\\Scripts\\activate)가 막힌다', sig:['running scripts is disabled','ExecutionPolicy','실행할 수 없'], kw:['powershell','activate','활성화','스크립트','실행 정책','venv'], cause:'PowerShell의 스크립트 실행 정책이 막고 있다.', fix:['명령 프롬프트(cmd)를 열어 같은 명령을 실행한다','또는 PowerShell 창에서 Set-ExecutionPolicy -Scope Process RemoteSigned 를 실행한 뒤 다시 활성화한다 (현재 창에만 적용된다)','회사 정책으로 막혀 있으면 무리하게 바꾸지 않고 도움을 요청한다'], src:'예측'},
 {id:'env_venv', step:['01'], title:'가상환경이 켜졌는지 모르겠다', sig:[], kw:['가상환경','venv','.venv','활성화'], cause:'활성화되면 터미널 줄 앞에 (.venv)가 보인다. 없다면 켜지지 않은 상태다.', fix:['터미널 줄 앞에 (.venv)가 있는지 본다','없으면 활성화 명령을 다시 실행한다 (Windows: .venv\\Scripts\\activate, macOS·Linux: source .venv/bin/activate)','VS Code를 새로 열었다면 터미널도 새로 열어 활성화한다'], src:'예측'},
 {id:'env_pip', step:['01'], title:'pip install이 실패하거나 멈춘다 (시간 초과, SSL 오류)', sig:['Could not find a version','ReadTimeout','SSLError','Connection','proxy','ProxyError'], kw:['pip','install','설치','시간 초과','ssl','프록시','사내망'], cause:'사내망의 프록시나 방화벽이 패키지 저장소 접속을 막고 있을 수 있다. 가상환경이 아닌 곳에 설치하려는 경우도 있다.', fix:['가상환경이 켜져 있는지 먼저 확인한다','오류 메시지의 마지막 5줄을 확인하고 한 번 더 실행한다','계속 실패하면 네트워크 정책 문제일 수 있으므로 오류 화면을 캡처해 강사나 담당자에게 알린다 (확인 필요)'], src:'예측'},
 {id:'env_modnf', step:['01','02','03','04','05','06','07','08'], title:'ModuleNotFoundError: No module named ... (google, langgraph, langchain 등)', sig:['ModuleNotFoundError','No module named'], kw:['module','모듈','import','google','langgraph','langchain','pydantic','dotenv'], cause:'가상환경이 꺼져 있거나 VS Code가 다른 파이썬을 쓰고 있어 패키지가 보이지 않는다.', fix:['터미널 줄 앞에 (.venv)가 있는지 확인한다','VS Code 우측 하단(또는 명령 팔레트)에서 .venv의 파이썬을 인터프리터로 선택한다','pip install -r requirements.txt 를 다시 실행한다','python check_env.py 로 어떤 패키지가 [확인 필요]인지 본다'], src:'예측'},
 {id:'env_pkg', step:['01'], title:'check_env: [확인 필요] 패키지 설치', sig:['확인 필요','설치','pip install -r requirements.txt'], kw:['check_env','패키지','설치'], cause:'가상환경이 꺼져 있거나 패키지가 설치되지 않았다.', fix:['가상환경이 켜져 있는지 본다 ((.venv) 표시)','pip install -r requirements.txt 를 다시 실행한다'], src:'가이드'},
 {id:'env_key', step:['01','02'], title:'GEMINI_API_KEY가 없다 / .env 파일에 키가 없다', sig:['GEMINI_API_KEY','.env 파일에','키가 없어요','.env.example'], kw:['키','api key','env','환경변수'], cause:'.env 파일이 없거나 키가 비어 있다.', fix:['.env.example을 .env로 복사한다','교육기관이 발급한 키를 GEMINI_API_KEY= 뒤에 붙여넣는다 (따옴표·공백 없이)','.env 파일은 다른 사람에게 보내거나 공유 폴더에 올리지 않는다'], src:'가이드'},
 {id:'env_cfg_sys', step:['01','02'], title:'SystemExit: .env 파일에 ... (또는 .env가 없다)', sig:['SystemExit','.env'], kw:['.env','systemexit','복사'], cause:'.env가 없거나 키가 비어 있다.', fix:['.env.example을 복사해 .env를 만든다','키를 넣고 저장한다','파일 이름이 .env.txt가 아닌지 확인한다 (Windows에서 확장자 숨김 주의)'], src:'가이드'},
 {id:'api_key_invalid', step:['02'], title:'API key not valid', sig:['API key not valid','API_KEY_INVALID','invalid api key'], kw:['api key','키','유효'], cause:'키를 잘못 넣었다.', fix:['.env의 값을 다시 확인한다. 따옴표와 공백 없이 키만 넣는다','키를 복사할 때 앞뒤 공백이 붙지 않았는지 본다','저장 후 터미널에서 다시 실행한다'], src:'가이드'},
 {id:'env_model404', step:['01','02'], title:'404 model not found / 모델 이름 오류', sig:['404','model not found','is not found','NOT_FOUND'], kw:['모델','404','model'], cause:'모델 이름이 바뀌었거나 오타다. 모델 이름은 계속 바뀐다.', fix:['.env의 GEMINI_MODEL을 강사가 안내한 이름으로 바꾼다 (한 줄만 바꾸면 된다)','저장한 뒤 다시 실행한다'], src:'가이드'},
 {id:'env_429', step:['01','02','03','04','05','07','08'], title:'429 / RESOURCE_EXHAUSTED (호출 한도 초과)', sig:['429','RESOURCE_EXHAUSTED','quota','rate limit'], kw:['429','한도','quota','너무 많'], cause:'한도가 프로젝트 단위로 적용되어 여러 명이 동시에 호출하면 발생할 수 있다.', fix:['잠시(30초~1분) 기다린 뒤 한 번 다시 실행한다. 연타하지 않는다','max_steps를 불필요하게 크게 쓰지 않았는지 본다','계속되면 상태를 \'도움 필요\'로 바꾸고 도움 요청 카드를 쓴다 (기관 키 발급 방식은 확인 필요)'], src:'가이드'},
 {id:'net_timeout', step:['02','03','04','05','07','08'], title:'연결 오류 / 시간 초과 (ConnectError, Timeout, 응답이 오지 않음)', sig:['ConnectError','Timeout','timed out','ConnectionError','Connection reset','getaddrinfo'], kw:['연결','네트워크','인터넷','시간 초과','응답이 없','멈춘'], cause:'교육장 네트워크가 불안정하거나 막혀 있을 수 있다.', fix:['브라우저로 아무 사이트나 열어 인터넷이 되는지 확인한다','잠시 뒤 한 번 다시 실행한다','계속되면 도움을 요청한다. 단계 02~05는 replay로 대체할 수 없다. 단계 06~09는 LLM_MODE=replay로 계속 진행할 수 있다'], src:'예측'},
 {id:'replay_live', step:['02','03','04','05'], title:'이 단계는 실제 Gemini 호출이 필요해요. LLM_MODE=live로 바꿔 주세요.', sig:['LLM_MODE=live','실제 Gemini 호출이 필요'], kw:['replay','live','LLM_MODE'], cause:'.env가 LLM_MODE=replay로 되어 있다. replay는 단계 06~09 전용이다.', fix:['단계 02~05를 할 때는 .env의 LLM_MODE=live로 바꾼다','저장 후 다시 실행한다'], src:'가이드'},
 {id:'replay_miss', step:['07','08','09'], title:'replay에 없는 요청이에요', sig:['replay에 없는 요청','ReplayMiss'], kw:['replay','없는 요청'], cause:'replay 모드는 지정된 5개 문장에서만 동작한다.', fix:['시작 준비 화면의 5개 문장을 한 글자도 바꾸지 않고 그대로 입력한다','자유 입력을 하려면 .env의 LLM_MODE=live로 바꾸고 키와 네트워크를 확인한다'], src:'가이드'},
 {id:'path_config', step:['02','03','04','05','06','07','08'], title:'ModuleNotFoundError: No module named config / data 파일을 찾을 수 없다', sig:["No module named 'config'",'No module named config','FileNotFoundError'], kw:['config','경로','폴더','찾을 수 없','FileNotFound'], cause:'실습 폴더의 최상위에서 실행하지 않았거나 파일 상단의 sys.path 두 줄을 지웠다.', fix:['VS Code에서 실습 폴더를 최상위로 열고, 터미널 위치가 그 폴더인지 확인한다','python starter/02_gemini_api.py 처럼 폴더 이름과 함께 실행한다','파일 상단 \'이 두 줄은 건드리지 않습니다\' 부분이 지워지지 않았는지 본다'], src:'예측'},
 {id:'todo_left', step:['02','03','04','05','06','07','08'], title:'NotImplementedError: TODO n / 값이 \'...\' 로 나온다', sig:['NotImplementedError','TODO','"..."'], kw:['TODO','NotImplementedError','채우지','pass'], cause:'TODO를 아직 채우지 않았거나 raise NotImplementedError 줄이 남아 있다.', fix:['오류 메시지에 적힌 TODO 번호를 찾아 채운다','단계 04처럼 \'위 raise를 지운 뒤\' 같은 안내가 있는지 TODO 주석을 끝까지 읽는다','TODO 힌트를 1단계부터 연다'], src:'예측'},
 {id:'syntax', step:['02','03','04','05','06','07','08'], title:'SyntaxError / IndentationError', sig:['SyntaxError','IndentationError','unexpected indent','invalid syntax'], kw:['문법','들여쓰기','괄호','따옴표'], cause:'괄호·따옴표 짝이 맞지 않거나 들여쓰기가 어긋났다.', fix:['오류 메시지에 나온 줄 번호와 바로 윗줄을 본다','여는 괄호와 따옴표가 모두 닫혔는지 확인한다','들여쓰기는 같은 깊이를 스페이스 4칸으로 통일한다. 탭과 스페이스를 섞지 않는다'], src:'예측'},
 /* 02 */
 {id:'json_parse', step:['02','08'], title:'JSON 파싱 오류 (model_validate_json 오류)', sig:['JSONDecodeError','model_validate_json','Invalid JSON','validation error'], kw:['json','파싱','스키마'], cause:'response_mime_type과 response_schema 설정이 누락되었다.', fix:['config에 response_mime_type="application/json" 과 response_schema=Intent 두 줄이 모두 있는지 확인한다','Intent 모델의 허용값과 필드 이름을 확인한다'], src:'가이드'},
 /* 03 */
 {id:'fc_none', step:['03'], title:'function_calls가 비어 있다 (None)', sig:["'NoneType' object is not subscriptable",'function_calls','NoneType'], kw:['function_calls','none','비어','호출이 안','도구를 안 부'], cause:'모델이 함수 호출 없이 바로 답했다.', fix:['선언의 description과 질문 표현을 점검한다. 언제 쓰는 함수인지 분명히 쓴다','시스템 지시에 \'반드시 도구를 활용해 조회한다\'는 문장을 넣는다'], src:'가이드'},
 {id:'fc_typeerror', step:['03','04','05'], title:"TypeError: unexpected keyword argument", sig:['unexpected keyword argument'], kw:['typeerror','keyword','인자','매개변수'], cause:'스키마(선언)의 인자 이름과 실제 파이썬 함수의 매개변수 이름이 다르다.', fix:['선언의 properties 이름을 함수 시그니처와 똑같이 맞춘다','오류 메시지에 나온 인자 이름을 tools.py의 함수와 비교한다'], src:'가이드'},
 {id:'fc_float', step:['03'], title:'max_price가 100000.0 (실수)으로 온다', sig:['100000.0'], kw:['실수','float','max_price'], cause:'숫자가 실수로 전달된다.', fix:['함수 안에서 int(max_price)로 바꾼다 (tools.py는 이미 처리되어 있다)'], src:'가이드'},
 {id:'fc_noresult', step:['03','04'], title:'답에 함수 실행 결과가 반영되지 않는다', sig:[], kw:['결과','반영','function_response','최종 답'], cause:'function_response를 쌓지 않았다.', fix:['모델의 제안(content)과 실행 결과(function_response)를 둘 다 contents에 쌓았는지 확인한다','5단계 흐름표의 4번(결과를 모델에 돌려준다)을 코드에서 찾는다'], src:'가이드'},
 /* 04 */
 {id:'loop_infinite', step:['04'], title:'무한 반복: 같은 호출이 계속 나온다', sig:[], kw:['무한','반복','계속','같은 호출','멈추지'], cause:'종료 조건이 없거나 도구 결과를 contents에 쌓지 않았다.', fix:['for step in range(1, max_steps + 1) 로 반복 상한이 있는지 확인한다','도구 실행 결과를 contents에 쌓았는지 확인한다','Ctrl+C로 중단한다'], src:'가이드'},
 {id:'loop_keyerror', step:['04'], title:"KeyError: 'xxx' (TOOL_FUNCS)", sig:['KeyError','TOOL_FUNCS'], kw:['keyerror','TOOL_FUNCS','도구 이름'], cause:'모델이 존재하지 않는 도구 이름을 불렀다.', fix:['TOOL_FUNCS[call.name] 앞에서 이름이 등록되어 있는지 검사한다','없으면 오류 메시지를 {"error": ...}로 \'관찰\' 결과로 돌려준다'], src:'가이드'},
 {id:'loop_400', step:['04'], title:'두 번째 호출에서 400 오류', sig:['400','INVALID_ARGUMENT'], kw:['400','두 번째','invalid'], cause:'모델의 제안(content)을 contents에 쌓지 않았다.', fix:['contents.append(response.candidates[0].content) 가 빠지지 않았는지 확인한다','도구 결과를 쌓기 전에 모델의 제안을 먼저 쌓는지 순서를 확인한다'], src:'가이드'},
 {id:'loop_empty', step:['04'], title:'최종 답이 비어 있다', sig:[], kw:['최종 답','비어','빈','text'], cause:'마지막 응답이 텍스트가 아니다.', fix:['calls가 비었는지 먼저 본다','response.text를 출력해 확인한다'], src:'가이드'},
 /* 05 */
 {id:'env_import_create_agent', step:['05'], title:"ImportError: cannot import name 'create_agent'", sig:['cannot import name','create_agent'], kw:['create_agent','import','langchain','버전'], cause:'구버전 langchain이 설치되어 있다.', fix:['가상환경이 켜져 있는지 확인한다','pip install -r requirements.txt 를 다시 실행한다 (requirements.txt에 고정된 버전을 쓴다)','pip list 로 langchain 버전을 확인한다. 라이브러리 버전은 강의 직전 리허설에서 고정된다'], src:'예측'},
 {id:'lc_oldexample', step:['05'], title:'인터넷 예제 코드가 동작하지 않는다 (AgentExecutor, initialize_agent, create_react_agent)', sig:['AgentExecutor','initialize_agent','create_react_agent','google-generativeai','ChatVertexAI'], kw:['예제','구버전','agentexecutor','예전'], cause:'검색한 예제가 구버전 문법이다.', fix:['\'예전 예제 vs 오늘 쓰는 것\' 표로 구분한다: from langchain.agents import create_agent, google-genai','예제의 발행일과 import 줄을 먼저 확인한다','requirements.txt의 버전 외에는 설치하지 않는다'], src:'가이드'},
 /* 06 */
 {id:'graph_empty', step:['06','08'], title:'answer가 비어 있다 (오류 없음)', sig:[], kw:['answer','비어','빈','값이 없','누락','오류 없이'], cause:'노드가 돌려준 딕셔너리의 키 이름이 State와 다르다 (예: anwser).', fix:['stream_mode="updates"로 각 노드가 바꾼 키를 확인한다','State 정의의 키 이름과 노드가 돌려주는 키를 한 글자씩 비교한다','고장 난 예제 06과 같은 증상이다'], src:'가이드'},
 {id:'graph_recursion', step:['06','08'], title:'GraphRecursionError / 그래프가 끝나지 않는다', sig:['GraphRecursionError','recursion limit'], kw:['recursion','끝나지','반복'], cause:'END로 가는 경로가 빠졌다. (08에서는 worker_step 뒤 분기가 끝으로 가지 않는 경우)', fix:['분기 함수가 돌려주는 모든 노드에 END로 향하는 엣지가 있는지 확인한다','08: 남은 작업이 없을 때 synthesize로 가는지, synthesize와 fail이 END로 이어지는지 확인한다'], src:'가이드'},
 {id:'graph_thread', step:['06'], title:'ValueError: ... thread_id', sig:['thread_id','checkpointer'], kw:['thread_id','체크포인터','configurable'], cause:'checkpointer를 쓰면서 thread_id를 주지 않았다.', fix:['invoke에 config={"configurable": {"thread_id": ...}} 를 넘긴다'], src:'가이드'},
 {id:'graph_overwrite', step:['06'], title:'이전 메시지가 덮어써진다', sig:[], kw:['덮어','메시지','add_messages','누적'], cause:'messages에 reducer를 붙이지 않았다.', fix:['messages: Annotated[list, add_messages] 로 바꾼다'], src:'가이드'},
 {id:'graph_memory', step:['06'], title:'\'그 주문\'을 기억하지 못한다', sig:[], kw:['그 주문','기억','멀티턴'], cause:'두 호출의 thread_id가 다르거나, 첫 호출에서 classify가 order_id를 State에 저장하지 않았다.', fix:['두 호출의 thread_id가 같은지 본다','classify가 order 의도일 때 {"intent": "order", "order_id": 번호}를 돌려주는지 본다','stream_mode="updates"로 첫 호출 뒤 order_id가 State에 남는지 확인한다'], src:'예측'},
 /* 07 */
 {id:'w_product_empty', step:['07'], title:'Product Worker의 ok가 False이거나 data가 비어 있다', sig:[], kw:['product','worker','ok','false','count','비어'], cause:'search_products ToolMessage를 잘못 꺼냈거나 도구가 호출되지 않았다.', fix:['result["messages"]에서 name이 search_products인 마지막 ToolMessage를 찾아 print로 확인한다','ToolMessage의 content를 json.loads로 읽는다','replay 모드라면 replay.product_args(query)의 인자로 search_products를 직접 호출한다'], src:'예측'},
 {id:'w_graph_start', step:['07'], title:'Worker 분기 그래프의 시작 연결을 모르겠다', sig:[], kw:['start','분기','조건부','worker 그래프'], cause:'조건부 엣지를 START에서 바로 걸 수 있다는 점이 낯설다.', fix:['builder.add_conditional_edges(START, route) 형태로 건다','route는 task["worker"] 값에 따라 노드 이름을 돌려준다','세 노드에서 모두 END로 잇는다'], src:'예측'},
 /* 08 */
 {id:'p_one_result', step:['08'], title:'실행 결과가 1개만 남는다', sig:[], kw:['결과','1개','하나만','results','덮어'], cause:'results에 reducer가 없어 덮어쓴다.', fix:['AgentState의 results가 Annotated[list, operator.add]인지 확인한다','worker_step이 results에 리스트 하나를 돌려주는지 확인한다: {"results": [result], ...}'], src:'가이드'},
 {id:'p_recursion', step:['08'], title:'GraphRecursionError (08)', sig:['GraphRecursionError'], kw:['recursion','반복','끝나지'], cause:'worker_step 뒤 분기가 끝으로 가지 않는다.', fix:['more_tasks가 idx가 작업 수에 도달하면 synthesize를 돌려주는지 확인한다','idx를 worker_step에서 1 증가시키는지 확인한다','fail → END, synthesize → END 엣지를 확인한다'], src:'가이드'},
 {id:'p_validation', step:['08'], title:'ValidationError (Plan)', sig:['ValidationError','Plan'], kw:['validationerror','plan','스키마'], cause:'모델 응답이 스키마와 다르다.', fix:['response_schema=Plan 설정과 Pydantic 모델의 필드 이름을 확인한다','Params, Task, Plan의 필드가 설명대로 있는지 확인한다'], src:'가이드'},
 {id:'p_diff_plan', step:['08','09'], title:'Planner가 실행마다 다른 계획을 낸다', sig:[], kw:['계획','다른','매번','달라'], cause:'모델은 비결정적이다.', fix:['validate 단계가 비정상 계획을 걸러내는지 확인한다','시연할 때는 .env의 LLM_MODE=replay를 사용해 일관성을 확보한다'], src:'가이드'},
 {id:'p_big_todo', step:['08'], title:'TODO 3의 함수 7개를 어디서부터 쓸지 모르겠다', sig:[], kw:['TODO 3','함수','노드','7개','어디서부터'], cause:'한 덩어리로 보면 크다.', fix:['planner → validate → after_validate 순으로 하나씩 쓴다','먼저 validate_plan을 단독으로 실행해 본다','worker_step → more_tasks → synthesize 순으로 이어서 쓴다','20분 이상 같은 곳이라면 체크포인트와 비교한다'], src:'예측'},
 {id:'p_scenario_fail', step:['08','09'], title:'시나리오 테스트가 일부만 실패한다', sig:['FAIL','실패'], kw:['시나리오','테스트','run_scenarios','통과'], cause:'특정 시나리오의 기대 구조와 다르다.', fix:['실패한 시나리오 번호의 \'확인 포인트\'를 읽는다 (08·09 화면의 시나리오 표)','시나리오 3이면 계획에 order와 product가 모두 있는지, 답에 [주문]과 [추천]이 있는지','시나리오 5면 worker가 \'refund\'일 때 Worker가 실행되지 않고 재시도 2회 뒤 실패 안내가 나오는지','replay 모드에서 5개가 모두 통과하는지 먼저 확인한다'], src:'예측'},
 {id:'synth_sections', step:['08','09'], title:'답에 [주문] / [추천] 줄이 나오지 않는다', sig:['[주문]','[추천]'], kw:['주문','추천','합치','synthesize','형식'], cause:'synthesize가 results를 Worker별로 나누어 줄을 만들지 않았다.', fix:['results를 하나씩 돌며 worker 값에 따라 [주문], [추천], [안내] 접두어를 붙이는지 확인한다','없는 주문번호일 때는 \'찾을 수 없어요\' 안내 줄을 쓴다'], src:'예측'}
];

/* 진단 트리 */
var TREE = {
 root:{q:'지금 상황에 가장 가까운 것은?', o:[
   ['실행하자마자 빨간 오류 메시지가 나온다','err'],
   ['오류는 없는데 결과가 비어 있거나 이상하다','weird'],
   ['실행할 때마다 결과가 조금씩 다르다','nondet'],
   ['실행이 멈춘 듯 아무 반응이 없다','hang'],
   ['환경 설치 자체가 안 된다','envq'],
   ['어디서부터 해야 할지 모르겠다','lost'],
   ['다 했는데 맞는지 모르겠다','verify']]},
 err:{q:'오류 메시지의 마지막 줄(오류 이름)이 무엇인가?', o:[
   ['ModuleNotFoundError / ImportError','leaf_mod'],
   ['API key not valid / 404 / 429','leaf_api'],
   ['SystemExit / .env 관련','leaf_env'],
   ['NotImplementedError: TODO','leaf_todo'],
   ['SyntaxError / IndentationError','leaf_syntax'],
   ['TypeError / KeyError / AttributeError / ValidationError','leaf_runtime'],
   ['GraphRecursionError','leaf_recursion'],
   ['위에 없다 / 읽어도 모르겠다','leaf_read']]},
 weird:{q:'지금 어느 구간인가?', o:[['단계 02~05 (Gemini API 호출)','leaf_weird_llm'],['단계 06 (그래프, LLM 없음)','leaf_weird_graph'],['단계 07~09 (Worker, Planner)','leaf_weird_pw']]},
 envq:{q:'어디에서 막히는가?', o:[['python 명령이 없거나 버전이 낮다','leaf_pyenv'],['가상환경 활성화가 안 된다','leaf_venvq'],['pip install이 실패한다','leaf_pipq'],['check_env에서 [확인 필요]가 나온다','leaf_checkenv']]},
 leaves:{
  leaf_mod:{title:'모듈을 찾지 못한다', steps:['터미널 줄 앞에 (.venv)가 있는지 확인한다','VS Code에서 .venv의 파이썬을 인터프리터로 선택했는지 확인한다','pip install -r requirements.txt 를 다시 실행한다','python check_env.py 로 [확인 필요] 항목을 본다','ImportError: cannot import name create_agent 라면 langchain 버전 문제다'], sym:['env_modnf','env_import_create_agent','env_pkg'], tier:'self'},
  leaf_api:{title:'API 호출 오류', steps:['API key not valid: .env의 키에서 따옴표·공백을 제거한다','404 model not found: .env의 GEMINI_MODEL을 강사가 안내한 이름으로 바꾼다','429: 30초~1분 기다린 뒤 한 번 다시 실행한다 (연타하지 않는다)','저장하고 다시 실행해도 같으면 도움 요청 카드를 쓴다'], sym:['api_key_invalid','env_model404','env_429'], tier:'self'},
  leaf_env:{title:'.env 관련 오류', steps:['.env.example을 .env로 복사했는지 확인한다','파일 이름이 .env 그대로인지 확인한다 (.env.txt 아님)','GEMINI_API_KEY= 뒤에 키가 있는지 확인한다','LLM_MODE가 단계에 맞는지 확인한다 (02~05는 live, 06~09는 replay도 가능)'], sym:['env_key','env_cfg_sys','replay_live'], tier:'self'},
  leaf_todo:{title:'TODO를 채우지 않았다', steps:['오류 메시지에 적힌 TODO 번호를 찾는다','그 TODO의 힌트를 1단계부터 연다','단계 04는 raise NotImplementedError 줄을 지운 뒤 TODO 2를 작성한다'], sym:['todo_left'], tier:'self'},
  leaf_syntax:{title:'문법 오류', steps:['오류 메시지의 줄 번호와 바로 윗줄을 본다','괄호와 따옴표가 모두 닫혔는지 확인한다','들여쓰기를 스페이스 4칸으로 통일한다'], sym:['syntax'], tier:'self'},
  leaf_runtime:{title:'실행 중 오류 (TypeError, KeyError 등)', steps:['오류 메시지의 줄 번호를 보고 해당 줄 근처를 읽는다','TypeError unexpected keyword argument: 선언의 인자 이름과 함수 매개변수 이름을 맞춘다 (단계 03)','KeyError TOOL_FUNCS: 도구 이름 검사 후 오류를 관찰로 돌려준다 (단계 04)','ValidationError (Plan): response_schema와 필드 이름을 확인한다 (단계 08)','그래도 모르면 증상 검색에 오류 메시지를 붙여넣는다'], sym:['fc_typeerror','loop_keyerror','p_validation'], tier:'self'},
  leaf_recursion:{title:'그래프가 끝나지 않는다', steps:['분기 함수가 돌려주는 모든 노드에 END 엣지가 있는지 확인한다','08이라면 worker_step 뒤 분기가 남은 작업이 없을 때 synthesize로 가는지 확인한다','synthesize와 fail이 END로 이어지는지 확인한다'], sym:['graph_recursion','p_recursion'], tier:'self'},
  leaf_read:{title:'오류 메시지 읽는 법', steps:['오류 화면의 맨 아래 줄이 오류 이름과 이유다. 거기부터 읽는다','그 위의 줄에서 내 파일 이름(starter/…py)과 줄 번호를 찾는다','오류 이름이나 문장 일부를 증상 검색에 붙여넣는다','5~7분 안에 해결되지 않으면 짝에게 화면을 보여 준다'], sym:[], tier:'peer'},
  leaf_weird_llm:{title:'단계 02~05에서 결과가 이상하다', steps:['함수 호출이 안 된다면: description과 질문 표현을 점검하고 시스템 지시에 \'도구로 조회한다\'를 넣는다 (단계 03)','결과가 답에 반영되지 않는다면: 모델의 제안과 function_response를 모두 contents에 쌓았는지 본다 (단계 03·04)','같은 호출이 반복된다면: max_steps와 결과 누적을 확인한다 (단계 04)','로그를 print로 찍어 어디까지 정상인지 확인한다'], sym:['fc_none','fc_noresult','loop_infinite','loop_empty'], tier:'self'},
  leaf_weird_graph:{title:'단계 06에서 값이 비어 있다', steps:['노드가 돌려주는 키 이름이 State와 같은지 한 글자씩 비교한다 (고장 난 예제 06과 같은 증상)','stream_mode="updates"로 각 노드가 바꾼 키를 확인한다','thread_id가 같은 호출끼리 같은 값인지 확인한다','messages에 add_messages가 붙어 있는지 확인한다'], sym:['graph_empty','graph_memory','graph_overwrite'], tier:'self'},
  leaf_weird_pw:{title:'단계 07~09에서 결과가 이상하다', steps:['results가 1개만 남는다면: Annotated[list, operator.add]를 확인한다','Worker 결과가 비어 있다면: ToolMessage에서 JSON을 제대로 꺼냈는지 확인한다','시나리오가 일부만 실패한다면: 08·09 화면의 시나리오 표에서 확인 포인트를 읽는다','replay에서 \'없는 요청\'이 나오면 지정된 5개 문장을 그대로 입력한다'], sym:['p_one_result','w_product_empty','p_scenario_fail','replay_miss'], tier:'self'},
  nondet:{title:'실행할 때마다 결과가 다르다', steps:['LLM이 관여하는 부분(Planner, Product Worker)은 실행마다 조금씩 달라질 수 있다. 정상이다','문장이 아니라 구조(어떤 Worker가 호출되었는가, 순서)를 비교한다','시연이나 테스트는 .env의 LLM_MODE=replay로 안정화한다 (단계 06~09)'], sym:['p_diff_plan'], tier:'self'},
  hang:{title:'실행이 멈춘 듯 반응이 없다', steps:['10~20초 기다린다. 모델 응답에 시간이 걸릴 수 있다','계속 반응이 없으면 Ctrl+C로 중단한다','브라우저로 인터넷이 되는지 확인하고 한 번 다시 실행한다','무한 루프라면 max_steps와 결과 누적을 확인한다 (단계 04)','같은 곳에서 반복되면 도움 요청 카드를 쓴다'], sym:['net_timeout','loop_infinite'], tier:'self'},
  lost:{title:'어디서부터 해야 할지 모르겠다', steps:['이 가이드의 현재 단계 페이지에서 \'목표\'와 \'확인 기준\'을 먼저 읽는다','\'사전 점검\' 질문 두 개에 한 줄씩 답을 써 본다','TODO 1부터 힌트 1단계를 연다','파일을 실행해 현재 어디까지 되는지 확인한다','10분 안에 시작점을 찾지 못하면 짝에게 묻는다'], sym:[], tier:'peer'},
  verify:{title:'다 했는데 맞는지 모르겠다', steps:['단계 페이지의 \'확인 기준\'을 하나씩 체크한다','기대 출력과 내 출력이 같은 모양인지 비교한다 (표현은 조금 달라도 된다)','단계 08~09는 python tests/run_scenarios.py 로 확인한다','이해 확인 문항을 풀어 본다','통과하면 상태를 \'단계 완료\'로 바꾸고 다음 단계로 간다'], sym:[], tier:'self'},
  leaf_pyenv:{title:'Python이 없거나 버전이 낮다', steps:['python --version (또는 python3 --version)을 실행한다','3.10 미만이면 3.10 이상이 필요하다','설치 권한이 없으면 도움을 요청한다. 대체 환경은 인터넷 연결이 필요하다'], sym:['env_py'], tier:'instructor'},
  leaf_venvq:{title:'가상환경 활성화가 안 된다', steps:['Windows PowerShell이라면 cmd에서 같은 명령을 시도한다','활성화되면 줄 앞에 (.venv)가 보인다','VS Code를 새로 열었다면 터미널도 새로 연다'], sym:['env_ps','env_venv'], tier:'self'},
  leaf_pipq:{title:'pip install이 실패한다', steps:['가상환경이 켜져 있는지 확인한다','오류 화면의 마지막 5줄을 확인하고 한 번 더 실행한다','계속 실패하면 네트워크 정책 문제일 수 있다. 화면을 캡처해 도움을 요청한다'], sym:['env_pip'], tier:'instructor'},
  leaf_checkenv:{title:'check_env에 [확인 필요]가 나온다', steps:['[확인 필요] 줄의 항목과 -> 뒤의 안내를 읽는다','패키지 문제라면 pip install -r requirements.txt를 다시 실행한다','.env나 키 문제라면 .env.example을 복사해 키를 넣는다','사전 준비 화면의 \'check_env 결과 읽기\' 표를 본다'], sym:['env_pkg','env_key'], tier:'self'}
 }
};

/* 설계 시트 */
var DESIGN = [
 {k:'c1', mark:'①', name:'업무·문제 정의', when:'단계 01', q:'어떤 업무이고 누가 어떤 요청을 하는가? 에이전트가 필요한가, 고정된 워크플로로 충분한가?', chk:['이 업무의 요청과 기대 결과를 한 문장으로 말할 수 있는가?','고정된 워크플로로 충분하지 않은 이유가 있는가?'], ex:'복합 쇼핑 요청(주문 확인 + 상품 추천). 요청마다 필요한 작업이 달라 계획 단계가 필요하다.'},
 {k:'c2', mark:'②', name:'Tool 후보', when:'단계 05', q:'어떤 조회·계산·호출이 필요한가? 도구별 입력, 출력, 실패하는 경우는?', chk:['각 도구의 입력과 출력이 적혀 있는가?','도구가 실패하면 어떻게 되는지 적혀 있는가?'], ex:'search_products(조건) → 상품 목록, get_order(번호) → 상태. 없는 번호는 \'데이터 없음\'으로 처리한다.'},
 {k:'c3', mark:'③', name:'State 설계', when:'단계 06', q:'단계 사이에 넘길 값은 무엇인가? 대화 이력은 어디까지 남기는가? 언제 끝나는가?', chk:['단계 사이에 넘기는 값이 모두 적혀 있는가?','언제 끝나는지 적혀 있는가?'], ex:'request, plan, idx, results(누적), problems(누적), attempts, answer. 작업을 모두 마치면 synthesize 후 종료, 재시도 상한을 넘으면 fail 후 종료한다. (코드에서는 오류 기록을 problems 칸에 쌓는다)'},
 {k:'c4', mark:'④', name:'Worker·Planner 분리', when:'단계 07', q:'업무를 어떻게 나누는가? 어떤 Worker에 LLM이 필요한가? 계획은 어떤 형식으로 받는가?', chk:['이 Worker에 LLM이 필요한 이유를 말할 수 있는가?','계획 형식(worker, params)이 정해져 있는가?'], ex:'Product는 LLM(조건 해석), Order는 함수(정확한 조회). 계획 형식은 {tasks: [{worker, params}]} 이다.'},
 {k:'c5', mark:'⑤', name:'위험·평가', when:'단계 09', q:'잘못되면 어떤 피해가 생기는가? 권한·개인정보·승인이 필요한 작업은? 성공을 무엇으로 확인하는가?', chk:['가장 큰 위험 1가지와 확인 방법이 구체적으로 적혀 있는가?','사람이 개입하는 단계가 적혀 있는가?'], ex:'쓰기 작업은 제외하고, 고객별 접근 통제를 두며, 5개 시나리오를 데이터와 대조해 검증한다. 쓰기 작업은 사람 승인 후에만 한다.'},
 {k:'c6', mark:'⑥', name:'성찰·적용 계획', when:'단계 09', q:'수업 전보다 달라진 이해 1가지는? 2주 안에 시도할 것 1가지와 필요한 데이터·권한·사람은?', chk:['달라진 이해를 한 문장으로 썼는가?','2주 안에 가능한 작은 한 걸음 1가지가 적혀 있는가?'], ex:'이해: 계획과 실행을 나누면 오류가 난 위치가 보인다. 시도: 주문 조회 Tool 1개를 실제 API에 연결해 본다. (조회 권한, 백엔드 담당자 필요)', noscore:true}
];
var DESIGN_TOPICS = ['고객 문의 분류·답변 초안: 들어온 문의를 유형별로 나누고, 규정 문서를 찾아 답변 초안을 만든다','사내 규정·휴가 조회 안내: 직원이 묻는 휴가·경비 규정을 찾아 안내하고, 잔여 휴가를 조회한다','일정·자료 취합 보고: 여러 곳의 일정과 자료를 모아 주간 보고 초안을 만든다'];
var DESIGN_CRIT = ['반복적으로 발생하고, 규칙과 판단이 섞여 있다','조회할 데이터나 호출할 도구가 이미 있다','조회 중심으로 시작할 수 있고, 결과를 데이터로 검증할 수 있다'];

var RUBRIC = [
 {k:'r1', name:'업무 정의', f:'업무·요청·기대 결과가 구체적이고, 에이전트 필요 여부를 근거와 함께 판단했다', p:'업무는 구체적이나 에이전트 필요 여부의 근거가 없다', n:'업무가 모호하거나 범위가 너무 넓다'},
 {k:'r2', name:'Tool 정의', f:'도구별 입력·출력·실패 경우가 적혀 있다', p:'도구 목록은 있으나 입출력 또는 실패 경우가 빠져 있다', n:'도구가 구체적이지 않다'},
 {k:'r3', name:'State·흐름', f:'공유 값, 분기, 종료 조건이 모두 있다', p:'공유 값은 있으나 분기나 종료 조건이 빠져 있다', n:'단계 간 흐름이 설명되지 않았다'},
 {k:'r4', name:'Worker·Planner 분리', f:'분리 근거와 LLM 필요 여부 판단이 일관된다', p:'분리는 했으나 근거가 충분히 서술되지 않았다', n:'역할 구분이 드러나지 않는다'},
 {k:'r5', name:'위험·평가', f:'위험 1건 이상과 통제 방안, 데이터·실행 기준의 검증 방법이 있다', p:'위험 또는 검증 방법 중 하나만 서술했다', n:'서술되지 않았다'}
];

var AFTER = {
  ext:[['의존 작업','주문 조회 결과의 상품을 이어서 추천한다 (Worker 간 값 전달)'],['LLM Synthesizer','고정 형식 대신 LLM이 답을 다듬는다. 테스트가 어려워지는 점을 확인한다'],['모듈 분리','06 이후 한 파일로 쓴 코드를 state, nodes, graph로 나눈다. 실무 코드 구조에 가장 가깝다'],['영속 저장','InMemorySaver를 DB 기반 체크포인터로 바꾼다 (공식 문서 참고)']],
  work:[['데이터','모의 JSON 파일','사내 DB·API 연동, 접근 권한 통제'],['대화 저장','InMemorySaver','DB 기반 영속 체크포인터 도입'],['작업 종류','조회만','쓰기 작업 추가 시 사람 승인(Human-in-the-loop)과 감사 로그 적용'],['평가','시나리오 5개','평가용 데이터셋, 지속 모니터링'],['비용·키','기관 발급 키','호출 상한, 비밀 관리, 모델 변경 대응']],
  good:[['내 업무에서 쓸 Tool 1개를 함수로 만들어 보기','작게 시작하고 결과를 데이터로 확인할 수 있다'],['시나리오 3개를 적어 두고 손으로 돌려 보기','테스트 기준이 먼저 생긴다'],['팀에 설계 시트 1장 공유하고 의견 받기','기술보다 업무 문제 정의가 먼저다']],
  after:[['코드를 다시 돌려 보고 싶다','핸즈온 패키지의 README 순서대로 실행한다 (키가 없으면 replay 모드)'],['설계 시트에 코멘트를 받고 싶다','교육 종료 후 제출하면 강사가 평가 기준으로 코멘트한다 (선택). 제출 기한과 방법은 기관 안내를 따른다'],['더 깊이 배우고 싶다','확장 과제와 공식문서 링크를 활용한다']],
  docs:[['Gemini API','텍스트 생성 · 구조화된 출력 · Function calling · 모델 목록','ai.google.dev/gemini-api/docs','02~03, 08'],['LangChain','Agents · Tools · v1 릴리스 노트','docs.langchain.com/oss/python/langchain','05'],['LangGraph','Graph API · 사용법 · 제어 흐름 · Persistence','docs.langchain.com/oss/python/langgraph','06~08'],['Pydantic','Models','docs.pydantic.dev/latest/concepts/models/','사전 과제']]
};

/* 강사용 */
var INSTR = {
  before:[
    '수업 시작 때 신호 체계(스티커 색, 도움 요청 순서)를 정해 안내한다. 이 가이드의 기본 규칙은 노랑·주황·빨강·초록·파랑 다섯 가지다',
    '단계 02~05는 실제 Gemini 호출이 필요하고 replay는 06~09에서만 쓸 수 있다는 점을 미리 알린다',
    'GEMINI_MODEL(모델 이름)과 패키지 버전은 강의 직전 리허설에서 고정한다. 바뀌면 전체에 공지한다',
    '429 한도는 프로젝트 단위로 적용된다. 여러 명이 동시에 호출하면 발생할 수 있다. 기관의 키 발급 방식은 확인이 필요하다',
    'solution 폴더는 모두 배포된다. 막혔을 때 먼저 힌트·증상 검색을 쓰고, 그다음에 solution과 비교하도록 안내한다'
  ],
  during:[
    ['단계 02 시작','환경 점검 결과를 한 번에 확인하고, 모델 이름 변경이 있으면 공지한다'],
    ['단계 04','코드 뼈대(①~⑤)를 화면에 띄워 두고 라이브 코딩 시범(약 5분). ①③ 먼저, ④⑤ 나중'],
    ['단계 05 직전','보충 카드 A를 3~5분 짚는다. 실습 후 로그 비교 5분 활동'],
    ['단계 06 직전','보충 카드 B를 3~5분 짚는다. 06은 LLM 호출이 없어 키 없이도 실행된다'],
    ['단계 07','판단 활동 5분: 내 판단과 이유를 적고 옆 사람과 30초 비교'],
    ['단계 08 중반','시간이 지연되면 체크포인트 합류를 안내한다'],
    ['단계 08 마무리','10분 점검: 복합 요청 시연, 틀린 요청, 실패 지점 질문, 정리. 한 조 이상은 전체 앞에서 시연'],
    ['설계 시트','각 단계 후 5분씩 한 칸. 순회하며 대표 2건 이상에 코멘트. \'왜 이 업무인가\'를 확인한다']
  ],
  after:[
    '설계 시트 평가는 선택이며 제출 기한과 방법은 기관 안내에 따른다',
    '평가 표현은 과하게 긍정적이거나 부정적이지 않게 쓴다'
  ]
};
