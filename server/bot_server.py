#!/usr/bin/env python3
"""강의 도우미 에이전트 서버 (표준 라이브러리만 사용, 추가 설치 없음).

실행:  python bot_server.py                 (기본 포트 8787, BOT_PORT로 변경)
수강자: http://<강사 PC 주소>:8787/         강사: http://127.0.0.1:8787/admin

파일 구성 (수업 단계와 대응)
  tools.py       Worker  : 조회 도구와 힌트 공개 규칙 (단계 03, 07)
  agent.py       루프    : 판단-행동-관찰 반복, 반복 상한, 최종 검증 (단계 04, 08)
  llm.py         어댑터  : OpenAI / Anthropic / mock 호출 형식 변환 (단계 02, 03, 05)
  bot_server.py  HTTP    : 요청 제한, 로그, 강사 설정
"""
import json, os, time, threading, hashlib, secrets, socket
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from collections import defaultdict, Counter, deque
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import llm, review
from agent import run_agent, mask, review_reasons
from tools import STEP_BY

HERE = Path(__file__).resolve().parent
GUIDE = next((c for c in (HERE.parent / 'index.html', HERE.parent / 'out' / 'index.html') if c.exists()), HERE.parent / 'index.html')
LOG_DIR = llm.DATA_DIR / 'logs'
PORT = int(os.environ.get('BOT_PORT', '8787'))
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN') or secrets.token_urlsafe(9)
LOCAL = ('127.0.0.1', '::1')

_rl = defaultdict(deque); _sess = Counter(); _rl_lock = threading.Lock(); _sem = [None, 0]
def check_limit(cid, lim):
    now = time.time()
    with _rl_lock:
        dq = _rl[cid]
        while dq and now - dq[0] > 60: dq.popleft()
        if len(dq) >= lim['per_minute']: return '질문이 너무 빠르다. %d초 뒤 다시 시도한다' % (int(60 - (now - dq[0])) + 1)
        if _sess[cid] >= lim['per_session']: return '질문 한도에 도달했다. 강사에게 알린다'
        dq.append(now); _sess[cid] += 1
    return None
def get_sem(n):
    if _sem[0] is None or _sem[1] != n: _sem[0], _sem[1] = threading.BoundedSemaphore(n), n
    return _sem[0]

_log_lock = threading.Lock()
def log(rec):
    LOG_DIR.mkdir(exist_ok=True)
    with _log_lock, open(LOG_DIR / ('bot-%s.jsonl' % time.strftime('%Y%m%d')), 'a', encoding='utf-8') as f: f.write(json.dumps(rec, ensure_ascii=False) + '\n')
def read_logs(day=None):
    """day(YYYYMMDD)를 주면 그날 로그만, 비우면 전체를 읽는다."""
    out = []
    for f in sorted(LOG_DIR.glob('bot-%s.jsonl' % (day or '*'))) if LOG_DIR.exists() else []:
        for line in f.read_text(encoding='utf-8').splitlines():
            try: out.append(json.loads(line))
            except Exception: pass
    return out

MIN_PEOPLE = 2   # 서로 다른 수강자가 이 인원 이상 물은 증상만 '공통 막힘'으로 본다
def common_top(logs, step, n=3):
    """같은 단계에서 증상별로 질문한 사람 수(cid 기준)를 센다. 한 명이 여러 번 물어도 1명이다.
    질문 원문과 cid는 내보내지 않는다. 이 규칙은 프롬프트가 아니라 여기서 지킨다."""
    who = defaultdict(set)
    for r in logs:
        if r.get('step') != step or not r.get('ok'): continue
        for i in r.get('ids', []): who[i].add(r.get('cid'))
    top = sorted(((i, len(c)) for i, c in who.items() if len(c) >= MIN_PEOPLE), key=lambda x: (-x[1], x[0]))[:n]
    return [{'id': i, 'people': k} for i, k in top]

