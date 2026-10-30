/* Global bilingual bibliography popovers use the bundled reference data on local file URLs. */
(()=>{'use strict';
const all=Array.isArray(window.SAT_PRIMER_REFERENCES)?window.SAT_PRIMER_REFERENCES:[];
const byNumber=new Map(all.map(x=>[String(x.number),x]));
const refs=[...document.querySelectorAll('a.cite-ref')];
const language=()=>document.documentElement.getAttribute('data-lang')==='zh'?'zh':'en';
const tr=(en,zh)=>language()==='zh'?zh:en;
const encode=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const popup=document.createElement('div');popup.className='cite-tooltip';popup.setAttribute('role','tooltip');popup.id='cite-tooltip';popup.hidden=true;document.body.append(popup);
let active=null,hideLater=null,openedByTouch=false;
function close(){clearTimeout(hideLater);popup.hidden=true;active?.removeAttribute('aria-describedby');active=null;openedByTouch=false;}
function position(anchor){
 if(popup.hidden)return;
 const a=anchor.getBoundingClientRect(),p=popup.getBoundingClientRect(),w=window.innerWidth,h=window.innerHeight,space=10;
 let x=Math.max(space,Math.min(w-space-p.width,a.left+(a.width-p.width)/2));
 let y=a.bottom+11;
 if(y+p.height>h-space&&a.top>p.height+space)y=a.top-p.height-11;
 else y=Math.min(y,h-space-p.height);
 popup.style.left=Math.round(x)+'px';popup.style.top=Math.round(Math.max(space,y))+'px';
}
function cardMarkup(src,loc,original){
 const num=src.number,locMarkup=loc?`<div class="cite-tooltip-location">${tr('Source location','文獻定位')}: ${encode(loc)}</div>`:'';
 const links=[];
 if(src.url)links.push(`<a href="${encode(src.url)}" target="_blank" rel="noopener noreferrer">${tr('Original source','原始來源')} ↗</a>`);
 if(src.digest)links.push(`<a href="${encode((location.pathname.includes('/chapters/')||location.pathname.includes('/research/'))?'../':'')+encode(src.digest)}">${tr('Paper digest','論文導讀')} ↗</a>`);
 links.push(`<a href="${encode((location.pathname.includes('/chapters/')||location.pathname.includes('/research/'))?'../':'')}references.html#ref-${num}">${tr('Bibliography','參考文獻')} ↗</a>`);
 return `<div class="cite-tooltip-top"><span>[${num}]</span><span>${encode(src.kind)}</span></div>`+
 `<div class="cite-tooltip-authors">${encode(src.author)}</div>`+
 `<div class="cite-tooltip-title">${encode(src.title)}</div>`+
 `<div class="cite-tooltip-venue">${encode(src.publication||[src.venue,src.year].filter(Boolean).join(' · '))}</div>`+
 locMarkup+(original?`<details class="cite-tooltip-original"><summary>${tr('Source note','原始出處註記')}</summary>${encode(original)}</details>`:'')+(src.note?`<p class="cite-tooltip-note">${encode(src.note)}</p>`:'')+
 `<div class="cite-tooltip-links">${links.join('')}</div>`;
}
function show(a,touch=false){const src=byNumber.get(a.dataset.cite);if(!src)return;
 clearTimeout(hideLater);if(active!==a){active?.removeAttribute('aria-describedby');active=a;}
 openedByTouch=touch;popup.innerHTML=cardMarkup(src,a.dataset.locator||'',a.dataset.sourceNote==='1'?(a.dataset.original||''):'');popup.hidden=false;
 a.setAttribute('aria-describedby','cite-tooltip');position(a);
}
function queueClose(){clearTimeout(hideLater);hideLater=setTimeout(()=>{if(!popup.matches(':hover')&&(!active||!active.matches(':hover,:focus-visible')))close();},180);}
for(const a of refs){
 a.addEventListener('mouseenter',()=>show(a));
 a.addEventListener('mouseleave',queueClose);
 a.addEventListener('focus',()=>show(a));
 a.addEventListener('blur',queueClose);
 a.addEventListener('click',e=>{
  // First tap on a citation opens the card. Its links can then be used normally.
  if((e.pointerType==='touch'||e.detail===0&&window.matchMedia('(pointer:coarse)').matches)&&(!openedByTouch||active!==a)){
   e.preventDefault();show(a,true);
  }
 });
}
popup.addEventListener('mouseenter',()=>clearTimeout(hideLater));
popup.addEventListener('mouseleave',queueClose);
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
document.addEventListener('pointerdown',e=>{if(!popup.hidden&&!popup.contains(e.target)&&!e.target.closest('a.cite-ref'))close();});
window.addEventListener('scroll',()=>{if(active&&!popup.hidden)position(active);},{passive:true});
window.addEventListener('resize',()=>{if(active&&!popup.hidden)position(active);});

const search=document.getElementById('reference-search'),count=document.getElementById('reference-count');
if(search){
 const entries=[...document.querySelectorAll('.ref-entry')];
 function filter(){const q=search.value.trim().toLowerCase();let visible=0;
  for(const item of entries){const has=!q||item.textContent.toLowerCase().includes(q);item.hidden=!has;if(has)visible++;}
  if(count)count.textContent=tr(`${visible} of ${entries.length} references`,`顯示 ${visible} / ${entries.length} 筆文獻`);
 }
 search.addEventListener('input',filter);filter();
 const en=document.getElementById('lang-en'),zh=document.getElementById('lang-zh');
 en?.addEventListener('click',()=>setTimeout(filter,0));zh?.addEventListener('click',()=>setTimeout(filter,0));
}
})();
