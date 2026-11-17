"""강사 검토함: 검토가 필요한 질문의 AI 초안을 저장하고, 강사가 고쳐 개별 전달한다.
상태는 둘이다. draft(초안, 강사 확인 전) -> delivered(강사가 고쳐서 전달함).
검토 대상 판정은 agent.review_reasons가 코드로 한다. 이 파일은 저장과 상태 전환만 맡는다."""
import json, os, threading, time, uuid, hashlib
import llm

PATH = llm.DATA_DIR / 'review_queue.json'
LABEL = {'long_stuck': '막힌 지 15분 이상', 'env': '환경 문제', 'no_basis': '가이드에 근거가 없음'}
MAX_ITEMS = 500                      # 수업 하루 분량이면 충분하다. 넘으면 오래된 전달 완료분부터 지운다
_lock = threading.Lock()

def _load():
    try: return json.loads(PATH.read_text(encoding='utf-8'))
    except Exception: return []
def _save(items):
    tmp = PATH.with_suffix('.tmp')
    tmp.write_text(json.dumps(items, ensure_ascii=False), encoding='utf-8'); os.replace(tmp, PATH)

def add_draft(cid, step, q, draft, reasons, stuck_min=0):
    """초안을 저장하고 id를 돌려준다."""
    item = {'id': uuid.uuid4().hex[:8], 'cid': cid, 'step': step, 'q': q[:500], 'draft': draft, 'reasons': list(reasons),
            'stuck_min': stuck_min, 'status': 'draft', 'ts': time.strftime('%H:%M:%S'), 'text': '', 'delivered_ts': ''}
    with _lock:
        items = _load(); items.append(item)
        if len(items) > MAX_ITEMS:
            keep = [i for i in items if i['status'] == 'draft']; done = [i for i in items if i['status'] != 'draft']
            items = (done[-(MAX_ITEMS - len(keep)):] if len(keep) < MAX_ITEMS else []) + keep
        _save(items)
    return item['id']

def listing(status=None):
    """강사 화면용 목록. cid 원문은 내보내지 않고 짧은 해시만 보여 준다."""
    with _lock: items = _load()
    out = []
    for i in items:
        if status and i['status'] != status: continue
        v = {k: i[k] for k in ('id', 'step', 'q', 'draft', 'reasons', 'stuck_min', 'status', 'ts', 'text', 'delivered_ts')}
        v['who'] = hashlib.sha1(i['cid'].encode()).hexdigest()[:6]; v['labels'] = [LABEL.get(r, r) for r in i['reasons']]
        out.append(v)
    return out

def deliver(rid, text):
    """강사가 고친 답을 전달 상태로 바꾼다. 이미 전달된 항목은 다시 고쳐 보낼 수 있다."""
    with _lock:
        items = _load()
        for i in items:
            if i['id'] == rid:
                i['status'] = 'delivered'; i['text'] = text; i['delivered_ts'] = time.strftime('%H:%M:%S'); _save(items); return True
    return False

def inbox(cid):
    """수강자에게 전달된 답만 돌려준다. cid를 아는 사람만 자기 답을 읽을 수 있다."""
    with _lock: items = _load()
    return [{'id': i['id'], 'step': i['step'], 'q': i['q'], 'text': i['text'], 'ts': i['delivered_ts']} for i in items if i['cid'] == cid and i['status'] == 'delivered']
