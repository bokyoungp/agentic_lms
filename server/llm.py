"""제공자 어댑터. 내부 메시지 형식을 OpenAI / Anthropic 형식으로 바꿔 호출한다.
내부 형식:  {'role':'user','content':str}
            {'role':'assistant','content':str,'calls':[{'id','name','args'}]}
            {'role':'tool','id':str,'name':str,'content':str}"""
import json, os, re, socket, threading, secrets, urllib.request, urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('BOT_DATA_DIR') or HERE)
CONFIG_PATH = DATA_DIR / 'bot_config.json'
ENV_KEY = {'openai': 'OPENAI_API_KEY', 'anthropic': 'ANTHROPIC_API_KEY'}
RUNTIME_KEYS = {}   # /admin에서 입력한 키. 메모리에만 두고 디스크에 쓰지 않는다

def _load_env():
    p = HERE / '.env'
    if p.exists():
        for line in p.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1); os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
_load_env()

DEFAULT_CONFIG = {
    'provider': 'mock', 'fallback': [],
    'models': {'openai': 'gpt-4o-mini', 'anthropic': 'claude-sonnet-5-5', 'mock': 'mock'},   # 모델명은 확인 필요
    'base_urls': {'openai': 'https://api.openai.com/v1', 'anthropic': 'https://api.anthropic.com'},
    'openai_token_param': 'max_completion_tokens', 'max_output_tokens': 1200, 'max_tool_rounds': 4,
    'limits': {'per_minute': 5, 'per_session': 60, 'max_concurrent': 6, 'max_question_chars': 2000}, 'timeout_sec': 45}

_cache = {'m': None, 'd': None}; _lock = threading.Lock()
def get_config():
    with _lock:
        if not CONFIG_PATH.exists(): CONFIG_PATH.write_text(json.dumps(DEFAULT_CONFIG, ensure_ascii=False, indent=2), encoding='utf-8')
        m = CONFIG_PATH.stat().st_mtime
        if _cache['m'] != m:
            try: user = json.loads(CONFIG_PATH.read_text(encoding='utf-8'))
            except Exception: user = {}
            cfg = json.loads(json.dumps(DEFAULT_CONFIG))
            for k, v in user.items():
                if isinstance(v, dict) and isinstance(cfg.get(k), dict): cfg[k].update(v)
                else: cfg[k] = v
            _cache.update(m=m, d=cfg)
        return _cache['d']

def save_config(patch):
    cur = json.loads(CONFIG_PATH.read_text(encoding='utf-8')) if CONFIG_PATH.exists() else {}
    for k in ('provider', 'fallback', 'max_output_tokens', 'max_tool_rounds', 'openai_token_param', 'timeout_sec'):
        if k in patch: cur[k] = patch[k]
    for k in ('models', 'base_urls', 'limits'):
        if isinstance(patch.get(k), dict): cur.setdefault(k, {}).update(patch[k])
    tmp = CONFIG_PATH.with_suffix('.tmp'); tmp.write_text(json.dumps(cur, ensure_ascii=False, indent=2), encoding='utf-8'); os.replace(tmp, CONFIG_PATH)

def get_key(p): return RUNTIME_KEYS.get(p) or os.environ.get(ENV_KEY.get(p, ''), '')

class ProviderError(Exception):
    def __init__(self, code, msg): super().__init__(msg); self.code = code

def _post(url, headers, body, timeout):
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=dict(headers, **{'Content-Type': 'application/json'}), method='POST')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e: raise ProviderError(e.code, 'HTTP %d' % e.code)
    except (urllib.error.URLError, socket.timeout, TimeoutError): raise ProviderError(0, '연결 실패')
    except Exception: raise ProviderError(0, '응답 해석 실패')

# ---------- OpenAI (chat/completions, 호환 서버 포함) ----------
def call_openai(cfg, system, msgs, tools):
    key = get_key('openai')
    if not key and 'api.openai.com' in cfg['base_urls']['openai']: raise ProviderError(401, '키 없음')
    out = [{'role': 'system', 'content': system}]
    for m in msgs:
        if m['role'] == 'user': out.append({'role': 'user', 'content': m['content']})
        elif m['role'] == 'tool': out.append({'role': 'tool', 'tool_call_id': m['id'], 'content': m['content']})
        else:
            a = {'role': 'assistant', 'content': m.get('content') or None}
            if m.get('calls'): a['tool_calls'] = [{'id': c['id'], 'type': 'function', 'function': {'name': c['name'], 'arguments': json.dumps(c['args'], ensure_ascii=False)}} for c in m['calls']]
            out.append(a)
    body = {'model': cfg['models']['openai'], 'messages': out}
    body[cfg['openai_token_param']] = cfg['max_output_tokens']
    if tools: body['tools'] = [{'type': 'function', 'function': {'name': t['name'], 'description': t['description'], 'parameters': t['parameters']}} for t in tools]
    d = _post(cfg['base_urls']['openai'].rstrip('/') + '/chat/completions', {'Authorization': 'Bearer ' + key}, body, cfg['timeout_sec'])
    try:
        m = d['choices'][0]['message']; calls = []
        for c in (m.get('tool_calls') or []):
            try: args = json.loads(c['function'].get('arguments') or '{}')
            except Exception: args = {}
            calls.append({'id': c['id'], 'name': c['function']['name'], 'args': args})
        return {'text': (m.get('content') or '').strip(), 'calls': calls}
    except Exception: raise ProviderError(0, '응답 형식 오류')

