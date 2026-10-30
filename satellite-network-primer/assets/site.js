/* Satellite Network Primer — shared page script.
   Language toggle (EN / 中文), reading progress, quiz engine, SVG helpers for interactive panels,
   step animations, KaTeX auto-render, and #def- link flashing. Same API as the AI Training Network primer (window.AITN). */
(function(){
"use strict";
const root=document.documentElement;
const $=(s,c)=>(c||document).querySelector(s), $$=(s,c)=>Array.from((c||document).querySelectorAll(s));
const L=()=>root.getAttribute("data-lang")||"en", t=(en,zh)=>L()==="zh"?zh:en;
const langHooks=[];
let saved=null; try{saved=localStorage.getItem("satn-lang");}catch(e){}
root.setAttribute("data-lang",saved==="zh"?"zh":"en");
root.setAttribute("lang",L()==="zh"?"zh-Hant":"en");
function setLang(l){root.setAttribute("data-lang",l);root.setAttribute("lang",l==="zh"?"zh-Hant":"en");$$(".lang button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));try{localStorage.setItem("satn-lang",l);}catch(e){}if(quizRender)quizRender(true);langHooks.forEach(f=>{try{f();}catch(e){console.error(e);}});}
$$(".lang button").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.lang===L()));b.addEventListener("click",()=>setLang(b.dataset.lang));});
const prog=$("#progress");function onScroll(){const h=root;const max=h.scrollHeight-h.clientHeight;if(prog)prog.style.width=(max>0?Math.min(100,100*h.scrollTop/max):0)+"%";}
window.addEventListener("scroll",onScroll,{passive:true});onScroll();

/* rail highlighting */
const railLinks=$$(".rail a[href^='#']");
if(railLinks.length){const map=new Map();railLinks.forEach(a=>{const id=a.getAttribute("href").slice(1);const h=document.getElementById(id);if(h)map.set(h,a);});
 try{const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){railLinks.forEach(a=>a.classList.remove("active"));const a=map.get(e.target);if(a)a.classList.add("active");}});},{rootMargin:"-20% 0px -70% 0px"});map.forEach((a,h)=>io.observe(h));}catch(e){}}

/* ---- SVG helpers ---- */
const NS="http://www.w3.org/2000/svg";
function svg(w,h){const s=document.createElementNS(NS,"svg");s.setAttribute("viewBox",`0 0 ${w} ${h}`);s.setAttribute("width",w);s.setAttribute("height",h);s.setAttribute("role","img");s.style.width="100%";s.style.height="auto";return s;}
function el(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const k in attrs){e.setAttribute(k,attrs[k]);}if(text!=null)e.textContent=text;return e;}
function css(name){return getComputedStyle(root).getPropertyValue(name).trim();}
function fmtBytes(b){const u=["B","KB","MB","GB","TB","PB"];let i=0;while(b>=1000&&i<u.length-1){b/=1000;i++;}return (b>=100?b.toFixed(0):b>=10?b.toFixed(1):b.toFixed(2))+" "+u[i];}
function fmtSec(s){if(s<1e-6)return (s*1e9).toFixed(0)+" ns";if(s<1e-3)return (s*1e6).toFixed(1)+" µs";if(s<1)return (s*1e3).toFixed(2)+" ms";if(s<90)return s.toFixed(2)+" s";if(s<3600*2)return (s/60).toFixed(1)+" min";if(s<86400*3)return (s/3600).toFixed(1)+" h";if(s<86400*400)return (s/86400).toFixed(1)+" "+t("days","天");return (s/86400/365.25).toFixed(1)+" "+t("years","年");}
function fmtNum(n,d){return (d==null?n:+n.toFixed(d)).toLocaleString(L()==="zh"?"zh-Hant":"en-US");}
function fmtBig(n){if(n>=1e12)return (n/1e12).toFixed(n>=1e13?0:1)+"T";if(n>=1e9)return (n/1e9).toFixed(n>=1e10?0:1)+"B";if(n>=1e6)return (n/1e6).toFixed(0)+"M";if(n>=1e3)return (n/1e3).toFixed(0)+"K";return String(Math.round(n));}
function fmtRate(bps){if(bps>=1e12)return (bps/1e12).toFixed(2)+" Tb/s";if(bps>=1e9)return (bps/1e9).toFixed(bps>=1e10?0:1)+" Gb/s";if(bps>=1e6)return (bps/1e6).toFixed(0)+" Mb/s";return (bps/1e3).toFixed(0)+" kb/s";}
function seg(id,cb){const box=$(id);if(!box)return;box.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;$$("button",box).forEach(x=>x.setAttribute("aria-pressed","false"));b.setAttribute("aria-pressed","true");cb(b.dataset.v,b);});}
function segVal(id){const b=$(id+" button[aria-pressed='true']");return b?b.dataset.v:null;}
const txt=(x,y,s,o)=>{const a=Object.assign({x,y,"font-family":"IBM Plex Mono, monospace","font-size":11,fill:"var(--ink-2)"},o||{});return el("text",a,s);};
/* slider helper: binds input#id to output#id-o with a formatter, calls cb on change */
function slider(id,fmt,cb){const i=$(id),o=$(id+"-o");if(!i)return null;const upd=()=>{if(o)o.textContent=fmt(+i.value);};i.addEventListener("input",()=>{upd();cb(+i.value);});upd();langHooks.push(upd);return i;}

