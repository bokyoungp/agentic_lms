"""에이전트 루프 (단계 04 ReAct + 단계 06~08의 검증 개념).
판단(LLM) -> 행동(도구) -> 관찰 -> 반복, 반복 상한이 있고, 최종 답은 코드로 한 번 더 검사한다."""
import json, re, time
from llm import chat_once, FRIENDLY
from tools import DECLS, run_tool

MASKS = [(re.compile(r'sk-ant-[A-Za-z0-9_\-]{10,}'), '[키 제거됨]'), (re.compile(r'sk-[A-Za-z0-9_\-]{16,}'), '[키 제거됨]'),
         (re.compile(r'AIza[0-9A-Za-z_\-]{20,}'), '[키 제거됨]'),
         (re.compile(r'(?im)^(\s*[A-Z0-9_]*(?:API_?KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*).+$'), r'\1[값 제거됨]'),
         (re.compile(r'(?i)(bearer\s+)[A-Za-z0-9._\-]{16,}'), r'\1[키 제거됨]')]
def mask(text):
    n = 0
    for rx, rep in MASKS: text, c = rx.subn(rep, text); n += c
    return text, n

SYSTEM = """너는 승승장구몰 Planner–Worker 핸즈온 수업의 학습 도우미 에이전트다. 수강자는 재직자이고 강사는 혼자 20명을 지원한다. 목표는 수강자가 스스로 막힘을 푸는 것이다.

규칙:
1. 한국어 평서체(~다)로 짧게 답한다. 이모지를 쓰지 않는다. 최대 8문장.
2. 사실은 도구 결과만 근거로 삼는다. 필요한 도구를 먼저 호출한다. 도구에 없으면 "가이드에 없는 내용이라 확인이 필요하다"라고 말하고 도움 요청 카드나 강사 호출을 안내한다. 추측으로 단정하지 않는다.
3. 정답 코드를 통째로 주지 않는다. get_hint가 허용한 단계까지만 쓴다. 차단되면 방향을 묻는 질문 1~2개와 가이드에서 힌트를 열라는 안내만 한다.
4. 원인 가설 1~2개와, 지금 바로 해 볼 확인 행동 한 가지를 제시하고 결과를 다시 알려 달라고 한다.
5. 근거로 쓴 증상은 [증상ID]로 표시한다.
6. .env, API 키, 비밀번호를 묻거나 되풀이해 쓰지 않는다.
7. 막힌 시간이 길면 get_stuck_guide로 다음 층을 확인해 안내한다. 강사가 필요하면 draft_help_card로 카드 초안을 만든다.
8. 수업과 무관한 요청은 정중히 거절하고 수업 질문으로 돌린다."""


MODE_TEXT = {
 'explain': '[도움 모드: 개념 설명] 수강자가 개념을 낯설어 한다. 뜻과 관계를 풀어 설명하고 짧은 완성 예를 함께 든다. 마지막에 이해 확인 질문 1개를 한다.',
 'hint': '[도움 모드: 막힘 해결] 수강자가 시도하다 막혔다. 수강자가 시도한 것을 먼저 읽고, 그것이 왜 안 되는지와 다음 한 걸음의 힌트를 준다. 정답 코드를 주지 않는다.',
 'extend': '[도움 모드: 스스로 진행] 수강자가 스스로 진행하고 있다. 답을 주기보다 선택한 이유를 묻고, 다른 조건(입력, 상한, 오류 상황)에 적용해 보게 한다.'}
MODE_LABEL = {'explain': '개념 설명', 'hint': '막힘 해결', 'extend': '스스로 진행'}
ERR_RX = re.compile(r'(?i)error|exception|traceback|오류|에러|안 ?됨|안 ?돼|실패|404|400|401|429|keyerror|importerror')
CONCEPT_RX = re.compile(r'뭐|무엇|왜|차이|개념|설명|의미|뜻|어떻게 동작|원리|what|why')

def decide_mode(state, q):
    """도움 모드는 LLM이 아니라 코드가 정한다. 수강자가 고른 유형이 우선이고, 자동이면 상태로 판정한다."""
    t = state.get('help_type')
    if t in MODE_TEXT: return t
    opened = any(int(v or 0) > 0 for v in (state.get('hints') or {}).values() if str(v).isdigit() or isinstance(v, int))
    if state.get('done_ratio', 0) >= 0.8: return 'extend'
    if ERR_RX.search(q) or state.get('tried') or state.get('stuck_min', 0) >= 3 or opened: return 'hint'
    if CONCEPT_RX.search(q): return 'explain'
    return 'hint'

def validate(text):
    """검증 단계: 키 문자열 제거, 15줄 넘는 코드 블록 제거(정답 통째 제공 방지)."""
    text, n = mask(text)
    def cut(m):
        body = m.group(0)
        return body if body.count('\n') <= 16 else '(긴 코드는 생략했다. solution 파일의 해당 TODO와 내 코드를 비교한다)'
    return re.sub(r'```[\s\S]*?```', cut, text), n

def run_agent(cfg, q, state, history):
    msgs = []
    for h in (history or [])[-6:]:
        role = 'assistant' if h.get('r') == 'a' else 'user'
        t = mask(str(h.get('t', ''))[:1500])[0]
        if msgs and msgs[-1]['role'] == role == 'user': msgs[-1]['content'] += '\n' + t
        else: msgs.append({'role': role, 'content': t, 'calls': []} if role == 'assistant' else {'role': role, 'content': t})
    while msgs and msgs[0]['role'] != 'user': msgs.pop(0)
    msgs.append({'role': 'user', 'content': q})
    mode = decide_mode(state, q); state['mode'] = mode
    system = SYSTEM + '\n\n' + MODE_TEXT[mode] + '\n\n[현재 상태] 단계 %s, 막힌 시간 %s분' % (state['step'], state.get('stuck_min', 0))
    if state.get('tried'): system += '\n[수강자가 이미 시도한 것]\n' + state['tried']
    trace, ids, used = [], [], None
    for rnd in range(cfg.get('max_tool_rounds', 4) + 1):
        last_round = (rnd == cfg.get('max_tool_rounds', 4))          # 반복 상한: 마지막에는 도구 없이 답을 강제한다
        resp, used, err = chat_once(cfg, system, msgs, [] if last_round else DECLS)
        if resp is None: return {'ok': False, 'msg': FRIENDLY.get(err[1], '봇을 쓸 수 없다') if err else '봇을 쓸 수 없다', 'trace': trace, 'ids': ids, 'provider': used, 'mode': mode}
        if not resp['calls']:
            text, masked = validate(resp['text'] or '답을 만들지 못했다. 다시 질문하거나 도움 요청 카드를 쓴다.')
            return {'ok': True, 'text': text, 'trace': trace, 'ids': ids, 'provider': used, 'masked': masked, 'mode': mode, 'mode_label': MODE_LABEL[mode]}
        msgs.append({'role': 'assistant', 'content': resp['text'], 'calls': resp['calls']})
        for c in resp['calls']:
            t0 = time.time(); res, summ = run_tool(c['name'], c['args'], state)
            for s in res.get('symptoms', []): ids.append(s['id'])
            trace.append({'tool': c['name'], 'args': c['args'], 'summary': summ, 'ms': int((time.time() - t0) * 1000)})
            msgs.append({'role': 'tool', 'id': c['id'], 'name': c['name'], 'content': json.dumps(res, ensure_ascii=False)})
    return {'ok': False, 'msg': '답을 만들지 못했다', 'trace': trace, 'ids': ids, 'provider': used, 'mode': mode}
