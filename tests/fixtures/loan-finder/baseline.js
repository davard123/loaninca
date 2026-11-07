
const form=document.getElementById('finderForm'), result=document.getElementById('finderResult'), paths=document.getElementById('paths');let summary='';
form.addEventListener('input',()=>{const names=['goal','income','status','credit','amount','down','property'];const done=names.filter(n=>form.elements[n]&&(form.elements[n].value||form.elements[n].length&&[...form.elements[n]].some(x=>x.checked))).length;document.getElementById('progress').style.width=Math.max(14,done/names.length*100)+'%';});
form.addEventListener('submit',e=>{e.preventDefault();LoanInCA.track('loan_finder_completed',{path:location.pathname});const d=Object.fromEntries(new FormData(form));const options=[];if(d.goal==='买投资房'||d.property==='长期出租'||d.property==='短租 / Airbnb')options.push(['DSCR','可进一步比较租金覆盖能力、appraisal rent、reserve、费用与 prepayment penalty。','/mortgage/dscr']);if(['1099','Self-employed','Business owner'].includes(d.income))options.push(['自雇 / Bank Statement 路径','如果报税收入与实际现金流差异较大，可比较传统收入计算与替代文件项目。','/mortgage/self-employed']);if(['H1B','OPT','EAD','Foreign National'].includes(d.status))options.push(['身份文件相关路径','需要核对身份文件、工作授权、收入连续性和具体 lender guideline。','/mortgage/h1b-opt']);if(d.goal==='Refinance'||d.goal==='Cash-out')options.push(['Refinance','先比较新旧月供、closing cost、break-even 与持有时间。','/mortgage/refinance']);if(!options.length||d.goal==='买自住房')options.unshift(['Conventional 或其他购房路径','优先核对 DTI、收入历史、首付、资产与 reserve；具体项目取决于完整资料。','/mortgage']);paths.innerHTML=options.map(o=>'<article><h3>'+o[0]+'</h3><p>'+o[1]+'</p><a href="'+o[2]+'">查看相关指南</a></article>').join('');summary='LoanInCA 初步方向\n目标：'+d.goal+'\n收入：'+d.income+'\n身份文件：'+d.status+'\n信用范围：'+d.credit+'\n房产：'+d.property+'\n建议了解：'+options.map(o=>o[0]).join('、');result.classList.add('visible');result.scrollIntoView({behavior:'smooth'});});
document.getElementById('sendResult').addEventListener('click',()=>{document.getElementById('contactStage').hidden=false;LoanInCA.track('lead_started',{source:'loan_finder'});});
document.getElementById('copyResult').addEventListener('click',async()=>{await navigator.clipboard.writeText(summary);document.getElementById('copyResult').textContent='已复制结果';});
document.getElementById('contactStage').addEventListener('submit',async e=>{
  e.preventDefault();
  const contactForm=e.currentTarget;
  const d=Object.fromEntries(new FormData(contactForm));
  const status=document.getElementById('leadStatus');
  const submit=document.getElementById('leadSubmit');
  const query=new URLSearchParams(location.search);
  status.textContent='';
  submit.disabled=true;
  submit.textContent='正在提交…';
  try{
    const payload={
      website:d.website,
      name:d.name,
      phone:d.method==='Email'?'':d.contact,
      email:d.method==='Email'?d.contact:'',
      inquiry_type:'loan_finder',
      note:summary+'\n首选方式：'+d.method,
      source_url:location.origin+location.pathname,
      utm_source:query.get('utm_source')||'',
      utm_medium:query.get('utm_medium')||'',
      utm_campaign:query.get('utm_campaign')||''
    };
    const res=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const response=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(response.error||'提交失败');
    status.textContent='已提交。David 会按你选择的方式回复。';
    LoanInCA.track('generate_lead',{source:'loan_finder'});
    LoanInCA.track('lead_submitted',{source:'loan_finder'});
    contactForm.reset();
    submit.textContent='已提交';
  }catch(error){
    status.textContent=error.message||'提交暂时未成功，请致电 949-656-1278 或发送邮件。';
    submit.disabled=false;
    submit.textContent='重新提交';
  }
});
