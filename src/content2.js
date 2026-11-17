/* 콘텐츠 2: 단계별 자료 (01~09) */
var STEPS = [];

STEPS.push({
  id:'01', title:'Agentic AI 이해와 환경 점검', min:30, asg:'-', mode:'-', design:'①',
  goal:'LLM·Tool·워크플로·Agent의 차이를 설명하고, 내 업무 후보 1건을 정한다.',
  precheck:['평소 어떤 업무에서 AI를 활용해 보았는가? (경험이 없다면 도입해 보고 싶은 업무)','AI 혼자서 처리하기 어려웠던 한계점은 무엇이었는가? 그 지점이 바로 외부 도구(Tool)가 필요한 곳이다.'],
  concept:[
    {t:'p', h:'오늘은 <b>LLM → Tool → Agent</b> 순서로 한 단계씩 만든다.'},
    {t:'table', head:['이름','다음 행동을 결정하는 주체','업무 예시'], rows:[
      ['LLM','없음 (단일 질문에 단일 응답)','이메일 문장 다듬기, 회의록 요약'],
      ['LLM + Tool','모델이 필요한 외부 함수 호출을 제안한다','주문번호를 조회해 배송 상태 안내'],
      ['워크플로','개발자가 미리 고정한 순서 (A → B → C)','문의 접수 → 유형 분류 → 담당자 자동 배정'],
      ['Agent','모델이 상황을 판단해 계획하고 도구를 반복 호출한다','요청마다 필요한 조회 조합이 달라지는 복합 응대']]},
    {t:'table', head:['고정 워크플로로 충분한 경우','에이전트가 필요한 경우'], rows:[
      ['요청 유형과 처리 순서가 항상 일정하다','요청마다 수행할 작업이 달라진다'],
      ['분기 조건이 단순하다','하나의 요청에 여러 조회가 섞여 있다'],
      ['실행 결과를 미리 예측할 수 있다','동적인 계획 수립 단계가 필요하다']]},
    {t:'flow', items:['판단: 어떤 정보가 더 필요한가?','행동: 도구를 호출한다','관찰: 결과를 읽는다','충분하면 답한다'], note:'부족하면 다시 판단으로 돌아간다. 이 반복이 ReAct 루프이고, 단계 04에서 직접 만든다.'},
    {t:'p', h:'<b>선정 기준</b> 내 업무는 (1) 반복적으로 생기고 규칙과 판단이 섞여 있으며 (2) 조회할 데이터나 도구가 이미 있고 (3) 조회부터 시작할 수 있고 결과를 데이터로 확인할 수 있어야 한다. 떠오르지 않으면 고객 문의 분류·답변 초안, 사내 규정·휴가 조회 안내, 일정·자료 취합 보고 중에서 고른다.'}
  ],
  tasks:[
    {id:'t01-1', t:'python check_env.py 와 --ping 을 실행해 결과를 확인한다', cmd:'python check_env.py\npython check_env.py --ping'},
    {id:'t01-2', t:'완성본 시연을 보며 아래 관찰 포인트에 답한다', cmd:'python solution/09_final.py'},
    {id:'t01-3', t:'내 업무 후보 1건을 정하고 설계 시트 ①을 쓴다'}
  ],
  observe:[['10만 원 이하 운동화 2개 추천해줘','Planner가 만든 계획에 작업이 몇 개인가?'],['ORD-1001 배송 확인하고 10만 원 이하 운동화 2개 추천해줘','어떤 Worker들이 호출되었는가?'],['ORD-9999 주문 조회해줘','없는 주문번호에서 프로그램이 멈추는가?']],
  todos:[],
  expected:['python check_env.py 의 모든 항목이 [OK]','python check_env.py --ping 이 [OK]','LLM, 워크플로, Agent의 차이를 한 문장씩 말할 수 있다','설계 시트 ①: 요청과 기대 결과를 한 문장으로 쓸 수 있다'],
  predicted:[
    {w:'환경 점검에서 [확인 필요]가 남는다', y:'가상환경 미활성, 패키지 미설치, 키 입력 오류', s:'아래 증상 목록에서 [확인 필요] 문구로 검색한다', a:'사전 점검 증빙을 보고 개별 확인. 같은 증상이 여럿이면 전체 화면으로 시연', src:'가이드', top:['env_pkg','env_key','env_model404']},
    {w:'내 업무 후보가 떠오르지 않는다', y:'조건(반복·조회 가능·검증 가능)이 한꺼번에 충족되는 업무를 찾기 어렵다', s:'예시 업무 3개 중 하나를 고른다. 완성도보다 \'왜 이 업무인가\'를 쓴다', a:'후보를 같이 좁혀 준다', src:'가이드'}
  ],
  quiz:[
    {q:'다음 행동을 모델이 상황을 판단해 정하고, 필요한 만큼 도구를 반복 호출하는 구조는?', o:['LLM 단독','고정 워크플로','Agent','단순 함수 호출'], a:2, why:'워크플로는 개발자가 순서를 고정한다. 모델이 판단해 반복하는 구조가 Agent다.'},
    {q:'\'배송 확인 + 조건부 상품 추천\' 같은 복합 요청에 계획(Planner) 단계가 필요한 가장 큰 이유는?', o:['답변이 길어서','요청마다 필요한 작업의 조합이 달라서','모델 비용을 줄이려고','화면을 예쁘게 만들려고'], a:1, why:'요청마다 작업 조합이 다르면 고정된 순서로 처리할 수 없어 동적 계획이 필요하다.'},
    {q:'ReAct 루프의 올바른 순서는?', o:['행동 → 판단 → 관찰','판단 → 행동 → 관찰 (충분하면 답)','관찰 → 답 → 판단','답 → 행동 → 판단'], a:1, why:'판단 → 행동 → 관찰을 반복하다가 충분하면 답한다.'}
  ],
  explain:['\'AI 혼자 못 했던 부분\'이 왜 Tool이 필요한 지점인지 내 업무 사례로 한 문장 적어 본다.'],
  join:null
});

