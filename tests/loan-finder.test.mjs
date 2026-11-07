import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

// Entirely offline: fake DOM/FormData/clipboard/analytics and an inert deferred
// fetch substitute. No actual browser, HTTP, production analytics or lead call.
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const scripts=Object.fromEntries(['baseline','prior-candidate','candidate'].map(k=>{
  if(k!=='candidate')return [k,fs.readFileSync(path.join(ROOT,'fixtures','loan-finder',k+'.js'),'utf8')];
  const html=fs.readFileSync(path.join(ROOT,'..','loan-finder.html'),'utf8');
  return [k,[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1]];
}));
const names=['goal','income','status','credit','amount','down','property'];
const valid={goal:'买自住房',income:'W2',status:'H1B',credit:'720–759',property:'自住房',amount:'',down:''};
const changed={...valid,income:'暂无收入 / 工作变动'};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function harness(kind='candidate'){
  const elements=new Map(),tracks=[],fetchCalls=[],clipboardCalls=[];
  let trackThrows=false,clipMode='resolve',clipPending=null;
  function el(id){
    if(!elements.has(id)){
      const classes=new Set(id==='finderResult'?['result']:[]);
      elements.set(id,{id,hidden:id==='contactStage',textContent:'',innerHTML:'',disabled:false,checked:false,style:{},attributes:{},data:{},elements:{},controls:[],listeners:{},valid:true,
        classList:{add(x){classes.add(x);},remove(x){classes.delete(x);},contains(x){return classes.has(x);}},
        addEventListener(event,fn){this.listeners[event]=fn;},scrollIntoView(){},setAttribute(k,v){this.attributes[k]=v;},
        reportValidity(){return this.valid&&(this.id!=='contactStage'||(el('consent').checked&&Boolean(this.data.name)&&Boolean(this.data.contact)));},checkValidity(){return this.valid;},reset(){this.data={method:'Text',name:'',contact:'',website:''};el('consent').checked=false;},
        querySelector(q){if(q==='button[type="submit"]')return el('generate');if(q==='input[type="checkbox"]')return el('consent');throw new Error('Unexpected selector '+q);},
        querySelectorAll(q){assert.equal(q,'input, select, button');return this.controls;}
      });
    }return elements.get(id);
  }
  const form=el('finderForm'),contact=el('contactStage');
  for(const name of names){const c=el('q-'+name);c.name=name;form.controls.push(c);}
  form.controls.push(el('generate'));
  for(const name of ['name','method','contact','website']){const c=el('c-'+name);c.name=name;contact.controls.push(c);}
  contact.controls.push(el('consent'),el('leadSubmit'));
  contact.data={name:'OFFLINE TEST',method:'Email',contact:'test@example.invalid',website:''};
  el('consent').checked=true;
  el('resultLabel').textContent='根据目前的信息，你可以优先了解';
  el('resultTitle').textContent='可以进一步了解的贷款';
  el('copyResult').textContent='复制结果摘要';el('leadSubmit').textContent='提交给 David';
  function data(d){form.data={...d};form.elements=Object.fromEntries(Object.entries(d).map(([k,v])=>[k,{value:v}]));}
  const context=vm.createContext({
    document:{getElementById:el},location:{pathname:'/loan-finder',origin:'https://www.loaninca.com',search:'?utm_source=offline-test'},URLSearchParams,
    FormData:class {constructor(f){this.data=Object.entries(f.data).filter(([name])=>!f.controls.find(c=>c.name===name)?.disabled);}[Symbol.iterator](){return this.data[Symbol.iterator]();}},
    LoanInCA:{track:(...args)=>{if(trackThrows)throw new Error('OFFLINE analytics failure');tracks.push(args);}},
    navigator:{clipboard:{writeText:value=>{clipboardCalls.push(value);if(clipMode==='reject')return Promise.reject(new Error('NotAllowedError'));if(clipMode==='pending'){clipPending=deferred();return clipPending.promise;}return Promise.resolve();}}},
    fetch:(url,init)=>{const d=deferred();fetchCalls.push({url,init,payload:JSON.parse(init.body),...d});return d.promise;}
  });
  new vm.Script(scripts[kind],{filename:kind+'-inline.js'}).runInContext(context);
  data(valid);
  const event={preventDefault(){}};
  function generate(d=valid){data(d);form.listeners.submit(event);return output();}
  function output(){return {paths:el('paths').innerHTML,label:el('resultLabel').textContent,title:el('resultTitle').textContent,summary:vm.runInContext('summary',context)};}
  return {el,form,contact,data,tracks,fetchCalls,clipboardCalls,context,generate,output,
    edit(d,eventName='input'){data(d);form.listeners[eventName](event);},
    reveal(){el('sendResult').listeners.click(event);},copy(){return el('copyResult').listeners.click(event);},submit(agree=false){if(agree)el('consent').checked=true;return contact.listeners.submit(event);},
    clip(mode){clipMode=mode;},get clipPending(){return clipPending;},set trackThrows(value){trackThrows=value;}
  };
}
const ok={ok:true,json:async()=>({})};
const values={goal:['买自住房','买投资房','Refinance','Cash-out','不确定'],income:['W2','1099','Self-employed','Business owner','Rental income','Overseas income','Mixed income','暂无收入 / 工作变动'],status:['US Citizen','Green Card','H1B','OPT','EAD','Foreign National','Other'],credit:['760+','720–759','680–719','640–679','<640','不知道'],property:['自住房','第二套房','长期出租','短租 / Airbnb','Condo','2–4 units','不确定']};

