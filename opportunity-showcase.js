/* MMGC homepage live opportunity showcase. Public previews; protected detail pages require an account. */
(function(){
'use strict';
const root=document.getElementById('opportunity-showcase');
if(!root)return;
const viewport=root.querySelector('#oppShowcaseViewport');
const track=root.querySelector('#oppShowcaseTrack');
const dots=root.querySelector('#oppShowcaseDots');
const status=root.querySelector('#oppShowcaseStatus');
const bar=root.querySelector('#oppShowcaseProgressBar');
const filters=[...root.querySelectorAll('.opp-showcase-filter')];
const prev=root.querySelector('#oppShowcasePrev');
const pauseButton=root.querySelector('#oppShowcasePause');
const next=root.querySelector('#oppShowcaseNext');
const allLink=root.querySelector('#oppShowcaseAllLink');
const navURL={all:'opportunities.html',tender:'tenders.html',job:'jobs.html'};
const dateFormat=new Intl.DateTimeFormat('en-LS',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Maseru'});
const today=Date.now();
let allItems=[],visible=[],active='all',page=0,perView=3,timer=null,paused=false,intersecting=true,renderToken=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const saneDate=d=>{const n=Date.parse(d||'');return Number.isFinite(n)?n:null;};
const dateText=d=>{const n=saneDate(d);return n===null?'Deadline to confirm':dateFormat.format(new Date(n));};
const validId=id=>String(id||'').trim();
function curated(){
 const tenders=(Array.isArray(window.MMGC_TENDERS)?window.MMGC_TENDERS:[])
   .filter(x=>x.title&&saneDate(x.deadline)!==null&&saneDate(x.deadline)>=today)
   .sort((a,b)=>saneDate(a.deadline)-saneDate(b.deadline))
   .slice(0,8)
   .map(x=>({id:'t-'+validId(x.id),kind:'tender',title:x.title,company:x.issuer||'Procurement opportunity',description:x.type==='rfq'?'Request for quotation':x.type==='major'?'Tender or expression of interest':'Procurement notice',date:x.deadline,href:'tender-details.html?id='+encodeURIComponent(x.id),source:'MMGC tender directory',order:saneDate(x.deadline),verified:x.verifiedAt||''}));
 const jobs=(Array.isArray(window.MMGC_JOBS)?window.MMGC_JOBS:[])
   .filter(x=>x.title&&saneDate(x.deadline)!==null&&saneDate(x.deadline)>=today)
   .sort((a,b)=>saneDate(a.deadline)-saneDate(b.deadline))
   .slice(0,5)
   .map(x=>({id:'j-'+validId(x.id),kind:'job',title:x.title,company:x.employer||'Recruitment opportunity',description:x.location||'Lesotho',date:x.deadline,href:'job.html?id='+encodeURIComponent(x.id),source:'MMGC jobs directory',order:saneDate(x.deadline),verified:x.verifiedAt||''}));
 const mix=[];
 while(tenders.length||jobs.length){if(tenders.length)mix.push(tenders.shift());if(jobs.length)mix.push(jobs.shift());}
 return mix;
}
async function discoveries(){
 try{
  const response=await fetch('data/opportunity-discoveries.json',{cache:'no-store'});
  if(!response.ok)throw Error('No discovery data');
  const data=await response.json();
  const entries=Array.isArray(data.tenders?.items)?data.tenders.items:[];
  const minDate=today-10*86400000;
  const result=entries.filter(x=>x.title&&saneDate(x.published)>=minDate)
    .slice(0,4).map(x=>({
       id:'d-'+validId(x.id),kind:'discovery',title:String(x.title),
       company:String(x.source||'Listed opportunity'),
       description:'Recently published listing · confirm details with issuer',
       date:null,href:'tenders.html#source-discoveries',
       source:'Recently discovered',order:saneDate(x.published)||today,
       verified:null
    }));
  return result;
 }catch(_){return [];}
}
function make(tag,cls,text){
 const n=document.createElement(tag);if(cls)n.className=cls;
 if(text!==undefined)n.textContent=text;
 return n;
}
function createCard(x,num,total){
 const card=make('article','opp-showcase-card');
 card.dataset.kind=x.kind;
 const top=make('div','opp-showcase-card-top');
 const tag=make('span','opp-showcase-label',x.kind==='job'?'Individual job':x.kind==='tender'?'Tender / RFQ':'New discovery');
 const idx=make('span','opp-showcase-idx',String(num+1).padStart(2,'0')+' / '+String(total).padStart(2,'0'));
 top.append(tag,idx);
 const title=make('h3',null,x.title);
 const company=make('p','opp-showcase-org',x.company);
 const details=make('p','opp-showcase-details',x.description);
 const date=make('div','opp-showcase-date');
 const dateLabel=make('span',null,x.date?'Closes':'Closing date');
 const dateValue=make('b',null,dateText(x.date));
 date.append(dateLabel,dateValue);
 const link=make('a','opp-showcase-view');
 link.href=x.href;
 const linkText=make('span',null,x.kind==='job'?'View Job Details':x.kind==='discovery'?'Browse Tender Notices':'View Tender Details');
 link.append(linkText,make('span',null,'→'));
 card.append(top,title,company,details,date,link);
 return card;
}
function getPerView(){return window.innerWidth<=660?1:window.innerWidth<=1020?2:3;}
function pageCount(){return Math.max(1,Math.ceil(visible.length/perView));}
function updateSlide(){
 const count=pageCount();
 page=Math.max(0,Math.min(page,count-1));
 const first=Math.max(0,Math.min(page*perView,Math.max(0,visible.length-perView)));
 const firstCard=track.firstElementChild;
 const gap=parseFloat(getComputedStyle(track).columnGap||getComputedStyle(track).gap)||16;
 const step=firstCard?firstCard.getBoundingClientRect().width+gap:0;
 track.style.transform='translate3d('+(-first*step)+'px,0,0)';
 prev.disabled=page===0||count<=1;
 next.disabled=count<=1;
 dots.replaceChildren();
 for(let i=0;i<count;i++){
   const d=make('button','opp-showcase-dot');
   d.type='button';d.setAttribute('aria-label','Go to slide '+(i+1));
   d.setAttribute('aria-current',String(i===page));
   d.addEventListener('click',()=>{page=i;updateSlide();restart();});
   dots.appendChild(d);
 }
 viewport.setAttribute('aria-label','Showing '+(first+1)+' to '+Math.min(first+perView,visible.length)+' of '+visible.length+' opportunities');
}
function refresh(){
 renderToken++;
 const chosen=allItems.filter(x=>active==='all'||(active==='tender'?x.kind!=='job':x.kind==='job'));
 visible=chosen;
 const allCount=allItems.length;
 status.textContent=chosen.length+' '+(active==='job'?'jobs':active==='tender'?'tender notices':'opportunity previews');
 allLink.href=navURL[active];
 allLink.textContent=active==='job'?'Browse all jobs →':active==='tender'?'Browse all tenders →':'Explore all opportunities →';
 track.textContent='';
 if(!chosen.length){
   const empty=make('div','opp-showcase-empty');
   empty.append(make('strong',null,'No currently dated '+(active==='job'?'job':'tender')+' listings to feature.'));
   empty.append(make('p',null,'We only show opportunities with a future closing date, or recent discoveries marked for deadline verification.'));
   const link=make('a',null,'Browse the full directory →');link.href=navURL[active];empty.append(link);
   track.appendChild(empty);
   track.style.transform='none';
   dots.textContent='';prev.disabled=true;next.disabled=true;bar.style.width='0%';
 }else{
   chosen.forEach((x,i)=>track.appendChild(createCard(x,i,chosen.length)));
   page=0;
   perView=getPerView();
   requestAnimationFrame(updateSlide);
 }
 filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===active)));
 restart();
}
function move(direction){
 const count=pageCount();
 if(count<=1)return;
 page=(page+direction+count)%count;
 updateSlide();
 restart();
}
function stop(){
 if(timer!==null){clearInterval(timer);timer=null;}
 bar.style.transition='none';bar.style.width='0%';
}
function restart(){
 stop();
 if(paused||!intersecting||reduced.matches||visible.length<=perView||document.hidden)return;
 requestAnimationFrame(()=>{
   bar.style.transition='width 5500ms linear';
   bar.style.width='100%';
 });
 timer=setInterval(()=>{
   if(!paused&&!document.hidden){page=(page+1)%pageCount();updateSlide();
     bar.style.transition='none';bar.style.width='0%';void bar.offsetWidth;
     bar.style.transition='width 5500ms linear';bar.style.width='100%';
   }
 },5500);
}
filters.forEach(btn=>btn.addEventListener('click',()=>{
 active=btn.dataset.kind||'all';page=0;refresh();
}));
prev.addEventListener('click',()=>move(-1));
next.addEventListener('click',()=>move(1));
viewport.addEventListener('keydown',e=>{
 if(e.key==='ArrowRight'){e.preventDefault();move(1);}
 if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}
});
pauseButton?.addEventListener('click',()=>{
 paused=!paused;
 pauseButton.textContent=paused?'▶':'Ⅱ';
 pauseButton.title=paused?'Resume automatic slideshow':'Pause automatic slideshow';
 pauseButton.setAttribute('aria-label',pauseButton.title);
 pauseButton.setAttribute('aria-pressed',String(paused));
 restart();
});
let touchX=0;
viewport.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
viewport.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>42)move(dx<0?1:-1);},{passive:true});
document.addEventListener('visibilitychange',restart);
let prevView=getPerView();
window.addEventListener('resize',()=>{const n=getPerView();if(n!==prevView){prevView=n;perView=n;page=0;}if(visible.length)updateSlide();restart();});
if(reduced.addEventListener)reduced.addEventListener('change',restart);
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{intersecting=entries[0]?.isIntersecting??true;restart();},{threshold:.15});
 observer.observe(root);
}
allItems=curated();
refresh();
discoveries().then(found=>{
 if(!found.length)return;
 const unique=new Set(allItems.map(x=>x.title.trim().toLowerCase()));
 const newcomers=found.filter(x=>!unique.has(x.title.trim().toLowerCase()));
 if(!newcomers.length)return;
 allItems=[...allItems,...newcomers].slice(0,16);
 refresh();
});
})();