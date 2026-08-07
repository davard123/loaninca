
window.dataLayer=window.dataLayer||[];
function track(name,detail={}){window.dataLayer.push({event:name,...detail});document.dispatchEvent(new CustomEvent('loaninca:'+name,{detail}));}
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.menu-btn'),n=document.querySelector('.nav-links');if(b&&n)b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',String(o))});document.querySelectorAll('[data-track]').forEach(el=>el.addEventListener('click',()=>track(el.dataset.track,{path:location.pathname})));});
window.LoanInCA={track};
