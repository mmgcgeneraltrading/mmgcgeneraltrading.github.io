import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

const client = createClient(
  'https://avgudubydtofgoaaukby.supabase.co',
  'sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
window.MMGC_AUTH_CLIENT = client;
if (!document.querySelector('link[href="header-modern.css"]')) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'header-modern.css';
  document.head.appendChild(css);
}

const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
const publicPages = new Set([
  'index.html','about.html','services.html','standard-services.html',
  'portfolio.html','industries.html','why-mmgc.html','tender-support.html',
  'auth.html'
]);
const publicPage = publicPages.has(current);
const safeNext = function(value) {
  if (!value) return 'account.html';
  try {
    const target = new URL(value, location.origin);
    if (target.origin !== location.origin || target.pathname.endsWith('/auth.html')) return 'account.html';
    if (target.pathname.startsWith('//')) return 'account.html';
    return target.pathname + target.search;
  } catch (_) { return 'account.html'; }
};
const loginURL = function(mode, next) {
  return 'auth.html?mode=' + encodeURIComponent(mode) + '&next=' + encodeURIComponent(safeNext(next));
};
const show = function() { document.documentElement.classList.add('mmgc-auth-ready'); };
function addNav(user) {
  const header = document.querySelector('header');
  const nav = header?.querySelector('.main-nav');
  if (!header || !nav) return;
  header.classList.add('mmgc-modern-header');
  nav.classList.add('mmgc-header-nav');
  nav.setAttribute('aria-label','Main navigation');
  const brand=header.querySelector('.brand');
  if(brand) {
    brand.href='index.html';
    brand.setAttribute('aria-label','MMGC General Trading homepage');
    const title=brand.querySelector('b'),tagline=brand.querySelector('small');
    if(title)title.textContent='MMGC GENERAL TRADING';
    if(tagline)tagline.textContent='Procurement · Business Support';
  }
  const links = document.createElement('div');
  links.className='mmgc-nav-links';
  const actions=document.createElement('div');
  actions.className='mmgc-nav-actions';
  const make=(text,href,kind)=>{
    const a=document.createElement('a');
    a.textContent=text;a.href=href;
    if(kind)a.className=kind;
    const target=href.split('#')[0].split('?')[0];
    if(target===current || (current==='index.html'&&href==='index.html')){
      a.setAttribute('aria-current','page');
    }
    a.addEventListener('click',()=>closeMenu());
    return a;
  };
  const primary=user
    ? [['Home','index.html'],['About','about.html'],['Services','services.html'],
       ['Products','products.html'],['Opportunities','opportunities.html'],['Business Tools','tools.html']]
    : [['Home','index.html'],['About','about.html'],['Services','services.html'],
       ['Tender Support','tender-support.html']];
  primary.forEach(([label,href])=>links.appendChild(make(label,href)));
  actions.appendChild(make('Get a Quote','index.html#quote','mmgc-action-quote'));
  if(user){
    actions.appendChild(make('My Account','account.html','mmgc-action-signin'));
    const out=make('Sign Out','#','mmgc-action-signout');
    out.addEventListener('click',async(e)=>{
      e.preventDefault();out.textContent='Signing out…';
      try{await client.auth.signOut();}catch(_){}
      location.replace('index.html');
    });
    actions.appendChild(out);
  } else {
    actions.appendChild(make('Sign In',loginURL('login',location.pathname+location.search),'mmgc-action-signin'));
    actions.appendChild(make('Create Account',loginURL('signup',location.pathname+location.search),'mmgc-action-signup'));
  }
  nav.replaceChildren(links,actions);
  const toggle=header.querySelector('.nav-toggle');
  const label=header.querySelector('.nav-toggle-label');
  function closeMenu(){
    if(toggle)toggle.checked=false;
    document.body.classList.remove('mmgc-menu-open');
    if(label)label.setAttribute('aria-expanded','false');
  }
  if(toggle && label && !toggle.dataset.mmgcModernBound){
    toggle.dataset.mmgcModernBound='1';
    label.setAttribute('role','button');
    label.setAttribute('tabindex','0');
    label.setAttribute('aria-label','Toggle navigation menu');
    label.setAttribute('aria-controls','mmgc-main-navigation');
    label.addEventListener('keydown',(e)=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle.checked=!toggle.checked;toggle.dispatchEvent(new Event('change'));}
    });
    toggle.addEventListener('change',()=>{
      label.setAttribute('aria-expanded',String(toggle.checked));
      document.body.classList.toggle('mmgc-menu-open',toggle.checked&&innerWidth<=1180);
    });
    document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeMenu();});
    document.addEventListener('click',(e)=>{if(toggle.checked && !header.contains(e.target))closeMenu();});
    window.addEventListener('resize',()=>{if(innerWidth>1180)closeMenu();});
  }
  nav.id='mmgc-main-navigation';
  if(label)label.setAttribute('aria-expanded',toggle?.checked?'true':'false');
}

async function run() {
  if (current === 'auth.html') { show(); return; }
  if (publicPage) {
    show();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded',()=>addNav(null),{once:true});
    } else addNav(null);
  }
  let user = null;
  try {
    const { data, error } = await client.auth.getUser();
    if (!error && data) user = data.user;
  } catch (_) {}
  if (!user && !publicPage) {
    location.replace(loginURL('login',location.pathname + location.search));
    return;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',function(){addNav(user);},{once:true});
  } else addNav(user);
  if (current === 'account.html' && user) {
    const email = document.getElementById('accountEmail');
    const name = document.getElementById('accountName');
    if (email) email.textContent = user.email || '';
    if (name) name.textContent = (user.user_metadata && user.user_metadata.full_name) || 'MMGC Member';
  }
  show();
}
run();