"""Worker: 도구 함수 모음. 단계 03(Function Calling)의 tools.py와 같은 역할이다.
LLM이 필요 없는 조회·판단은 모두 여기에서 코드로 처리한다. 규칙 검사(힌트 공개 여부)도 프롬프트가 아니라 코드가 한다."""
import json, re
from pathlib import Path

KB = json.loads((Path(__file__).resolve().parent / 'kb.json').read_text(encoding='utf-8'))
STEP_BY = {s['id']: s for s in KB['steps']}

def _tokens(q):
    return [t for t in re.split(r'[\s,.:;\'"()\[\]{}<>=/\\|_\-]+', q.lower()) if len(t) >= 2]

def search_symptoms(query, step=None, n=4):
    qs = (query or '').strip().lower()
    if not qs: return []
    toks = _tokens(query); out = []
    for sy in KB['symptoms']:
        sc = 0; hay = (sy['title'] + ' ' + sy['cause']).lower()
        sc += sum(6 for g in sy.get('sig', []) if g and g.lower() in qs)
        sc += sum(3 for k in sy.get('kw', []) if k.lower() in qs)
        sc += sum(1 for t in toks if t in hay)
        if qs in hay: sc += 4
        if sc > 0 and step in sy.get('step', []): sc += 1
        if sc >= 3: out.append((sc, sy))
    out.sort(key=lambda x: -x[0])
    return [s for _, s in out[:n]]

# ---- 도구 선언 (단계 03의 declarations.py에 해당). 제공자 공통 형식(JSON Schema) ----
DECLS = [
    {'name': 'search_symptoms',
     'description': '오류 메시지나 증상 설명으로 가이드의 증상 DB를 검색한다. 원인과 해결 순서를 돌려준다.',
     'parameters': {'type': 'object', 'properties': {
         'query': {'type': 'string', 'description': '수강자가 말한 오류 메시지 또는 증상'},
         'step': {'type': 'string', 'description': '단계 번호 01~09. 생략하면 현재 단계'}}, 'required': ['query']}},
    {'name': 'get_step_info',
     'description': '현재 단계의 목표, 작업 파일, 확인 기준, TODO 목록과 각 TODO의 열린 힌트 단계를 돌려준다.',
     'parameters': {'type': 'object', 'properties': {}}},
    {'name': 'get_hint',
     'description': '특정 TODO의 힌트를 돌려준다. 수강자가 가이드에서 해당 단계까지 연 경우에만 내용을 돌려준다.',
     'parameters': {'type': 'object', 'properties': {
         'todo_id': {'type': 'string', 'description': '예: TODO 1'},
         'level': {'type': 'integer', 'description': '1(방향) 2(뼈대) 3(거의 정답)'}}, 'required': ['todo_id', 'level']}},
    {'name': 'get_stuck_guide',
     'description': '막힌 시간에 맞는 다음 행동(막힘 사다리)을 돌려준다.',
     'parameters': {'type': 'object', 'properties': {'stuck_min': {'type': 'integer', 'description': '막힌 시간(분). 생략하면 현재 값'}}}},
    {'name': 'draft_help_card',
     'description': '강사에게 보여 줄 도움 요청 카드 초안을 만든다. 수강자가 강사 호출이 필요한 경우에만 쓴다.',
     'parameters': {'type': 'object', 'properties': {
         'error_line': {'type': 'string', 'description': '오류 메시지 마지막 줄'},
         'expected_vs_actual': {'type': 'string', 'description': '기대한 것과 실제로 나온 것'},
         'tried': {'type': 'array', 'items': {'type': 'string'}, 'description': '이미 해 본 것'}}, 'required': ['expected_vs_actual']}},
]

def _step(state, arg=None):
    sid = arg if arg in STEP_BY else state.get('step', '01')
    return STEP_BY.get(sid) or STEP_BY['01']

def _lv(state, todo_id):
    try: return max(0, min(3, int((state.get('hints') or {}).get(todo_id, 0))))
    except Exception: return 0

def run_tool(name, args, state):
    """도구를 실행하고 (결과 dict, 한 줄 요약)을 돌려준다. 오류는 예외로 끊지 않고 결과로 돌려준다(단계 04와 같은 원칙)."""
    if not isinstance(args, dict): args = {}
    try:
        if name == 'search_symptoms':
            hits = search_symptoms(str(args.get('query', ''))[:500], args.get('step') or state.get('step'))
            res = {'count': len(hits), 'symptoms': [{'id': s['id'], 'title': s['title'], 'cause': s['cause'], 'fix': s['fix']} for s in hits]}
            return res, ('증상 %d건 [%s]' % (len(hits), ', '.join(s['id'] for s in hits))) if hits else '일치하는 증상 없음'
        if name == 'get_step_info':
            st = _step(state)
            res = {'step': st['id'], 'title': st['title'], 'goal': st['goal'], 'file': st['file'], 'expected': st['expected'],
                   'todos': [{'id': t['id'], 'title': t['t'], 'hint_opened': _lv(state, t['id'])} for t in st['todos']]}
            return res, '단계 %s 정보' % st['id']
        if name == 'get_hint':
            st = _step(state); tid = str(args.get('todo_id', '')).strip()
            try: level = int(args.get('level', 1))
            except Exception: level = 1
            todo = next((t for t in st['todos'] if t['id'].lower() == tid.lower()), None)
            if not todo or not 1 <= level <= 3: return {'error': 'TODO 또는 level이 올바르지 않다'}, '잘못된 요청'
            opened = _lv(state, todo['id'])
            if level > opened:
                return ({'allowed': False, 'opened': opened,
                         'message': '수강자가 아직 힌트 %d단계를 열지 않았다. 내용을 알려 주지 말고 가이드의 해당 TODO에서 힌트를 열도록 안내한다.' % level},
                        '%s 힌트 %d단계: 차단(열린 단계 %d)' % (todo['id'], level, opened))
            return {'allowed': True, 'todo': todo['id'], 'level': level, 'hint': todo['h'][level - 1]}, '%s 힌트 %d단계: 허용' % (todo['id'], level)
        if name == 'get_stuck_guide':
            m = args.get('stuck_min', state.get('stuck_min', 0))
            try: m = max(0, int(m))
            except Exception: m = 0
            lad = KB['ladder']
            idx = 0 if m < 7 else 1 if m < 10 else 2 if m < 15 else 3
            r = lad[idx] if idx < len(lad) else ['', '', '', '']
            return {'stuck_min': m, 'rung': r[0], 'action': r[1], 'detail': r[2], 'target_time': r[3]}, '%d분 경과: %s층' % (m, r[0])
        if name == 'draft_help_card':
            st = _step(state)
            card = {'단계': '단계 %s %s' % (st['id'], st['title']), '오류 메시지': str(args.get('error_line') or '-')[:300],
                    '기대와 실제': str(args.get('expected_vs_actual') or '-')[:400],
                    '이미 해 본 것': ', '.join(map(str, (args.get('tried') or [])[:6])) or '-', '막힌 시간': '%s분' % state.get('stuck_min', 0)}
            return {'card': card, 'note': '이 내용을 도움 요청 카드에 옮겨 적도록 안내한다.'}, '도움 요청 카드 초안'
    except Exception:
        return {'error': '도구 실행 중 오류'}, '도구 오류'
    return {'error': '알 수 없는 도구'}, '알 수 없는 도구'
