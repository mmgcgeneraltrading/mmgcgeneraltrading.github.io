/* MMGC click-to-play gallery. YouTube iframes load only after explicit user action. */
(function(){
'use strict';
function init(){
 for(const button of document.querySelectorAll('[data-mmgc-gallery-id]')){
   if(button.dataset.mmgcBound)return;
   button.dataset.mmgcBound='1';
   button.addEventListener('click',()=>{
     const code=button.getAttribute('data-mmgc-gallery-id')||'';
     if(!/^[A-Za-z0-9_-]{11}$/.test(code))return;
     const host=button.closest('.mmgc-media-video');
     if(!host)return;
     const frame=document.createElement('iframe');
     frame.title=button.getAttribute('data-mmgc-gallery-title')||'YouTube demonstration';
     frame.src='https://www.youtube-nocookie.com/embed/'+code+'?autoplay=1&rel=0';
     frame.allow='accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen';
     frame.referrerPolicy='strict-origin-when-cross-origin';
     frame.allowFullscreen=true;
     host.replaceChildren(frame);
   },{once:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();