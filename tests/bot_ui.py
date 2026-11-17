import json, os, subprocess, sys, time
import os, pathlib, tempfile
ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
SERVER = ROOT + '/server'
GUIDE = ROOT + '/out/index.html'
SHOTS = ROOT + '/tests/shots'; os.makedirs(SHOTS, exist_ok=True)
DATA = tempfile.mkdtemp(prefix='botdata-')      # 설정과 로그는 임시 폴더에 둔다 (내 설정을 덮어쓰지 않는다)
CHROME = os.environ.get('CHROME_PATH') or None  # 비우면 playwright 기본 chromium 사용
LAUNCH = dict(args=['--no-sandbox'], **({'executable_path': CHROME} if CHROME else {}))

from playwright.sync_api import sync_playwright


json.dump({'provider':'mock'},open(DATA+'/bot_config.json','w'))
env=dict(os.environ,BOT_DATA_DIR=DATA,BOT_PORT='8798',ADMIN_TOKEN='tok')
srv=subprocess.Popen([sys.executable,SERVER+'/bot_server.py'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
res=[]
def ok(c,m): print(('PASS ' if c else 'FAIL ')+m)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(**LAUNCH)
    ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://127.0.0.1:8798/#/step/03'); pg.wait_for_selector('#botFab')
    ok(pg.is_visible('#botFab'),'플로팅 버튼 표시')
    pg.click('#botFab'); pg.wait_for_timeout(500)
    ok('연결됨 · mock' in pg.inner_text('#botSt'),'서버 연결 상태: '+pg.inner_text('#botSt'))
    # 힌트 1단계 열고 질문
    pg.click('#todo-03-TODO_1 summary'); pg.click('#todo-03-TODO_1 [data-act=hint][data-dir=next]')
    pg.click('#botFab') if not pg.is_visible('#bot') else None
    pg.click('[data-act=bot-open]') if pg.is_visible('[data-act=bot-open]') else None
    pg.fill('#botTried','키를 .env에 넣고 python 02_gemini.py를 실행했다')
    pg.fill('#botQ','API key not valid 오류가 나요'); pg.press('#botQ','Enter')
    pg.wait_for_selector('#botMsgs .ba .bb:not(.muted)',timeout=8000); pg.wait_for_timeout(300)
    txt=pg.inner_text('#botMsgs'); print(txt[:400].replace('\n',' | '))
    ok('api_key_invalid' in txt and '도움 모드 막힘 해결' in txt,'답변과 도움 모드 표시')
    ok(pg.locator('#botMsgs .sym').count()>=1,'증상 ID 칩')
    ok('해 본 것' in txt,'시도 입력이 말풍선에 표시')
    pg.click('#botMsgs details.trace summary'); ok('search_symptoms' in pg.inner_text('#botMsgs details.trace'),'에이전트 동작 기록: '+pg.inner_text('#botMsgs details.trace')[:90].replace('\n',' '))
    # 도움 유형 선택 -> 개념 설명
    pg.select_option('#botType','explain'); pg.fill('#botQ','Function Calling이 뭐야?'); pg.click('#botSend'); pg.wait_for_function("document.querySelectorAll('#botMsgs .ba').length>=2",timeout=8000); pg.wait_for_timeout(300)
    ok('도움 모드 개념 설명' in pg.inner_text('#botMsgs'),'수강자 선택 모드 반영')
    # 칩 클릭 -> 증상 검색 화면
    pg.locator('#botMsgs .sym').first.click(); pg.wait_for_timeout(300)
    ok(pg.evaluate('location.hash')=='#/fix' and pg.input_value('#symq')!='' ,'증상 칩 -> 증상 검색 이동: '+pg.input_value('#symq')[:30])
    ok(pg.is_hidden('#bot'),'칩 클릭 시 패널 닫힘')
    # 서버 로그 반영
    st=json.loads(__import__('urllib.request').request.urlopen(__import__('urllib.request').request.Request('http://127.0.0.1:8798/api/admin/stats',headers={'X-Admin-Token':'tok'})).read())
    ok(st['total']>=2 and any(m for m in st['tools']),'서버 통계 반영: '+str(st['tools']))
    # 새로고침 후 대화 유지
    pg.reload(); pg.wait_for_selector('#botFab'); pg.click('#botFab'); pg.wait_for_timeout(300)
    ok(pg.locator('#botMsgs .bu').count()==2,'새로고침 후 대화 유지')
    pg.screenshot(path=''+SHOTS+'/bot_open.png')
    # file:// + 주소 없음 -> 정적 대체
    pg2=ctx.new_page(); pg2.on('pageerror',lambda e: errs.append(str(e)))
    pg2.goto('file://'+GUIDE+'#/step/02'); pg2.wait_for_selector('#botFab'); pg2.click('#botFab')
    pg2.fill('#botQ','API key not valid'); pg2.click('#botSend'); pg2.wait_for_selector('#botMsgs .ba'); pg2.wait_for_timeout(300)
    t2=pg2.inner_text('#botMsgs'); ok('서버 주소가 설정되지 않았다' in t2 and 'API key' in t2,'file:// 서버 없음: 정적 검색 대체')
    # file:// + 서버 주소 설정 -> CORS 통신
    (pg2.click('[data-bot=cfg]') if pg2.is_hidden('#botCfg') else None); pg2.fill('#botUrl','http://127.0.0.1:8798'); pg2.click('[data-bot=saveurl]'); pg2.wait_for_timeout(600)
    ok('연결됨' in pg2.inner_text('#botSt'),'file:// -> 서버 주소 연결: '+pg2.inner_text('#botSt'))
    pg2.fill('#botQ','ImportError create_agent'); pg2.click('#botSend'); pg2.wait_for_function("document.querySelectorAll('#botMsgs .ba').length>=2",timeout=8000); pg2.wait_for_timeout(300)
    ok('모의 응답' in pg2.inner_text('#botMsgs'),'file:// 에서 에이전트 응답 수신')
    # 서버 중단 -> 대체
    srv.terminate(); time.sleep(0.5)
    pg2.fill('#botQ','404 not found'); pg2.click('#botSend'); pg2.wait_for_function("document.querySelectorAll('#botMsgs .ba').length>=3",timeout=8000); pg2.wait_for_timeout(300)
    ok('연결하지 못했다' in pg2.inner_text('#botMsgs'),'서버 중단 시 대체 안내')
    # 좁은 화면
    pg2.set_viewport_size({'width':560,'height':800}); pg2.wait_for_timeout(200); pg2.screenshot(path=''+SHOTS+'/bot_narrow.png')
    ov=pg2.evaluate("document.documentElement.scrollWidth>window.innerWidth"); ok(not ov,'좁은 화면 가로 넘침 없음')
    b.close()
print('page errors:',errs)
srv.terminate()
