// 콘텐츠 JS에서 서버용 지식 베이스(kb.json)를 만든다.
var fs=require('fs'), path=require('path');
var dir=__dirname;
var src=['content1.js','content2.js','content3.js'].map(function(f){return fs.readFileSync(path.join(dir,f),'utf8');}).join('\n');
var o=new Function(src+';return {STEPS:STEPS,SYMPTOMS:SYMPTOMS,TREE:TREE,START:START}')();
var kb={
  symptoms:o.SYMPTOMS,
  steps:o.STEPS.map(function(s){return {id:s.id,title:s.title,goal:s.goal,file:s.file||'',mode:s.mode,
    todos:(s.todos||[]).map(function(t){return {id:t.id,t:t.t,h:t.h};}),
    expected:s.expected,
    predicted:(s.predicted||[]).map(function(p){return {w:p.w,y:p.y,s:p.s,a:p.a,src:p.src};})};}),
  ladder:o.START.ladder
};
fs.writeFileSync(process.argv[2],JSON.stringify(kb));
console.log('kb.json', kb.symptoms.length+' symptoms', kb.steps.length+' steps');