/* ---- step animations ---- */
const RM_MQ=(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)");}catch(e){return null;}})();
function anim(host,o){
  host=typeof host==="string"?$(host):host;
  let S=Math.max(2,o.steps|0),k=0,playing=false,raf=0,t0=0,speed=1,u=0;
  const dur=()=>(o.dur||900)/speed;const reduced=()=>!!(RM_MQ&&RM_MQ.matches);
  const bar=document.createElement("div");bar.className="anim-bar";
  const B=(cls,en,zh,glyph)=>{const b=document.createElement("button");b.type="button";b.className="btn anim-"+cls;b.innerHTML='<span aria-hidden="true">'+glyph+"</span>";b._l=[en,zh];return b;};
  const bReset=B("reset","Back to the start","回到開頭","⏮"),bPrev=B("prev","Previous step","上一步","◀"),bPlay=B("play","Play","播放","▶"),bNext=B("next","Next step","下一步","▶▏");
  const sel=document.createElement("select");sel.className="anim-speed";
  [["0.5","0.5×"],["1","1×"],["2","2×"]].forEach(([v,s])=>{const op=document.createElement("option");op.value=v;op.textContent=s;if(v==="1")op.selected=true;sel.appendChild(op);});
  const cnt=document.createElement("span");cnt.className="anim-count";
  const cap=document.createElement("div");cap.className="anim-cap";cap.setAttribute("aria-live","polite");
  bar.append(bReset,bPrev,bPlay,bNext,sel,cnt);
  host.insertAdjacentElement("afterend",cap);host.insertAdjacentElement("afterend",bar);
  function labels(){[bReset,bPrev,bNext].forEach(b=>{b.setAttribute("aria-label",t(b._l[0],b._l[1]));b.title=t(b._l[0],b._l[1]);});const pl=playing?["Pause","暫停"]:["Play","播放"];bPlay.setAttribute("aria-label",t(pl[0],pl[1]));bPlay.title=t(pl[0],pl[1]);bPlay.firstChild.textContent=playing?"❚❚":"▶";sel.setAttribute("aria-label",t("Speed","速度"));}
  function paint(){try{o.draw(k,u);}catch(e){console.error(e);}cnt.textContent=t("Step ","第 ")+(k+1)+" / "+S+t(""," 步");cap.textContent=o.cap?o.cap(k):"";bPrev.disabled=k===0&&u===0;bNext.disabled=k>=S-1;labels();}
  function frame(ts){if(!playing)return;if(!t0)t0=ts;const p=(ts-t0)/dur();if(p>=1){t0=ts;u=0;if(k<S-1)k++;if(k>=S-1){if(o.loop){paint();k=0;}else{playing=false;paint();return;}}}else u=reduced()?0:p;paint();raf=requestAnimationFrame(frame);}
  function play(){if(playing)return;if(k>=S-1)k=0;playing=true;t0=0;u=0;paint();raf=requestAnimationFrame(frame);}
  function pause(){playing=false;cancelAnimationFrame(raf);u=0;paint();}
  function goto(n){playing=false;cancelAnimationFrame(raf);u=0;k=Math.max(0,Math.min(S-1,n|0));paint();}
  bPlay.addEventListener("click",()=>playing?pause():play());bNext.addEventListener("click",()=>goto(k+1));bPrev.addEventListener("click",()=>goto(k-1));bReset.addEventListener("click",()=>goto(0));
  sel.addEventListener("change",()=>{speed=+sel.value||1;});
  try{new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting&&playing)pause();})).observe(host);}catch(e){}
  langHooks.push(paint);paint();
  return {goto,reset:()=>goto(0),play,pause,redraw:paint,k:()=>k,setSteps(n){S=Math.max(2,n|0);goto(0);}};
}