STEPS.push({
  id:'02', title:'Gemini API로 상담원 만들기', min:35, asg:'과제 1', mode:'live (네트워크·키 필요)', design:'',
  file:'02_gemini_api.py', run:'python starter/02_gemini_api.py',
  goal:'상담원의 말투(페르소나)를 지정하고, 이전 대화를 기억시키고, 응답을 정해진 JSON 구조로 받는다.',
  precheck:['LLM에게 말투와 역할을 알려 주려면 어디에 써야 할까?','같은 모델인데 질문을 두 번 하면 앞 대화를 기억할까?'],
  concept:[
    {t:'p', h:'호출은 세 가지 요소로 구성된다. 시스템 지시는 사용자가 보지 못하는 \'근무 수칙\'이다.'},
    {t:'table', head:['요소','역할'], rows:[['모델','사용할 Gemini 모델 (.env의 '+LLM.gemini.model+'). OpenAI를 쓰면 '+LLM.openai.model+'이다'],['시스템 지시','역할, 말투, 모를 때의 행동'],['contents','지금까지 쌓인 대화 이력']]},
    {t:'code', c:'response = client.models.generate_content(\n    model=config.MODEL,\n    contents=history,\n    config=types.GenerateContentConfig(system_instruction=SYSTEM),\n)\nprint(response.text)'},
    {t:'table', head:['호출','내가 보내는 contents','모델이 아는 것'], rows:[['1번째','사용자: \'러닝용 운동화를 찾고 있어요.\'','이 문장만'],['2번째 (history 없이)','사용자: \'그럼 쿠션이 중요할까요?\'','\'그럼\'이 무엇인지 모른다'],['2번째 (history 포함)','사용자 → 모델 → 사용자 (3개 메시지)','앞 대화 전체']]},
    {t:'table', head:['문장으로 받으면','JSON으로 받으면'], rows:[['\'주문 상태를 조회하시려는 것 같아요.\' → 코드가 읽으려면 한 번 더 해석해야 한다','{"intent": "order_status", "keywords": ["ORD-1001"]} → parsed.intent로 바로 분기한다']]},
    {t:'callout', k:'info', h:'단계 08의 Planner가 같은 방식(Pydantic 모델 + JSON 응답)으로 계획을 만든다.'}
  ],
  todos:[
    {id:'TODO 1', t:'페르소나 쓰기', h:[
      'PERSONA는 문자열 하나다. 상담원에게 주는 근무 수칙이라고 생각하고 세 가지를 넣는다: 누구인지 / 말투와 길이 / 모르는 정보를 만났을 때의 행동.',
      '문장 세 개로 나누어 쓴다.\n(1) 당신은 쇼핑몰 \'승승장구몰\'의 상담원이에요.\n(2) ___체로, ___문장 이내로 답해요.\n(3) 확인할 수 없는 정보는 ___하고 ___라고 말해요.',
      'PERSONA = "당신은 쇼핑몰 \'승승장구몰\'의 상담원이에요. 해요체로 3문장 이내로 답해요. 확인할 수 없는 정보는 아는 척하지 않고 확인이 필요하다고 말해요."\n\n실행해서 [기본]과 [상담원] 두 답의 말투·길이를 비교한다. 페르소나를 한 줄 바꿔 2~3번 다시 돌려 본다.']},
    {id:'TODO 2', t:'대화 이력 쌓기', h:[
      '질문 하나마다 \'사용자 말 → 전체 전송 → 모델 답\'을 history에 순서대로 쌓는다. 세 줄이다.',
      '1) history.append(user(q))\n2) answer = ask(history, PERSONA)\n3) history.append(model(answer))',
      'for 루프 안에 위 세 줄을 순서대로 넣는다. 끝나고 len(history)를 출력해 4인지 확인한다. 4가 아니면 append 한 줄이 빠졌거나 ask에 history 대신 새 리스트를 넘겼는지 본다.']},
    {id:'TODO 3', t:'Intent 모델 완성', h:[
      'Pydantic 모델이다. intent는 허용된 값 중 하나만, keywords는 문자열 목록이다. 사전 과제의 Pydantic 예시를 떠올린다.',
      'class Intent(BaseModel):\n    intent: Literal[ ... ]   # 4개 값\n    keywords: ...            # 문자열 목록',
      'class Intent(BaseModel):\n    intent: Literal["product_search", "order_status", "policy", "other"]\n    keywords: list[str]']},
    {id:'TODO 4', t:'JSON 응답 설정', h:[
      'config(GenerateContentConfig)에 JSON으로 받겠다는 설정 두 개를 추가한다. 하나는 형식, 하나는 모양(스키마)이다.',
      'config=types.GenerateContentConfig(\n    system_instruction="...",\n    ____=...,\n    ____=...,\n)',
      'response_mime_type="application/json",\nresponse_schema=Intent\n\n그 뒤 Intent.model_validate_json(response.text)로 읽는다.']}
  ],
  expected:['[기본]과 [상담원] 두 답의 말투와 길이가 달라졌다','history에 4개의 메시지가 쌓였다 (len(history) == 4)','order_status [\'ORD-1001\'] 형태의 결과가 출력된다 (키워드 표현은 조금 달라질 수 있다)','페르소나를 한 줄 바꾸면 답이 어떻게 달라지는지 2~3번 확인했다'],
  predicted:[
    {w:'API key not valid / 404 model not found', y:'.env의 키에 따옴표·공백, 모델 이름 변경·오타', s:'증상 검색 \'API key not valid\', \'404\'', a:'모델 이름 변경은 전체 공지로 한 번에 해결', src:'가이드', top:['api_key_invalid','env_model404','env_cfg_sys']},
    {w:'JSON 파싱 오류', y:'response_mime_type과 response_schema 중 하나를 빠뜨림', s:'TODO 4의 두 줄을 모두 썼는지 본다', a:'화면을 보고 빠진 줄 짚어 주기', src:'가이드', top:['json_parse']},
    {w:'호출이 멈추거나 연결 오류가 난다', y:'교육장 네트워크 불안정, 동시 호출로 인한 한도 초과(429)', s:'잠시 뒤 한 번 다시 실행. 연타하지 않는다', a:'반복되면 전체 상황 확인. 02~05는 replay로 대체할 수 없으므로 시연으로 대체할 수 있다', src:'예측', top:['net_timeout','env_429']},
    {w:'history가 4개가 안 된다', y:'append 한 줄 누락, 매번 새 리스트를 보냄', s:'TODO 2 힌트 3단계 확인, len(history) 출력', a:'개별 지도', src:'예측'}
  ],
  quiz:[
    {q:'상담원의 말투·역할·\'모를 때의 행동\'을 적는 곳은?', o:['contents','시스템 지시(system_instruction)','response_schema','history'], a:1, why:'시스템 지시는 사용자에게 보이지 않는 근무 수칙이다.'},
    {q:'두 번째 질문 \'그럼 쿠션이 중요할까요?\'에서 모델이 앞 대화를 알게 하려면?', o:['질문을 더 길게 쓴다','history 전체를 매번 contents로 보낸다','temperature를 올린다','모델 이름을 바꾼다'], a:1, why:'모델은 대화를 스스로 기억하지 않는다. 쌓은 이력을 매번 함께 보낸다.'},
    {q:'응답을 JSON으로 받을 때 config에 넣는 두 가지는?', o:['model, contents','response_mime_type, response_schema','system_instruction, history','tools, limit'], a:1, why:'형식(application/json)과 모양(Pydantic 스키마) 두 가지가 모두 필요하다.'}
  ],
  explain:['history 없이 두 번째 질문을 보내면 모델이 무엇을 모르게 되는지, 내가 돌려 본 결과로 한 문장 적어 본다.'],
  join:{note:'02는 이후 단계로 이어지는 의존 파일이 없다. 막히면 solution/02와 비교한다.'}
});

STEPS.push({
  id:'03', title:'Function Calling 적용하기', min:35, asg:'과제 1', mode:'live (네트워크·키 필요)', design:'',
  file:'03_function_calling.py', run:'python starter/03_function_calling.py',
  goal:'모델이 제안한 함수 호출을 내 코드가 실행하고 그 결과를 모델에 돌려주는 흐름을 구현한다. 수동 방식을 먼저, 자동 방식을 그다음 실습한다.',
  precheck:['모델은 승승장구몰의 주문 데이터베이스를 알고 있는가?','그렇다면 \'모른다\'고 답하게 하는 것이 최선일까?'],
  concept:[
    {t:'callout', k:'key', h:'핵심 한 문장: <b>모델은 함수 호출을 제안하고, 실제 실행은 내 코드가 한다.</b> 모델은 \'이 함수를 이 인자로 불러 주세요\'라는 요청서를 줄 뿐이다.'},
    {t:'table', head:['순서','누가','하는 일'], rows:[
      ['1','내 코드','질문과 함수 설명서(선언부)를 모델에 보낸다'],
      ['2','모델','\'search_products를 max_price=100000 인자로 호출해 주세요\'라고 제안한다'],
      ['3','내 코드','제안받은 인자로 실제 파이썬 함수를 실행한다 (모델은 이 과정을 볼 수 없다)'],
      ['4','내 코드','실행 결과를 function_response로 모델에 다시 전달한다'],
      ['5','모델','결과를 바탕으로 고객에게 보낼 최종 답을 쓴다']]},
    {t:'table', head:['개념','Gemini (이 단계의 코드)','OpenAI를 쓰는 경우'], rows:[['모델의 호출 제안','function_call','tool_calls'],['결과를 돌려주는 메시지','function_response (role="user")','role="tool" 메시지 (tool_call_id 포함)'],['함수 선언','function_declarations','tools (type="function")']]},
    {t:'callout', k:'warn', h:'흐름은 두 제공자가 같고 이름과 메시지 모양만 다르다. 이 단계의 starter 코드는 Gemini 기준이며, OpenAI용 코드가 핸즈온에 있는지는 확인이 필요하다.'},
    {t:'table', head:['선언의 칸','모델이 이걸로 판단한다','승승장구몰 예시'], rows:[['name','어떤 함수인지','search_products'],['description','언제 쓰고 언제 쓰지 않는지','상품 추천·가격 비교에 쓴다. 주문 조회에는 쓰지 않는다'],['parameters','어떤 인자를 어떤 모양으로 채울지','max_price는 정수, 10만 원이면 100000'],['각 인자의 description','값을 어떻게 바꿔 넣을지','\'가격 상한(원). 없으면 0\'']]},
    {t:'table', head:['','수동 방식 (먼저)','자동 방식 (그다음)'], rows:[['누가 함수를 실행하나','내 코드','SDK가 대신'],['코드에서 보이는 것','제안·실행·반환 3단계','tools=[search_products] 한 줄'],['언제 쓰나','과정을 보고 싶을 때, 승인·검증이 필요할 때','단순한 도구 호출'],['주의할 점','history 쌓기를 직접 해야 한다','기본으로 켜져 있어 의도치 않게 실행될 수 있다']]}
  ],
  broken:{file:'broken/03_vague_tool.py', run:'python broken/03_vague_tool.py', intro:'모호한 설명서({"name": "tool_a", "description": "데이터를 가져와요."} / {"name": "tool_b", "description": "정보를 조회해요."})만 주어졌을 때 모델이 어떤 함수를 고를지 먼저 예측한다.', rows:['ORD-1001 배송 상태 알려줘','10만 원 이하 운동화 추천해줘'], opts:['tool_a','tool_b','호출 안 함'], reveal:'실행 결과는 직접 확인해 아래에 기록한다. 토론: 왜 그렇게 골랐을까? 설명서를 어떻게 고치면 될까? (힌트: description에 \'언제 쓰고 언제 쓰지 않는지\'를 쓴다)'},
  todos:[
    {id:'TODO 1', t:'함수 선언 작성', h:[
      'search_products_decl은 딕셔너리다. name은 실제 함수 이름과 똑같이, description에는 언제 쓰고 언제 쓰지 않는지를 쓴다. tools.py의 search_products docstring을 참고한다.',
      'search_products_decl = {\n  "name": "search_products",\n  "description": "... 에 쓴다. ... 에는 쓰지 않는다.",\n  "parameters": {"type": "object", "properties": {\n     "keyword": {"type": "string", "description": "..."},\n     # category, max_price(integer), limit(integer)도 같은 방식\n  }},\n}',
      'description 예: 상품 추천·가격 비교에 쓴다. 주문 조회에는 쓰지 않는다.\nmax_price: {"type": "integer", "description": "가격 상한(원). 10만 원이면 100000. 없으면 0"}\n인자 이름 4개(keyword, category, max_price, limit)가 함수의 매개변수 이름과 정확히 같아야 한다.']},
    {id:'TODO 2', t:'자동 호출 끄기', h:[
      '수동 방식이므로 SDK가 함수를 대신 실행하지 못하게 config에서 자동 호출을 끈다.',
      'automatic_function_calling=types.AutomaticFunctionCallingConfig(____=True)',
      'automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)']},
    {id:'TODO 3', t:'함수는 내 코드가 실행', h:[
      '모델의 제안은 first.function_calls[0]에 들어 있다. 제안받은 인자를 그대로 넘겨 search_products를 실행한다.',
      'result = search_products(**dict(call.args))',
      'result = search_products(**dict(call.args))   # 모델이 준 인자 그대로\n[제안] 로그와 [실행] 로그가 순서대로 나오는지 확인한다.']},
    {id:'TODO 4', t:'결과를 모델에게 돌려주기', h:[
      '모델의 제안(content)과 실행 결과(function_response)를 모두 contents에 쌓아야 한다. 결과는 role="user" 메시지로 쌓는다.',
      'contents.append(first.candidates[0].content)   # 모델의 제안 (이미 있음)\ncontents.append(types.Content(role="user", parts=[ ____ ]))',
      'contents.append(types.Content(role="user", parts=[\n    types.Part.from_function_response(name=call.name, response={"result": result})\n]))']},
    {id:'TODO 5', t:'자동 방식', h:[
      '이번에는 선언 대신 파이썬 함수 객체 자체를 tools에 넣는다.',
      'config=types.GenerateContentConfig(tools=[ ____ ])',
      'config=types.GenerateContentConfig(tools=[search_products])']}
  ],
  expected:['[제안] search_products({\'category\': \'운동화\', \'max_price\': 100000, ...}) 로그가 출력된다 (인자는 실행마다 조금 달라질 수 있다)','[실행] N개 조회 로그 뒤에 최종 답이 이어진다','자동 방식에서도 같은 결과가 나온다','선언의 인자 이름이 함수 매개변수와 정확히 일치한다'],
  predicted:[
    {w:'function_calls가 비어 있다 (None)', y:'모델이 호출 없이 바로 답했다', s:'description과 질문 표현 점검. 시스템 지시에 \'도구로 조회한다\' 추가', a:'모호한 설명서 예제의 원리를 전체 화면으로 시연', src:'가이드', top:['fc_none']},
    {w:'TypeError: unexpected keyword argument', y:'스키마의 인자 이름과 함수 매개변수가 다르다', s:'properties 이름을 함수 시그니처와 똑같이 맞춘다', a:'개별 지도', src:'가이드', top:['fc_typeerror']},
    {w:'답에 함수 결과가 반영되지 않는다', y:'모델의 제안과 function_response 중 하나를 쌓지 않았다', s:'5단계 흐름표와 내 코드를 한 줄씩 대조', a:'공통 이슈면 전체 시연', src:'가이드', top:['fc_noresult']},
    {w:'수동·자동 방식이 헷갈린다', y:'SDK 기본값이 자동 호출이라 의도치 않게 실행될 수 있다', s:'비교표를 읽고 TODO 2의 disable=True 여부를 확인', a:'비교표 설명', src:'가이드'}
  ],
  quiz:[
    {q:'Function Calling에서 함수를 실제로 실행하는 주체는?', o:['Gemini 모델','내 코드','Google 서버','LangChain'], a:1, why:'모델은 호출을 제안만 한다. 실행은 내 코드(자동 방식에서는 SDK)가 한다.'},
    {q:'함수 선언의 description에 반드시 담아야 하는 것은?', o:['개발자 이름','언제 쓰고 언제 쓰지 않는지','함수의 줄 수','모델 버전'], a:1, why:'모델은 description을 읽고 어떤 함수를 부를지 판단한다.'},
    {q:'최종 답에 함수 실행 결과가 반영되지 않을 때 가장 먼저 확인할 것은?', o:['인터넷 속도','모델의 제안과 function_response를 모두 contents에 쌓았는지','.env 파일 이름','Python 버전'], a:1, why:'둘 다 쌓아야 모델이 \'내가 부탁한 호출의 결과\'를 이해한다.'}
  ],
  explain:['수동 방식과 자동 방식 중, 내 업무에서 \'사람 승인\'이 필요한 호출이 있다면 어느 쪽을 쓰겠는지 이유와 함께 적어 본다.'],
  join:{note:'03을 끝내면 루트의 declarations.py(선언 4종)가 04에서 쓰인다. 이 파일은 이미 배포되어 있으므로 03을 끝내지 못해도 04를 시작할 수 있다.'}
});

