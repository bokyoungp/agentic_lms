(function(){
'use strict';

/* ---------- 상수 ---------- */
var STATUS = {
  working:{l:'진행 중', c:'노란색', d:'정상 진행 중'},
  stuck:{l:'스스로 해결 중', c:'주황색', d:'막혔지만 1~2층을 시도하는 중'},
  help:{l:'도움 필요', c:'빨간색', d:'1~3층을 거쳤고 강사가 필요하다'},
  done:{l:'단계 완료', c:'초록색', d:'확인 기준을 모두 통과했다'},
  helper:{l:'도와줄 수 있음', c:'파란색', d:'먼저 끝나서 옆 사람을 도울 수 있다'}
};
var STEP_ORDER = STEPS.map(function(s){return s.id;});
var STEP_BY = {}; STEPS.forEach(function(s){STEP_BY[s.id]=s;});

/* ---------- 상태 저장 ---------- */
function defaults(){
  return {name:'', status:'working', stuckSince:null, lastStep:'01', bot:{url:'',msgs:[],cid:'',type:''}, checks:{}, notes:{}, quiz:{}, hints:{}, open:{}, design:{}, dchk:{}, rubric:{}, broken:{}, timers:{}, help:{}, ins:{}, visits:[]};
}
var S = defaults(), canStore = true;
(function load(){
  try{
    var raw = window.localStorage.getItem(META.key);
    if(raw){ var o = JSON.parse(raw); for(var k in o){ S[k]=o[k]; } }
  }catch(e){ canStore = false; }
})();
var saveT = null;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(function(){
    try{ window.localStorage.setItem(META.key, JSON.stringify(S)); }catch(e){ canStore = false; }
  }, 200);
}
function saveNow(){ try{ window.localStorage.setItem(META.key, JSON.stringify(S)); }catch(e){ canStore=false; } }

/* ---------- 유틸 ---------- */
function E(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function $(sel, root){ return (root||document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
function toast(msg){ var t=$('#toast'); t.textContent=msg; t.style.display='block'; clearTimeout(toast._t); toast._t=setTimeout(function(){t.style.display='none';}, 1800); }
function copyText(text, cb){
  function fallback(){
    var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    var ok=false; try{ ok=document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); cb(ok);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(function(){cb(true);}, fallback); } else { fallback(); }
}
function pad(n){ return (n<10?'0':'')+n; }
function fmt(ms){ var s=Math.floor(ms/1000), m=Math.floor(s/60); s=s%60; var h=Math.floor(m/60); m=m%60; return (h?h+':'+pad(m):m)+':'+pad(s); }
function mins(t){ var p=t.split(':'); return +p[0]*60+ +p[1]; }
function nowSlot(d){
  var m=d.getHours()*60+d.getMinutes();
  for(var i=0;i<SLOTS.length;i++){ if(m>=mins(SLOTS[i].s) && m<mins(SLOTS[i].e)) return SLOTS[i]; }
  return null;
}
function phase(d){
  var m=d.getHours()*60+d.getMinutes(); if(m<mins('09:00')) return 'before'; if(m>=mins('18:00')) return 'after'; return 'during';
}
function isCheck(k){ return !!S.checks[k]; }
function nextOf(id){ var i=STEP_ORDER.indexOf(id); return i>=0&&i<STEP_ORDER.length-1?STEP_ORDER[i+1]:null; }
function prevOf(id){ var i=STEP_ORDER.indexOf(id); return i>0?STEP_ORDER[i-1]:null; }

/* ---------- 진행률 ---------- */
function stepKeys(st){
  var ks=[]; (st.tasks||[]).forEach(function(t){ks.push(t.id);});
  (st.expected||[]).forEach(function(x,i){ks.push('e|'+st.id+'|'+i);});
  return ks;
}
function stepProg(id){ var ks=stepKeys(STEP_BY[id]), d=0; ks.forEach(function(k){ if(S.checks[k]) d++; }); return {d:d,t:ks.length}; }
function allProg(){ var d=0,t=0; STEPS.forEach(function(s){var p=stepProg(s.id); d+=p.d; t+=p.t;}); return {d:d,t:t}; }
function pwProg(){
  var d=0,t=0; PREWORK.env.forEach(function(x){t++; if(S.checks[x.id]) d++;});
  PREWORK.pydantic.tries.forEach(function(x){t++; if(S.checks[x.id]) d++;});
  PREWORK.diag.forEach(function(x){t++; if((S.notes[x.id]||'').trim()) d++;});
  return {d:d,t:t};
}
function stProg(){ var d=0; START.checks.forEach(function(x){ if(S.checks[x.id]) d++; }); return {d:d,t:START.checks.length}; }
function bar(p){ var pc=p.t?Math.round(p.d*100/p.t):0; return '<div class="progress"><i style="width:'+pc+'%"></i></div>'; }
function quizScore(id){
  var st=STEP_BY[id], r=0, a=0; (st.quiz||[]).forEach(function(q,i){ var v=S.quiz[id+'|'+i]; if(v!=null){ a++; if(v===q.a) r++; } });
  return {right:r, answered:a, total:(st.quiz||[]).length};
}
function refreshProgress(){
  STEPS.forEach(function(s){
    var p=stepProg(s.id);
    $$('[data-prog="step:'+s.id+'"]').forEach(function(el){ el.textContent=p.d+'/'+p.t; });
    $$('[data-dot="'+s.id+'"]').forEach(function(el){ el.className='dot'+(p.t&&p.d===p.t?' ok':''); });
    $$('[data-bar="step:'+s.id+'"]').forEach(function(el){ el.innerHTML=bar(p); });
  });
  var a=allProg(); $$('[data-bar="all"]').forEach(function(el){ el.innerHTML=bar(a)+'<span class="small muted">'+a.d+' / '+a.t+' 항목</span>'; });
  var pw=pwProg(); $$('[data-bar="pw"]').forEach(function(el){ el.innerHTML=bar(pw)+'<span class="small muted">'+pw.d+' / '+pw.t+' 항목</span>'; });
  var sp=stProg(); $$('[data-bar="st"]').forEach(function(el){ el.innerHTML=bar(sp)+'<span class="small muted">'+sp.d+' / '+sp.t+' 항목</span>'; });
}

/* ---------- 작은 빌더 ---------- */
function codeBlock(c, label){
  return (label?'<div class="tab">'+E(label)+'</div>':'')+'<div class="code"><pre>'+E(c)+'</pre><button class="cp" data-act="copy" type="button">복사</button></div>';
}
function chk(map,key,label,desc,extra){
  var on=!!(S[map]&&S[map][key]);
  return '<label class="chk'+(on?' done':'')+'"><input type="checkbox" data-map="'+map+'" data-key="'+E(key)+'"'+(on?' checked':'')+'><span class="t"><b>'+label+'</b>'+(desc?'<br><span class="muted small">'+desc+'</span>':'')+(extra||'')+'</span></label>';
}
function ta(map,key,ph,rows){
  var v=(S[map]&&S[map][key])||'';
  return '<textarea data-map="'+map+'" data-key="'+E(key)+'" placeholder="'+E(ph||'')+'" rows="'+(rows||3)+'">'+E(v)+'</textarea>';
}
function inp(map,key,ph){
  var v=(S[map]&&S[map][key])||'';
  return '<input type="text" data-map="'+map+'" data-key="'+E(key)+'" placeholder="'+E(ph||'')+'" value="'+E(v)+'">';
}
function table(head, rows, cls){
  var h=head&&head.length?'<thead><tr>'+head.map(function(x){return '<th>'+E(x)+'</th>';}).join('')+'</tr></thead>':'';
  return '<div class="tw"><table class="'+(cls||'')+'">'+h+'<tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+E(c)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>';
}
function pill(txt, cls){ return '<span class="pill '+(cls||'')+'">'+E(txt)+'</span>'; }
function srcPill(s){ return s==='가이드'?pill('가이드 근거','guide'):pill('예측 · 강사 확인 필요','pred'); }

/* ---------- 구조 지도 (SVG) ---------- */
function mapSVG(stepId){
  var hl = {}, hl2 = {}, cap = '';
  var all=['req','pl','va','p','o','s','sy','rs'];
  if(stepId==='01'||stepId==='09'){ all.forEach(function(k){hl2[k]=1;}); cap='오늘 만드는 전체 구조'; }
  else if(['02','03','04','05'].indexOf(stepId)>=0){ hl.p=1; cap='단계 02~05 · Product Worker 내부 동작 원리: LLM API → Function Calling → ReAct 루프 → LangChain create_agent'; }
  else if(stepId==='06'){ all.forEach(function(k){hl2[k]=1;}); cap='단계 06 · LangGraph StateGraph가 전체 상태(State), 조건부 분기, 실행 결과 누적을 제어한다'; }
  else if(stepId==='07'){ hl.p=1; hl.o=1; hl.s=1; cap='단계 07 · Worker 3개로 역할을 나눈다'; }
  else if(stepId==='08'){ hl.pl=1; hl.va=1; hl.sy=1; hl2.p=1; hl2.o=1; hl2.s=1; cap='단계 08 · Planner, 검증, Synthesizer를 만들어 Worker와 연결한다'; }
  else { cap='구조 지도'; }
  function bx(k,x,y,w,h,t,sub){
    var cls=hl[k]?'bx hl':(hl2[k]?'bx hl2':'bx');
    return '<rect class="'+cls+'" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8"/><text x="'+(x+w/2)+'" y="'+(y+h/2+(sub?-3:5))+'" text-anchor="middle" class="'+(hl[k]?'hl':'')+'">'+t+'</text>'+(sub?'<text x="'+(x+w/2)+'" y="'+(y+h/2+13)+'" text-anchor="middle" class="cap">'+sub+'</text>':'');
  }
  var s='<svg class="map" viewBox="0 0 860 240" role="img" aria-label="전체 구조 지도: 사용자 요청, Planner, 계획 검증, Worker 3종, Synthesizer, 응답"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" style="color:var(--ink2)"/></marker></defs>';
  s+=bx('req',10,98,100,44,'사용자 요청');
  s+=bx('pl',136,98,100,44,'Planner','LLM이 계획');
  s+=bx('va',262,98,104,44,'계획 검증','코드로 검사');
  s+=bx('p',404,28,200,48,'Product Worker','LLM · create_agent');
  s+=bx('o',404,98,200,44,'Order Worker','함수');
  s+=bx('s',404,164,200,44,'Support Worker','함수');
  s+=bx('sy',648,98,108,44,'Synthesizer','고정 형식');
  s+=bx('rs',780,98,60,44,'응답');
  s+='<path class="ln" d="M110 120H134"/><path class="ln" d="M236 120H260"/>';
  s+='<path class="ln" d="M366 120H385V52H402"/><path class="ln" d="M366 120H402"/><path class="ln" d="M366 120H385V186H402"/>';
  s+='<path class="ln" d="M604 52H626V120H646"/><path class="ln" d="M604 120H646"/><path class="ln" d="M604 186H626V120H646"/><path class="ln" d="M756 120H778"/>';
  s+='<path class="ln dash" d="M314 142V222H186V144"/><text x="250" y="216" text-anchor="middle" class="cap">재시도 (최대 2회)</text>';
  s+='</svg><div class="small muted" style="margin-top:.2rem">'+E(cap)+(Object.keys(hl).length?' (노란색이 오늘의 위치)':'')+'</div>';
  return s;
}
function graph08SVG(){
  function nd(x,y,w,t,c){ return '<rect class="bx'+(c?' hl2':'')+'" x="'+x+'" y="'+y+'" width="'+w+'" height="40" rx="8"/><text x="'+(x+w/2)+'" y="'+(y+25)+'" text-anchor="middle">'+t+'</text>'; }
  var s='<svg class="map" viewBox="0 0 800 250" role="img" aria-label="단계 08 그래프 연결 구조"><defs><marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" style="color:var(--ink2)"/></marker></defs>';
  s+=nd(10,100,90,'planner',1)+nd(150,100,90,'validate',1)+nd(310,100,110,'worker_step',1)+nd(490,100,110,'synthesize',1)+nd(680,100,80,'END');
  s+=nd(150,190,90,'fail',1);
  var L=function(d,dash){ return '<path d="'+d+'" fill="none" stroke="var(--ink2)" stroke-width="1.6" '+(dash?'stroke-dasharray="5 4" ':'')+'marker-end="url(#arr2)"/>'; };
  s+=L('M100 120H148')+L('M240 120H308')+L('M420 120H488')+L('M600 120H678');
  s+=L('M195 100V50H55V98','1')+'<text x="125" y="44" text-anchor="middle" class="cap">틀렸고 재시도 가능</text>';
  s+=L('M195 140V188')+'<text x="205" y="168" class="cap">틀렸고 상한</text>';
  s+=L('M240 210H720V142')+'<text x="480" y="226" text-anchor="middle" class="cap">fail → END</text>';
  s+=L('M340 100V62H390V98','1')+'<text x="365" y="56" text-anchor="middle" class="cap">남은 작업이 있다</text>';
  s+='<text x="274" y="112" class="cap">올바르다</text><text x="454" y="112" class="cap">다 끝났다</text>';
  s+='</svg>';
  return s;
}

/* ---------- 개념 블록 ---------- */
function blocks(list){
  return list.map(function(b){
    if(b.t==='p') return '<p>'+b.h+'</p>';
    if(b.t==='table') return table(b.head,b.rows);
    if(b.t==='code') return codeBlock(b.c);
    if(b.t==='callout') return '<div class="callout '+(b.k==='warn'?'warn':b.k==='key'?'key':'')+'">'+b.h+'</div>';
    if(b.t==='flow'){
      return '<div class="flow">'+b.items.map(function(x,i){return (i?'<span class="ar">→</span>':'')+'<span class="nd">'+E(x)+'</span>';}).join('')+'</div>'+(b.note?'<p class="small muted">'+E(b.note)+'</p>':'');
    }
    if(b.t==='branch'){
      return '<div class="branch"><div class="hd">'+E(b.head)+'</div><div class="lines">'+b.items.map(function(x){return '<div class="ln"><span class="c">'+E(x[0])+' →</span><b>'+E(x[1])+'</b></div>';}).join('')+'</div><div class="small muted">'+E(b.end)+'</div></div>';
    }
    if(b.t==='graph08') return '<div class="card" style="padding:.6rem">'+graph08SVG()+'</div>';
    return '';
  }).join('');
}

/* ---------- 증상 ---------- */
function symHTML(sy, tokens, open){
  var t=E(sy.title);
  (tokens||[]).forEach(function(tk){ if(tk.length>=2){ try{ t=t.replace(new RegExp('('+tk.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>'); }catch(e){} } });
  return '<details class="res"'+(open?' open':'')+'><summary>'+t+' '+pill(sy.step.length>3?'단계 '+sy.step[0]+'~'+sy.step[sy.step.length-1]:'단계 '+sy.step.join(', '))+srcPill(sy.src)+'</summary><div class="bd"><p><b>원인</b> '+E(sy.cause)+'</p><p><b>해결</b></p><ol>'+sy.fix.map(function(f){return '<li>'+E(f)+'</li>';}).join('')+'</ol></div></details>';
}
function tokensOf(q){ return (q||'').toLowerCase().split(/[\s,.:;'"()\[\]{}<>=\/\\|_\-]+/).filter(function(x){return x.length>=2;}); }
function searchSyms(q, step){
  var qs=(q||'').trim().toLowerCase();
  if(!qs) return [];
  var toks=tokensOf(q);
  var out=[];
  SYMPTOMS.forEach(function(sy){
    var sc=0, hay=(sy.title+' '+sy.cause).toLowerCase();
    sy.sig.forEach(function(g){ var gl=g.toLowerCase(); if(gl && qs.indexOf(gl)>=0) sc+=6; else if(gl.length>=4 && gl.indexOf(qs)>=0 && qs.length>=4) sc+=3; });
    sy.kw.forEach(function(k){ var kl=k.toLowerCase(); if(qs.indexOf(kl)>=0) sc+=3; else if(kl.indexOf(qs)>=0 && qs.length>=2) sc+=2; });
    toks.forEach(function(tk){ if(hay.indexOf(tk)>=0) sc+=1; });
    if(hay.indexOf(qs)>=0) sc+=4;
    if(sc>0 && step && sy.step.indexOf(step)>=0) sc+=1;
    if(sc>0) out.push({sy:sy,sc:sc});
  });
  out.sort(function(a,b){return b.sc-a.sc;});
  return out.slice(0,8).map(function(x){return x.sy;});
}

/* ---------- 도움 카드 데이터 ---------- */
function hintSummary(stepId){
  var st=STEP_BY[stepId]; if(!st) return '';
  var out=[]; (st.todos||[]).forEach(function(t){ var lv=S.hints[stepId+'|'+t.id]||0; if(lv>0) out.push(t.id+' 힌트 '+lv+'단계까지'); });
  return out.join(', ');
}
function stuckMin(){ return S.stuckSince?Math.floor((Date.now()-S.stuckSince)/60000):0; }

/* ---------- 상태 ---------- */
function setStatus(k){
  S.status=k;
  if(k==='stuck' && !S.stuckSince) S.stuckSince=Date.now();
  if(k==='working'||k==='done'||k==='helper') S.stuckSince=null;
  saveNow(); updateBand();
}
function updateBand(){
  var b=$('#band'); b.setAttribute('data-s', S.status);
  var st=STATUS[S.status];
  $('#bandLbl').textContent='내 상태: '+st.l;
  var d=new Date(), sl=nowSlot(d), ph=phase(d), txt;
  if(sl) txt=sl.n+(sl.steps.length?' · 단계 '+sl.steps.join(', '):'')+' ('+sl.s+'~'+sl.e+')';
  else if(ph==='before') txt='수업 시작 전 (09:00 시작)';
  else if(ph==='after') txt='수업 종료';
  else txt='휴식';
  var extra=(S.stuckSince?' · 막힌 지 '+stuckMin()+'분':'');
  $('#bandMeta').textContent=pad(d.getHours())+':'+pad(d.getMinutes())+' · '+txt+extra;
  var big=$('#big'); if(big.classList.contains('on') && big.getAttribute('data-kind')==='status'){ big.style.background=colorOf(S.status); }
}
function colorOf(k){ return {working:'#e8b400',stuck:'#ee7d1a',help:'#d92d20',done:'#1b8a47',helper:'#2563c9'}[k]; }

/* ---------- 사이드바 ---------- */
function buildNav(){
  var h='<div class="brand">'+E(META.title)+'<small>'+E(META.sub)+'</small></div>';
  h+='<div class="grp">시작</div>';
  h+=nl('#/home','홈')+nl('#/prework','사전 준비','pw')+nl('#/start','당일 시작 준비','st');
  h+='<div class="grp">단계별 실습</div>';
  STEPS.forEach(function(s){
    var p=stepProg(s.id);
    h+='<a href="#/step/'+s.id+'" data-nav="step/'+s.id+'"><span class="num">'+s.id+'</span><span>'+E(s.title)+'</span><span class="dot'+(p.t&&p.d===p.t?' ok':'')+'" data-dot="'+s.id+'"></span></a>';
  });
  h+='<div class="grp">막혔을 때</div>';
  h+=nl('#/fix','증상 검색 · 진단')+nl('#/help','도움 요청 카드');
  h+='<div class="grp">정리</div>';
  h+=nl('#/design','설계 시트 · 루브릭')+nl('#/after','수업 이후 · 확장 과제');
  h+='<div class="grp">강사</div>';
  h+=nl('#/instructor','강사 화면')+nl('#/project/signals','투사: 신호 규칙');
  $('#side').innerHTML=h;
}
function nl(href,label,prog){ return '<a href="'+href+'" data-nav="'+href.slice(2)+'"><span>'+E(label)+'</span>'+(prog?'<span class="pg" data-bar-mini="'+prog+'"></span>':'')+'</a>'; }

/* ---------- 뷰: 홈 ---------- */
function viewHome(){
  var d=new Date(), sl=nowSlot(d), ph=phase(d);
  var now;
  if(sl && sl.steps.length){ now='지금은 <b>'+sl.n+'</b> ('+sl.s+'~'+sl.e+')이고 진행 단계는 '+sl.steps.map(function(x){return '<a href="#/step/'+x+'">단계 '+x+'</a>';}).join(', ')+'이다. 목표 산출물: '+E(sl.out); }
  else if(sl && sl.lunch) now='지금은 점심시간이다. '+E(sl.out);
  else if(sl && sl.wrap) now='정리와 Q&A 시간이다. 설계 시트를 마무리한다. <a href="#/design">설계 시트로 이동</a>';
  else if(ph==='before') now='수업 시작 전이다. <a href="#/prework">사전 준비</a>와 <a href="#/start">당일 시작 준비</a>를 확인한다.';
  else if(ph==='after') now='오늘 수업이 끝났다. <a href="#/after">수업 이후 안내</a>를 본다.';
  else now='휴식 시간이다.';
  var h='<h1>'+E(META.title)+'</h1><p class="muted">'+E(META.sub)+'</p>';
  h+='<div class="card"><div class="row"><div style="flex:1;min-width:200px"><label class="small muted">이름 (도움 요청 카드와 설계 시트에 쓰인다)</label>'+'<input type="text" data-map="root" data-key="name" placeholder="이름" value="'+E(S.name)+'"></div></div><p style="margin-top:.8rem">'+now+'</p></div>';
  h+='<div class="row" style="margin:.6rem 0"><a class="btn pri" href="#/fix">막혔어요: 증상 검색·진단</a><a class="btn" href="#/help">도움 요청 카드</a><a class="btn" href="#/design">설계 시트</a><button class="btn" data-act="openStatus" type="button">내 상태 바꾸기</button></div>';
  h+='<div class="grid2"><div class="card"><h3>사전 준비</h3><div data-bar="pw"></div><a href="#/prework">사전 준비 보기</a></div><div class="card"><h3>실습 진행</h3><div data-bar="all"></div><a href="#/step/'+E(S.lastStep||'01')+'">이어서 보기 (단계 '+E(S.lastStep||'01')+')</a></div></div>';
  h+='<div class="card"><h3>이 가이드를 쓰는 방법</h3><ol><li>터미널·에디터와 이 가이드를 한 화면에 나란히 둔다. 창이 좁아도 읽을 수 있게 만들었다.</li><li>막히면 <b>1층</b> 증상 검색·진단 → <b>2층</b> 짝 → <b>3층</b> 체크포인트 비교 → <b>4층</b> 강사 호출 순서로 올라간다.</li><li>각 단계의 확인 기준을 체크하면 진행률이 표시된다. 기록은 이 브라우저에만 저장된다.</li><li>상단 색 띠는 내 상태 신호다. 강사가 교실을 둘러볼 때 화면 색으로 파악한다.</li></ol></div>';
  h+='<h2>오늘의 학습 목표</h2>'+table(['#','학습 목표','확인 지점'], GOALS.map(function(g,i){return [i+1,g[0],g[1]];}));
  h+='<h2>과제 구성</h2>'+table(['과제','포함 단계','완료 시 확보하는 산출물'], ASSIGNMENTS.map(function(a){return [a.n,a.steps,a.out];}))+'<p class="small muted">각 단계가 끝나면 solution 폴더의 체크포인트 코드로 다음 과제에 합류할 수 있다.</p>';
  h+='<div class="card noprint"><h3>내 기록 백업</h3><p class="small muted">기록은 이 브라우저에 저장된다. 다른 컴퓨터로 옮기거나 지워지는 상황에 대비해 파일로 내보낼 수 있다.</p><div class="row"><button class="btn" data-act="export-json" type="button">백업 파일 내보내기</button><label class="btn">백업 파일 불러오기<input type="file" accept=".json,application/json" data-act="import-json" style="display:none"></label><button class="btn" data-act="reset-all" type="button">내 기록 모두 지우기</button></div>'+(canStore?'':'<p class="callout warn">이 브라우저에서는 기록을 저장할 수 없다. 창을 닫으면 사라지므로 백업 파일을 내보내 둔다.</p>')+'</div>';
  return h;
}

/* ---------- 뷰: 사전 준비 ---------- */
function viewPrework(){
  var h='<h1>사전 준비 (약 70분)</h1><p>수업 날 바로 코딩에 들어갈 수 있도록 미리 준비한다. 막히는 부분은 화면을 캡처해 전용 채널에 올리거나, 아래 증상 검색을 먼저 써 본다.</p><div data-bar="pw"></div>';
  h+='<h2>1. 환경 만들기 (약 30분)</h2><div class="card">';
  PREWORK.env.forEach(function(x,i){
    var extra=''; if(x.cmd) extra=x.cmd.map(function(c){return codeBlock(c[1],c[0]);}).join('');
    h+=chk('checks',x.id,(i+1)+'. '+E(x.t),E(x.d))+(extra?'<div style="margin-left:1.7rem">'+extra+'</div>':'');
  });
  h+='</div>';
  h+='<div class="callout warn">.env 파일과 API Key는 다른 사람에게 보내거나 공유 폴더에 올리지 않는다. 터미널이나 화면 공유에도 키가 보이지 않게 한다.</div>';
  h+='<h3>check_env 결과 읽기</h3><p class="small muted">모든 항목이 [OK]면 완료다. [확인 필요]가 나오면 아래 표에서 같은 문구를 찾는다.</p><div class="tw"><table><thead><tr><th>이런 메시지가 나오면</th><th>이렇게 해 본다</th></tr></thead><tbody>'+PREWORK.envRead.map(function(r){return '<tr><td>'+E(r[0])+'</td><td>'+E(r[1])+'</td></tr>';}).join('')+'</tbody></table></div>';
  h+='<div class="card"><h4>check_env 출력 붙여넣기 (선택)</h4><p class="small muted">강사에게 보여 줄 때 쓰는 메모다. 키 값은 출력되지 않지만, 다른 민감한 내용은 붙여넣지 않는다.</p>'+ta('notes','pw-evidence','python check_env.py 의 출력 전체를 붙여넣는다',5)+'</div>';
  h+='<h3>환경 설정이 어려운 경우</h3>'+table(['상황','대응'],PREWORK.fallback);
  h+='<h2>2. Python·LLM 경험 진단 5문항 (약 10분)</h2><p class="small muted">정답 여부로 평가하지 않는다. 수업 난이도와 도움이 필요한 곳을 맞추는 데만 쓴다. 답은 내 브라우저에만 저장된다.</p>';
  PREWORK.diag.forEach(function(x,i){ h+='<div class="card"><b>'+(i+1)+'.</b> '+E(x.q)+ta('notes',x.id,'내 답',i===2?5:3)+'</div>'; });
  h+='<h2>3. Pydantic 보충 학습 (약 30분)</h2><p>단계 02와 08에서 모델의 답을 \'정해진 모양\'으로 받을 때 쓴다.</p>'+codeBlock(PREWORK.pydantic.code,'pydantic 예시')+'<div class="card"><b>직접 해 볼 것</b>'+PREWORK.pydantic.tries.map(function(x){return chk('checks',x.id,E(x.t));}).join('')+'</div><div class="callout">'+E(PREWORK.pydantic.note)+'</div><p class="small muted">공식문서: docs.pydantic.dev/latest/concepts/models/ (인터넷 연결 시)</p>';
  h+='<div class="pager"><span></span><a class="btn pri" href="#/start">당일 시작 준비로</a></div>';
  return h;
}

/* ---------- 뷰: 시작 준비 ---------- */
function viewStart(){
  var cur=nowSlot(new Date());
  var h='<h1>당일 시작 준비</h1><p>수업 시작 시 확인할 것과 오늘 하루의 지도를 모았다.</p>';
  h+='<h2>오늘 만들 것</h2><div class="card"><p>고객 요청 예시</p>'+codeBlock(START.made.request)+'<ol>'+START.made.steps.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ol><p>결과 예시</p>'+codeBlock(START.made.answer)+'<p class="small muted">모든 실습 데이터는 모의 데이터이고 조회 기능만 쓴다. 환불·결제 같은 데이터 변경은 다루지 않는다.</p></div>';
  h+='<h2>전체 구조 지도</h2><div class="card">'+mapSVG('01')+'</div>';
  h+='<h2>시작 전 점검</h2><div data-bar="st"></div><div class="card">'+START.checks.map(function(x){return chk('checks',x.id,E(x.t));}).join('')+'</div>';
  h+='<div class="callout warn">.env 파일이 열린 화면을 투사하거나 다른 사람에게 보여 주지 않는다. 키가 노출되면 강사에게 알린다.</div>';
  h+='<h2>하루 시간표</h2><div class="tw"><table><thead><tr><th>교시</th><th>시간</th><th>진행 단계</th><th>주요 산출물</th></tr></thead><tbody>'+SLOTS.map(function(s){
    return '<tr class="'+(cur===s?'cur ':'')+(s.lunch?'lunch ':'')+(s.wrap?'wrap':'')+'"><td>'+E(s.n)+'</td><td>'+s.s+'~'+s.e+'</td><td>'+(s.steps.length?s.steps.map(function(x){return '<a href="#/step/'+x+'">'+x+'</a>';}).join(', '):'-')+'</td><td>'+E(s.out)+'</td></tr>';
  }).join('')+'</tbody></table></div><p class="small muted">50분 수업과 10분 휴식으로 진행한다. 점심 시각은 기관 일정에 맞춰 바뀔 수 있다. 현재 교시는 이 컴퓨터의 시계 기준으로 표시된다.</p>';
  h+='<h2>막혔을 때: 4층 사다리</h2>'+ladderHTML(null)+'<p class="small muted">시간은 목표 기준이다. 같은 곳에서 오래 진행이 없다면 다음 층으로 올라간다.</p>';
  h+='<h2>내 상태 신호</h2><p>화면 상단 색 띠와 스티커로 내 상태를 알린다. (신호 체계는 수업 시작 때 강사가 정한다. 아래는 기본 규칙이다)</p><div class="tw"><table><thead><tr><th>색</th><th>상태</th><th>뜻</th></tr></thead><tbody>'+START.signals.map(function(s){return '<tr><td><span class="pill" style="background:'+colorOf(s[0])+';color:'+(s[0]==='working'?'#2b2200':'#fff')+';border:0">'+E(s[2])+'</span></td><td><b>'+E(s[1])+'</b></td><td>'+E(s[3])+'</td></tr>';}).join('')+'</tbody></table></div><button class="btn" data-act="openStatus" type="button">내 상태 바꾸기</button>';
  h+='<h2>같이 가는 방법</h2>'+table(['방법','내용'],START.tools);
  h+='<h2>replay 모드로 쓸 수 있는 문장</h2><p>단계 06~09에서 <code>LLM_MODE=replay</code>를 쓰면 키와 네트워크 없이 실행된다. 아래 5개 문장에서만 동작한다.</p><div class="card">'+START.replaySentences.map(function(x){return '<div class="row" style="justify-content:space-between;margin:.2rem 0"><code>'+E(x)+'</code><button class="btn sm" data-act="copy-text" data-text="'+E(x)+'" type="button">복사</button></div>';}).join('')+'</div><p class="small muted">.env에서 LLM_MODE=replay로 바꾸고 저장한다. 단계 02~05는 실제 호출이 필요하므로 live로 되돌린다.</p>';
  h+='<h2>폴더 구성</h2>'+table(['폴더·파일','설명'],START.folders);
  h+='<div class="pager"><a class="btn" href="#/prework">사전 준비</a><a class="btn pri" href="#/step/01">단계 01 시작</a></div>';
  return h;
}
function ladderHTML(now){
  return '<div class="ladder">'+START.ladder.map(function(r,i){ return '<div class="rung'+(now===i+1?' now':'')+'"><span class="n">'+E(r[0])+'</span><span><b>'+E(r[1])+'</b> · '+E(r[2])+'</span><span class="tm">'+E(r[3])+'</span></div>'; }).join('')+'</div>';
}

/* ---------- 뷰: 단계 ---------- */
function todoHTML(stepId, t){
  var key=stepId+'|'+t.id, lv=S.hints[key]||0, st=STEP_BY[stepId];
  var open=(lv>0 || S.open['todo|'+key]);
  var h='<details class="todo" id="todo-'+stepId+'-'+t.id.replace(/\W/g,'_')+'" data-okey="todo|'+E(key)+'"'+(open?' open':'')+'><summary><span class="tn">'+E(t.id)+'</span><span>'+E(t.t)+'</span><span class="lv">힌트 '+lv+'/3</span></summary><div class="bd">';
  if(lv===0) h+='<p class="lock">먼저 스스로 시도한다. 막히면 힌트를 한 단계씩 연다.</p>';
  var names=['1단계 · 방향','2단계 · 뼈대','3단계 · 거의 정답'];
  for(var i=0;i<lv;i++){
    var tx=t.h[i], isCode=(i>0);
    h+='<div class="hint"><h5>'+names[i]+'</h5>'+(isCode?'<pre>'+E(tx)+'</pre>':'<div class="tx">'+E(tx)+'</div>')+'</div>';
  }
  h+='<div class="row">';
  if(lv<3) h+='<button class="btn sm pri" data-act="hint" data-step="'+stepId+'" data-todo="'+E(t.id)+'" data-dir="next" type="button">'+(lv===0?'힌트 1단계 열기':'다음 힌트 열기 ('+(lv+1)+'/3)')+'</button>';
  if(lv>0) h+='<button class="btn sm" data-act="hint" data-step="'+stepId+'" data-todo="'+E(t.id)+'" data-dir="reset" type="button">힌트 접기</button>';
  h+='</div>';
  if(lv===3 && st.file) h+='<p class="small muted" style="margin-top:.5rem">그래도 막히면 <code>solution/'+E(st.file)+'</code>의 같은 TODO 부분과 내 코드를 비교한다. 정답을 그대로 옮기지 말고 차이를 설명해 본다.</p>';
  h+='</div></details>';
  return h;
}
function quizHTML(stepId,i){
  var q=STEP_BY[stepId].quiz[i], sel=S.quiz[stepId+'|'+i], answered=(sel!=null);
  var h='<div class="q" id="q-'+stepId+'-'+i+'"><div class="qt">'+(i+1)+'. '+E(q.q)+'</div>';
  q.o.forEach(function(o,j){
    var cls=''; if(answered){ if(j===q.a) cls='right'; else if(j===sel) cls='wrong'; }
    h+='<label class="'+cls+'"><input type="radio" name="q'+stepId+i+'" data-act="quiz" data-step="'+stepId+'" data-i="'+i+'" data-j="'+j+'"'+(sel===j?' checked':'')+(answered?' disabled':'')+'><span>'+E(o)+'</span></label>';
  });
  if(answered){ h+='<div class="why"><b>'+(sel===q.a?'정답이다.':'정답은 '+E(q.o[q.a])+'이다.')+'</b> '+E(q.why)+' <button class="btn sm" data-act="quiz-reset" data-step="'+stepId+'" data-i="'+i+'" type="button">다시 풀기</button></div>'; }
  return h+'</div>';
}
function brokenHTML(stepId){
  var b=STEP_BY[stepId].broken; if(!b) return '';
  var rv=S.broken[stepId+'|reveal'];
  var h='<div class="card" id="broken-'+stepId+'"><h3>고장 난 예제: 실행하기 전에 예측한다</h3><p>'+E(b.intro)+'</p><div class="row small muted">파일: <code>'+E(b.file)+'</code></div>';
  h+='<div class="tw"><table><thead><tr><th>질문</th><th>내 예측</th></tr></thead><tbody>'+b.rows.map(function(r,i){
    var cur=S.broken[stepId+'|'+i];
    return '<tr><td>'+E(r)+'</td><td>'+b.opts.map(function(o){return '<label style="display:inline-flex;gap:.3rem;margin-right:.8rem"><input type="radio" name="bk'+stepId+i+'" data-map="broken" data-key="'+stepId+'|'+i+'" value="'+E(o)+'"'+(cur===o?' checked':'')+'>'+E(o)+'</label>';}).join('')+'</td></tr>';
  }).join('')+'</tbody></table></div>';
  h+=codeBlock(b.run)+'<p>실행해 본 결과와 예측이 다르다면 무엇 때문인지 적어 본다.</p>'+ta('notes','brk|'+stepId,'실행 결과 기록',3);
  h+='<div class="row" style="margin-top:.5rem"><button class="btn sm" data-act="reveal" data-step="'+stepId+'" type="button">'+(rv?'설명 접기':'실행 뒤 설명 보기')+'</button></div>'+(rv?'<div class="callout" style="margin-top:.6rem">'+E(b.reveal)+'</div>':'');
  return h+'</div>';
}
function timerHTML(st){
  var tm=S.timers[st.id]||{ms:0,since:null};
  var el=tm.ms+(tm.since?Date.now()-tm.since:0);
  return '<div class="card timer noprint" id="timerBox"><span class="small muted">내 실습 시간</span><span class="tim" data-tm="'+st.id+'">'+fmt(el)+'</span><span class="small muted">권장 '+st.min+'분</span>'+(tm.since?'<button class="btn sm" data-act="timer" data-step="'+st.id+'" data-do="pause" type="button">일시정지</button>':'<button class="btn sm pri" data-act="timer" data-step="'+st.id+'" data-do="start" type="button">시작</button>')+'<button class="btn sm" data-act="timer" data-step="'+st.id+'" data-do="reset" type="button">초기화</button><span class="small muted">같은 곳에서 10분 넘게 진행이 없으면 다음 층으로 올라간다.</span></div>';
}
function viewStep(id){
  var st=STEP_BY[id]; if(!st) return '<h1>없는 단계</h1>';
  S.lastStep=id; save();
  var h='<div class="crumb">단계별 실습 · '+(st.asg!=='-'?E(st.asg):'준비')+'</div><h1>단계 '+id+'. '+E(st.title)+'</h1>';
  h+='<div class="row" style="margin-bottom:.4rem">'+pill(st.min+'분')+(st.mode.indexOf('live')===0?pill(st.mode,'live'):pill(st.mode))+(st.design?pill('설계 시트 '+st.design,'guide'):'')+(st.file?'<span class="pill"><code>starter/'+E(st.file)+'</code></span>':'')+'</div>';
  h+='<div data-bar="step:'+id+'"></div>';
  h+='<div class="row noprint small" style="margin:.5rem 0"><a href="#s-concept">개념</a><a href="#s-practice">실습</a><a href="#s-check">확인 기준</a><a href="#s-stuck">막혔을 때</a><a href="#s-quiz">이해 확인</a></div>';
  h+=timerHTML(st);
  h+='<div class="card">'+mapSVG(id)+'</div>';
  h+='<div class="callout key"><b>이 단계의 목표</b> '+E(st.goal)+'</div>';
  if(st.mode.indexOf('live')===0) h+='<div class="callout warn">이 단계는 실제 LLM 호출이 필요하다. 네트워크와 API 키가 필요하며 replay 모드로 대체할 수 없다. .env의 LLM_MODE는 live여야 한다.</div>';
  if(st.precheck && st.precheck.length){ h+='<h2>사전 점검 (1~2분)</h2><div class="card">'+st.precheck.map(function(q,i){return '<p><b>'+(i+1)+'.</b> '+E(q)+'</p>'+ta('notes','pre|'+id+'|'+i,'한 줄로 적어 본다',2);}).join('')+'</div>'; }
  h+='<h2 id="s-concept">핵심 개념</h2>'+blocks(st.concept||[]);
  if(st.observe){ h+='<h3>완성본 시연 관찰</h3><div class="tw"><table><thead><tr><th>입력</th><th>관찰 포인트</th><th>내 답</th></tr></thead><tbody>'+st.observe.map(function(o,i){return '<tr><td>'+E(o[0])+'</td><td>'+E(o[1])+'</td><td>'+ta('notes','obs|'+id+'|'+i,'',2)+'</td></tr>';}).join('')+'</tbody></table></div>'; }
  if(st.judge){
    h+='<h3>판단 활동 (5분): LLM이 필요한가</h3><p class="small muted">먼저 내 판단과 이유를 적고 옆 사람과 30초 비교한다. 정답은 아래에 접어 두었다.</p><div class="tw"><table><thead><tr><th>Worker</th><th>입력 모양</th><th>LLM 필요? 이유</th></tr></thead><tbody>'+st.judge.rows.map(function(r,i){return '<tr><td>'+E(r[0])+'</td><td>'+E(r[1])+'</td><td>'+ta('notes','judge|'+i,'필요 / 불필요, 이유',3)+'</td></tr>';}).join('')+'</tbody></table></div><details class="res"><summary>정답 예시 보기</summary><div class="bd">'+E(st.judge.answerKey)+'</div></details>';
  }
  h+=brokenHTML(id);
  h+='<h2 id="s-practice">실습</h2>';
  if(st.run) h+='<p>실행</p>'+codeBlock(st.run);
  if(st.check) h+='<p>점검</p>'+codeBlock(st.check);
  if(st.tasks){ h+='<div class="card">'+st.tasks.map(function(t){return chk('checks',t.id,E(t.t))+(t.cmd?'<div style="margin-left:1.7rem">'+codeBlock(t.cmd)+'</div>':'');}).join('')+'</div>'; }
  if(st.todos && st.todos.length){
    h+='<p>'+st.todos.length+'개 TODO가 있다. <b>힌트는 3단계</b>이며 한 단계씩 연다. 1단계는 방향, 2단계는 뼈대, 3단계는 거의 정답이다.</p>';
    h+=st.todos.map(function(t){return todoHTML(id,t);}).join('');
  }
  if(st.scenarios){ h+='<h3>시나리오 5개</h3>'+table(['시나리오','요청','확인 포인트'],st.scenarios)+'<p class="small muted">시나리오 5는 Planner 출력을 직접 넣어 검증만 따로 확인한다. 모델 없이도 재현된다.</p>'; }
  if(st.edge){ h+='<h3>엣지 케이스 찾기</h3><ul>'+st.edge.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ul>'+ta('notes','edge|'+id,'발견한 엣지 케이스를 기록한다',4); }
  if(st.closing){ h+='<h3>마무리 점검 (10분)</h3><p class="small muted">완성하지 못했다면 체크포인트 코드로 시연해도 된다. 구조를 설명할 수 있으면 충분하다.</p><div class="card">'+st.closing.map(function(c,i){return chk('checks','cl|'+id+'|'+i,E(c[1]),'약 '+E(c[2]));}).join('')+'</div>'; }
  h+='<h2 id="s-check">확인 기준</h2><div class="card">'+st.expected.map(function(x,i){return chk('checks','e|'+id+'|'+i,E(x));}).join('')+'</div>';
  if(st.design){ h+='<div class="callout">설계 시트 '+E(st.design)+'을 작성할 시점이다. <a href="#/design">설계 시트로 이동</a> (약 5분)</div>'; }
  h+='<h2 id="s-stuck">막혔을 때</h2><div class="row noprint" style="margin-bottom:.6rem"><a class="btn pri" href="#/fix">증상 검색 · 진단 트리</a><button class="btn" data-act="bot-open" type="button">AI 도우미에게 묻기</button><button class="btn" data-act="stuck-start" type="button">막혔어요 (타이머 시작)</button><a class="btn" href="#/help">도움 요청 카드</a></div>';
  h+='<h3>막힘 예측표</h3><p class="small muted">\'가이드 근거\'는 덱·가이드 자료에 있는 내용이고, \'예측\'은 현장 경험에 비추어 추가한 항목이다. 예측 항목은 강사가 확인한 뒤 확정한다.</p><div class="tw"><table><thead><tr><th>막히는 지점</th><th>왜</th><th>스스로 해결</th><th>강사가 줄 수 있는 도움</th></tr></thead><tbody>'+st.predicted.map(function(p){return '<tr><td><b>'+E(p.w)+'</b><br>'+srcPill(p.src)+'</td><td>'+E(p.y)+'</td><td>'+E(p.s)+'</td><td>'+E(p.a)+'</td></tr>';}).join('')+'</tbody></table></div>';
  var rel=SYMPTOMS.filter(function(s){return s.step.indexOf(id)>=0;});
  h+='<h3>이 단계의 증상 목록 ('+rel.length+')</h3>'+rel.map(function(s){return symHTML(s,[],false);}).join('');
  if(st.join){
    var f=st.file;
    h+='<h3>체크포인트 합류</h3><div class="card"><p>코드가 꼬이면 해당 단계의 solution 파일로 바꿔 다음 단계에 합류할 수 있다. 먼저 힌트와 비교를 시도한다.</p>'+(f?'<ol><li>내 코드를 남겨 둔다 (나중에 비교하기 위해 파일 이름을 바꿔 복사)</li><li>solution 파일을 starter로 복사한다</li><li>실행해서 기대 출력을 확인한다</li></ol>'+codeBlock('copy starter\\'+f+' starter\\'+f.replace('.py','_my.py')+'\ncopy solution\\'+f+' starter\\'+f,'Windows (cmd)')+codeBlock('cp starter/'+f+' starter/'+f.replace('.py','_my.py')+'\ncp solution/'+f+' starter/'+f,'macOS / Linux'):'')+'<p class="small muted">'+E(st.join.note)+'</p></div>';
  }
  h+='<h2 id="s-quiz">이해 확인</h2><p class="small muted">각 문항은 답을 고르면 바로 채점된다. 틀려도 다시 풀 수 있다.</p>'+st.quiz.map(function(q,i){return quizHTML(id,i);}).join('');
  h+='<h3>설명 과제</h3><div class="card">'+st.explain.map(function(q,i){return '<p>'+E(q)+'</p>'+ta('notes','exp|'+id+'|'+i,'내 말로 적어 본다 (옆 사람에게 30초로 설명해 본다)',3);}).join('')+'</div>';
  var pv=prevOf(id), nx=nextOf(id);
  h+='<div class="pager">'+(pv?'<a class="btn" href="#/step/'+pv+'">← 단계 '+pv+'</a>':'<a class="btn" href="#/start">← 당일 시작 준비</a>')+(nx?'<a class="btn pri" href="#/step/'+nx+'">단계 '+nx+' →</a>':'<a class="btn pri" href="#/design">설계 시트로 →</a>')+'</div>';
  return h;
}

/* ---------- 뷰: 막힘 해결 ---------- */
var treePath=['root'];
var fixTab='search', fixQ='';
function ladderNow(){ var m=S.stuckSince?(Date.now()-S.stuckSince)/60000:null; if(m==null) return null; return m<7?1:(m<10?2:(m<15?3:4)); }
function stuckBox(){
  var n=ladderNow();
  var h='<div class="card" id="stuckBox"><div class="row" style="justify-content:space-between"><b>지금 몇 층인가</b>'+(S.stuckSince?'<span class="small">막힌 지 <b>'+stuckMin()+'분</b></span>':'<span class="small muted">막힌 시간 타이머가 꺼져 있다</span>')+'</div>'+ladderHTML(n);
  h+='<div class="row noprint">'+(S.stuckSince?'<button class="btn" data-act="stuck-solved" type="button">해결했어요</button>':'<button class="btn pri" data-act="stuck-start" type="button">막혔어요 (타이머 시작)</button>')+'<a class="btn" href="#/help">도움 요청 카드 작성</a></div>';
  if(n===3) h+='<p class="callout warn">10분이 지났다. 해당 단계의 solution 파일과 내 코드를 비교하거나 체크포인트로 합류하는 것을 고려한다.</p>';
  if(n===4) h+='<p class="callout warn">15분이 지났다. 도움 요청 카드를 작성하고 상태를 \'도움 필요\'로 바꾼다.</p>';
  return h+'</div>';
}
function treeHTML(){
  var cur=treePath[treePath.length-1], h='<div id="treeBox">';
  var crumbs=treePath.map(function(k){ var n=TREE[k]||TREE.leaves[k]; return E(n.q||n.title); });
  if(treePath.length>1) h+='<p class="crumb">'+crumbs.join(' › ')+'</p>';
  var node=TREE[cur];
  if(node){
    h+='<h3>'+E(node.q)+'</h3>'+node.o.map(function(o){return '<button class="opt" data-act="tree" data-to="'+o[1]+'" type="button">'+E(o[0])+'</button>';}).join('');
    if(treePath.length>1) h+='<button class="btn sm" data-act="tree-back" type="button">← 뒤로</button>';
  } else {
    var lf=TREE.leaves[cur];
    h+='<h3>'+E(lf.title)+'</h3><ol>'+lf.steps.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ol>';
    var msg={self:'위 순서를 모두 해 보았는데 같다면 증상 검색에 오류 메시지를 붙여넣거나, 짝에게 화면을 보여 준다.',peer:'혼자 풀리지 않으면 짝에게 화면을 보여 주는 것이 가장 빠르다. 먼저 끝난 사람(파란 상태)에게 물어도 좋다.',instructor:'이 항목은 환경·권한 문제일 수 있어 혼자 해결이 어려울 수 있다. 오류 화면을 캡처해 도움 요청 카드를 작성한다.'}[lf.tier];
    h+='<div class="callout">'+E(msg)+'</div>';
    if(lf.sym.length){ h+='<h4>관련 증상</h4>'+lf.sym.map(function(id){var sy=SYMPTOMS.filter(function(x){return x.id===id;})[0]; return sy?symHTML(sy,[],false):'';}).join(''); }
    h+='<div class="row noprint"><button class="btn" data-act="tree-reset" type="button">처음으로</button><button class="btn" data-act="tree-back" type="button">← 뒤로</button><button class="btn" data-act="stuck-solved" type="button">해결했어요</button><a class="btn" href="#/help">도움 요청 카드</a></div>';
  }
  return h+'</div>';
}
function searchHTML(){
  var q=fixQ, step=S.lastStep;
  var h='<label class="small muted" for="symq">오류 메시지의 마지막 줄이나 증상을 그대로 붙여넣거나 입력한다</label><input id="symq" type="text" data-act="search" placeholder="예: API key not valid / 404 / answer가 비어 있다 / 무한 반복" value="'+E(q)+'" autocomplete="off"><div id="symres">'+searchResults(q)+'</div>';
  return h;
}
function searchResults(q){
  var step=S.lastStep, h='';
  if(!q.trim()){
    var rel=SYMPTOMS.filter(function(s){return s.step.indexOf(step)>=0;});
    h+='<p class="small muted">입력 전에는 현재 단계(단계 '+E(step)+')의 증상을 보여 준다. 전체는 '+SYMPTOMS.length+'건이다.</p>'+rel.map(function(s){return symHTML(s,[],false);}).join('');
  } else {
    var res=searchSyms(q, step);
    if(!res.length) h+='<div class="callout warn">일치하는 증상이 없다. 다른 단어로 다시 검색하거나 <b>진단 트리</b> 탭을 써 본다. 그래도 안 되면 도움 요청 카드를 작성한다.</div>';
    else h+='<p class="small muted">'+res.length+'건 찾음</p>'+res.map(function(s,i){return symHTML(s,tokensOf(q),i===0);}).join('');
  }
  return h;
}
function viewFix(){
  var h='<h1>막혔을 때</h1><p>먼저 스스로 해결을 시도한다. 아래 도구는 모두 이 파일 안에 들어 있어 인터넷 없이 쓸 수 있다.</p>'+stuckBox();
  h+='<div class="row noprint" style="margin:.8rem 0">'+['search:증상 검색','tree:진단 트리','env:check_env 읽기'].map(function(x){var p=x.split(':');return '<button class="btn'+(fixTab===p[0]?' pri':'')+'" data-act="fixtab" data-tab="'+p[0]+'" type="button">'+p[1]+'</button>';}).join('')+'</div><div id="fixBody">'+fixBody()+'</div>';
  return h;
}
function fixBody(){
  if(fixTab==='search') return searchHTML();
  if(fixTab==='tree') return treeHTML();
  return '<p>python check_env.py 결과에서 [확인 필요]가 나온 줄을 아래 표에서 찾는다.</p><div class="tw"><table><thead><tr><th>이런 메시지가 나오면</th><th>이렇게 해 본다</th></tr></thead><tbody>'+PREWORK.envRead.map(function(r){return '<tr><td>'+E(r[0])+'</td><td>'+E(r[1])+'</td></tr>';}).join('')+'</tbody></table></div>';
}

/* ---------- 뷰: 도움 요청 카드 ---------- */
var TYPES=['실행하면 오류 메시지가 나온다','오류는 없는데 결과가 이상하다','어디서부터 해야 할지 모르겠다','환경 설치·설정 문제','기타'];
function helpData(){
  var H=S.help, step=H.step||S.lastStep||'01';
  var tried=[]; if(H['t:search']) tried.push('증상 검색'); if(H['t:tree']) tried.push('진단 트리'); if(H['t:hint']) tried.push('힌트'); if(H['t:peer']) tried.push('짝과 화면 비교'); if(H['t:cp']) tried.push('solution 파일 비교');
  var hs=hintSummary(step); if(hs && tried.indexOf('힌트')<0) tried.push('힌트 ('+hs+')');
  return {name:S.name||'(이름 미입력)', step:step, todo:H.todo||'-', type:H.type||'-', err:H.err||'-', want:H.want||'-', tried:tried.length?tried.join(' / '):'아직 없음', min:S.stuckSince?stuckMin()+'분':'-'};
}
function cardHTML(d){
  return '<div class="helpcard"><b>도움 요청 카드</b><dl><dt>이름</dt><dd>'+E(d.name)+'</dd><dt>단계 / TODO</dt><dd>단계 '+E(d.step)+' / '+E(d.todo)+'</dd><dt>증상 유형</dt><dd>'+E(d.type)+'</dd><dt>오류 메시지 (마지막 줄)</dt><dd>'+E(d.err)+'</dd><dt>기대한 것과 실제로 나온 것</dt><dd>'+E(d.want)+'</dd><dt>이미 해 본 것</dt><dd>'+E(d.tried)+'</dd><dt>막힌 시간</dt><dd>'+E(d.min)+'</dd></dl></div>';
}
function viewHelp(){
  var H=S.help, step=H.step||S.lastStep||'01';
  var h='<h1>도움 요청 카드</h1><p>강사가 자리에 도착했을 때 상황을 바로 파악할 수 있도록 작성한다. 강사는 혼자 20명을 지원하므로, 아래 항목을 채우면 대기 시간이 줄어든다.</p>';
  h+='<div class="callout warn"><b>화면에 .env 파일이나 API 키가 보이지 않게 한다.</b> 키가 노출되면 바로 알린다.</div>';
  h+='<div class="card"><h3>먼저 해 보았는가</h3><div class="row noprint"><a class="btn sm" href="#/fix">증상 검색·진단 트리</a></div>'+[['t:search','증상 검색을 해 보았다'],['t:tree','진단 트리를 따라가 보았다'],['t:hint','TODO 힌트를 열어 보았다'],['t:peer','짝과 화면을 비교했다'],['t:cp','solution 파일과 내 코드를 비교했다']].map(function(x){return chk('help',x[0],x[1]);}).join('')+'</div>';
  h+='<div class="card"><div class="grid2"><div><label class="small muted">단계</label><select data-map="help" data-key="step">'+STEP_ORDER.map(function(s){return '<option value="'+s+'"'+(s===step?' selected':'')+'>단계 '+s+' '+E(STEP_BY[s].title)+'</option>';}).join('')+'</select></div><div><label class="small muted">TODO 번호 / 막힌 위치</label>'+inp('help','todo','예: TODO 3, 줄 42')+'</div></div>';
  h+='<label class="small muted">증상 유형</label><select data-map="help" data-key="type"><option value="">선택</option>'+TYPES.map(function(t){return '<option'+(H.type===t?' selected':'')+'>'+E(t)+'</option>';}).join('')+'</select>';
  h+='<label class="small muted">오류 메시지 (마지막 줄 그대로)</label>'+ta('help','err','예: TypeError: search_products() got an unexpected keyword argument ...',3);
  h+='<label class="small muted">기대한 것과 실제로 나온 것</label>'+ta('help','want','예: 기대 - order_status ... / 실제 - 빈 값',3)+'</div>';
  h+='<h2>카드 미리보기</h2><div id="cardPrev">'+cardHTML(helpData())+'</div>';
  h+='<div class="row noprint" style="margin-top:.8rem"><button class="btn danger" data-act="help-red" type="button">상태를 \'도움 필요(빨강)\'로 바꾸기</button><button class="btn" data-act="help-big" type="button">카드를 크게 보여 주기</button><button class="btn" data-act="print" type="button">인쇄</button></div>';
  h+='<p class="small muted">스티커를 붙인 뒤 이 카드를 화면에 띄워 두고 기다린다. 기다리는 동안 증상 검색과 힌트를 계속 시도해도 된다.</p>';
  return h;
}

/* ---------- 뷰: 설계 시트 ---------- */
function rubricResult(){
  var n=0,f=0,p=0,b=0;
  RUBRIC.forEach(function(r){ var v=S.rubric[r.k]; if(v){ n++; if(v==='f') f++; else if(v==='p') p++; else b++; } });
  if(n<5) return '<p class="muted">5개 기준을 모두 선택하면 초안 판정이 표시된다. (현재 '+n+'/5)</p>';
  var ok=(f>=3 && b===0);
  var need=RUBRIC.filter(function(r){return S.rubric[r.k]==='n';}).map(function(r){return r.name;});
  var part=RUBRIC.filter(function(r){return S.rubric[r.k]==='p';}).map(function(r){return r.name;});
  return '<div class="callout '+(ok?'':'warn')+'"><b>초안 판정:</b> 기준 충족 '+f+'개, 부분 충족 '+p+'개, 보완 필요 '+b+'개. '+(ok?'기준 충족이 3개 이상이고 보완 필요가 없어 설계 목표 기준을 충족한다.':'기준 충족이 3개 이상이고 보완 필요가 없어야 한다. 아직 충족하지 못했다.')+(need.length?' 보완이 필요한 항목: '+E(need.join(', '))+'.':'')+(!ok&&part.length?' 부분 충족 항목: '+E(part.join(', '))+'.':'')+'</div><p class="small muted">⑥ 성찰·적용 계획은 평가 점수에 반영하지 않고 작성 여부만 확인한다.</p>';
}
function viewDesign(){
  var h='<h1>설계 시트와 루브릭</h1><p>코드 실습을 마칠 때마다 약 5분씩 한 칸을 채운다. 정해진 정답은 없고 <b>\'왜 이런 구조로 나누었는가\'</b>가 핵심이다. 수업 중에는 자가 점검까지만 하고, 강사 평가는 교육 종료 후 제출 시 선택으로 받는다.</p>';
  h+='<div class="card"><div class="grid2"><div><label class="small muted">이름</label><input type="text" data-map="root" data-key="name" placeholder="이름" value="'+E(S.name)+'"></div><div><label class="small muted">선정한 내 업무</label>'+inp('design','topic','예: 고객 문의 분류·답변 초안')+'</div></div></div>';
  h+='<details class="res"><summary>업무 선정 기준과 예시 업무 보기</summary><div class="bd"><p><b>선정 기준 (대부분 만족하는 업무 1건)</b></p><ul>'+DESIGN_CRIT.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ul><p><b>떠오르지 않을 때</b></p><ol>'+DESIGN_TOPICS.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ol></div></details>';
  DESIGN.forEach(function(c){
    h+='<div class="card"><h3>'+c.mark+' '+E(c.name)+' '+pill(c.when,'guide')+'</h3><p>'+E(c.q)+'</p>'+ta('design',c.k,'내 답',5)+'<div style="margin-top:.4rem">'+c.chk.map(function(x,i){return chk('dchk',c.k+'|'+i,E(x));}).join('')+'</div><details class="res"><summary>승승장구몰 예시 보기 (먼저 내 답을 쓴 뒤 비교한다)</summary><div class="bd">'+E(c.ex)+'</div></details></div>';
  });
  h+='<h2>루브릭 자가 점검</h2><p>5개 기준별로 \'기준 충족 / 부분 충족 / 보완 필요\' 중 하나를 스스로 표시한다.</p>';
  RUBRIC.forEach(function(r){
    var v=S.rubric[r.k]||'';
    h+='<div class="card"><b>'+E(r.name)+'</b><div class="tw"><table><tbody>'+[['f','기준 충족',r.f],['p','부분 충족',r.p],['n','보완 필요',r.n]].map(function(o){return '<tr><td style="width:7.5rem"><label style="display:flex;gap:.4rem;align-items:center"><input type="radio" name="rb'+r.k+'" data-map="rubric" data-key="'+r.k+'" value="'+o[0]+'"'+(v===o[0]?' checked':'')+'><b>'+o[1]+'</b></label></td><td>'+E(o[2])+'</td></tr>';}).join('')+'</tbody></table></div></div>';
  });
  h+='<div id="rubRes">'+rubricResult()+'</div>';
  h+='<div class="card noprint"><h3>내보내기</h3><p class="small muted">설계 시트를 파일로 저장하거나 인쇄한다. 교육 종료 후 강사 평가를 받으려면 기관 안내에 따라 이 파일을 제출한다(선택).</p><div class="row"><button class="btn pri" data-act="export-md" type="button">마크다운(.md)으로 저장</button><button class="btn" data-act="print" type="button">인쇄</button><button class="btn" data-act="export-json" type="button">전체 기록 백업(.json)</button></div></div>';
  return h;
}
function designMD(){
  var L=['# 에이전트 적용 설계 시트','','- 이름: '+(S.name||''),'- 선정한 내 업무: '+(S.design.topic||''),''];
  DESIGN.forEach(function(c){
    L.push('## '+c.mark+' '+c.name+' ('+c.when+')','', '작성 질문: '+c.q,'','**내 답**','',(S.design[c.k]||'(미작성)'),'','자가 점검:');
    c.chk.forEach(function(x,i){ L.push('- ['+(S.dchk[c.k+'|'+i]?'x':' ')+'] '+x); });
    L.push('');
  });
  L.push('## 루브릭 자가 점검','','| 기준 | 자가 판단 |','|---|---|');
  var map={f:'기준 충족',p:'부분 충족',n:'보완 필요'};
  RUBRIC.forEach(function(r){ L.push('| '+r.name+' | '+(map[S.rubric[r.k]]||'미선택')+' |'); });
  L.push('','판정(초안): 5개 기준 중 \'기준 충족\'이 3개 이상이고 \'보완 필요\'가 없으면 설계 목표를 달성한 것으로 본다. ⑥은 작성 여부만 확인한다.');
  return L.join('\n');
}
function download(name, text, type){
  var blob=new Blob([text],{type:type||'text/plain;charset=utf-8'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- 뷰: 수업 이후 ---------- */
function viewAfter(){
  var h='<h1>수업 이후</h1>';
  h+='<h2>수업 이후 활동</h2>'+table(['하고 싶다면','방법'],AFTER.after);
  h+='<h2>더 해 보고 싶다면: 확장 과제</h2><p class="small muted">먼저 끝난 사람은 1종을 골라 구현해 본다. 모듈 분리는 실무 코드 구조에 가장 가깝다.</p>'+table(['과제','내용'],AFTER.ext);
  h+='<h2>실무로 가져갈 때</h2>'+table(['주제','오늘','실무에서는'],AFTER.work)+'<div class="callout key">한 번에 크게 만들지 말고, 조회 전용 에이전트 하나로 시작해서 늘려 간다. 사내 보안 정책과 개인정보 규정은 기관·회사마다 다르므로 확인이 필요하다.</div>';
  h+='<h2>2주 안에 해 볼 좋은 한 걸음의 예</h2>'+table(['한 걸음','이유'],AFTER.good);
  h+='<h2>공식문서</h2><p class="small muted">문서는 자주 바뀐다. 예제를 참고할 때는 발행일과 import 경로를 먼저 확인한다. (링크는 인터넷에 연결되어 있을 때만 열린다)</p>'+table(['주제','문서','주소','오늘 단계'],AFTER.docs);
  h+='<div class="card"><h3>핵심 정리</h3><p>결과물은 쇼핑 도우미이고, 가져갈 것은 <b>설계 관점</b>이다. 업무를 분해하고, 도구와 상태를 정의하며, 실패할 지점을 먼저 방어한다. 내 업무에서 가장 작은 조회 기능 하나부터 시작해 본다.</p><a class="btn pri" href="#/design">설계 시트로 돌아가기</a></div>';
  return h;
}

/* ---------- 뷰: 강사 ---------- */
function viewInstructor(){
  var cur=nowSlot(new Date());
  var h='<h1>강사 화면</h1><p class="muted">이 화면은 강사가 진행을 돕기 위한 것이다. 수강자 개인의 상태는 이 파일이 알 수 없으므로, 색 띠와 스티커로 교실을 둘러보며 파악한다.</p>';
  h+='<h2>진행 시각표</h2><div class="tw"><table><thead><tr><th>교시</th><th>시간</th><th>단계</th><th>투사</th></tr></thead><tbody>'+SLOTS.map(function(s){return '<tr class="'+(cur===s?'cur ':'')+(s.lunch?'lunch ':'')+(s.wrap?'wrap':'')+'"><td>'+E(s.n)+'</td><td>'+s.s+'~'+s.e+'</td><td>'+(s.steps.length?s.steps.join(', '):'-')+'</td><td>'+s.steps.map(function(x){return '<a href="#/project/'+x+'">'+x+'</a>';}).join(' ')+'</td></tr>';}).join('')+'</tbody></table></div>';
  h+='<h2>단계 투사 화면</h2><p>단계를 고르면 큰 글씨로 구조 지도, 확인 기준, 공통 막힘 Top 3를 보여 준다.</p><div class="row">'+STEPS.map(function(s){return '<a class="btn" href="#/project/'+s.id+'">'+s.id+'</a>';}).join('')+'<a class="btn pri" href="#/project/signals">신호 규칙</a></div>';
  h+='<h2>수업 시작 전 점검</h2><div class="card">'+INSTR.before.map(function(x,i){return chk('ins','b'+i,E(x));}).join('')+'</div>';
  h+='<h2>수업 중 진행 메모</h2>'+table(['시점','할 일'],INSTR.during);
  h+='<h2>현장 방문 메모</h2><p class="small muted">도움 요청이 여러 곳에서 올 때 방문 순서를 정리하는 메모다. 이 컴퓨터에만 저장된다.</p><div class="card noprint"><div class="grid2"><div>'+'<input type="text" id="vName" placeholder="이름 또는 자리"></div><div><input type="text" id="vNote" placeholder="증상 (예: 단계 04 400 오류)"></div></div><div class="row" style="margin-top:.5rem"><button class="btn pri" data-act="visit-add" type="button">추가</button></div></div><div id="visitList">'+visitHTML()+'</div>';
  h+='<h2>수업 후</h2><ul>'+INSTR.after.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ul>';
  return h;
}
function visitHTML(){
  if(!S.visits.length) return '<p class="small muted">아직 메모가 없다.</p>';
  return '<div class="card">'+S.visits.map(function(v){return '<div class="chk'+(v.done?' done':'')+'"><input type="checkbox" data-act="visit-toggle" data-id="'+v.id+'"'+(v.done?' checked':'')+'><span class="t"><b>'+E(v.name)+'</b> · '+E(v.note)+'<br><span class="small muted">'+E(v.time)+'</span></span><button class="btn sm" data-act="visit-del" data-id="'+v.id+'" type="button">삭제</button></div>';}).join('')+'</div>';
}
/* 공통 막힘 Top 3: 서버가 있으면 오늘 질문 집계, 없으면 강사가 미리 적어 둔 예측을 보여 준다 */
function commonBox(st){
  return '<h3>공통 막힘 Top 3</h3><div id="commonTop" data-step="'+st.id+'"><ol>'+st.predicted.slice(0,3).map(function(p){return '<li><b>'+E(p.w)+'</b><br><span class="muted">'+E(p.s)+'</span></li>';}).join('')+'</ol></div>'+
    '<p class="small muted" id="commonSrc">예측 (질문 집계 전)</p><button class="btn sm noprint" data-act="common-refresh" type="button">새로고침</button>';
}
function commonLoad(id){
  var box=document.getElementById('commonTop'), src=document.getElementById('commonSrc'), base=botBase();
  if(!box||base===null) return;
  botFetch('/api/common?step='+encodeURIComponent(id),{base:base,method:'GET'},3000).then(function(d){
    if(!box.isConnected||!d.ok) return;
    var rows=(d.top||[]).map(function(t){ var sy=SYMPTOMS.filter(function(x){return x.id===t.id;})[0]; return sy?{sy:sy,people:t.people}:null; }).filter(Boolean);
    if(!rows.length){ src.textContent='예측 (아직 '+d.min_people+'명 이상 겹친 질문이 없다)'; return; }
    box.innerHTML='<ol>'+rows.map(function(r){ return '<li><b>'+E(r.sy.title)+'</b> <span class="muted">('+r.people+'명)</span><br><span class="muted">'+E(r.sy.fix[0]||'')+'</span></li>'; }).join('')+'</ol>';
    src.textContent='질문 집계 (오늘, '+d.min_people+'명 이상 겹친 증상)';
  }, function(){});
}
function viewProject(id){
  var h='<div class="proj">';
  h+='<div class="row noprint" style="margin-bottom:.6rem"><a class="btn" href="#/instructor">← 강사 화면</a>'+(id!=='signals'?'<a class="btn" href="#/project/'+(prevOf(id)||'signals')+'">이전</a><a class="btn" href="#/project/'+(nextOf(id)||'signals')+'">다음</a>':'')+'<button class="btn" data-act="print" type="button">인쇄</button></div>';
  if(id==='signals'){
    h+='<h1>신호 규칙과 막혔을 때</h1><h2>내 상태 신호</h2><table><thead><tr><th>색</th><th>상태</th><th>뜻</th></tr></thead><tbody>'+START.signals.map(function(s){return '<tr><td style="background:'+colorOf(s[0])+';color:'+(s[0]==='working'?'#2b2200':'#fff')+';font-weight:800">'+E(s[2])+'</td><td><b>'+E(s[1])+'</b></td><td>'+E(s[3])+'</td></tr>';}).join('')+'</tbody></table><h2>막혔을 때: 4층 사다리</h2>'+ladderHTML(null)+'<div class="callout warn">.env 파일과 API 키는 화면에 띄우거나 다른 사람에게 보내지 않는다.</div>';
    return h+'</div>';
  }
  var st=STEP_BY[id]; if(!st) return '<h1>없는 단계</h1>';
  h+='<h1>단계 '+id+'. '+E(st.title)+'</h1><div class="card">'+mapSVG(id)+'</div><div class="callout key"><b>목표</b> '+E(st.goal)+'</div>';
  h+='<div class="grid2"><div class="card"><h3>확인 기준</h3><ul>'+st.expected.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ul></div><div class="card">'+commonBox(st)+'</div></div>';
  if(st.run) h+=codeBlock(st.run);
  return h+'</div>';
}

/* ---------- 라우팅 ---------- */
function render(){
  var hash=location.hash||'#/home', parts=hash.replace(/^#\//,'').split('/'), name=parts[0]||'home', arg=parts[1], html;
  var main=$('#main');
  if(name==='step'||name==='project'){ if(name==='step' && !STEP_BY[arg]) arg='01'; }
  switch(name){
    case 'home': html=viewHome(); break;
    case 'prework': html=viewPrework(); break;
    case 'start': html=viewStart(); break;
    case 'step': html=viewStep(arg); break;
    case 'fix': html=viewFix(); break;
    case 'help': html=viewHelp(); break;
    case 'design': html=viewDesign(); break;
    case 'after': html=viewAfter(); break;
    case 'instructor': html=viewInstructor(); break;
    case 'project': html=viewProject(arg||'signals'); break;
    default: html=viewHome(); name='home';
  }
  main.innerHTML=html;
  $$('#side a').forEach(function(a){ var k=a.getAttribute('data-nav'); a.classList.toggle('on', k===(name+(arg&&name!=='home'?'/'+arg:''))||(k===name)); a.classList.toggle('cur', k==='step/'+S.lastStep); });
  $('#side').classList.remove('open');
  document.title=META.title;
  if(name==='project' && STEP_BY[arg]) commonLoad(arg);
  refreshProgress();
  var mini=$$('[data-bar-mini]'); mini.forEach(function(el){ var p=el.getAttribute('data-bar-mini')==='pw'?pwProg():stProg(); el.textContent=p.d+'/'+p.t; });
  if(location.hash.indexOf('#s-')===0){ var t=document.getElementById(location.hash.slice(1)); if(t) t.scrollIntoView(); } else window.scrollTo({top:0,behavior:'instant'});
}

/* ---------- 이벤트 ---------- */
var debounceT=null;
document.addEventListener('input', function(e){
  var t=e.target;
  if(t.getAttribute && t.getAttribute('data-act')==='search'){ fixQ=t.value; $('#symres').innerHTML=searchResults(fixQ); return; }
  var map=t.getAttribute&&t.getAttribute('data-map');
  if(!map) return;
  var key=t.getAttribute('data-key');
  if(t.type==='checkbox'||t.type==='radio') return;
  if(map==='root') S[key]=t.value; else S[map][key]=t.value;
  save();
  if(map==='help'){ var cp=$('#cardPrev'); if(cp) cp.innerHTML=cardHTML(helpData()); }
});
document.addEventListener('change', function(e){
  var t=e.target, act=t.getAttribute&&t.getAttribute('data-act');
  if(act==='quiz'){
    var st=t.getAttribute('data-step'), i=+t.getAttribute('data-i'), j=+t.getAttribute('data-j');
    S.quiz[st+'|'+i]=j; saveNow();
    var box=document.getElementById('q-'+st+'-'+i); if(box) box.outerHTML=quizHTML(st,i);
    return;
  }
  if(act==='import-json'){
    var f=t.files&&t.files[0]; if(!f) return;
    var r=new FileReader(); r.onload=function(){ try{ var o=JSON.parse(r.result); var d=defaults(); for(var k in d){ S[k]=(o[k]!==undefined?o[k]:d[k]); } saveNow(); updateBand(); render(); toast('백업을 불러왔다'); }catch(err){ toast('파일을 읽을 수 없다'); } }; r.readAsText(f); return;
  }
  var map=t.getAttribute&&t.getAttribute('data-map'); if(!map) return;
  var key=t.getAttribute('data-key');
  if(t.type==='checkbox'){
    S[map][key]=t.checked; var lab=t.closest('.chk'); if(lab) lab.classList.toggle('done', t.checked);
    saveNow(); refreshProgress();
    if(map==='checks'){ $$('[data-bar-mini]').forEach(function(el){ var p=el.getAttribute('data-bar-mini')==='pw'?pwProg():stProg(); el.textContent=p.d+'/'+p.t; }); }
    if(map==='help'){ var cp=$('#cardPrev'); if(cp) cp.innerHTML=cardHTML(helpData()); }
  } else if(t.type==='radio'){
    S[map][key]=t.value; saveNow();
    if(map==='rubric'){ $('#rubRes').innerHTML=rubricResult(); }
  } else if(t.tagName==='SELECT'){
    S[map][key]=t.value; saveNow();
    if(map==='help'){ var cp2=$('#cardPrev'); if(cp2) cp2.innerHTML=cardHTML(helpData()); }
  }
});
document.addEventListener('toggle', function(e){
  var d=e.target; if(d.tagName!=='DETAILS') return; var k=d.getAttribute('data-okey'); if(!k) return;
  S.open[k]=d.open; save();
}, true);
document.addEventListener('click', function(e){
  var t=e.target.closest('[data-act]'); if(!t){ if(e.target.closest('#side a')) $('#side').classList.remove('open'); return; }
  var act=t.getAttribute('data-act');
  if(act==='copy'){ var pre=t.parentNode.querySelector('pre'); copyText(pre.textContent, function(ok){ t.textContent=ok?'복사됨':'복사 실패'; setTimeout(function(){t.textContent='복사';},1200); }); }
  else if(act==='copy-text'){ copyText(t.getAttribute('data-text'), function(ok){ toast(ok?'복사했다':'복사하지 못했다'); }); }
  else if(act==='hint'){
    var st=t.getAttribute('data-step'), td=t.getAttribute('data-todo'), key=st+'|'+td, lv=S.hints[key]||0;
    S.hints[key]=t.getAttribute('data-dir')==='reset'?0:Math.min(3,lv+1); S.open['todo|'+key]=true; saveNow();
    var todo=STEP_BY[st].todos.filter(function(x){return x.id===td;})[0];
    var el=document.getElementById('todo-'+st+'-'+td.replace(/\W/g,'_')); if(el) el.outerHTML=todoHTML(st,todo);
    if(S.hints[key]>0 && S.status==='working'){} 
  }
  else if(act==='quiz-reset'){ var s2=t.getAttribute('data-step'), i2=+t.getAttribute('data-i'); delete S.quiz[s2+'|'+i2]; saveNow(); var b2=document.getElementById('q-'+s2+'-'+i2); if(b2) b2.outerHTML=quizHTML(s2,i2); }
  else if(act==='reveal'){ var s3=t.getAttribute('data-step'); S.broken[s3+'|reveal']=!S.broken[s3+'|reveal']; saveNow(); var b3=document.getElementById('broken-'+s3); if(b3) b3.outerHTML=brokenHTML(s3); }
  else if(act==='timer'){
    var s4=t.getAttribute('data-step'), tm=S.timers[s4]||{ms:0,since:null}, dd=t.getAttribute('data-do');
    if(dd==='start'){ tm.since=Date.now(); } else if(dd==='pause'){ tm.ms+=Date.now()-tm.since; tm.since=null; } else { tm={ms:0,since:null}; }
    S.timers[s4]=tm; saveNow(); var box=document.getElementById('timerBox'); if(box) box.outerHTML=timerHTML(STEP_BY[s4]);
  }
  else if(act==='openStatus'){ openStatus(); }
  else if(act==='setStatus'){ setStatus(t.getAttribute('data-s')); closeBig(); var sb=$('#stuckBox'); if(sb) sb.outerHTML=stuckBox(); }
  else if(act==='big'){ openBigStatus(); }
  else if(act==='closeBig'){ closeBig(); }
  else if(act==='stuck-start'){ setStatus('stuck'); toast('막힌 시간 타이머를 시작했다'); var sb2=$('#stuckBox'); if(sb2) sb2.outerHTML=stuckBox(); }
  else if(act==='stuck-solved'){ setStatus('working'); toast('상태를 진행 중으로 바꿨다'); var sb3=$('#stuckBox'); if(sb3) sb3.outerHTML=stuckBox(); }
  else if(act==='fixtab'){ fixTab=t.getAttribute('data-tab'); render(); }
  else if(act==='tree'){ treePath.push(t.getAttribute('data-to')); $('#treeBox').outerHTML=treeHTML(); }
  else if(act==='tree-back'){ if(treePath.length>1) treePath.pop(); $('#treeBox').outerHTML=treeHTML(); }
  else if(act==='tree-reset'){ treePath=['root']; $('#treeBox').outerHTML=treeHTML(); }
  else if(act==='help-red'){ setStatus('help'); toast('상태를 도움 필요로 바꿨다'); }
  else if(act==='help-big'){ openBigCard(); }
  else if(act==='print'){ window.print(); }
  else if(act==='common-refresh'){ var cb=$('#commonTop'); if(cb) commonLoad(cb.getAttribute('data-step')); }
  else if(act==='export-md'){ download('설계시트_'+(S.name||'내이름')+'.md', designMD(), 'text/markdown;charset=utf-8'); }
  else if(act==='export-json'){ download('agentic-lms-backup.json', JSON.stringify(S,null,1), 'application/json'); }
  else if(act==='reset-all'){ if(window.confirm('이 브라우저에 저장된 내 기록을 모두 지운다. 계속할까?')){ S=defaults(); saveNow(); updateBand(); render(); } }
  else if(act==='visit-add'){
    var n=$('#vName').value.trim(), no=$('#vNote').value.trim(); if(!n&&!no) return;
    var d=new Date(); S.visits.push({id:String(Date.now()), name:n||'-', note:no||'-', time:pad(d.getHours())+':'+pad(d.getMinutes()), done:false}); saveNow(); $('#visitList').innerHTML=visitHTML(); $('#vName').value=''; $('#vNote').value='';
  }
  else if(act==='visit-toggle'){ var id=t.getAttribute('data-id'); S.visits.forEach(function(v){ if(v.id===id) v.done=t.checked; }); saveNow(); $('#visitList').innerHTML=visitHTML(); }
  else if(act==='visit-del'){ var id2=t.getAttribute('data-id'); S.visits=S.visits.filter(function(v){return v.id!==id2;}); saveNow(); $('#visitList').innerHTML=visitHTML(); }
  else if(act==='menu'){ $('#side').classList.toggle('open'); }
  else if(act==='bot-open'){ botOpen(); }
});
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeBig(); });

/* ---------- 오버레이 ---------- */
function closeBig(){ var b=$('#big'); b.classList.remove('on'); b.innerHTML=''; b.removeAttribute('data-kind'); }
function openStatus(){
  var b=$('#big'); b.setAttribute('data-kind','pick'); b.className='on'; b.style.background='rgba(20,24,28,.94)';
  b.innerHTML='<div class="card" style="max-width:640px;width:100%;color:var(--ink);text-align:left"><h3>내 상태 선택</h3><div class="sgrid">'+Object.keys(STATUS).map(function(k){return '<button class="sbtn'+(S.status===k?' on':'')+'" data-act="setStatus" data-s="'+k+'" type="button"><b><i style="background:'+colorOf(k)+'"></i>'+STATUS[k].l+'</b><small>'+STATUS[k].c+' · '+STATUS[k].d+'</small></button>';}).join('')+'</div><div class="row" style="margin-top:.8rem"><button class="btn" data-act="big" type="button" style="color:var(--ink)">현재 상태를 크게 보기</button><button class="btn" data-act="closeBig" type="button" style="color:var(--ink)">닫기</button></div></div>';
}
function openBigStatus(){
  var b=$('#big'); b.setAttribute('data-kind','status'); b.className='on'; b.style.background=colorOf(S.status);
  b.style.color=S.status==='working'?'#2b2200':'#fff';
  b.innerHTML='<div class="bl">'+E(S.name||'')+'</div><div class="bl" style="font-size:clamp(1.8rem,6vw,4rem)">'+STATUS[S.status].l+'</div><div class="bs">'+STATUS[S.status].d+(S.stuckSince?' · 막힌 지 '+stuckMin()+'분':'')+'</div><button data-act="closeBig" type="button">닫기 (Esc)</button>';
}
function openBigCard(){
  var b=$('#big'); b.setAttribute('data-kind','card'); b.className='on'; b.style.background='rgba(20,24,28,.96)'; b.style.color='#fff';
  b.innerHTML='<div style="max-width:900px;width:100%;color:#1d2327;text-align:left">'+cardHTML(helpData()).replace('class="helpcard"','class="helpcard" style="background:#fff"')+'</div><button data-act="closeBig" type="button">닫기 (Esc)</button>';
}

/* ---------- 타이머 틱 ---------- */
setInterval(function(){
  updateBand();
  $$('[data-tm]').forEach(function(el){ var id=el.getAttribute('data-tm'), tm=S.timers[id]||{ms:0,since:null}; el.textContent=fmt(tm.ms+(tm.since?Date.now()-tm.since:0)); });
  var sb=$('#stuckBox'); if(sb && !document.activeElement.closest('#stuckBox')){ sb.outerHTML=stuckBox(); }
}, 1000);

/*BOT*/

/* ---------- 초기화 ---------- */
buildNav();
botInit();
$('#menuBtn').addEventListener('click', function(){ $('#side').classList.toggle('open'); });
$('#bandStatus').addEventListener('click', openStatus);
$('#bandBig').addEventListener('click', openBigStatus);
window.addEventListener('hashchange', render);
updateBand();
render();
})();