class H(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *a): pass
    def _send(self, code, body, ctype='application/json; charset=utf-8'):
        b = body if isinstance(body, bytes) else (json.dumps(body, ensure_ascii=False).encode('utf-8') if ctype.startswith('application/json') else str(body).encode('utf-8'))
        self.send_response(code)
        for k, v in (('Content-Type', ctype), ('Content-Length', str(len(b))), ('Access-Control-Allow-Origin', '*'),
                     ('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token'), ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'), ('Cache-Control', 'no-store')):
            self.send_header(k, v)
        self.end_headers(); self.wfile.write(b)
    def _body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n > 64 * 1024: return None
        try: return json.loads(self.rfile.read(n).decode('utf-8') or '{}')
        except Exception: return None
    def _admin(self): return self.client_address[0] in LOCAL and secrets.compare_digest(self.headers.get('X-Admin-Token', ''), ADMIN_TOKEN)
    def do_OPTIONS(self): self._send(204, b'', 'text/plain')
    def do_GET(self):
        path = self.path.split('?')[0]
        if path in ('/', '/index.html'):
            return self._send(200, GUIDE.read_bytes(), 'text/html; charset=utf-8') if GUIDE.exists() else self._send(404, '가이드 파일이 없다', 'text/plain; charset=utf-8')
        if path == '/admin':
            if self.client_address[0] not in LOCAL: return self._send(403, '강사 PC에서만 열 수 있다', 'text/plain; charset=utf-8')
            return self._send(200, (HERE / 'admin.html').read_bytes(), 'text/html; charset=utf-8')
        if path == '/api/health':
            c = llm.get_config(); return self._send(200, {'ok': True, 'provider': c['provider'], 'ready': c['provider'] == 'mock' or bool(llm.get_key(c['provider']))})
        if path == '/api/common':
            step = parse_qs(urlparse(self.path).query).get('step', [''])[0]
            if step not in STEP_BY: return self._send(400, {'ok': False, 'msg': '알 수 없는 단계'})
            return self._send(200, {'ok': True, 'step': step, 'min_people': MIN_PEOPLE, 'top': common_top(read_logs(time.strftime('%Y%m%d')), step)})
        if path == '/api/inbox':   # 수강자가 자기 cid로 강사가 전달한 답을 가져간다
            cid = parse_qs(urlparse(self.path).query).get('cid', [''])[0][:40]
            return self._send(200, {'ok': True, 'items': review.inbox(cid) if cid else []})
        if path.startswith('/api/admin/'):
            if not self._admin(): return self._send(403, {'ok': False, 'msg': '권한이 없다'})
            if path == '/api/admin/review':
                st = parse_qs(urlparse(self.path).query).get('status', [''])[0]
                return self._send(200, {'ok': True, 'items': review.listing(st if st in ('draft', 'delivered') else None)})
            if path == '/api/admin/config':
                return self._send(200, {'ok': True, 'config': llm.get_config(), 'keys': {k: bool(llm.get_key(k)) for k in llm.ENV_KEY}, 'providers': list(llm.PROVIDERS)})
            if path == '/api/admin/stats':
                L = read_logs()
                return self._send(200, {'ok': True, 'total': len(L), 'errors': sum(1 for r in L if not r.get('ok')), 'sessions': len(set(r.get('cid') for r in L)),
                    'by_step': Counter(r.get('step') for r in L).most_common(), 'top_symptoms': Counter(i for r in L for i in r.get('ids', [])).most_common(8),
                    'tools': Counter(t for r in L for t in r.get('tools', [])).most_common(), 'unmatched': [r.get('q') for r in L if not r.get('ids')][-15:]})
        self._send(404, {'ok': False})
    def do_POST(self):
        path = self.path.split('?')[0]; p = self._body()
        if p is None: return self._send(400, {'ok': False, 'msg': '요청 형식이 올바르지 않다'})
        if path == '/api/chat': return self.chat(p)
        if path.startswith('/api/admin/'):
            if not self._admin(): return self._send(403, {'ok': False, 'msg': '권한이 없다'})
            if path == '/api/admin/config':
                if p.get('provider') is not None and p['provider'] not in llm.PROVIDERS: return self._send(400, {'ok': False, 'msg': '알 수 없는 제공자'})
                llm.save_config(p); return self._send(200, {'ok': True})
            if path == '/api/admin/review/deliver':
                text = mask(str(p.get('text') or '').strip()[:2000])[0]
                if not text: return self._send(400, {'ok': False, 'msg': '전달할 내용을 입력한다'})
                return self._send(200, {'ok': True}) if review.deliver(str(p.get('id') or ''), text) else self._send(404, {'ok': False, 'msg': '없는 항목이다'})
            if path == '/api/admin/key':
                prov, key = p.get('provider'), (p.get('key') or '').strip()
                if prov not in llm.ENV_KEY: return self._send(400, {'ok': False, 'msg': '알 수 없는 제공자'})
                if key: llm.RUNTIME_KEYS[prov] = key
                else: llm.RUNTIME_KEYS.pop(prov, None)
                return self._send(200, {'ok': True, 'has_key': bool(llm.get_key(prov))})
            if path == '/api/admin/test':
                c = json.loads(json.dumps(llm.get_config())); c['fallback'] = []; c['provider'] = p.get('provider') or c['provider']; c['max_output_tokens'] = 200
                t0 = time.time(); r, used, err = llm.chat_once(c, '한 문장으로 "연결 확인"이라고만 답한다.', [{'role': 'user', 'content': '확인'}], [])
                if r is None: return self._send(200, {'ok': False, 'msg': llm.FRIENDLY.get(err[1], '실패'), 'code': err[1]})
                return self._send(200, {'ok': True, 'ms': int((time.time() - t0) * 1000), 'sample': (r['text'] or '')[:60]})
        self._send(404, {'ok': False})
    def chat(self, p):
        cfg = llm.get_config(); lim = cfg['limits']
        cid = str(p.get('cid') or self.client_address[0])[:40]
        q = str(p.get('q') or '').strip()[:lim['max_question_chars']]
        if not q: return self._send(400, {'ok': False, 'msg': '질문을 입력한다'})
        q, masked = mask(q)
        why = check_limit(cid, lim)
        if why: return self._send(429, {'ok': False, 'msg': why})
        step = p.get('step') if p.get('step') in STEP_BY else '01'
        hints = {str(k)[:20]: v for k, v in (p.get('hints') or {}).items()} if isinstance(p.get('hints'), dict) else {}
        try: stuck = max(0, min(600, int(p.get('stuck_min') or 0)))
        except Exception: stuck = 0
        try: done = max(0.0, min(1.0, float(p.get('done_ratio') or 0)))
        except Exception: done = 0.0
        tried = mask(str(p.get('tried') or '')[:600])[0].strip()
        htype = p.get('help_type') if p.get('help_type') in ('explain', 'hint', 'extend') else None
        state = {'step': step, 'hints': hints, 'stuck_min': stuck, 'done_ratio': done, 'tried': tried, 'help_type': htype}
        sem = get_sem(lim['max_concurrent'])
        if not sem.acquire(timeout=20): return self._send(503, {'ok': False, 'msg': '지금 질문이 몰려 있다. 잠시 뒤 다시 시도한다'})
        t0 = time.time()
        try: res = run_agent(cfg, q, state, p.get('history'))
        finally: sem.release()
        res['masked'] = res.get('masked', 0) + masked
        why = review_reasons(state, q, res) if res.get('ok') else []
        if why:   # 강사 검토 대상: 초안을 저장하고, 수강자에게는 답과 함께 '검토 전'임을 알린다
            res['review'] = {'id': review.add_draft(cid, step, q, res['text'], why, stuck), 'labels': [review.LABEL[w] for w in why]}
        log({'ts': time.strftime('%H:%M:%S'), 'cid': hashlib.sha1(cid.encode()).hexdigest()[:6], 'step': step, 'q': q[:200], 'ids': res.get('ids', []),
             'tools': [t['tool'] for t in res.get('trace', [])], 'mode': res.get('mode'), 'provider': res.get('provider'), 'ok': res.get('ok'), 'ms': int((time.time() - t0) * 1000), 'masked': res['masked'], 'review': why})
        self._send(200, res)

def lan_ip():
    try: s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('10.255.255.255', 1)); ip = s.getsockname()[0]; s.close(); return ip
    except Exception: return '127.0.0.1'

if __name__ == '__main__':
    c = llm.get_config(); srv = ThreadingHTTPServer(('0.0.0.0', PORT), H); srv.daemon_threads = True
    print('강의 도우미 에이전트 서버')
    print('  수강자 접속 : http://%s:%d/' % (lan_ip(), PORT))
    print('  강사 설정   : http://127.0.0.1:%d/admin   (관리 토큰: %s)' % (PORT, ADMIN_TOKEN))
    print('  제공자      : %s   (OPENAI 키 %s / ANTHROPIC 키 %s)' % (c['provider'], '있음' if llm.get_key('openai') else '없음', '있음' if llm.get_key('anthropic') else '없음'))
    print('종료: Ctrl+C')
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