STEPS.push({
  id:'04', title:'ReAct 루프 직접 구현하기', min:35, asg:'과제 1', mode:'live (네트워크·키 필요)', design:'',
  file:'04_react_loop.py', run:'python starter/04_react_loop.py',
  goal:'판단 → 행동 → 관찰을 반복하다가 충분한 정보가 모이면 스스로 종료하는 에이전트 루프를 구현한다.',
  precheck:['\'ORD-1001이 어떤 상품인지, 그 상품 평점도 알려줘\'는 함수가 몇 번 필요할까?','앞 결과를 보고 다음 호출이 정해진다면, 누가 \'그만 부르자\'를 정해야 할까?'],
  concept:[
    {t:'flow', items:['판단: 모델이 다음 할 일을 정한다','행동: 내 코드가 함수를 실행한다','관찰: 결과를 대화에 쌓는다'], note:'호출할 도구가 남아 있으면 다시 \'판단\'으로 돌아간다.'},
    {t:'table', head:['종료 조건','의미'], rows:[['① 모델이 더 호출할 도구가 없다고 판단','정상 종료 → 최종 답'],['② 반복 상한(max_steps)에 도달','안전장치 → 강제 종료']]},
    {t:'callout', k:'info', h:'두 가지 종료 조건이 모두 있어야 무한 루프와 과도한 API 비용을 막을 수 있다.'},
    {t:'code', c:'for step in range(1, max_steps + 1):          # ① 반복 상한이 있는 루프\n    response = generate(contents)             # ② 판단: 지금까지 대화를 보고 모델이 결정\n    calls = response.function_calls or []\n    if not calls:                             # ③ 종료: 더 부를 도구가 없으면 최종 답\n        return response.text\n    contents.append(response.candidates[0].content)   # ④ 모델의 제안을 쌓고\n    for call in calls: ...실행하고 결과를 쌓는다       # ⑤ 행동과 관찰'},
    {t:'p', h:'03에서 한 번 하던 \'제안 → 실행 → 반환\'이 ④~⑤다. 그것을 for로 감싸면 된다. 도구 실행 중 오류가 나도 예외로 중단하지 않고 <code>{"error": ...}</code>를 \'관찰\' 결과로 돌려준다.'}
  ],
  broken:{file:'broken/04_no_exit.py', run:'python broken/04_no_exit.py', intro:'반복 상한도 없고, 모델이 도구 없이 답해도 \'계속하세요\'를 보내는 while True 루프다. 실행하면 어떻게 될까?', rows:['이 루프는 스스로 끝나는가?'], opts:['끝난다','계속된다'], reveal:'계속된다. 이 예제는 안전장치(5번 반복)에서 강제 종료된다. 토론: 없는 주문번호(ORD-9999)를 물으면 \'못 찾으면 멈춘다\'는 조건이 없어 어떻게 되는가? 종료 조건 ①과 ②가 왜 둘 다 필요한가?'},
  todos:[
    {id:'TODO 1', t:'반복 상한이 있는 루프', h:[
      'run_agent 안에서 for 루프를 만든다. 순서는 모델 호출 → calls 확인 → 없으면 최종 답 return → 있으면 제안 쌓기 → 도구 실행 → 결과를 role="user"로 쌓기다. 도구 오류는 예외로 중단하지 않고 {"error": ...}를 \'관찰\'로 돌려준다.',
      '위 \'코드 뼈대\' ①~⑤를 보고 ①과 ③을 먼저 쓴다. 그다음 ④(제안 쌓기)와 ⑤(실행·결과 쌓기)를 채운다.\n\n실행 전에 TOOL_FUNCS[call.name]의 이름이 등록되어 있는지 확인하는 한 줄이 필요하다.',
      'for call in calls:\n    if call.name not in TOOL_FUNCS:\n        observation = {"error": f"등록되지 않은 도구: {call.name}"}\n    else:\n        try:\n            observation = TOOL_FUNCS[call.name](**dict(call.args))\n        except Exception as e:\n            observation = {"error": str(e)}\n    # 결과를 role="user"의 function_response로 contents에 쌓는다 (03 TODO 4와 같은 방식)\n\n막히면 이 줄에서 시작해 solution/04와 비교한다. 위 코드는 구조를 보여 주는 예이며 solution의 변수 이름과 다를 수 있다.']},
    {id:'TODO 2', t:'상한 초과 시 종료 문장', h:[
      '위의 raise NotImplementedError 줄을 지우고, 반복 상한을 넘었을 때 돌려줄 안내 문장을 정한다.',
      'message = f"최대 {max_steps}번 반복해도 끝나지 않아서 멈췄어요."\nreturn message',
      'for 루프가 끝난 뒤(= 상한을 모두 썼는데도 return이 없었을 때) 위 문장을 반환한다. 들여쓰기가 for와 같은 깊이인지 확인한다.']}
  ],
  expected:['로그에 [1] 행동(Act), [1] 관찰(Observe), ..., [N] 최종 답이 순서대로 출력된다','도구 호출이 두 번 이상 일어난다 (예: get_order → get_product)','앞 결과가 다음 행동을 만든다 ([1] 관찰의 P-103이 [2] 행동의 인자로 이어진다)','없는 주문번호(ORD-9999)를 넣어도 예외로 중단되지 않고 \'데이터 없음\'이 관찰로 돌아온다'],
  predicted:[
    {w:'동일한 호출이 무한 반복된다', y:'종료 조건이 없거나 도구 결과를 contents에 쌓지 않았다', s:'max_steps 확인, 결과를 쌓았는지 확인', a:'개별 지도', src:'가이드', top:['loop_infinite']},
    {w:'두 번째 호출에서 400 오류', y:'모델의 제안(content)을 쌓지 않았다', s:'contents.append(response.candidates[0].content) 위치 확인', a:'공통 이슈면 전체 시연', src:'가이드', top:['loop_400']},
    {w:'KeyError: TOOL_FUNCS', y:'모델이 등록되지 않은 도구 이름을 불렀다', s:'실행 전에 이름을 검사하고 오류를 관찰로 돌려준다', a:'개별 지도', src:'가이드', top:['loop_keyerror']},
    {w:'NotImplementedError: TODO 1', y:'TODO를 채우지 않았거나 raise 줄을 지우지 않았다', s:'TODO 2 안내처럼 raise 줄을 지운다', a:'-', src:'예측', top:['todo_left']},
    {w:'루프 구조가 머릿속에 안 그려진다', y:'03의 1회 호출을 반복문으로 감싸는 감각이 없다', s:'\'코드 뼈대\' 순서 ①~⑤를 소리 내어 읽으며 03 코드와 대응시킨다', a:'라이브 코딩 시범(약 5분)으로 ①③ 먼저, ④⑤ 나중 순서로 보여 줌', src:'가이드'}
  ],
  quiz:[
    {q:'ReAct 루프에 필요한 두 가지 종료 조건은?', o:['모델이 도구 없이 답한다 / 반복 상한에 도달한다','실행 시간이 길다 / 메모리가 부족하다','답이 길다 / 답이 짧다','사용자가 종료한다 / 키가 만료된다'], a:0, why:'정상 종료(도구 호출 없음)와 안전장치(max_steps) 두 가지가 모두 있어야 한다.'},
    {q:'존재하지 않는 주문번호를 조회했을 때 루프가 해야 하는 일은?', o:['예외를 던지고 중단한다','{"error": ...}나 \'데이터 없음\'을 관찰로 돌려주고 계속 진행한다','같은 호출을 무한 반복한다','주문번호를 임의로 만든다'], a:1, why:'오류도 \'관찰\' 결과로 돌려주어 모델이 다음 판단을 하게 한다.'},
    {q:'두 번째 호출에서 400 오류가 날 때 가장 먼저 확인할 것은?', o:['API 키 길이','contents.append(response.candidates[0].content)가 빠지지 않았는지','모델 이름 철자','파일 인코딩'], a:1, why:'모델의 제안(content)을 대화에 쌓지 않으면 대화 형식이 어긋나 400 오류가 난다.'}
  ],
  explain:['내 업무에서 \'앞 결과를 보고 다음 호출이 정해지는\' 경우를 하나 찾아 호출 순서를 적어 본다.'],
  join:{note:'04 starter는 루트의 declarations.py를 불러온다. 이미 배포되어 있으므로 별도 작업은 필요 없다.'}
});

