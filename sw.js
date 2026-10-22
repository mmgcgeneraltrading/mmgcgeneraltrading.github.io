const CACHE='mmgc-platform-v22';
const CORE=['/','/index.html','/offline.html','/opportunities.html','/south-africa-jobs.html','/south-africa-tenders.html','/tenders.html','/jobs.html','/job.html','/job-apply.html','/applications.html','/products.html','/stationery.html','/standard-services.html','/suppliers.html','/tender-calculator.html','/checklists.html','/styles.css','/mobile.css','/header-v4.css','/header-v4.js','/learning-gallery.css','/learning-gallery.js','/drone-services.html','/smart-security.html','/smart-home.html','/smart-life.html','/smart-energy.html','/header-modern.css','/home-priority.css','/opportunity-showcase.css','/opportunity-showcase.js','/media-demo.js','/auth-guard.js','/opportunities.css','/application-system.css','/cv-extract.css','/products.css','/assistant.css','/pwa.css','/ai-bridge.css','/calculator-modern.css','/calculator-upload.css','/tender-intelligence.css','/site-integration.js','/pwa.js','/mmgc-supabase.js','/jobs-data.js','/jobs-social-data.js','/jobs.js','/job.js','/job-apply.js','/cv-browser-extract.js','/applications.js','/calculator.js','/tender-intelligence.js','/procurement-data.js','/source-links.js','/manifest.webmanifest','/assets/mmgc-logo.png','/assets/mmgc-app-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;
  if(/\/(?:header-v4|learning-gallery|opportunity-showcase)\.(?:js|css)$/.test(url.pathname) || url.pathname.endsWith('/data/lesotho-sources.json') || url.pathname.endsWith('/data/opportunity-discoveries.json') || url.pathname.endsWith('/jobs-data.js') || url.pathname.endsWith('/procurement-data.js')){
    event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request)));return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{if(response&&response.status===200){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(async()=>await caches.match(event.request)||await caches.match('/offline.html')));return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.status===200){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;})));
});
