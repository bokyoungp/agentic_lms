import json, os, subprocess, sys, time, threading, urllib.request
import os, pathlib, tempfile
ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
SERVER = ROOT + '/server'
GUIDE = ROOT + '/out/index.html'
SHOTS = ROOT + '/tests/shots'; os.makedirs(SHOTS, exist_ok=True)
DATA = tempfile.mkdtemp(prefix='botdata-')      # 설정과 로그는 임시 폴더에 둔다 (내 설정을 덮어쓰지 않는다)
CHROME = os.environ.get('CHROME_PATH') or None  # 비우면 playwright 기본 chromium 사용
LAUNCH = dict(args=['--no-sandbox'], **({'executable_path': CHROME} if CHROME else {}))
ROOT = SERVER
from http.server import HTTPServer, BaseHTTPRequestHandler

SEEN=[]   # 가짜 제공자가 받은 요청

class Fake(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_POST(self):
        b=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        SEEN.append((self.path, dict(self.headers), b))
        if self.path.endswith('/chat/completions'):
            msgs=b['messages']; has_tool=any(m['role']=='tool' for m in msgs)
            if not has_tool:
                out={'choices':[{'message':{'content':None,'tool_calls':[{'id':'call_1','type':'function','function':{'name':'search_symptoms','arguments':json.dumps({'query':'API key not valid'})}},{'id':'call_2','type':'function','function':{'name':'get_hint','arguments':json.dumps({'todo_id':'TODO 1','level':3})}}]}}]}
            else: out={'choices':[{'message':{'content':'OPENAI-FINAL [env_key]'}}]}
        elif self.path.endswith('/v1/messages'):
            has_tool=any(isinstance(m['content'],list) and any(x.get('type')=='tool_result' for x in m['content']) for m in b['messages'])
            if not has_tool: out={'content':[{'type':'text','text':'확인한다'},{'type':'tool_use','id':'tu_1','name':'search_symptoms','input':{'query':'API key not valid'}}],'stop_reason':'tool_use'}
            else: out={'content':[{'type':'text','text':'ANTHROPIC-FINAL'}],'stop_reason':'end_turn'}
        else: out={}
        d=json.dumps(out).encode(); self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(d))); self.end_headers(); self.wfile.write(d)
fk=HTTPServer(('127.0.0.1',9911),Fake); threading.Thread(target=fk.serve_forever,daemon=True).start()

env=dict(os.environ, BOT_DATA_DIR=DATA, BOT_PORT='8799', ADMIN_TOKEN='tok', OPENAI_API_KEY='sk-test-openai-key-0000', ANTHROPIC_API_KEY='ak-test')
cfg={'provider':'mock','models':{'openai':'m1','anthropic':'m2'},'base_urls':{'openai':'http://127.0.0.1:9911/v1','anthropic':'http://127.0.0.1:9911'},'limits':{'per_minute':4}}
json.dump(cfg,open(DATA+'/bot_config.json','w'))
srv=subprocess.Popen([sys.executable,ROOT+'/bot_server.py'],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT); time.sleep(1.0)
B='http://127.0.0.1:8799'
def call(m,p,body=None,tok=True,cid=None):
    h={'Content-Type':'application/json'}
    if tok: h['X-Admin-Token']='tok'
    r=urllib.request.Request(B+p,data=json.dumps(body).encode() if body is not None else None,headers=h,method=m)
    try:
        with urllib.request.urlopen(r) as x: return x.status,json.loads(x.read())
    except urllib.error.HTTPError as e: return e.code,json.loads(e.read() or b'{}')