STEPS.push({
  id:'05', title:'LangChain으로 구현 단순화하기', min:35, asg:'과제 1', mode:'live (네트워크·키 필요)', design:'②',
  file:'05_langchain.py', run:'python starter/05_langchain.py',
  goal:'단계 04에서 직접 쓴 반복 루프를 LangChain의 create_agent로 바꾸고, 두 실행 로그가 같은 흐름임을 확인한다.',
  precheck:['내 루프 코드에서 \'남이 대신해 줘도 되는 부분\'은 어디일까?','프레임워크를 쓰면 무엇을 얻고 무엇을 잃을까?'],
  concept:[
    {t:'p', h:'<b>보충 카드 A</b> 타입 힌트는 \'이 값은 이런 종류\'라는 표시다. 실행에는 영향이 없지만 LangChain은 이것을 읽어 도구의 입력 모양을 만든다. 데코레이터(<code>@이름</code>)는 함수 위에 붙여 그 함수를 감싸는 문법이다. <code>@tool</code>을 붙이면 평범한 함수가 에이전트가 쓰는 도구가 되고, 함수 설명(docstring)이 모델이 읽는 도구 설명서가 된다.'},
    {t:'code', c:'from langchain.tools import tool\n\ndef search_products(keyword: str = "", max_price: int = 0) -> dict:   # 인자와 반환값에 종류를 적는다\n    ...\n\n@tool("get_order")\ndef get_order_tool(order_id: str) -> dict:\n    """주문번호로 주문 상태를 조회합니다."""\n    ...'},
    {t:'table', head:['04에서 내가 만든 것','LangChain에서는'], rows:[['TOOL_FUNCS + 함수 선언(딕셔너리)','@tool 데코레이터 + docstring'],['for 루프 (판단 → 실행 → 관찰)','create_agent(...)가 만든 에이전트'],['contents (Content 목록)','messages (HumanMessage, AIMessage, ToolMessage)'],['function_calls (모델의 제안)','AIMessage.tool_calls'],['function_response (결과 반환)','ToolMessage'],['max_steps','recursion_limit']]},
    {t:'table', head:['예전 예제에서 보이는 것','오늘 쓰는 것 (LangChain 1.x)'], rows:[['google-generativeai 패키지','google-genai 패키지 (from google import genai)'],['AgentExecutor, initialize_agent','from langchain.agents import create_agent'],['langgraph.prebuilt.create_react_agent','create_agent (LangChain 1.0의 표준)'],['ChatVertexAI로 Gemini 접속','langchain_google_genai.ChatGoogleGenerativeAI']]},
    {t:'callout', k:'warn', h:'인터넷에서 예제를 찾았다면 먼저 발행일과 import 줄을 확인한다. 오늘은 requirements.txt에 고정한 버전만 쓴다.'}
  ],
  todos:[
    {id:'TODO 1', t:'@tool로 함수 감싸기', h:[
      '04에서 쓰던 세 함수(search_products, get_order, get_product)를 @tool로 감싼다. docstring에 \'언제 쓰고 언제 쓰지 않는지\'를 쓴다. 매개변수에는 타입 힌트가 꼭 필요하다.',
      '@tool("get_order")\ndef get_order_tool(order_id: str) -> dict:\n    """... 에 쓴다. ... 에는 쓰지 않는다."""\n    return T.get_order(order_id)\n\nLC_TOOLS = [search_products_tool, ____, ____]',
      '세 도구 모두 같은 모양이다. 마지막에 LC_TOOLS 리스트에 세 도구를 모두 넣는다. 하나라도 빠지면 에이전트가 그 도구를 쓸 수 없다.']},
    {id:'TODO 2', t:'create_agent로 에이전트 만들기', h:[
      '모델, 도구 목록, 시스템 지시를 넘겨 에이전트를 만든다.',
      'agent = create_agent(model=..., tools=..., system_prompt=...)',
      'agent = create_agent(\n    model=config.get_chat_model(),\n    tools=LC_TOOLS,\n    system_prompt=SYSTEM,\n)']},
    {id:'TODO 3', t:'invoke로 실행', h:[
      '입력은 messages 목록이고, 반복 상한은 config의 recursion_limit로 준다. 04의 max_steps와 같은 역할이다.',
      'result = agent.invoke({"messages": [ ... ]}, config={"recursion_limit": ...})',
      'result = agent.invoke(\n    {"messages": [{"role": "user", "content": question}]},\n    config={"recursion_limit": 12},\n)']}
  ],
  expected:['show_trace 출력이 행동(Act) ← AIMessage.tool_calls → 관찰(Observe) ← ToolMessage → 최종 답 ← AIMessage 순서로 나온다','04 로그와 비교해 같은 순서다 (호출 횟수는 달라도 괜찮다)','세 도구가 모두 LC_TOOLS에 들어 있다','설계 시트 ②(Tool 후보)를 썼다: 입력, 출력, 실패하면 어떻게 되는지'],
  predicted:[
    {w:'ImportError: cannot import name create_agent', y:'구버전 langchain이 설치되어 있다', s:'pip install -r requirements.txt를 다시 실행하고 pip list로 버전 확인', a:'공통 이슈면 전체 공지', src:'예측', top:['env_import_create_agent']},
    {w:'구버전 예제 코드를 가져다 붙인다', y:'검색한 예제가 AgentExecutor 등 옛 문법이다', s:'\'예전 예제 vs 오늘 쓰는 것\' 표로 판별', a:'표를 전체 화면으로 안내', src:'가이드', top:['lc_oldexample']},
    {w:'도구가 호출되지 않는다', y:'docstring이 모호하거나 LC_TOOLS에 도구를 넣지 않았다', s:'docstring에 \'언제 쓰는지\' 추가, LC_TOOLS 확인', a:'개별 지도', src:'예측'},
    {w:'로그가 04와 달라 보인다', y:'모델이 같은 질문에도 호출 순서를 다르게 정할 수 있다', s:'호출 횟수가 아니라 행동 → 관찰 → 답의 구조를 비교', a:'로그 비교 5분 활동 안내', src:'가이드'}
  ],
  quiz:[
    {q:'04에서 직접 쓴 for 반복 루프에 대응하는 LangChain 요소는?', o:['@tool','create_agent','ToolMessage','recursion_limit'], a:1, why:'create_agent가 판단 → 실행 → 관찰 반복을 대신한다.'},
    {q:'04의 max_steps에 대응하는 설정은?', o:['recursion_limit','system_prompt','tool_calls','temperature'], a:0, why:'invoke의 config에 recursion_limit을 주어 반복 상한을 둔다.'},
    {q:'LangChain에서 모델이 읽는 도구 설명서 역할을 하는 것은?', o:['함수 이름','docstring','반환값의 길이','파일 이름'], a:1, why:'docstring이 도구 설명이 되므로 언제 쓰고 쓰지 않는지를 써야 한다.'}
  ],
  explain:['\'프레임워크를 쓰면 얻는 것과 잃는 것\'을 각각 한 가지씩 적어 본다.'],
  join:{note:'05를 끝내면 루트의 lc_tools.py(도구 3종)가 07의 Product Worker에서 쓰인다. 이미 배포되어 있다.'}
});