/* ---- orbital helpers shared by panels ---- */
const MU=3.986004418e14, RE=6371.0e3, C=299792458;
function period(h){const r=RE+h;return 2*Math.PI*Math.sqrt(r*r*r/MU);}          // s, h in m
function vorb(h){return Math.sqrt(MU/(RE+h));}                                     // m/s
function slant(h,elevDeg){const e=elevDeg*Math.PI/180,r=RE+h;return -RE*Math.sin(e)+Math.sqrt(r*r-RE*RE*Math.cos(e)*Math.cos(e));} // m
function centralAngle(h,elevDeg){const e=elevDeg*Math.PI/180;return Math.acos(RE*Math.cos(e)/(RE+h))-e;} // rad, half-cone on Earth
function chord(h,angRad){return 2*(RE+h)*Math.sin(angRad/2);}                     // m, straight line between two sats at same altitude

window.AITN={L,t,$,$$,svg,el,txt,css,fmtBytes,fmtSec,fmtNum,fmtBig,fmtRate,seg,segVal,slider,anim,onLang:f=>langHooks.push(f),setLang,orb:{MU,RE,C,period,vorb,slant,centralAngle,chord}};

/* ---- KaTeX auto-render (loaded from cdnjs in the page head) ---- */
function renderMath(){if(window.renderMathInElement){try{renderMathInElement(document.body,{delimiters:[{left:"$$",right:"$$",display:true},{left:"\\(",right:"\\)",display:false},{left:"\\[",right:"\\]",display:true}],throwOnError:false});}catch(e){console.error(e);}}}
if(document.readyState==="complete")renderMath();else window.addEventListener("load",renderMath);