# ---------- Anthropic (Messages API) ----------
def call_anthropic(cfg, system, msgs, tools):
    key = get_key('anthropic')
    if not key: raise ProviderError(401, '키 없음')
    out = []
    def push(role, blocks):
        if out and out[-1]['role'] == role: out[-1]['content'] += blocks      # 같은 역할은 한 메시지로 합친다
        else: out.append({'role': role, 'content': blocks})
    for m in msgs:
        if m['role'] == 'user': push('user', [{'type': 'text', 'text': m['content']}])
        elif m['role'] == 'tool': push('user', [{'type': 'tool_result', 'tool_use_id': m['id'], 'content': m['content']}])
        else:
            b = ([{'type': 'text', 'text': m['content']}] if m.get('content') else []) + [{'type': 'tool_use', 'id': c['id'], 'name': c['name'], 'input': c['args']} for c in m.get('calls', [])]
            if b: push('assistant', b)
    body = {'model': cfg['models']['anthropic'], 'max_tokens': cfg['max_output_tokens'], 'system': system, 'messages': out}
    if tools: body['tools'] = [{'name': t['name'], 'description': t['description'], 'input_schema': t['parameters']} for t in tools]
    d = _post(cfg['base_urls']['anthropic'].rstrip('/') + '/v1/messages', {'x-api-key': key, 'anthropic-version': '2023-06-01'}, body, cfg['timeout_sec'])
    try:
        text = ''.join(b.get('text', '') for b in d['content'] if b.get('type') == 'text').strip()
        calls = [{'id': b['id'], 'name': b['name'], 'args': b.get('input') or {}} for b in d['content'] if b.get('type') == 'tool_use']
        return {'text': text, 'calls': calls}
    except Exception: raise ProviderError(0, '응답 형식 오류')

# ---------- mock: 키 없이 에이전트 구조를 시연한다 (규칙 기반 정책) ----------
def call_mock(cfg, system, msgs, tools):
    last_user = next((m['content'] for m in reversed(msgs) if m['role'] == 'user'), '')
    results = []
    for m in reversed(msgs):
        if m['role'] == 'user': break
        if m['role'] == 'tool': results.append((m['name'], json.loads(m['content'])))
    if not results:       # 판단: 어떤 도구가 필요한가
        calls = [{'id': 'm1', 'name': 'search_symptoms', 'args': {'query': last_user}}]
        if re.search(r'막혔|오래|모르겠|도와|안 ?돼|안돼', last_user): calls.append({'id': 'm2', 'name': 'get_stuck_guide', 'args': {}})
        return {'text': '', 'calls': calls}
    parts = []             # 관찰을 읽고 답한다
    for name, r in results:
        if name == 'search_symptoms':
            if r.get('count'):
                s = r['symptoms'][0]
                parts.append('가장 가까운 증상은 [%s] %s이다. 원인: %s 먼저 해 볼 것: %s' % (s['id'], s['title'], s['cause'], s['fix'][0]))
                if len(r['symptoms']) > 1: parts.append('비슷한 증상으로 [%s]도 확인한다.' % r['symptoms'][1]['id'])
            else: parts.append('가이드에 없는 내용이라 확인이 필요하다. 도움 요청 카드를 작성하거나 강사를 호출한다.')
        if name == 'get_stuck_guide' and r.get('rung'): parts.append('막힌 시간 기준으로 지금은 %s층이다. %s' % (r['rung'], r.get('action', '')))
    return {'text': '(모의 응답: 규칙 기반) ' + ' '.join(parts), 'calls': []}

PROVIDERS = {'openai': call_openai, 'anthropic': call_anthropic, 'mock': call_mock}
FRIENDLY = {401: '서버의 API 키가 올바르지 않거나 없다', 403: '서버의 API 키 권한이 없다', 404: '모델 이름 또는 주소가 올바르지 않다',
            429: '사용량 한도에 걸렸다. 잠시 뒤 다시 시도한다', 0: '제공자에 연결하지 못했다'}

def chat_once(cfg, system, msgs, tools):
    """설정된 제공자를 부르고, 실패하면 fallback 순서대로 넘어간다. (응답, 쓴 제공자, 마지막 오류)를 돌려준다."""
    order = [cfg['provider']] + [x for x in cfg.get('fallback', []) if x != cfg['provider']]
    last = None
    for name in order:
        fn = PROVIDERS.get(name)
        if not fn: continue
        try: return fn(cfg, system, msgs, tools), name, None
        except ProviderError as e: last = (name, e.code)
    return None, order[0], last