STEPS.push({
  id:'06', title:'LangGraph로 흐름·상태 설계하기', min:65, asg:'과제 2', mode:'규칙 기반 (키 불필요)', design:'③',
  file:'06_stategraph.py', run:'python starter/06_stategraph.py',
  goal:'State, Node, Edge로 조건부 분기 그래프를 만들고, thread_id로 이전 대화를 유지한다. 이 단계는 LLM을 호출하지 않는다.',
  precheck:['\'주문\', \'상품\', \'기타\'로 나누는 if 문이 여러 겹이면 읽기 편할까?','단계 사이에 넘겨야 할 값(주문번호, 결과)이 늘면 어디에 둘까?'],
  concept:[
    {t:'p', h:'<b>보충 카드 B</b> <code>TypedDict</code>는 \'딕셔너리에 어떤 칸이 있는지\' 적어 두는 틀이고 LangGraph의 State가 이 틀이다. <code>Annotated[타입, 함수]</code>는 타입에 \'합치는 방법\' 메모(reducer)를 붙인다. <code>add_messages</code>를 붙이면 새 메시지를 덮어쓰지 않고 뒤에 이어 붙인다.'},
    {t:'code', c:'from typing import Annotated, TypedDict\nfrom langgraph.graph.message import add_messages\n\nclass State(TypedDict):\n    messages: Annotated[list, add_messages]   # 누적 (뒤에 이어 붙임)\n    answer: str                               # 덮어쓰기 (최신 값만)'},
    {t:'table', head:['','코드로 직접 쓰면','그래프로 쓰면'], rows:[['분기','if / elif가 겹겹이 쌓인다','분기 함수 하나와 선 몇 개'],['단계 사이 값','변수를 이리저리 넘긴다','State 하나를 모두가 읽고 쓴다'],['대화 기억','history를 직접 관리한다','thread_id로 저장·복원한다'],['흐름 확인','코드를 읽어야 한다','노드와 선을 그려 볼 수 있다']]},
    {t:'table', head:['구성 요소','뜻'], rows:[['State','모두가 함께 읽고 쓰는 공유 메모장. TypedDict로 칸을 적는다'],['Node','상태를 받아 바꿀 값만 돌려주는 파이썬 함수'],['Edge','노드 사이의 길. 항상 가는 길, 상태를 보고 고르는 길(조건부)']]},
    {t:'branch', head:'classify (의도를 나눈다)', items:[['intent == order','order_node'],['intent == product','product_node'],['그 밖의 경우','fallback_node']], end:'세 노드 모두 END로 이어져야 그래프가 끝난다'},
    {t:'code', c:'def route(state) -> Literal["order_node", "product_node", "fallback_node"]:\n    return {"order": "order_node", "product": "product_node"}.get(state["intent"], "fallback_node")\n\nbuilder.add_conditional_edges("classify", route)'},
    {t:'table', head:['칸 (reducer)','1턴 뒤','2턴 뒤','동작'], rows:[['answer: str','"ORD-1001은 배송 중이에요"','"…운동화가 있어요"','덮어쓰기: 최신 값만'],['messages: Annotated[list, add_messages]','2개','4개','누적'],['results: Annotated[list, operator.add] (단계 08)','Worker 결과 1개','Worker 결과 2개','누적']]},
    {t:'table', head:['호출','thread_id','저장된 상태','결과'], rows:[['ORD-1001 배송 어디쯤이야?','kate-1','order_id = ORD-1001','주문 조회'],['그 주문 상품이 뭐였지?','kate-1','이전 order_id를 기억','같은 주문의 상품을 답한다'],['그 주문 상품이 뭐였지?','other-2','기억 없음 (새 대화)','\'주문번호나 찾는 상품을 말씀해 주세요.\'']]},
    {t:'callout', k:'info', h:'두 번째 질문의 \'그 주문\'은 LLM이 아니라 classify의 규칙이 해석한다. InMemorySaver는 프로그램이 꺼지면 사라진다. 실무에서는 DB 기반 체크포인터로 바꾼다.'},
    {t:'code', c:'graph = builder.compile(checkpointer=InMemorySaver())\nconfig = {"configurable": {"thread_id": "kate-1"}}\ngraph.invoke({"messages": [("user", text)]}, config)'},
    {t:'callout', k:'warn', h:'노드 전후 State를 비교하는 것이 디버깅의 핵심이다. stream_mode="updates"를 쓰면 각 노드 실행 직후 바뀐 칸을 볼 수 있다.'}
  ],
  broken:{file:'broken/06_missing_key.py', run:'python broken/06_missing_key.py', intro:'order_node가 {"anwser": ...}를 돌려준다. (State의 칸 이름은 answer) 실행하면 어떻게 될까?', rows:['오류가 나는가? answer 칸에는 무엇이 들어 있는가?'], opts:['오류로 멈춘다','오류 없이 answer가 비어 있다','answer에 정상 값이 들어간다'], reveal:'오류 없이 answer가 비어 있다. 조용히 값이 사라지는 오류가 가장 위험하다. 노드가 돌려준 키 이름이 State와 같은지 stream_mode="updates" 로그로 점검한다.'},
  todos:[
    {id:'TODO 1', t:'messages에 reducer', h:[
      'messages가 덮어쓰이지 않고 누적되도록 타입 힌트에 reducer를 붙인다.',
      'messages: Annotated[list, ____]',
      'messages: Annotated[list, add_messages]']},
    {id:'TODO 2', t:'classify: 규칙으로 의도 나누기', h:[
      'LLM 없이 규칙으로 나눈다. (1) ORD-숫자4자리가 있으면 order와 번호 저장 (2) \'그 주문\' 표현이 있고 저장된 order_id가 있으면 order (3) \'추천\'이나 \'운동화\'가 있으면 product (4) 그 외 unknown',
      'text = state["messages"][-1].content\nm = re.search(r"ORD-\\d{4}", text)\nif m: return {"intent": "order", "order_id": m.group()}\nif "그 주문" in text and state.get("order_id"): return {"intent": "order"}\n...',
      '나머지 두 규칙도 같은 방식이다. 순서가 중요하다: 번호가 있는지 먼저 보고, 그다음 \'그 주문\', 그다음 product 키워드, 마지막이 unknown이다. 반환하는 키 이름(intent, order_id)이 State와 같은지 확인한다.']},
    {id:'TODO 3', t:'order_node: 조회 결과를 문장으로', h:[
      'get_order(state["order_id"]) 결과로 문장을 만들고, 없으면 \'주문 정보를 찾을 수 없습니다\' 안내를 쓴다. answer와 messages 두 칸을 돌려준다.',
      'data = get_order(state["order_id"])\nif data["found"]: text = ...\nelse: text = "주문 정보를 찾을 수 없습니다. ..."\nreturn {"answer": text, "messages": [("ai", text)]}',
      '돌려주는 딕셔너리의 키는 정확히 "answer"와 "messages"다. 오타가 나면 오류 없이 값이 사라진다 (고장 난 예제 06).']},
    {id:'TODO 4', t:'route: 노드 이름 돌려주기', h:[
      'state["intent"]에 따라 다음 노드의 이름(문자열)을 돌려준다.',
      'order → "order_node", product → "product_node", 나머지 → "fallback_node"',
      'return {"order": "order_node", "product": "product_node"}.get(state["intent"], "fallback_node")']},
    {id:'TODO 5~6', t:'그래프 조립과 컴파일', h:[
      '노드 4개를 등록하고, START → classify, classify에서 route로 가는 조건부 엣지, 세 노드에서 END로 가는 엣지를 연결한다. 마지막에 checkpointer를 붙여 컴파일한다.',
      'builder.add_node("classify", classify)  # 4개 모두\nbuilder.add_edge(START, "classify")\nbuilder.add_conditional_edges("classify", route)\nbuilder.add_edge("order_node", END)  # 세 노드 모두\nreturn builder.compile(checkpointer=____)',
      '세 노드(order_node, product_node, fallback_node)에서 END로 가는 엣지를 빠뜨리면 GraphRecursionError가 난다.\nreturn builder.compile(checkpointer=InMemorySaver())']}
  ],
  expected:['같은 thread_id로 \'그 주문 상품이 뭐였지?\'를 물으면 이전 주문번호를 기억해 답한다 (누적 메시지 4개)','새로운 thread_id에서는 \'주문번호나 찾으시는 상품을 말씀해 주세요.\'가 출력된다','ORD-1001는 \'배송 중\' 상태예요. 상품: 트레일 그립 운동화 와 같은 형태의 답이 나온다','설계 시트 ③(State 설계)을 썼다: 공유 값, 대화 이력, 종료 조건'],
  predicted:[
    {w:'answer가 비어 있다 (오류 없음)', y:'노드가 돌려준 키 이름이 State와 다르다', s:'stream_mode="updates"로 바뀐 키를 확인한다', a:'고장 난 예제 06을 전체 시연', src:'가이드', top:['graph_empty']},
    {w:'GraphRecursionError / 끝나지 않는다', y:'분기 함수가 돌려주는 노드 중 END로 가는 엣지가 빠졌다', s:'세 노드 모두 END 엣지가 있는지 확인', a:'개별 지도', src:'가이드', top:['graph_recursion']},
    {w:'thread_id 관련 ValueError', y:'checkpointer를 쓰면서 thread_id를 주지 않았다', s:'config={"configurable": {"thread_id": ...}}를 넘긴다', a:'-', src:'가이드', top:['graph_thread']},
    {w:'메시지가 덮어써진다', y:'messages에 reducer를 붙이지 않았다', s:'Annotated[list, add_messages]로 바꾼다', a:'-', src:'가이드', top:['graph_overwrite']},
    {w:'\'그 주문\'을 기억하지 못한다', y:'다른 thread_id를 썼거나 classify가 order_id를 저장하지 않았다', s:'두 호출의 thread_id가 같은지, 첫 호출에서 order_id를 돌려주는지 확인', a:'개별 지도', src:'예측', top:['graph_memory']},
    {w:'이 단계에서 시간이 길어진다 (65분)', y:'TODO가 6개이고 State·Node·Edge 개념이 처음이다', s:'TODO 단위로 나누어 실행하며 진행. 20분 이상 정체되면 체크포인트와 비교', a:'단계 중반에 체크포인트 비교 안내', src:'예측'}
  ],
  quiz:[
    {q:'messages가 덮어쓰이지 않고 누적되게 하려면?', o:['messages: str','messages: Annotated[list, add_messages]','messages: dict','messages = []'], a:1, why:'Annotated로 reducer(add_messages)를 붙이면 새 메시지가 뒤에 이어 붙는다.'},
    {q:'오류는 없는데 answer 칸이 비어 있을 때 가장 먼저 확인할 것은?', o:['컴퓨터 재부팅','노드가 돌려준 키 이름이 State와 같은지 (stream_mode="updates")','API 키','모델 이름'], a:1, why:'키 오타(anwser)는 오류 없이 값이 사라진다. updates 로그로 바뀐 키를 확인한다.'},
    {q:'같은 thread_id에서 \'그 주문\'이 이전 주문번호를 기억하는 이유는?', o:['LLM이 대화를 기억해서','checkpointer가 thread_id별로 State를 저장·복원해서','모델이 커져서','history를 손으로 쌓아서'], a:1, why:'InMemorySaver가 thread_id별 상태를 저장하고, \'그 주문\'은 classify의 규칙이 해석한다.'},
    {q:'분기 함수가 돌려주는 모든 노드에 필요한 것은?', o:['LLM 호출','END로 향하는 엣지','thread_id','print 문'], a:1, why:'END로 가는 길이 없으면 그래프가 끝나지 않아 GraphRecursionError가 난다.'}
  ],
  explain:['내 업무에서 \'덮어써도 되는 값\'과 \'쌓아야 하는 값\'을 하나씩 찾아 적어 본다. (설계 시트 ③과 연결)'],
  join:{note:'06은 LLM 호출이 없어 키 없이도 실행된다. 막히면 solution/06과 비교한다.'}
});