ok=lambda c,msg: print(('PASS ' if c else 'FAIL ')+msg)
try:
    print(call('GET','/api/health'))
    base={'cid':'c1','step':'03','hints':{'TODO 1':1},'stuck_min':2}
    s,r=call('POST','/api/chat',dict(base,q='API key not valid 오류가 나요'),tok=False)
    ok(r['ok'] and r['provider']=='mock' and r['trace'][0]['tool']=='search_symptoms','mock 에이전트 루프: '+r['text'][:70])
    ok(r['mode']=='hint','모드 hint (오류 문구)')
    # 힌트 차단: level3 요청, 열린 단계 1
    from importlib import import_module
    sys.path.insert(0,ROOT); import tools
    res,summ=tools.run_tool('get_hint',{'todo_id':'TODO 1','level':3},{'step':'03','hints':{'TODO 1':1}}); ok(res['allowed'] is False,'get_hint 차단: '+summ)
    res,summ=tools.run_tool('get_hint',{'todo_id':'TODO 1','level':1},{'step':'03','hints':{'TODO 1':1}}); ok(res['allowed'] is True,'get_hint 허용: '+summ)
    # 제공자 전환 openai
    call('POST','/api/admin/config',{'provider':'openai'})
    del SEEN[:]
    s,r=call('POST','/api/chat',dict(base,cid='c2',q='API key not valid',tried='키를 .env에 넣었다 OPENAI_API_KEY=sk-abcdefghijklmnopqrstu'),tok=False)
    ok(r['ok'] and r['text'].startswith('OPENAI-FINAL') and r['provider']=='openai','openai 도구 호출 왕복: '+str(r.get('text'))[:40])
    ok([t['tool'] for t in r['trace']]==['search_symptoms','get_hint'],'도구 2개 실행: '+str([t['summary'] for t in r['trace']]))
    p0=SEEN[0]; ok(p0[1].get('Authorization','')=='Bearer sk-test-openai-key-0000','Authorization 헤더 서버에서만 부착')
    ok('tools' in p0[2] and p0[2]['tools'][0]['type']=='function','OpenAI tools 형식')
    ok(any(m['role']=='tool' and 'tool_call_id' in m for m in SEEN[1][2]['messages']),'tool 결과 메시지 형식')
    sysmsg=SEEN[0][2]['messages'][0]['content']; ok('sk-abcdefghijklmnopqrstu' not in json.dumps(SEEN[0][2]) and '[값 제거됨]' in sysmsg or 'sk-abcdefghij' not in sysmsg,'시도 입력의 키 마스킹')
    ok('막힘 해결' in sysmsg,'모드 지침이 시스템 프롬프트에 포함')
    # anthropic
    call('POST','/api/admin/config',{'provider':'anthropic'}); del SEEN[:]
    s,r=call('POST','/api/chat',dict(base,cid='c3',q='API key not valid'),tok=False)
    ok(r['ok'] and r['text']=='ANTHROPIC-FINAL','anthropic 도구 호출 왕복: '+str(r.get('text')))
    h={k.lower():v for k,v in SEEN[0][1].items()}; ok(h.get('x-api-key')=='ak-test' and h.get('anthropic-version'),'x-api-key / version 헤더')
    msgs2=SEEN[1][2]['messages']; ok(msgs2[-1]['role']=='user' and msgs2[-1]['content'][0]['type']=='tool_result' and msgs2[-2]['content'][-1]['type']=='tool_use','Anthropic tool_use/tool_result 형식')
    ok(SEEN[0][2]['tools'][0].get('input_schema'),'input_schema 형식')
    # 폴백: openai 주소 죽이고 fallback anthropic
    call('POST','/api/admin/config',{'provider':'openai','fallback':['anthropic'],'base_urls':{'openai':'http://127.0.0.1:1/v1'}})
    s,r=call('POST','/api/chat',dict(base,cid='c4',q='API key not valid'),tok=False); ok(r['ok'] and r['provider']=='anthropic','제공자 장애 시 fallback: '+str(r.get('provider')))
    call('POST','/api/admin/config',{'provider':'mock','fallback':[]})
    # 권한
    s,r=call('GET','/api/admin/config',tok=False); ok(s==403,'토큰 없이 관리 API 403')
    s,r=call('GET','/api/admin/config'); ok(s==200 and r['keys']['openai'] is True and 'sk-test' not in json.dumps(r),'관리 API는 키 값을 돌려주지 않음')
    # 제한
    codes=[call('POST','/api/chat',dict(base,cid='c5',q='안녕'),tok=False)[0] for _ in range(6)]; ok(codes.count(429)>=2,'분당 제한 429: '+str(codes))
    # 모드 판정
    import agent
    ok(agent.decide_mode({'hints':{}},'react가 뭐야?')=='explain','모드 explain')
    ok(agent.decide_mode({'hints':{},'done_ratio':0.9},'다음은?')=='extend','모드 extend')
    ok(agent.decide_mode({'hints':{'TODO 1':2}},'이거 어떻게 해?')=='hint','모드 hint(힌트 열림)')
    ok(agent.decide_mode({'help_type':'explain','hints':{},'stuck_min':20},'오류')=='explain','수강자 선택 우선')
    # 검증: 긴 코드 제거 / 키 제거
    v,n=agent.validate('코드\n```python\n'+'\n'.join('x=%d'%i for i in range(30))+'\n```\nsk-ant-abcdefghijklmnop'); ok('생략' in v and 'sk-ant' not in v,'validate: 긴 코드/키 제거')
    # 통계
    print(call('GET','/api/admin/stats')[1])
finally:
    srv.terminate(); print(srv.stdout.read().decode()[-400:])
