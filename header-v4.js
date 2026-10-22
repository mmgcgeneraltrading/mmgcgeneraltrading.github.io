/* MMGC compact nav: native <details> works without JS; enhancements for focus & mobile. */
(function(){
'use strict';
function init(){
 const header=document.querySelector('header.mmgc-v4-header');
 if(!header||header.dataset.navReady)return;
 header.dataset.navReady='1';
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