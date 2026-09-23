(()=>{
  if(window.MMGC_SITE_INTEGRATION_LOADED)return;
  window.MMGC_SITE_INTEGRATION_LOADED=true;
  const load=(tag,attrs)=>{const key=attrs.src||attrs.href;if(!key)return;if(document.querySelector(`${tag}[src="${key}"],${tag}[href="${key}"]`))return;const el=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>el[k]=v);document.head.appendChild(el);};
  const ensureManifest=()=>{if(document.querySelector('link[rel="manifest"]'))return;const m=document.createElement('link');m.rel='manifest';m.href='manifest.webmanifest';document.head.appendChild(m);};
  const addSmartHomeBanner=()=>{
    const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(current!=='index.html'||document.querySelector('.mmgc-smart-home-banner'))return;
    const hero=document.querySelector('.hero');
    const intro=document.querySelector('.intro-strip');
    if(!hero&&!intro)return;
    const section=document.createElement('section');
    section.className='mmgc-smart-home-banner';
    section.innerHTML=`<div class="wrap smart-home-inner"><div><p class="eyebrow">NEW MMGC TECHNOLOGY RANGE</p><h2>Smart Home. Smart Life.</h2><p>MMGC now supplies and installs Starlink, smart security, mesh Wi-Fi, Smart TVs, smart appliances, AI home automation, smart energy and connected-vehicle technology. Start with a complete package or build your own system.</p><div class="smart-home-tags"><span>Starlink & Wi-Fi</span><span>Cameras & Alarms</span><span>Smart TVs</span><span>Lights & Plugs</span><span>AI Home Manager</span><span>Smart Appliances</span><span>Energy</span><span>Smart Vehicle</span></div><div class="smart-home-actions"><a class="btn gold" href="smart-home.html">Explore MMGC Smart Homes</a><a class="btn light-btn" target="_blank" rel="noopener" href="https://wa.me/26658311808?text=Hello%20MMGC%2C%20I%20want%20a%20Smart%20Home%20quotation.">Build My Smart Home</a></div></div><div class="smart-home-pack-preview"><a href="smart-home.html"><b>M15,200</b><span>Secure Start</span></a><a href="smart-home.html"><b>M20,000</b><span>Connected Home</span></a><a href="smart-home.html"><b>M25,000</b><span>Smart Family</span></a><a href="smart-home.html"><b>M30,000</b><span>Smart Home Pro</span></a></div></div>`;
    (intro||hero).insertAdjacentElement('afterend',section);
  };
  const init=()=>{
    const nav=document.querySelector('.main-nav');
    if(nav){
      nav.querySelectorAll('a[href="tenders.html"]').forEach(a=>a.textContent='Tenders & RFQs');
      nav.querySelectorAll('a[href="jobs.html"]').forEach(a=>a.textContent='Jobs & Consultancies');
      let opp=nav.querySelector('a[href="opportunities.html"]');
      if(!opp){opp=document.createElement('a');opp.href='opportunities.html';opp.textContent='Opportunities';const home=nav.querySelector('a[href="index.html"],a[href="#home"]');home?.insertAdjacentElement('afterend',opp);if(!home)nav.prepend(opp);}
      let smart=nav.querySelector('a[href="smart-home.html"]');
      if(!smart){smart=document.createElement('a');smart.href='smart-home.html';smart.textContent='Smart Homes';opp?.insertAdjacentElement('afterend',smart);if(!opp)nav.prepend(smart);}else smart.textContent='Smart Homes';
      let products=nav.querySelector('a[href="products.html"]');
      if(!products){products=document.createElement('a');products.href='products.html';products.textContent='Products';smart?.insertAdjacentElement('afterend',products);if(!smart)nav.prepend(products);}else products.textContent='Products';
      const tender=nav.querySelector('a[href="tenders.html"]');
      if(tender&&tender.previousElementSibling!==products)products.insertAdjacentElement('afterend',tender);
      let jobs=nav.querySelector('a[href="jobs.html"]');
      if(!jobs){jobs=document.createElement('a');jobs.href='jobs.html';jobs.textContent='Jobs & Consultancies';tender?.insertAdjacentElement('afterend',jobs);}
      else if(tender&&jobs.previousElementSibling!==tender)tender.insertAdjacentElement('afterend',jobs);
      let applications=nav.querySelector('a[href="applications.html"]');
      if(!applications){applications=document.createElement('a');applications.href='applications.html';applications.textContent='My Applications';jobs?.insertAdjacentElement('afterend',applications);}
      else if(jobs&&applications.previousElementSibling!==jobs)jobs.insertAdjacentElement('afterend',applications);
      const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
      nav.querySelectorAll('a[href]').forEach(a=>{const target=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(target===current)a.setAttribute('aria-current','page');});
    }
    document.querySelectorAll('.main-nav a').forEach(a=>{if(a.dataset.mmgcNavBound)return;a.dataset.mmgcNavBound='1';a.addEventListener('click',()=>{const t=document.getElementById('nav-toggle');if(t)t.checked=false;});});
    document.querySelectorAll('.stationery-card .quote').forEach(a=>{
      a.textContent='Add to Enquiry';a.href='products.html#basket';
      if(a.dataset.mmgcBasketBound)return;a.dataset.mmgcBasketBound='1';
      a.addEventListener('click',e=>{
        e.preventDefault();const card=a.closest('.stationery-card');if(!card)return;
        const name=card.querySelector('h3')?.textContent?.trim()||'Stationery item';
        const unit=(card.querySelector('.sell-price small')?.textContent||card.querySelector('.pack')?.textContent||'unit').replace('/','').trim();
        const price=card.querySelector('.sell-price')?.childNodes?.[0]?.textContent?.trim()||'';
        let basket=[];try{basket=JSON.parse(localStorage.getItem('mmgcEnquiryBasket')||'[]');if(!Array.isArray(basket))basket=[];}catch{basket=[];}
        const id='stationery-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
        const existing=basket.find(x=>x.id===id);if(existing)existing.qty=(Number(existing.qty)||1)+1;else basket.push({id,qty:1,custom:{name,unit:unit||'unit',price,category:'Stationery'}});
        localStorage.setItem('mmgcEnquiryBasket',JSON.stringify(basket));location.href='products.html#basket';
      });
    });
    addSmartHomeBanner();
  };
  ensureManifest();
  load('link',{rel:'stylesheet',href:'assistant.css'});
  load('link',{rel:'stylesheet',href:'pwa.css'});
  load('link',{rel:'stylesheet',href:'smart-home.css'});
  load('script',{src:'pwa.js',defer:true});
  load('script',{src:'assistant.js',defer:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();