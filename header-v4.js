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
 // Persistent gateway logo and enquiry-basket shortcut, visible outside the collapsed mobile menu.
 if(!header.querySelector('.mmgc-superpay-shortcuts')){
  const brand=header.querySelector('.mmgc-v4-brand');
  const block=document.createElement('div');
  block.className='mmgc-superpay-shortcuts';
  block.innerHTML='<a class="mmgc-superpay-shortcut" href="superpay/" aria-label="SuperPay Gateway"><img src="assets/superpay-logo.svg" alt="SuperPay Gateway"></a><a class="mmgc-cart-shortcut" href="products.html#basket" title="Open MMGC quotation basket" aria-label="Open MMGC quotation basket"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 2h3l3 14h14l2-10H5"/></svg></a>';
  if(brand)brand.insertAdjacentElement('afterend',block);
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