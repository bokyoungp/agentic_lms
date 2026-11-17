/* ---------- AI 도우미 (서버 에이전트와 통신, 서버가 없으면 정적 검색으로 대체) ---------- */
var BOT = {busy:false, online:null, info:'', open:false};
var MODE_NAMES = {'':'자동', explain:'개념 설명', hint:'막힘 해결', extend:'스스로 진행'};
function botBase(){
  if(S.bot.url) return S.bot.url.replace(/\/+$/,'');
  if(location.protocol==='http:'||location.protocol==='https:') return '';
  return null;
}
function botCid(){ if(!S.bot.cid){ S.bot.cid='c'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); saveNow(); } return S.bot.cid; }
function botFetch(path, opt, ms){
  var ctl=('AbortController' in window)?new AbortController():null, t=null;
  if(ctl){ opt.signal=ctl.signal; t=setTimeout(function(){ ctl.abort(); }, ms); }
  return fetch(opt.base+path, opt).then(function(r){ clearTimeout(t); return r.json(); }, function(e){ clearTimeout(t); throw e; });
}
function botInit(){
  var fab=document.createElement('button'); fab.id='botFab'; fab.type='button'; fab.className='noprint'; fab.setAttribute('data-bot','toggle'); fab.textContent='AI 도우미';
  var box=document.createElement('section'); box.id='bot'; box.className='noprint'; box.hidden=true; box.setAttribute('aria-label','AI 도우미');
  box.innerHTML='<div class="bh"><b>AI 도우미</b><span id="botSt" class="small"></span><span class="sp"></span><button type="button" data-bot="cfg" title="서버 주소">설정</button><button type="button" data-bot="close" aria-label="닫기">닫기</button></div>'+
   '<div id="botCfg" class="bcfg" hidden><label class="small">서버 주소 (강사가 알려 준 주소. 강사 PC에서 가이드를 연 경우 비워 둔다)</label><div class="row"><input id="botUrl" type="text" placeholder="http://192.168.0.10:8787"><button type="button" data-bot="saveurl" class="btn sm">저장</button></div></div>'+
   '<div id="botMsgs" class="bm" aria-live="polite"></div>'+
   '<div class="bc"><div class="chips" id="botChips"></div><div class="row"><select id="botType" aria-label="도움 유형"></select><span class="small muted" id="botCtx"></span></div>'+
   '<textarea id="botTried" rows="2" placeholder="이미 해 본 것 (선택): 어떤 방법을 시도했고 무엇이 달랐는지"></textarea>'+
   '<div class="row"><textarea id="botQ" rows="2" placeholder="질문 또는 오류 메시지 (Enter 전송, Shift+Enter 줄바꿈)"></textarea><button type="button" class="btn pri" data-bot="send" id="botSend">보내기</button></div>'+
   '<p class="small muted" style="margin:.3rem 0 0">질문은 강사 PC의 서버로 전송되고 키 값은 자동으로 지워진다. 그래도 .env 내용은 붙여 넣지 않는다.</p></div>';
  document.body.appendChild(fab); document.body.appendChild(box);
  $('#botType').innerHTML=Object.keys(MODE_NAMES).map(function(k){ return '<option value="'+k+'">도움 유형: '+MODE_NAMES[k]+'</option>'; }).join('');
  $('#botType').value=S.bot.type||'';
  $('#botType').addEventListener('change', function(e){ S.bot.type=e.target.value; saveNow(); });
  $('#botQ').addEventListener('keydown', function(e){ if(e.key==='Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); botSend(); } });
  $('#botUrl').value=S.bot.url||'';
  box.addEventListener('click', botClick); fab.addEventListener('click', function(){ BOT.open?botClose():botOpen(); });
}
function botChips(){
  var step=STEP_BY[S.lastStep];
  var c=['방금 난 오류의 원인을 알려 줘','이 단계에서 가장 많이 막히는 곳은?'];
  if(step) c.push('"'+step.title+'" 개념을 쉬운 예로 설명해 줘');
  $('#botChips').innerHTML=c.map(function(x){ return '<button type="button" data-bot="chip" data-q="'+E(x)+'">'+E(x)+'</button>'; }).join('');
}
function botCtxText(){
  var p=stepProg(S.lastStep), n=0, st=STEP_BY[S.lastStep];
  (st.todos||[]).forEach(function(t){ n+=(S.hints[S.lastStep+'|'+t.id]||0)>0?1:0; });
  return '단계 '+S.lastStep+' · 확인 '+p.d+'/'+p.t+' · 연 힌트 '+n+'개'+(S.stuckSince?' · 막힌 지 '+stuckMin()+'분':'');
}
function botOpen(){
  BOT.open=true; $('#bot').hidden=false; $('#botFab').classList.add('on'); botChips(); $('#botCtx').textContent=botCtxText(); botRender(); botHealth();
  setTimeout(function(){ var q=$('#botQ'); if(q) q.focus(); }, 50);
}
function botClose(){ BOT.open=false; $('#bot').hidden=true; $('#botFab').classList.remove('on'); }
function botHealth(){
  var base=botBase(), st=$('#botSt');
  if(base===null){ BOT.online=false; st.textContent='서버 주소 없음 · 정적 검색만 사용'; $('#botCfg').hidden=false; return; }
  st.textContent='연결 확인 중';
  botFetch('/api/health',{base:base,method:'GET'},3000).then(function(d){
    BOT.online=!!d.ok; st.textContent=d.ok?('연결됨 · '+d.provider+(d.ready?'':' (서버 키 없음)')):'서버 응답 이상';
    if(d.ok&&!d.ready) st.textContent+=' · 강사에게 알린다';
  }, function(){ BOT.online=false; st.textContent='서버에 연결할 수 없다 · 정적 검색만 사용'; });
}
function botMsgHTML(m, i){
  if(m.r==='u'){
    return '<div class="bu"><div class="bb">'+E(m.t).replace(/\n/g,'<br>')+(m.tried?'<div class="small" style="opacity:.85;margin-top:.3rem">해 본 것: '+E(m.tried).replace(/\n/g,'<br>')+'</div>':'')+'</div></div>';
  }
  var t=E(m.t).replace(/\n/g,'<br>'), ids=[];
  t=t.replace(/\[([A-Za-z0-9_]+)\]/g, function(all,id){ var sy=SYMPTOMS.filter(function(x){return x.id===id;})[0]; if(!sy) return all; if(ids.indexOf(id)<0) ids.push(id); return '<button type="button" class="sym" data-bot="sym" data-id="'+id+'" title="'+E(sy.title)+'">'+id+'</button>'; });
  var h='<div class="ba"><div class="bb'+(m.err?' err':'')+'">'+t;
  if(m.fallback && m.fallback.length) h+='<div class="small" style="margin-top:.4rem"><b>가이드에서 찾은 증상</b> (서버 없이 검색한 결과)</div>'+m.fallback.map(function(id){ var sy=SYMPTOMS.filter(function(x){return x.id===id;})[0]; return sy?symHTML(sy,[],false):''; }).join('');
  h+='</div>';
  if(m.trace && m.trace.length){
    h+='<details class="trace"><summary>에이전트 동작 보기 (도구 '+m.trace.length+'회)</summary><ol>'+m.trace.map(function(x){ var a=''; try{ a=JSON.stringify(x.args); }catch(e){} return '<li><code>'+E(x.tool)+'</code> <span class="muted small">'+E(a.length>80?a.slice(0,80)+'...':a)+'</span><br><span class="small">'+E(x.summary)+'</span></li>'; }).join('')+'</ol><p class="small muted">판단(LLM) -> 도구(코드) -> 관찰을 반복한 기록이다. 힌트 공개 여부는 코드가 검사한다.</p></details>';
  }
  var meta=[]; if(m.mode_label) meta.push('도움 모드 '+m.mode_label); if(m.provider && m.provider!=='mock') meta.push(m.provider); if(m.provider==='mock') meta.push('모의 응답'); if(m.masked) meta.push('키로 보이는 문자열 '+m.masked+'건 제거'); 
  if(meta.length) h+='<div class="small muted bmeta">'+E(meta.join(' · '))+'</div>';
  return h+'</div>';
}
function botRender(){
  var el=$('#botMsgs'); if(!el) return;
  if(!S.bot.msgs.length){ el.innerHTML='<p class="muted small" style="padding:.6rem">막힌 부분을 적어 본다. 이미 해 본 것을 함께 적으면 더 정확하게 도울 수 있다. 정답 코드는 주지 않고, 열어 둔 힌트 단계까지만 안내한다.</p>'; }
  else el.innerHTML=S.bot.msgs.map(botMsgHTML).join('')+(BOT.busy?'<div class="ba"><div class="bb muted">찾아보는 중...</div></div>':'');
  el.scrollTop=el.scrollHeight;
  var b=$('#botSend'); if(b) b.disabled=BOT.busy;
}
function botPush(m){ S.bot.msgs.push(m); if(S.bot.msgs.length>30) S.bot.msgs=S.bot.msgs.slice(-30); saveNow(); }
function botSend(){
  var q=$('#botQ').value.trim(), tried=$('#botTried').value.trim();
  if(!q||BOT.busy) return;
  var step=S.lastStep, base=botBase();
  var hints={}; (STEP_BY[step].todos||[]).forEach(function(t){ var v=S.hints[step+'|'+t.id]||0; if(v) hints[t.id]=v; });
  var p=stepProg(step);
  var hist=S.bot.msgs.slice(-6).map(function(m){ return {r:m.r, t:m.t}; });
  botPush({r:'u', t:q, tried:tried}); $('#botQ').value=''; BOT.busy=true; botRender();
  var body={cid:botCid(), q:q, tried:tried, step:step, hints:hints, stuck_min:stuckMin(), done_ratio:p.t?p.d/p.t:0, help_type:S.bot.type||'', history:hist};
  function offline(why){
    var ids=searchSyms(q+' '+tried, step).slice(0,3).map(function(s){return s.id;});
    botPush({r:'a', t:why+' 대신 가이드의 증상 검색 결과를 보여 준다.'+(ids.length?'':' 일치하는 증상이 없으면 진단 트리를 쓰거나 도움 요청 카드를 작성한다.'), fallback:ids, err:true});
    BOT.busy=false; botRender();
  }
  if(base===null){ offline('서버 주소가 설정되지 않았다.'); return; }
  botFetch('/api/chat',{base:base, method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}, 70000).then(function(d){
    if(d && d.ok){ botPush({r:'a', t:d.text, trace:d.trace||[], provider:d.provider, mode_label:d.mode_label, masked:d.masked}); BOT.busy=false; botRender(); }
    else offline((d&&d.msg)?d.msg+'.':'답을 받지 못했다.');
  }, function(){ BOT.online=false; $('#botSt').textContent='서버에 연결할 수 없다 · 정적 검색만 사용'; offline('서버에 연결하지 못했다.'); });
}
function botClick(e){
  var t=e.target.closest('[data-bot]'); if(!t) return; var a=t.getAttribute('data-bot');
  if(a==='close') botClose();
  else if(a==='cfg'){ var c=$('#botCfg'); c.hidden=!c.hidden; }
  else if(a==='saveurl'){ S.bot.url=$('#botUrl').value.trim(); saveNow(); botHealth(); toast('서버 주소를 저장했다'); }
  else if(a==='send') botSend();
  else if(a==='chip'){ $('#botQ').value=t.getAttribute('data-q'); $('#botQ').focus(); }
  else if(a==='sym'){
    var sy=SYMPTOMS.filter(function(x){return x.id===t.getAttribute('data-id');})[0]; if(!sy) return;
    fixTab='search'; fixQ=sy.title; botClose();
    if(location.hash==='#/fix') render(); else location.hash='#/fix';
  }
}
document.addEventListener('keydown', function(e){ if(e.key==='Escape' && BOT.open && document.activeElement && document.activeElement.id!=='botQ') botClose(); });
window.addEventListener('hashchange', function(){ if(BOT.open){ $('#botCtx').textContent=botCtxText(); botChips(); } });