test('reproduce prior stale-summary issue without any network request',async()=>{
  const h=harness('prior-candidate');h.generate(valid);h.edit(changed);await h.copy();
  assert.ok(h.clipboardCalls[0].includes('收入：W2'));
  assert.equal(h.fetchCalls.length,0);
});
test('initial state cannot copy, reveal contact or submit without a generated result',async()=>{
  const h=harness();h.reveal();await h.copy();await h.submit(true);
  assert.equal(h.el('contactStage').hidden,true);assert.equal(h.clipboardCalls.length,0);assert.equal(h.fetchCalls.length,0);
});
test('11,760 radio combinations keep exact prior-candidate recommendations and summary',()=>{
  const b=harness('prior-candidate'),c=harness();let count=0;
  for(const goal of values.goal)for(const income of values.income)for(const status of values.status)for(const credit of values.credit)for(const property of values.property){
    const d={...valid,goal,income,status,credit,property};assert.deepEqual(c.generate(d),b.generate(d));count++;
  }
  assert.equal(count,11760);assert.equal(c.fetchCalls.length,0);
});
test('each of seven answers invalidates actions until regeneration',async()=>{
  for(const [name,value] of Object.entries({goal:'Cash-out',income:changed.income,status:'EAD',credit:'760+',amount:'900000',down:'20%–29%',property:'Condo'})){
    const h=harness();h.generate();h.reveal();const prior=h.output();h.edit({...valid,[name]:value});
    assert.deepEqual(h.output(),prior);assert.equal(h.el('finderResult').classList.contains('visible'),true);
    assert.equal(h.contact.hidden,false);assert.ok(h.el('finderNotice').textContent.includes('重新生成'));
    for(const id of ['sendResult','copyResult','leadSubmit'])assert.equal(h.el(id).disabled,true);
    h.reveal();await h.copy();await h.submit(true);assert.equal(h.fetchCalls.length,0);assert.equal(h.clipboardCalls.length,0);
  }
});
test('change event fallback detects stale selection',()=>{const h=harness();h.generate();h.edit(changed,'change');assert.equal(h.el('copyResult').disabled,true);});
test('reverting to exact generated answers restores actions without recalculation',()=>{
  const h=harness();const r=h.generate();h.edit(changed);h.edit(valid);assert.equal(h.el('copyResult').disabled,false);assert.deepEqual(h.output(),r);
});
test('regeneration refreshes snapshot and resets consent but preserves typed contact',()=>{
  const h=harness();h.generate();h.reveal();h.el('consent').checked=true;h.edit(changed);h.generate(changed);
  assert.ok(h.output().summary.includes(changed.income));assert.equal(h.el('consent').checked,false);
  assert.equal(h.contact.data.name,'OFFLINE TEST');assert.equal(h.contact.hidden,false);assert.equal(h.el('finderNotice').textContent,'');
});
test('invalid questionnaire cannot generate or erase a valid snapshot',()=>{
  const h=harness();const previous=h.generate();h.form.valid=false;h.generate(changed);assert.deepEqual(h.output(),previous);
});
test('invalid contact form is not sent in the mocked handler',async()=>{
  const h=harness();h.generate();h.contact.valid=false;await h.submit(true);assert.equal(h.fetchCalls.length,0);
});
test('payload captured before contact controls are frozen and schema stays unchanged',async()=>{
  const h=harness();const r=h.generate(changed);h.reveal();const p=h.submit(true);
  assert.equal(h.fetchCalls.length,1);const request=h.fetchCalls[0];
  assert.deepEqual(Object.keys(request.payload),['website','name','phone','email','inquiry_type','note','source_url','utm_source','utm_medium','utm_campaign']);
  assert.equal(request.payload.name,'OFFLINE TEST');assert.equal(request.payload.email,'test@example.invalid');
  assert.equal(request.payload.note,r.summary+'\n首选方式：Email');
  assert.equal(request.url,'/api/leads');assert.equal(request.init.method,'POST');
  assert.ok(h.contact.controls.every(c=>c.disabled));assert.equal(h.contact.attributes['aria-busy'],'true');
  request.resolve(ok);await p;
});
test('pending edit keeps contact and progress status visible while making result stale',async()=>{
  const h=harness();h.generate();h.reveal();const p=h.submit(true);h.edit(changed);
  assert.equal(h.contact.hidden,false);assert.ok(h.el('leadStatus').textContent.includes('正在提交'));
  assert.ok(h.el('finderNotice').textContent.includes('等待本次请求结束'));assert.equal(h.el('generate').disabled,true);
  h.fetchCalls[0].resolve(ok);await p;
  assert.equal(h.contact.hidden,false);assert.ok(h.el('leadStatus').textContent.includes('这份已生成'));
  assert.equal(h.el('generate').disabled,false);assert.equal(h.el('leadSubmit').disabled,true);
});
test('pending regeneration and duplicate contact-handler calls cannot replace or resend snapshot',async()=>{
  const h=harness();const r=h.generate();const p=h.submit(true);h.generate(changed);await h.submit(true);
  assert.deepEqual(h.output(),r);assert.equal(h.fetchCalls.length,1);h.fetchCalls[0].resolve(ok);await p;
});
test('successful submission is not duplicated and an explicit new generation starts a new cycle',async()=>{
  const h=harness();h.generate();let p=h.submit(true);h.fetchCalls[0].resolve(ok);await p;
  await h.submit(true);assert.equal(h.fetchCalls.length,1);assert.equal(h.el('leadSubmit').disabled,true);
  h.generate(changed);assert.equal(h.el('leadSubmit').disabled,false);assert.equal(h.el('leadSubmit').textContent,'提交给 David');
  assert.equal(h.el('leadStatus').textContent,'');assert.equal(h.el('consent').checked,false);
});
test('HTTP failure restores fields and allows only an explicit manual retry',async()=>{
  const h=harness();h.generate();const p=h.submit(true);h.fetchCalls[0].resolve({ok:false});await p;
  assert.equal(h.el('leadSubmit').disabled,false);assert.equal(h.contact.data.name,'OFFLINE TEST');
  assert.ok(h.el('leadStatus').textContent.includes('尚未确认'));assert.equal(h.fetchCalls.length,1);
  const retry=h.submit(true);assert.equal(h.fetchCalls.length,2);h.fetchCalls[1].resolve(ok);await retry;
});
test('network rejection with edited answers preserves status and requires regeneration before retry',async()=>{
  const h=harness();h.generate();const p=h.submit(true);h.edit(changed);h.fetchCalls[0].reject(new Error('OFFLINE fake outage'));await p;
  assert.equal(h.el('leadSubmit').disabled,true);assert.ok(h.el('leadStatus').textContent.includes('尚未确认'));
  await h.submit(true);assert.equal(h.fetchCalls.length,1);assert.equal(h.contact.hidden,true); // never revealed by this test
  h.generate(changed);assert.equal(h.el('leadSubmit').disabled,false);
});
test('pre-disabled contact controls remain disabled after async settlement',async()=>{
  const h=harness();h.generate();h.el('c-website').disabled=true;const p=h.submit(true);h.fetchCalls[0].resolve(ok);await p;
  assert.equal(h.el('c-website').disabled,true);assert.equal(h.el('c-name').disabled,false);assert.equal(h.contact.attributes['aria-busy'],'false');
});
test('copy rejection is handled without a false copied label',async()=>{
  const h=harness();h.generate();h.clip('reject');await h.copy();
  assert.equal(h.el('copyResult').textContent,'复制结果摘要');assert.ok(h.el('finderNotice').textContent.includes('复制未完成'));assert.equal(h.el('copyResult').disabled,false);
});
test('pending copy resolves after edits without claiming current answers were copied',async()=>{
  const h=harness();h.generate();h.clip('pending');const p=h.copy();h.edit(changed);h.clipPending.resolve();await p;
  assert.equal(h.el('copyResult').textContent,'复制结果摘要');assert.equal(h.el('copyResult').disabled,true);
});
test('repeated copy while pending creates one mock clipboard operation',async()=>{
  const h=harness();h.generate();h.clip('pending');const p=h.copy();await h.copy();assert.equal(h.clipboardCalls.length,1);h.clipPending.resolve();await p;
});
test('copy succeeds and regenerated result replaces previous copied summary',async()=>{
  const h=harness();const first=h.generate();await h.copy();assert.equal(h.clipboardCalls[0],first.summary);
  const second=h.generate(changed);await h.copy();assert.equal(h.clipboardCalls[1],second.summary);assert.equal(h.el('copyResult').textContent,'已复制结果');
});
test('raw exception details never appear in user-facing submission failure',async()=>{
  const h=harness();h.generate();const p=h.submit(true);h.fetchCalls[0].reject(new Error('SECRET_BACKEND_DETAIL'));await p;assert.ok(!h.el('leadStatus').textContent.includes('SECRET'));
});
test('successful mock acceptance keeps success even if analytics subsequently throws',async()=>{
  const h=harness();h.generate();const p=h.submit(true);h.trackThrows=true;h.fetchCalls[0].resolve(ok);await p;
  assert.ok(h.el('leadStatus').textContent.startsWith('已提交'));assert.equal(h.el('leadSubmit').disabled,true);
});
test('invalid numeric content that serializes empty cannot copy or submit a formerly blank amount',async()=>{
  const h=harness();h.generate();h.form.valid=false;h.edit({...valid,amount:''});
  assert.equal(h.el('copyResult').disabled,true);assert.equal(h.el('leadSubmit').disabled,true);
  await h.copy();await h.submit(true);assert.equal(h.clipboardCalls.length,0);assert.equal(h.fetchCalls.length,0);
});
test('optional analytics failure does not block generation or contact reveal',()=>{
  const h=harness();h.trackThrows=true;const r=h.generate(changed);h.reveal();
  assert.ok(r.summary.includes(changed.income));assert.equal(h.contact.hidden,false);
});

test('regenerated scenario cannot send until consent is explicitly checked again',async()=>{
  const h=harness();h.generate();await h.submit(false);assert.equal(h.fetchCalls.length,0);
  h.el('consent').checked=true;h.generate(changed);await h.submit(false);assert.equal(h.fetchCalls.length,0);
});
test('missing required contact data does not reach the inert fetch substitute',async()=>{
  const h=harness();h.generate();h.contact.data.name='';await h.submit(true);assert.equal(h.fetchCalls.length,0);
});