STEPS.push({
  id:'07', title:'Worker 3개로 역할 분리하기', min:45, asg:'과제 2', mode:'live 또는 replay', design:'④',
  file:'07_workers.py', run:'python starter/07_workers.py',
  goal:'전체 업무를 역할별 Worker 3개로 나누고, 각 Worker에 LLM이 필요한지 입력 데이터 형태에 근거해 판단한다.',
  precheck:['주문 조회, 상품 추천, 정책 안내를 한 명이 다 맡으면 어디서 틀리기 쉬울까?','그중 정말 LLM이 필요한 일은 어느 것일까? 이유도 함께.'],
  concept:[
    {t:'table', head:['Worker','맡는 일','입력','출력'], rows:[['Order Worker','주문 조회','order_id','주문 상태'],['Product Worker','상품 추천','query (자연어)','추천 목록'],['Support Worker','정책 안내','topic','정책 안내']]},
    {t:'callout', k:'key', h:'기준: 입력이 정해진 형식이면 함수로 충분하고, 자연어를 해석해야 하면 LLM이 필요하다. 쓸 수 있으면 함수가 더 싸고 정확하다.'},
    {t:'p', h:'모든 Worker는 같은 모양의 딕셔너리를 돌려준다: <code>{"worker": ..., "ok": ..., "data": ...}</code>. Worker마다 입력과 출력이 정해져 있어 하나를 고쳐도 다른 Worker에 영향이 없다. 오늘의 Worker는 모두 조회 전용이다.'}
  ],
  judge:{head:['Worker','입력이 어떤 모양인가','LLM이 필요한가 (내 판단)','이유'], rows:[['Order Worker','정확한 주문번호'],['Product Worker','\'가볍고 쿠션 좋은 거\' 같은 자연어'],['Support Worker','정해진 주제어 (반품, 교환, 배송)']], answerKey:'정답 예시: Order와 Support는 함수, Product만 LLM. 입력 형식이 명확하면 함수가 빠르고 정확하며 비용이 들지 않는다. Product는 비정형 자연어를 검색 조건으로 바꿔야 해서 LLM이 필요하다. 이유가 타당하면 다른 답도 가능하다. (예: Support에 자연어가 들어오는 설계라면 LLM)'},
  todos:[
    {id:'TODO 1', t:'Product Worker (LLM)', h:[
      '05의 create_agent로 자연어 query를 해석해 search_products 결과를 data에 담는다. 에이전트는 한 번만 만들어 재사용한다. replay 모드에서는 replay.product_args(query)로 얻은 인자로 search_products를 직접 호출한다.',
      '1) lc_tools.py의 search_products_tool로 create_agent를 한 번 만든다\n2) agent.invoke로 params["query"]를 보낸다\n3) 결과 messages 중 마지막 search_products ToolMessage의 JSON을 꺼내 data로 쓴다\n4) ok는 data["count"] > 0 일 때 True',
      'tool_messages = [m for m in result["messages"] if m.type == "tool" and m.name == "search_products"]\ndata = json.loads(tool_messages[-1].content)\nreturn {"worker": "product", "ok": data["count"] > 0, "data": data}\n\nreplay 모드에서는 data = search_products(**replay.product_args(query)) 로 대신한다.']},
    {id:'TODO 2', t:'Order Worker (함수)', h:[
      'params에서 order_id를 읽어 get_order로 조회한다. LLM은 쓰지 않는다.',
      'data = get_order(params.get("order_id", ""))\nreturn {"worker": "order", "ok": ____, "data": data}',
      'ok는 data["found"] 이다.']},
    {id:'TODO 3', t:'Support Worker (함수)', h:[
      'params에서 topic을 읽어 get_policy로 조회한다. Order Worker와 같은 모양이다.',
      'data = get_policy(params.get("topic", ""))\nreturn {"worker": "support", "ok": ____, "data": data}',
      'ok는 data["found"] 이다.']},
    {id:'TODO 4', t:'Worker 분기 그래프', h:[
      'task["worker"] 값에 따라 세 Worker 노드 중 하나로 가고 END로 끝나는 그래프다. 조건부 엣지는 START에서 바로 걸 수 있다.',
      'builder.add_conditional_edges(START, route)\nroute는 task["worker"]에 따라 노드 이름을 돌려준다.\n세 노드에서 모두 END로 잇는다.',
      'def route(state) -> Literal["order_node", "product_node", "support_node"]:\n    return {"order": "order_node", "product": "product_node", "support": "support_node"}[state["task"]["worker"]]\nbuilder.add_conditional_edges(START, route)\nfor name in [...]: builder.add_edge(name, END)']}
  ],
  expected:['세 Worker를 차례로 실행하면 모두 {\'worker\': ..., \'ok\': ..., \'data\': ...} 구조를 돌려준다','product_worker({\'query\': \'10만 원 이하 운동화 2개\'})가 data의 count 2를 돌려준다','Worker마다 LLM 필요 여부와 이유를 말할 수 있다','설계 시트 ④(Worker·Planner 분리)를 썼다'],
  predicted:[
    {w:'Product Worker의 ok가 False다', y:'search_products ToolMessage를 잘못 꺼냈거나 도구가 호출되지 않았다', s:'마지막 ToolMessage의 name과 content를 print로 확인. replay 모드면 replay.product_args 경로 확인', a:'개별 지도', src:'예측', top:['w_product_empty']},
    {w:'분기 그래프에서 시작 노드 연결 방법을 모르겠다', y:'조건부 엣지를 START에서 바로 걸 수 있다는 점이 낯설다', s:'TODO 4 힌트 2단계: add_conditional_edges(START, ...)', a:'06의 분기 구조를 다시 짚어 줌', src:'예측', top:['w_graph_start']},
    {w:'LLM 필요 여부 판단 근거를 쓰기 어렵다', y:'\'입력 형태\'라는 기준을 처음 적용한다', s:'판단 표의 \'입력이 어떤 모양인가\' 열부터 채운다', a:'판단 활동 5분 + 옆 사람과 30초 비교', src:'가이드'},
    {w:'replay에서 \'replay에 없는 요청\' 오류', y:'지정된 5개 문장 외의 문장을 넣었다', s:'시작 준비 화면의 5개 문장을 그대로 입력', a:'-', src:'예측', top:['replay_miss']}
  ],
  quiz:[
    {q:'Order Worker를 LLM 없이 일반 함수로 구현하는 이유는?', o:['LLM이 비싸서만','정확한 주문번호가 입력으로 주어져 단순 조회만 하면 되어서','함수가 더 어려워서','주문이 적어서'], a:1, why:'입력 형식이 명확하면 함수가 빠르고 정확하며 비용이 들지 않는다.'},
    {q:'Product Worker에 LLM이 필요한 이유는?', o:['\'가볍고 쿠션 좋은\' 같은 비정형 자연어를 검색 조건으로 바꿔야 해서','데이터가 적어서','함수를 만들 수 없어서','출력이 길어서'], a:0, why:'자연어 해석이 필요한 곳에만 LLM을 쓴다.'},
    {q:'세 Worker가 공통으로 돌려주는 형식은?', o:['문자열 하나','{"worker", "ok", "data"}','리스트','HTML'], a:1, why:'통일된 형식이어야 Planner·Synthesizer가 Worker 종류와 상관없이 다룰 수 있다.'}
  ],
  explain:['내 업무의 작업 1개를 골라 \'함수로 충분한가, LLM이 필요한가\'를 입력 형태에 근거해 한 문장으로 적어 본다.'],
  join:{note:'07을 끝내면 루트의 workers.py가 08에서 쓰인다. 이미 배포되어 있으므로 07을 끝내지 못해도 08을 시작할 수 있다. Product Worker는 루트의 lc_tools.py를 쓴다.'}
});

