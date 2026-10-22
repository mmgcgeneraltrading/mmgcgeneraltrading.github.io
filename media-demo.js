// Loads the DJI demonstration video only after a user chooses to play it.
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-mmgc-video]').forEach(button=>{
    button.addEventListener('click',()=>{
      const holder=button.closest('.mmgc-video-window');
      if(!holder)return;
      const id=button.getAttribute('data-mmgc-video');
      if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
      const frame=document.createElement('iframe');
      frame.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
      frame.title='DJI Agras T55 spraying demonstration, manufacturer-supplied video';
      frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen=true;
      frame.referrerPolicy='strict-origin-when-cross-origin';
      holder.replaceChildren(frame);
    },{once:true});
  });
});