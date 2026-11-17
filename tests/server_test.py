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
    # 공통 막힘 집계: 사람 수(cid) 기준, 2명 미만 제외, 질문 원문/cid 비노출
    b5=dict(base,step='05')
    for c in ('c6','c6','c7','c8'): s,r=call('POST','/api/chat',dict(b5,cid=c,q='API key not valid'),tok=False)
    s,r9=call('POST','/api/chat',dict(base,step='06',cid='c9',q='API key not valid'),tok=False)
    s,r=call('GET','/api/common?step=05',tok=False); ids=r9['ids']
    ok(s==200 and ids and [t['id'] for t in r['top']]==sorted(ids) and all(t['people']==3 for t in r['top']),'공통 집계: 같은 사람이 두 번 물어도 1명, 3명으로 센다 '+str(r['top']))
    ok('API key not valid' not in json.dumps(r) and 'c6' not in json.dumps(r),'공통 집계에 질문 원문과 cid가 없다')
    s,r=call('GET','/api/common?step=06',tok=False); ok(s==200 and r['top']==[],'1명만 물은 증상은 공통에서 제외')
    s,r=call('GET','/api/common?step=99',tok=False); ok(s==400,'알 수 없는 단계 400')
    import bot_server
    ok(bot_server.common_top([{'step':'01','ok':True,'cid':'a','ids':['x']},{'step':'01','ok':False,'cid':'b','ids':['x']}],'01')==[],'실패한 응답은 집계하지 않는다')
    # 강사 검토함: 15분 이상 / 환경 문제 / 근거 부족일 때만 초안 저장, 전달 후 해당 수강자만 받는다
    import agent
    ok(agent.review_reasons({'stuck_min':15},'질문',{'ids':['x'],'mode':'extend'})==['long_stuck'],'검토 사유: 15분 이상')
    ok(agent.review_reasons({'stuck_min':14},'질문',{'ids':['x'],'mode':'extend'})==[],'검토 사유: 14분은 대상 아님')
    ok(agent.review_reasons({},'q',{'ids':['env_key'],'mode':'hint'})==['env'],'검토 사유: 환경 문제 증상')
    ok(agent.review_reasons({},'KeyError 오류',{'ids':[],'mode':'hint'})==['no_basis'],'검토 사유: 오류를 물었는데 근거 없음')
    ok(agent.review_reasons({},'react가 뭐야?',{'ids':[],'mode':'explain'})==[],'개념 설명은 근거 없어도 대상 아님')
    s,r=call('POST','/api/chat',dict(base,cid='r1',step='05',stuck_min=20,q='API key not valid'),tok=False)
    ok(r['ok'] and r['review'] and '막힌 지 15분 이상' in r['review']['labels'],'15분 이상이면 응답에 검토 표시: '+str(r.get('review')))
    rid=r['review']['id']
    s,r2=call('POST','/api/chat',dict(base,cid='r2',step='05',stuck_min=1,q='Function Calling이 뭐야?',help_type='explain'),tok=False)
    ok(r2['ok'] and 'review' not in r2,'일반 질문은 검토 대상이 아니다')
    s,r=call('GET','/api/admin/review',tok=False); ok(s==403,'토큰 없이 검토함 403')
    s,r=call('GET','/api/admin/review?status=draft'); d=[x for x in r['items'] if x['id']==rid]
    ok(d and d[0]['status']=='draft' and d[0]['draft'] and 'cid' not in d[0] and 'r1' not in json.dumps(r),'검토함에 초안 저장, cid 원문 비노출')
    s,r=call('GET','/api/inbox?cid=r1',tok=False); ok(r['items']==[],'전달 전에는 수강자가 받을 답이 없다')
    s,r=call('POST','/api/admin/review/deliver',{'id':rid,'text':''}); ok(s==400,'빈 답은 전달하지 않는다')
    s,r=call('POST','/api/admin/review/deliver',{'id':rid,'text':'강사 답이다. OPENAI_API_KEY=sk-abcdefghijklmnopqrstu 는 쓰지 않는다'},tok=False); ok(s==403,'토큰 없이 전달 403')
    s,r=call('POST','/api/admin/review/deliver',{'id':rid,'text':'강사 답이다. OPENAI_API_KEY=sk-abcdefghijklmnopqrstu 는 쓰지 않는다'}); ok(s==200,'강사 전달')
    s,r=call('GET','/api/inbox?cid=r1',tok=False); ok(len(r['items'])==1 and r['items'][0]['text'].startswith('강사 답이다') and 'sk-abcdefghij' not in json.dumps(r),'전달 후 해당 수강자만 받고 키는 지워진다')
    s,r=call('GET','/api/inbox?cid=r2',tok=False); ok(r['items']==[],'다른 수강자는 받지 못한다')
    s,r=call('GET','/api/admin/review?status=delivered'); ok(any(x['id']==rid and x['status']=='delivered' for x in r['items']),'상태가 전달됨으로 바뀐다')
    s,r=call('POST','/api/admin/review/deliver',{'id':'nope','text':'x'}); ok(s==404,'없는 항목 404')
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