STEPS.push({
  id:'08', title:'Planner–Worker 통합하기', min:80, asg:'과제 3', mode:'live 또는 replay', design:'',
  file:'08_planner_worker.py', run:'python starter/08_planner_worker.py',
  check:'python tests/run_scenarios.py --target starter/08_planner_worker.py',
  goal:'복합 요청을 계획(Plan) → 검증(Validate) → 실행(Execute) → 종합(Synthesize) 단계로 처리하는 에이전트를 완성하고 시연한다. LLM은 Planner와 Product Worker에만 쓴다.',
  precheck:['07에서 Worker는 만들었다. 요청을 받아 어느 Worker에 무엇을 시킬지는 누가 정할까?','그 결정이 틀리면(없는 Worker 이름 등) 어떻게 막을 수 있을까?'],
  concept:[
    {t:'flow', items:['고객 요청','Planner (LLM이 계획)','validate (계획 검사)','Worker 반복 (작업을 하나씩)','Synthesizer (정해진 형식으로 합침)'], note:'LLM은 계획과 상품 해석에만 쓴다. 나머지는 코드라서 예측하고 테스트할 수 있다.'},
    {t:'code', c:'{"tasks": [\n  {"worker": "order",   "params": {"order_id": "ORD-1001"}},\n  {"worker": "product", "params": {"query": "10만 원 이하 운동화 2개"}}\n]}'},
    {t:'table', head:['검사 항목','실패하면'], rows:[['tasks가 비어 있지 않은가','문제로 기록 (모호한 요청은 여기서 거른다)'],['worker 이름이 허용 목록(order, product, support)에 있는가','문제로 기록하고 Planner에게 재시도 요청'],['그 Worker에 필요한 파라미터가 모두 있는가','예: order에는 order_id가 필수'],['재시도는 몇 번까지','최대 2회. 상한을 넘으면 안전한 실패 안내로 종료']]},
    {t:'callout', k:'key', h:'모델이 만든 계획은 그대로 신뢰하지 않고 코드로 검증한 뒤 실행한다. \'모델 출력은 검사하고 쓴다\'가 에이전트의 기본이다.'},
    {t:'table', head:['State 칸','역할','합치는 방법'], rows:[['request','고객 요청 원문','덮어쓰기'],['inject_plan','시나리오 5 테스트용 강제 주입 계획','덮어쓰기'],['plan','검증을 통과한 계획','덮어쓰기'],['idx','다음에 실행할 작업 번호','덮어쓰기'],['results','Worker 결과 모음','누적 (operator.add)'],['problems','검증 문제 기록','누적 (operator.add)'],['attempts','Planner 재시도 횟수','덮어쓰기'],['answer','최종 답','덮어쓰기']]},
    {t:'table', head:['분기 위치','조건','다음'], rows:[['validate 뒤','계획이 올바르다','worker_step'],['validate 뒤','틀렸고 재시도 가능','planner (다시)'],['validate 뒤','틀렸고 재시도 상한','fail → END'],['worker_step 뒤','남은 작업이 있다','worker_step (반복)'],['worker_step 뒤','다 끝났다','synthesize']]},
    {t:'graph08'},
    {t:'callout', k:'info', h:'모든 경로가 END로 이어진다. 06에서 배운 \'종료 경로 점검\'을 여기서도 한다.'}
  ],
  broken:{file:'broken/08_bad_worker_name.py', run:'python broken/08_bad_worker_name.py', intro:'Planner가 {"worker": "orders"}처럼 존재하지 않는 Worker 이름을 계획에 넣었다. (맞는 이름은 order) 검증이 있을 때와 없을 때 각각 어떻게 될까?', rows:['검증이 없을 때','검증이 있을 때'], opts:['KeyError로 멈춘다','문제를 기록하고 재시도한다','정상 실행된다'], reveal:'검증이 있으면 문제를 기록하고 재시도하며, 없으면 딕셔너리 키 오류(KeyError)로 멈춘다. 토론: 모델의 출력은 왜 반드시 검증해야 할까? 실무에서는 어떤 값을 검증할까?'},
  todos:[
    {id:'TODO 1', t:'스키마 3개와 make_plan', h:[
      'Pydantic 모델 3개를 만든다. Params(query, order_id, topic: 모두 선택), Task(worker: 문자열, params), Plan(tasks: Task 목록). worker는 일부러 Literal이 아닌 문자열이다(허용되지 않은 값을 앱이 직접 검증하는 연습). make_plan은 replay면 replay.plan(request), live면 response_schema=Plan으로 호출한다.',
      'class Params(BaseModel):\n    query: Optional[str] = Field(default=None, description="...")\n    order_id: ...\n    topic: ...\nclass Task(BaseModel):\n    worker: str = Field(description="...")\n    params: Params\nclass Plan(BaseModel):\n    tasks: list[Task]',
      'live 호출: config=types.GenerateContentConfig(system_instruction=PLANNER_SYSTEM, response_mime_type="application/json", response_schema=Plan)\n결과: return Plan.model_validate_json(response.text).model_dump()\nPLANNER_SYSTEM에는 product/order/support 세 작업과 각 params를 설명하고, 무관한 요청은 tasks를 비우라고 쓴다.']},
    {id:'TODO 2', t:'validate_plan', h:[
      '문제가 있으면 문장 목록을, 없으면 빈 리스트를 돌려준다. 세 가지를 검사한다: tasks 비어 있음 / worker가 ALLOWED에 없음 / 필수 파라미터가 비어 있음.',
      'problems = []\ntasks = plan.get("tasks", [])\nif not tasks: problems.append(...)\nfor i, task in enumerate(tasks, 1):\n    worker = task.get("worker")\n    if worker not in ALLOWED: problems.append(...); continue\n    for field in ALLOWED[worker]: ...\nreturn problems',
      '허용되지 않은 작업명 메시지는 \'허용되지 않은 작업명 ...\' 로 시작하게 쓴다. 올바른 계획은 [], worker가 \'orders\'면 [\'허용되지 않은 작업명 ...\']가 나와야 한다.']},
    {id:'TODO 3', t:'노드와 분기 함수 7개', h:[
      '이름은 자유이고 역할은 일곱 가지다. 함수 하나씩 만들고 하나씩 실행해 본다. planner, validate, after_validate(조건부), worker_step, more_tasks(조건부), fail, synthesize.',
      'planner: inject_plan이 있으면 그것을, 없으면 make_plan(request)을 plan에 저장. attempts+1, idx=0\nvalidate: validate_plan 결과를 problems에 저장\nafter_validate: 문제 없으면 worker_step / 있고 attempts < MAX_PLAN_ATTEMPTS면 planner / 아니면 fail\nworker_step: plan["tasks"][idx]를 WORKERS로 실행, results에 결과 1개 추가, idx+1\nmore_tasks: idx < 작업 수면 worker_step 계속, 아니면 synthesize\nfail: answer에 안내 문장\nsynthesize: results를 [주문]/[추천]/[안내] 줄로 합쳐 answer에 저장 (LLM 없이)',
      '반환 키 이름이 State와 같은지 확인한다. worker_step은 results에 \'리스트 하나\'를 돌려주어야 reducer가 누적한다: return {"results": [result], "idx": idx + 1}']},
    {id:'TODO 4', t:'그래프 조립', h:[
      'START → planner → validate → (조건부) ... → synthesize → END, fail → END 순서로 연결한다. 조건부 엣지는 두 곳이다.',
      'validate 뒤: after_validate → worker_step / planner / fail\nworker_step 뒤: more_tasks → worker_step / synthesize\nsynthesize → END, fail → END',
      'builder.add_conditional_edges("validate", after_validate)\nbuilder.add_conditional_edges("worker_step", more_tasks)\nbuilder.add_edge("synthesize", END)\nbuilder.add_edge("fail", END)\nrun()은 이미 들어 있다.']}
  ],
  scenarios:[
    ['1 상품 검색','10만 원 이하 운동화 2개 추천해줘','product Worker만 호출되고 조건에 맞는 상품 2개'],
    ['2 주문 조회','ORD-1001 배송 상태 알려줘','order Worker만 호출되고 답에 주문 상태가 있다'],
    ['3 복합 요청','ORD-1001 배송 확인하고 10만 원 이하 운동화 2개 추천해줘','계획에 order, product가 모두 있고 답에 [주문]과 [추천]'],
    ['4 예외 처리','ORD-9999 주문 조회해줘','오류로 멈추지 않고 \'찾을 수 없어요\' 안내'],
    ['5 계획 오류','(잘못된 계획 주입) worker가 \'refund\'','Worker는 실행되지 않고, 재시도 2회 뒤 실패 안내로 종료']
  ],
  expected:['python tests/run_scenarios.py --target starter/08_planner_worker.py 에서 5개 시나리오가 모두 통과한다','복합 요청 하나를 넣으면 [주문]과 [추천] 줄이 함께 나온다','없는 주문번호와 모호한 입력을 넣어도 프로그램이 멈추지 않는다','나의 에이전트 구조를 노드 5개와 분기 화살표로 그려 설명할 수 있다 (planner → validate → worker_step → synthesize → END / fail → END)'],
  closing:[['1','복합 요청 1개를 내 에이전트에 넣고 결과를 실행한다','2분'],['2','일부러 틀린 요청(없는 주문, 모호한 입력)을 넣는다','2분'],['3','\'어디서 실패할 수 있을까\'를 스스로 질문한다','2분'],['4','스스로 점검한 결과를 정리한다','4분']],
  predicted:[
    {w:'실행 결과가 1개만 남는다', y:'results에 operator.add reducer가 없어 덮어쓴다', s:'State의 results를 Annotated[list, operator.add]로 확인', a:'공통 이슈면 06의 reducer 표를 다시 띄움', src:'가이드', top:['p_one_result']},
    {w:'GraphRecursionError', y:'worker_step 뒤 분기가 끝으로 가지 않는다', s:'남은 작업이 없을 때 synthesize로 가는지 확인', a:'개별 지도', src:'가이드', top:['p_recursion']},
    {w:'ValidationError (Plan)', y:'모델 응답이 스키마와 다르다', s:'response_schema=Plan과 필드 이름 확인', a:'-', src:'가이드', top:['p_validation']},
    {w:'함수 7개를 한 번에 쓰다가 정체된다', y:'TODO 3이 한 덩어리로 크다', s:'함수 단위로 나누어 하나씩 실행하며 진행. 단계 중반에 체크포인트 비교', a:'시간이 지연되면 체크포인트 합류 안내', src:'예측', top:['p_big_todo']},
    {w:'시나리오 중 일부만 실패한다', y:'어떤 시나리오가 무엇을 확인하는지 모른다', s:'아래 시나리오 표에서 실패한 번호의 \'확인 포인트\'를 읽는다', a:'개별 지도', src:'예측', top:['p_scenario_fail']},
    {w:'Planner가 매번 다른 계획을 낸다', y:'모델의 비결정적 특성', s:'validate로 걸러낸다. 시연은 replay 모드로 안정화', a:'replay 전환 안내', src:'가이드', top:['p_diff_plan']}
  ],
  quiz:[
    {q:'계획 검증(validate_plan)이 확인하는 세 가지가 아닌 것은?', o:['tasks가 비어 있지 않은가','worker 이름이 허용 목록에 있는가','필수 파라미터가 있는가','상품 가격이 시장 평균과 같은가'], a:3, why:'검증은 계획의 구조(비어 있음, 이름, 필수 값)를 확인한다.'},
    {q:'results와 problems에 operator.add를 쓰는 이유는?', o:['속도를 높이려고','여러 Worker의 결과와 검증 기록이 덮어써지지 않고 누적되게','코드를 줄이려고','출력을 정렬하려고'], a:1, why:'reducer가 없으면 마지막 값만 남는다.'},
    {q:'검증에 계속 실패하면 어떻게 끝나야 하는가?', o:['무한 재시도','재시도 최대 2회 뒤 fail → 안전한 실패 안내로 종료','Worker를 임의로 실행','프로그램을 강제 종료'], a:1, why:'재시도 상한 후 안전한 안내로 종료한다. Worker는 실행되지 않는다.'},
    {q:'모델이 만든 계획을 그대로 실행하지 않고 검증하는 이유는?', o:['모델이 항상 틀려서','모델의 출력은 틀릴 수 있어 코드로 검사한 뒤 쓰는 것이 에이전트의 기본이라서','검증이 더 빨라서','LLM 비용 때문에'], a:1, why:'없는 Worker 이름 같은 값이 그대로 실행되면 오류나 위험으로 이어진다.'}
  ],
  explain:['validate가 없으면 \'orders\' 같은 오타가 어떤 결과를 낳는지, 고장 난 예제 08 결과를 바탕으로 한 문장 적어 본다.'],
  join:{note:'08 starter는 루트의 workers.py(07 체크포인트)를 불러온다. 이미 배포되어 있다. 07을 못 끝냈어도 08을 시작할 수 있다.'}
});

