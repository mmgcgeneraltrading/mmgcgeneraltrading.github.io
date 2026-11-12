/* MMGC compact nav: native <details> works without JS; enhancements for focus & mobile. */
function mmgcLoadAssistant(){
  if(window.__MMGC_ASSISTANT_LOADER)return;
  if(/\/(auth|job-apply|applications)\.html$/i.test(location.pathname))return;
  window.__MMGC_ASSISTANT_LOADER=true;
  if(!document.querySelector('link[href="assistant.css"]')){const c=document.createElement('link');c.rel='stylesheet';c.href='assistant.css?v=3';document.head.appendChild(c);}
  const script=document.createElement('script');script.src='assistant.js?v=3';script.defer=true;document.head.appendChild(script);
}
mmgcLoadAssistant();

(function(){
'use strict';
function init(){
 const header=document.querySelector('header.mmgc-v4-header');
 if(!header||header.dataset.navReady)return;
 header.dataset.navReady='1';
 // Public access to the central product catalogue, including for visitors without accounts.
 const primary=header.querySelector('.mmgc-v4-primary');
 if(primary&&!primary.querySelector('a[href="catalogue.html"]')){
   const entry=document.createElement('a');
   entry.href='catalogue.html';entry.className='mmgc-v4-catalogue-link';entry.textContent='Catalogue';
   const home=primary.querySelector('.mmgc-v4-home');
   if(home)home.insertAdjacentElement('afterend',entry);else primary.prepend(entry);
 }
 // Persistent gateway logo and enquiry-basket shortcut, visible outside the collapsed mobile menu.
 if(!header.querySelector('.mmgc-superpay-shortcuts')){
  const brand=header.querySelector('.mmgc-v4-brand');
  const block=document.createElement('div');
  block.className='mmgc-superpay-shortcuts';
  block.innerHTML='<a class="mmgc-superpay-shortcut" href="superpay/" aria-label="SuperPay Gateway"><img src="assets/superpay-logo.svg" alt="SuperPay Gateway"></a><a class="mmgc-cart-shortcut" href="products.html#basket" title="Open MMGC quotation basket" aria-label="Open MMGC quotation basket"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 2h3l3 14h14l2-10H5"/></svg></a>';
  if(brand)brand.insertAdjacentElement('afterend',block);
 }


 // Load the shared MMGC catalogue for comprehensive suggestions on every page.
 function loadOnce(src){
   if(document.querySelector('script[data-mmgc-catalogue="'+src+'"]')||document.querySelector('script[src="'+src+'"]'))return;
   const a=document.createElement('script');a.src=src;a.defer=true;a.dataset.mmgcCatalogue=src;document.head.append(a);
 }
 if(!window.MMGC_PRODUCTS)loadOnce('product-data.js');
 loadOnce('unified-catalog.js');
 // Global site search: locally indexed pages and instant suggestions, no external tracking.
 if(!header.querySelector('.mmgc-site-search')){
 const root=new URL('header-v4.js',document.querySelector('script[src*="header-v4.js"]')?.src||location.href);
 const pages=[
 ['EcoFlow RIVER 3','ecoflow/','portable power battery UPS'],
 ['EcoFlow DELTA 3 Plus','ecoflow/','backup UPS power station'],
 ['EcoFlow DELTA Pro 3','ecoflow/','home energy backup'],
 ['Solar generator kits','ecoflow/','solar panels charging ecoflow'],
 ['EcoFlow energy solutions','ecoflow/','solar batteries power'],
 ['MMGC SuperPay Gateway','superpay/','mpesa ecocash payment merchant API fintech'],
 ['Merchant payment application','superpay/','merchant apply register gateway'],
 ['Agricultural drones & DJI Agras T55','drone-services.html','drone spraying farming agriculture aerial'],
 ['CCTV security cameras','smart-security.html','camera surveillance security monitoring'],
 ['Alarm systems and smart sensors','smart-home.html','alarm security smart home sensors'],
 ['Starlink and connected homes','smart-home.html','internet connectivity satellite wifi'],
 ['Product catalogue and basket','products.html','shop products checkout cart'],
 ['Business services','services.html','supply procurement printing IT'],
 ['Tender opportunities','tenders.html','bidding RFQ procurement'],
 ['Job opportunities','jobs.html','employment vacancies'],
 ['Ask MMGC assistant','#ask-mmgc','ask mmgc help assistant questions chat'],
 ['Business quotations and procurement','index.html#quote','quotations general trading tendering'],
 ['Contact MMGC for quotation','index.html#quote','enquiry contact quote']
 ];
 const shell=document.createElement('div');shell.className='mmgc-site-search';
 const icon=document.createElement('button');icon.type='button';icon.className='mmgc-search-toggle';icon.setAttribute('aria-label','Search MMGC website');icon.setAttribute('aria-expanded','false');icon.textContent='⌕ Search';
 const input=document.createElement('input');input.type='search';input.placeholder='Search MMGC products & services';input.setAttribute('aria-label','Search MMGC website');input.setAttribute('autocomplete','off');input.setAttribute('aria-expanded','false');
 const popup=document.createElement('div');popup.className='mmgc-search-results';popup.setAttribute('role','listbox');
 shell.append(icon,input,popup);
 const quote=header.querySelector('.mmgc-v4-quote');if(quote)quote.insertAdjacentElement('afterend',shell);else header.querySelector('.mmgc-v4-inner')?.append(shell);
 const ideas=['EcoFlow','SuperPay','Agricultural drones','CCTV'];
 function render(){
  const query=input.value.trim().toLowerCase(),terms=query.split(/\s+/).filter(Boolean);
  let found=terms.length?pages.filter(p=>terms.every(t=>(p[0]+' '+p[2]).toLowerCase().includes(t))):pages.filter(p=>ideas.some(s=>p[0]===s||p[0].toLowerCase().startsWith(s.toLowerCase()))).slice(0,4);
  const catalogue=window.MMGC_CATALOGUE;
  if(catalogue){const products=(query?catalogue.search(query,12):catalogue.all().filter(p=>['EcoFlow RIVER 3 Portable Power Station','SuperPay Gateway demonstration','Agricultural drones and inspections','CCTV cameras and alarm systems'].includes(p.name))).map(p=>[p.name,p.url||'catalogue.html',p.description||'']);const combined=products.concat(pages.filter(p=>terms.length?terms.every(t=>(p[0]+' '+p[2]).toLowerCase().includes(t)):ideas.some(s=>p[0].toLowerCase().includes(s.toLowerCase()))));found=combined.filter((v,i,a)=>a.findIndex(x=>x[0]===v[0])===i).slice(0,7)}
  found=found.slice(0,7);
  popup.replaceChildren();
  const title=document.createElement('div');title.className='mmgc-search-caption';title.textContent=query?'Matching website pages':'Popular searches';popup.append(title);
  if(!found.length){const empty=document.createElement('p');empty.textContent='No matches. Try EcoFlow, drones, SuperPay or cameras.';popup.append(empty)}
  found.forEach(p=>{const a=document.createElement('a');a.href=p[1]==='#ask-mmgc'?'#ask-mmgc':new URL(p[1],root).href;a.textContent=p[0];a.setAttribute('role','option');if(p[1]==='#ask-mmgc'){a.addEventListener('click',e=>{e.preventDefault();popup.hidden=true;document.querySelector('.mmgc-assistant-launcher, .mmgc-assistant-toggle, [data-mmgc-assistant-open]')?.click()})}popup.append(a)});
  popup.hidden=false;input.setAttribute('aria-expanded','true');
 }
 icon.addEventListener('click',()=>{const opening=!shell.classList.contains('mmgc-search-open');shell.classList.toggle('mmgc-search-open',opening);icon.setAttribute('aria-expanded',String(opening));if(opening){input.focus();render()}else{popup.hidden=true;input.setAttribute('aria-expanded','false')}});
 input.addEventListener('focus',render);input.addEventListener('input',render);
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){popup.hidden=true;input.setAttribute('aria-expanded','false');input.blur();shell.classList.remove('mmgc-search-open');icon.setAttribute('aria-expanded','false')}if(e.key==='Enter'){e.preventDefault();popup.querySelector('a')?.click()}});
 document.addEventListener('click',e=>{if(!shell.contains(e.target)){popup.hidden=true;input.setAttribute('aria-expanded','false');shell.classList.remove('mmgc-search-open');icon.setAttribute('aria-expanded','false')}});
 popup.hidden=true;
 // On small screens keep Search visible even while the navigation drawer is closed.
 const positionSearch=()=>{
  const quote=header.querySelector('.mmgc-v4-quote');
  const inner=header.querySelector('.mmgc-v4-inner');
  const hamburger=header.querySelector('.mmgc-v4-hamburger');
  if(window.innerWidth<=1110&&inner&&hamburger){inner.insertBefore(shell,hamburger)}
  else if(quote){quote.insertAdjacentElement('afterend',shell)}
 };
 positionSearch();
 window.addEventListener('resize',positionSearch);
 }

 const toolsMenu=header.querySelector('.mmgc-v4-tools .mmgc-v4-dropdown');
 if(toolsMenu&&!toolsMenu.querySelector('a[href="pos.html"]')){
  const posLink=document.createElement('a');posLink.href='pos.html';posLink.textContent='Shop POS · Point of Sale';toolsMenu.appendChild(posLink);
 }
 const menus=[...header.querySelectorAll('details.mmgc-v4-group,details.mmgc-v4-account')];
 const toggle=header.querySelector('#nav-toggle');
 const close=except=>menus.forEach(menu=>{if(menu!==except)menu.open=false;});
 menus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)close(menu);}));
 document.addEventListener('click',event=>{
   if(!header.contains(event.target)){
     close();
     if(toggle)toggle.checked=false;
   }
 });
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'){
     const opened=menus.find(menu=>menu.open);
     if(opened){opened.open=false;opened.querySelector('summary')?.focus();}
     else if(toggle?.checked){toggle.checked=false;header.querySelector('.mmgc-v4-hamburger')?.focus();}
   }
 });
 header.querySelectorAll('.mmgc-v4-nav a').forEach(anchor=>{
   const url=new URL(anchor.href,location.href);
   if(url.origin===location.origin && url.pathname===location.pathname && (!url.hash||url.hash===location.hash)){
     anchor.setAttribute('aria-current','page');
   }
   anchor.addEventListener('click',()=>{close();if(toggle)toggle.checked=false;});
 });
 window.addEventListener('resize',()=>{if(window.innerWidth>1110&&toggle)toggle.checked=false;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();