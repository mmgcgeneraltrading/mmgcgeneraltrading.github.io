/* MMGC homepage product-first carousel: no checkout or inventory assertions. */
(()=>{
const slides=[
 {title:'EcoFlow RIVER 3',tag:'Portable power • EcoFlow showcase',copy:'Explore compact backup power for laptops, routers and essential devices. Enquire about Lesotho supply.',image:'https://www.tienexenergy.co/app_data_archivos/tienexenergy.soomi.co/productos/producto_08ae5b57a9d40e4d379d65420c3239d51c7e39b91776528929.png',href:'ecoflow/',cta:'Explore EcoFlow'},
 {title:'EcoFlow DELTA 3 Plus',tag:'Smart UPS and backup power',copy:'Portable energy solutions for homes, offices and connected businesses.',image:'https://cdn.solarpowersupply.eu/files/EcoFlow_groepsafbeelding_delta3serie-4-20250115.jpg',href:'ecoflow/',cta:'See energy solutions'},
 {title:'EcoFlow DELTA Pro 3',tag:'High-capacity backup concepts',copy:'Discover larger-capacity EcoFlow energy products and request a tailored sourcing enquiry.',image:'https://www.ecoflow.no/media/catalog/product/d/p/dp3-1-hq.jpg',href:'ecoflow/',cta:'Request information'},
 {title:'Solar generator kits',tag:'Power • Solar charging',copy:'Explore portable power stations and compatible solar panels for business, home and outdoor needs.',image:'https://mobileimages.lowes.com/productimages/6520018b-b24d-4deb-a1de-9efad3faec62/68185967.jpeg?size=pdhz',href:'ecoflow/',cta:'Explore solar kits'},
 {title:'Agricultural drones',tag:'Aerial technology',copy:'Agricultural spraying concepts, drone sourcing, surveying and site inspection enquiries.',image:'https://i.ytimg.com/vi/lZ7-m23-6hg/maxresdefault.jpg',href:'drone-services.html',cta:'Explore drones'},
 {title:'Smart security cameras',tag:'CCTV • Connected monitoring',copy:'Remote cameras, smart home networks, video monitoring and connected security solutions.',image:'https://images.pexels.com/photos/28549934/pexels-photo-28549934.jpeg?auto=compress&cs=tinysrgb&w=1800',href:'smart-security.html',cta:'Explore smart security'},
 {title:'Alarm systems and sensors',tag:'Connected homes and businesses',copy:'Explore intrusion alarms, motion sensors, notifications and smart property monitoring.',image:'https://images.pexels.com/photos/28549934/pexels-photo-28549934.jpeg?auto=compress&cs=tinysrgb&w=1800',href:'smart-home.html',cta:'Explore alarms'},
 {title:'MMGC Products Marketplace',tag:'Trade • Products • Procurement',copy:'Explore general supplies, technology, stationery and sourcing enquiries in one marketplace.',image:'assets/mmgc-logo.png',href:'products.html',cta:'Browse MMGC products'},
 {title:'Tendering and RFQs',tag:'Tender opportunities • Business support',copy:'Find procurement opportunities and explore MMGC tender preparation and sourcing support.',image:'assets/mmgc-logo.png',href:'tenders.html',cta:'Browse RFQs and tenders'},
 {title:'Jobs and opportunities',tag:'Careers • Consultancies',copy:'Browse job opportunities, consultancy notices and resources for applicants.',image:'assets/mmgc-logo.png',href:'opportunities.html',cta:'Explore opportunities'},
 {title:'Smart homes and Starlink',tag:'Internet • Smart living',copy:'Discover smart connectivity, remote monitoring, cameras and property technology.',image:'https://images.pexels.com/photos/28549934/pexels-photo-28549934.jpeg?auto=compress&cs=tinysrgb&w=1800',href:'smart-home.html',cta:'Explore smart homes'},
 {title:'Business support and quotations',tag:'General trading • MMGC services',copy:'Procurement, business solutions, commercial supplies and requests for quotations.',image:'assets/mmgc-logo.png',href:'services.html',cta:'Discover our services'},
 {title:'MMGC SuperPay Gateway',tag:'Fintech demonstration • Not live payments',copy:'See how the proposed M-Pesa and EcoCash gateway works and apply as a merchant.',image:'assets/superpay-logo.svg',href:'superpay/',cta:'Explore SuperPay'}
];
function boot(){
 const main=document.querySelector('main'); if(!main||document.getElementById('mmgc-product-showcase'))return;
 const s=document.createElement('section');s.id='mmgc-product-showcase';s.className='mmgc-showcase';s.setAttribute('aria-label','Featured MMGC products and services');
 s.innerHTML='<div class="mmgc-showcase-slides"></div><div class="mmgc-showcase-controls"><button type="button" data-prev aria-label="Previous slide">‹</button><div class="mmgc-showcase-dots" aria-label="Choose slide"></div><button type="button" data-next aria-label="Next slide">›</button><button type="button" data-pause aria-label="Pause slideshow">Pause</button></div>';
 main.insertBefore(s,main.firstChild);
 const track=s.querySelector('.mmgc-showcase-slides'),dots=s.querySelector('.mmgc-showcase-dots');
 slides.forEach((item,i)=>{
  const a=document.createElement('article');a.className='mmgc-showcase-slide';a.setAttribute('aria-hidden',i?'true':'false');
  const img=document.createElement('img');img.src=item.image;img.alt=item.title+' product and service showcase';img.loading=i?'lazy':'eager';img.addEventListener('error',()=>{img.style.display='none';a.classList.add('mmgc-showcase-noimage')});
  const shade=document.createElement('div');shade.className='mmgc-showcase-shade';
  const text=document.createElement('div');text.className='mmgc-showcase-copy';text.innerHTML='<span class="mmgc-showcase-tag"></span><h1></h1><p></p><a class="mmgc-showcase-cta"></a><small>Product information and sourcing enquiries; availability and authorisation subject to confirmation.</small>';
  text.querySelector('.mmgc-showcase-tag').textContent=item.tag;text.querySelector('h1').textContent=item.title;text.querySelector('p').textContent=item.copy;const link=text.querySelector('a');link.href=item.href;link.textContent=item.cta;
  a.append(img,shade,text);track.append(a);
  const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show '+item.title);b.title=item.title;b.addEventListener('click',()=>show(i,true));dots.append(b);
 });
 let current=0,paused=false,timer;
 const all=[...track.children],buttons=[...dots.children];
 function show(index,manual){current=(index+slides.length)%slides.length;all.forEach((el,i)=>{el.classList.toggle('active',i===current);el.setAttribute('aria-hidden',String(i!==current));});buttons.forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));if(manual)restart();}
 function restart(){clearInterval(timer);if(!paused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(()=>show(current+1,false),6500)}
 s.querySelector('[data-prev]').addEventListener('click',()=>show(current-1,true));s.querySelector('[data-next]').addEventListener('click',()=>show(current+1,true));
 const pause=s.querySelector('[data-pause]');pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Play':'Pause';restart()});
 s.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(current-1,true);if(e.key==='ArrowRight')show(current+1,true)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(timer);else restart()});
 show(0,false);restart();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();