STEPS.push({
  id:'09', title:'검증과 설계 정리하기', min:40, asg:'과제 3', mode:'live 또는 replay', design:'⑤ ⑥',
  file:'09_final.py', run:'python solution/09_final.py',
  check:'python tests/run_scenarios.py',
  goal:'5가지 핵심 시나리오로 에이전트를 최종 검증하고, 잠재 위험을 정리해 설계 시트 ⑤·⑥을 완성한다.',
  precheck:['오늘 만든 에이전트가 잘못된 답을 하면 누가 피해를 보는가?','그 잘못을 우리는 어떻게 알아챌 수 있는가?'],
  concept:[
    {t:'table', head:['위치','일어날 수 있는 일','오늘 코드의 방어'], rows:[['입력','모호한 요청, 없는 주문번호','분류 규칙, \'데이터 없음\' 안내'],['계획','없는 Worker, 필수 값 누락','validate와 재시도 상한 2'],['실행','도구 오류, 무한 반복','max_steps, 오류를 관찰로 돌려줌'],['출력','잘못된 정보 안내','조회 결과만 사용하는 고정 형식'],['운영','비용 증가, 키 유출','호출 상한, .env 관리, 키 공유 금지']]},
    {t:'callout', k:'info', h:'오늘은 조회 전용이라 위험이 작다. 쓰기 작업이 들어가면 사람 승인 단계가 필요하다.'},
    {t:'table', head:['확인 방법','무엇을 보는가','오늘 어디에 있는가'], rows:[['시나리오 테스트','정해 둔 입력에서 기대한 구조가 나오는가','tests/run_scenarios.py'],['실행 로그','어떤 노드·Worker가 어떤 순서로 실행되었는가','단계 06 노드 전후 State, 단계 08 로그'],['사람 검토','표현·사실 오류가 없는가','짝 시연 (단계 08 마무리)']]},
    {t:'callout', k:'key', h:'LLM 응답 문장은 실행마다 조금씩 달라진다. 그래서 텍스트 일치가 아니라 \'기대한 작업 구조와 실행 순서를 따랐는가\'를 기준으로 검증한다.'}
  ],
  tasks:[
    {id:'t09-1', t:'전체 시나리오 테스트를 실행한다. 키가 없으면 .env의 LLM_MODE=replay로 바꾼다', cmd:'python tests/run_scenarios.py'},
    {id:'t09-2', t:'완성본을 실행해 자유 질문을 입력하고, 오류나 응답 형식이 흔들리는 엣지 케이스를 기록한다', cmd:'python solution/09_final.py'},
    {id:'t09-3', t:'설계 시트 ⑤ 위험·평가와 ⑥ 성찰·적용 계획을 작성한다'},
    {id:'t09-4', t:'루브릭으로 자가 점검한다'}
  ],
  todos:[],
  scenarios:[
    ['1 상품 검색','10만 원 이하 운동화 2개 추천해줘','product Worker만 호출되고 조건에 맞는 상품 2개'],
    ['2 주문 조회','ORD-1001 배송 상태 알려줘','order Worker만 호출되고 답에 주문 상태가 있다'],
    ['3 복합 요청','ORD-1001 배송 확인하고 10만 원 이하 운동화 2개 추천해줘','계획에 order, product가 모두 있고 답에 [주문]과 [추천]'],
    ['4 예외 처리','ORD-9999 주문 조회해줘','오류로 멈추지 않고 \'찾을 수 없어요\' 안내'],
    ['5 계획 오류','(잘못된 계획 주입) worker가 \'refund\'','Worker는 실행되지 않고, 재시도 2회 뒤 실패 안내로 종료']
  ],
  edge:['없는 주문번호, 모호한 입력, 쇼핑몰과 무관한 질문을 넣어 본다','한 문장에 요청이 세 개 이상 섞인 입력을 넣어 본다','같은 입력을 두 번 넣어 계획이 달라지는지 본다 (live 모드)'],
  expected:['python tests/run_scenarios.py 에서 5개 시나리오가 모두 통과한다','실행 로그로 \'어떤 Worker가 어떤 순서로 실행되었는지\' 설명할 수 있다','설계 시트 ⑤에 가장 큰 위험 1가지와 확인 방법이 구체적으로 적혀 있다','설계 시트 ⑥에 2주 안에 할 작은 한 걸음 1가지와 필요한 자원이 적혀 있다'],
  predicted:[
    {w:'시나리오 일부가 실패한다', y:'synthesize 형식, worker 호출 순서, 재시도 횟수 등 기대 구조와 다르다', s:'실패한 시나리오의 \'확인 포인트\'를 읽고 해당 단계 힌트로 돌아간다', a:'개별 지도, 못 끝내면 solution으로 시연', src:'예측', top:['p_scenario_fail','synth_sections']},
    {w:'설계 시트 ⑤에 무엇을 써야 할지 모르겠다', y:'\'위험\'을 기술 오류로만 생각한다', s:'위험 유형 표(입력·계획·실행·출력·운영)에서 내 업무에 해당하는 것을 고른다', a:'대표 사례 2건에 코멘트', src:'예측'},
    {w:'⑥의 \'2주 안에 한 걸음\'이 너무 크다', y:'거창한 계획이 시작을 어렵게 한다', s:'\'작고 2주 안에 가능한 것\'으로 줄인다. 예: Tool 1개를 함수로 만들어 보기', a:'예시 안내', src:'가이드'}
  ],
  quiz:[
    {q:'LLM 응답 문장이 실행마다 달라질 때 적절한 검증 기준은?', o:['글자 하나까지 일치','기대한 작업 구조와 실행 순서를 따랐는가','응답이 길수록 좋다','응답 시간이 짧을수록 좋다'], a:1, why:'어떤 Worker가 어떤 순서로 호출되었는지 같은 구조를 확인한다.'},
    {q:'쓰기 작업(환불, 주문 변경)을 추가할 때 반드시 필요한 통제는?', o:['더 큰 모델','사람 승인(Human-in-the-loop)과 감사 로그','더 긴 프롬프트','캐시'], a:1, why:'쓰기는 되돌리기 어려워 사람의 확인과 기록이 필요하다.'},
    {q:'시나리오 5(잘못된 계획 주입)에서 기대하는 동작은?', o:['Worker가 실행되고 오류가 난다','Worker는 실행되지 않고 재시도 2회 뒤 실패 안내로 종료','프로그램이 멈춘다','refund Worker가 새로 만들어진다'], a:1, why:'검증이 걸러내고 재시도 상한 후 안전하게 종료한다.'}
  ],
  explain:['내 업무에서 에이전트가 틀렸을 때 가장 큰 피해는 무엇이고, 그것을 무엇으로 알아챌지 적어 본다. (설계 시트 ⑤와 연결)'],
  join:{note:'09_final.py는 solution에만 있다. 08을 완성하지 못했다면 solution/08로 합류해 시연 준비에 참여한다. 완성하지 못해도 구조를 설명할 수 있으면 충분하다.'}
});
