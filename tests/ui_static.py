import sys, json
import os, pathlib, tempfile
ROOT = str(pathlib.Path(__file__).resolve().parent.parent)
SERVER = ROOT + '/server'
GUIDE = ROOT + '/out/index.html'
SHOTS = ROOT + '/tests/shots'; os.makedirs(SHOTS, exist_ok=True)
DATA = tempfile.mkdtemp(prefix='botdata-')      # 설정과 로그는 임시 폴더에 둔다 (내 설정을 덮어쓰지 않는다)
CHROME = os.environ.get('CHROME_PATH') or None  # 비우면 playwright 기본 chromium 사용
LAUNCH = dict(args=['--no-sandbox'], **({'executable_path': CHROME} if CHROME else {}))

from playwright.sync_api import sync_playwright
URL='file://'+GUIDE
errs=[]
def log(*a): print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(**LAUNCH)
    ctx=b.new_context(viewport={'width':1280,'height':900}, accept_downloads=True)
    pg=ctx.new_page()
    pg.on('console', lambda m: errs.append(('console',m.type,m.text)) if m.type in ('error','warning') else None)
    pg.on('pageerror', lambda e: errs.append(('pageerror',str(e))))
    pg.goto(URL); pg.wait_for_selector('#main h1')
    log('home h1:', pg.inner_text('#main h1'))
    # visit every route
    routes=['home','prework','start']+['step/%02d'%i for i in range(1,10)]+['fix','help','design','after','instructor','project/signals']+['project/%02d'%i for i in range(1,10)]
    for r in routes:
        pg.goto(URL+'#/'+r); pg.wait_for_timeout(80)
        h=pg.inner_text('#main h1')
        n=len(pg.inner_text('#main'))
        log('%-16s h1=%s len=%d'%(r,h[:40],n))
    # hints
    pg.goto(URL+'#/step/03'); 
    pg.click('#todo-03-TODO_1 summary')
    for i in range(3):
        pg.click('#todo-03-TODO_1 [data-act=hint][data-dir=next]')
    log('hint level text:', pg.inner_text('#todo-03-TODO_1 summary')[-12:])
    log('solution pointer shown:', 'solution/03_function_calling.py' in pg.inner_text('#todo-03-TODO_1'))
    # quiz
    pg.click('#q-03-0 label:nth-child(3) input')  # wrong (index 1 of options => nth-child 3 because first child is .qt)
    log('quiz why:', pg.inner_text('#q-03-0 .why')[:60])
    # checks + progress
    pg.click('#s-check ~ .card label.chk:nth-child(1) input')
    log('step progress:', pg.inner_text('[data-bar="step:03"]'))
    # timer
    pg.click('[data-act=timer][data-do=start]'); pg.wait_for_timeout(1300)
    log('timer:', pg.inner_text('[data-tm="03"]'))
    # broken
    pg.goto(URL+'#/step/04')
    pg.click('#broken-04 input[value="계속된다"]')
    pg.click('#broken-04 [data-act=reveal]')
    log('broken reveal:', pg.inner_text('#broken-04 .callout')[:30])
    # search
    pg.goto(URL+'#/fix')
    pg.fill('#symq','API key not valid')
    log('search first:', pg.inner_text('#symres details summary')[:40])
    pg.fill('#symq',"ImportError: cannot import name 'create_agent' from 'langchain.agents'")
    log('search2 first:', pg.inner_text('#symres details summary')[:50])
    pg.fill('#symq','answer가 비어 있다')
    log('search3 first:', pg.inner_text('#symres details summary')[:50])
    pg.fill('#symq','zzzzzz')
    log('search none:', pg.inner_text('#symres')[:40])
    # tree
    pg.click('[data-act=fixtab][data-tab=tree]')
    pg.click('[data-act=tree][data-to=err]'); pg.click('[data-act=tree][data-to=leaf_api]')
    log('tree leaf:', pg.inner_text('#treeBox h3'))
    # stuck
    pg.click('[data-act=stuck-start]')
    log('band after stuck:', pg.inner_text('#bandLbl'), '|', pg.inner_text('#bandMeta'))
    # help card
    pg.goto(URL+'#/help')
    pg.fill('[data-key=err]','TypeError: x'); pg.fill('[data-key=todo]','TODO 3')
    pg.check('[data-key="t:search"]')
    log('card:', pg.inner_text('#cardPrev')[:160].replace('\n',' | '))
    pg.click('[data-act=help-red]'); log('band:', pg.get_attribute('#band','data-s'))
    pg.click('[data-act=help-big]'); log('big on:', pg.evaluate("document.getElementById('big').classList.contains('on')"))
    pg.keyboard.press('Escape')
    # design
    pg.goto(URL+'#/design')
    pg.fill('[data-key=c1]','복합 쇼핑 응대'); pg.fill('[data-map=design][data-key=topic]','고객 문의')
    for k,v in [('r1','f'),('r2','f'),('r3','f'),('r4','p'),('r5','p')]:
        pg.check('[data-map=rubric][data-key=%s][value=%s]'%(k,v))
    log('rubric:', pg.inner_text('#rubRes')[:120])
    with pg.expect_download() as d: pg.click('[data-act=export-md]')
    path=d.value.path(); txt=open(path,encoding='utf-8').read(); log('md download:', d.value.suggested_filename, len(txt)); log(txt[:260])
    # persistence
    pg.reload(); pg.wait_for_selector('#main h1')
    log('persist c1:', pg.input_value('[data-key=c1]'))
    pg.goto(URL+'#/step/03'); log('persist hint:', pg.inner_text('#todo-03-TODO_1 summary')[-10:], '| quiz why kept:', 'why' in pg.inner_html('#q-03-0'))
    # instructor visits
    pg.goto(URL+'#/instructor'); pg.fill('#vName','A-3'); pg.fill('#vNote','04 400'); pg.click('[data-act=visit-add]'); log('visit:', pg.inner_text('#visitList')[:30].replace('\n',' '))
    # screenshots
    for r,name in [('home','home'),('step/04','step04'),('fix','fix'),('help','help'),('design','design'),('project/08','proj08')]:
        pg.goto(URL+'#/'+r); pg.wait_for_timeout(150); pg.screenshot(path=''+SHOTS+'/%s.png'%name, full_page=False)
    pg.set_viewport_size({'width':560,'height':900})
    pg.goto(URL+'#/step/06'); pg.wait_for_timeout(150); pg.screenshot(path='/home/claude/work/test/shots/narrow06.png')
    ov=pg.evaluate("document.documentElement.scrollWidth>window.innerWidth")
    log('narrow overflow:', ov)
    b.close()
log('ERRORS:', json.dumps(errs, ensure_ascii=False)[:1500])