/* ---- quiz ---- */
let quizRender=null;
const qd=$("#quiz-data");
if(qd){
const data=JSON.parse(qd.textContent);
const state=data.map(()=>null);
const slug=document.body.dataset.slug;const keyFor="satn-quiz-"+slug;
try{const s=JSON.parse(localStorage.getItem(keyFor)||"null");if(Array.isArray(s)&&s.length===data.length)s.forEach((v,i)=>state[i]=(v===null?null:v));}catch(e){}
const box=$("#quiz-root");
function renderQuiz(){
  box.innerHTML="";
  const n=data.length;
  const intro=document.createElement("p");intro.className="qintro";intro.textContent=t(`${n} questions apply this page’s concepts. Choose an answer to see its explanation. Your answers stay on this device.`,`${n} 題，運用本頁概念作答。選擇答案後可查看解釋，作答紀錄儲存在這台裝置上。`);box.appendChild(intro);
  data.forEach((q,i)=>{
    const card=document.createElement("div");card.className="qcard";card.id="q"+(i+1);
    card.innerHTML=`<div class="qnum">${t("QUESTION","第")} ${i+1}${t("","題")} / ${n}</div><div class="qtext">${q.q[L()]}</div>`;
    const ul=document.createElement("ul");ul.className="opts";
    q.o.forEach((o,j)=>{const li=document.createElement("li");const b=document.createElement("button");b.type="button";b.className="opt";b.innerHTML=`<span class="lk">${"ABCD"[j]}</span><span>${o[L()]}</span>`;
      if(state[i]!==null){b.disabled=true;if(j===q.a)b.classList.add(state[i]===j?"correct":"reveal");else if(j===state[i])b.classList.add("wrong");}
      b.addEventListener("click",()=>{if(state[i]!==null)return;state[i]=j;try{localStorage.setItem(keyFor,JSON.stringify(state));}catch(e){}renderQuiz();const e2=$("#q"+(i+1));if(e2)e2.scrollIntoView({block:"nearest"});});
      li.appendChild(b);ul.appendChild(li);});
    card.appendChild(ul);
    const why=document.createElement("div");why.className="why"+(state[i]!==null?" show":"")+(state[i]!==null&&state[i]!==q.a?" bad":"");
    if(state[i]!==null){const ok=state[i]===q.a;why.innerHTML=`<span class="verdict">${ok?t("Correct.","答對了。"):t("The correct answer is "+"ABCD"[q.a]+".","正確答案是 "+"ABCD"[q.a]+"。")}</span>${q.why[L()]}`;}
    card.appendChild(why);box.appendChild(card);
  });
  const answered=state.filter(v=>v!==null).length,correct=state.filter((v,i)=>v===data[i].a).length;
  const sc=document.createElement("div");sc.className="score";const pct=answered?Math.round(100*correct/n):0;let msg="";
  if(answered<n)msg=t(`${answered} of ${n} answered.`,`已作答 ${answered} / ${n} 題。`);
  else if(correct>=Math.ceil(0.9*n))msg=t("You understand this page. Move to the next one.","你已經理解這一頁了。前往下一頁。");
  else if(correct>=Math.ceil(0.7*n))msg=t("Review the sections linked to your missed questions, then try them again.","重讀答錯題目對應的章節，再作答一次。");
  else msg=t("Review the text and figures, then retry using the mechanisms explained on this page.","回到內文與圖複習，再運用本頁說明的機制作答。");
  sc.innerHTML=`<div class="big">${correct} / ${n}</div><div class="bar"><i style="width:${pct}%"></i></div><button type="button" class="btn" id="qreset">${t("Reset quiz","重做測驗")}</button><div class="msg">${msg}</div>`;
  box.appendChild(sc);
  $("#qreset").addEventListener("click",()=>{state.fill(null);try{localStorage.removeItem(keyFor);}catch(e){}renderQuiz();});
  renderMath();
}
quizRender=renderQuiz;renderQuiz();
}

/* ---- #def- anchors: jump to the definition in the current language and flash it ---- */
function defTarget(){const h=location.hash;if(!h||h.indexOf("#def-")!==0)return null;const id=decodeURIComponent(h.slice(1));const zh=L()==="zh";return (zh&&document.getElementById(id+"-zh"))||document.getElementById(id);}
function defGo(){const e=defTarget();if(!e)return;try{e.scrollIntoView({block:"center"});}catch(x){e.scrollIntoView();}e.classList.remove("flash");void e.offsetWidth;e.classList.add("flash");}
window.addEventListener("hashchange",defGo);window.addEventListener("load",()=>setTimeout(defGo,60));
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#def-"]');if(!a)return;e.preventDefault();const h=a.getAttribute("href");try{history.pushState(null,"",h);}catch(x){location.hash=h;return;}defGo();});
})();
