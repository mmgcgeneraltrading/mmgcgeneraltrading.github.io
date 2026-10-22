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
  if(header?.classList.contains('mmgc-v4-header')){
    header.classList.toggle('mmgc-signed-in',Boolean(user));
    const next=location.pathname+location.search;
    const login=header.querySelector('[data-mmgc-login]');
    const signup=header.querySelector('[data-mmgc-signup]');
    if(login)login.href=loginURL('login',next);
    if(signup)signup.href=loginURL('signup',next);
    const signout=header.querySelector('[data-mmgc-signout]');
    if(signout&&!signout.dataset.bound){
      signout.dataset.bound='1';
      signout.addEventListener('click',async function(){
        signout.disabled=true;signout.textContent='Signing out…';
        try{
          const {error}=await client.auth.signOut();
          if(error)throw error;
          location.replace('index.html');
        }catch(_){
          signout.disabled=false;
          signout.textContent='Sign Out (retry)';
        }
      });
    }
    return;
  }
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

  const links=document.createElement('div');
  links.className='mmgc-nav-links';
  const actions=document.createElement('div');
  actions.className='mmgc-nav-actions';
  const groups=[];
  const toggle=header.querySelector('.nav-toggle');
  const label=header.querySelector('.nav-toggle-label');

  function closeDropdowns(except) {
    groups.forEach(group=>{
      if(group===except)return;
      group.classList.remove('is-open');
      const button=group.querySelector('.mmgc-dropdown-toggle');
      if(button)button.setAttribute('aria-expanded','false');
    });
  }
  function closeMenu() {
    closeDropdowns();
    if(toggle)toggle.checked=false;
    document.body.classList.remove('mmgc-menu-open');
    if(label)label.setAttribute('aria-expanded','false');
  }
  const make=(text,href,kind)=>{
    const a=document.createElement('a');
    a.textContent=text;
    a.href=href;
    if(kind)a.className=kind;
    const target=href.split('#')[0].split('?')[0];
    if(target===current || (current==='index.html'&&target==='index.html')){
      a.setAttribute('aria-current','page');
    }
    a.addEventListener('click',closeMenu);
    return a;
  };
  function makeGroup(labelText,overview,items) {
    const group=document.createElement('div');
    group.className='mmgc-nav-group';
    const head=document.createElement('div');
    head.className='mmgc-nav-group-heading';
    const mainLink=make(labelText,overview,'mmgc-nav-group-main');
    const caret=document.createElement('button');
    caret.type='button';
    caret.className='mmgc-dropdown-toggle';
    caret.setAttribute('aria-label','Show '+labelText+' pages');
    caret.setAttribute('aria-expanded','false');
    const menu=document.createElement('div');
    const menuId='mmgc-menu-'+labelText.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    menu.id=menuId;
    menu.className='mmgc-dropdown-menu';
    caret.setAttribute('aria-controls',menuId);
    caret.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    items.forEach(([name,url,desc])=>{
      const a=make(name,url,'mmgc-sub-link');
      if(desc) {
        const small=document.createElement('small');
        small.textContent=desc;
        a.appendChild(small);
      }
      menu.appendChild(a);
    });
    if(items.some(item=>item[1].split('#')[0]===current))group.classList.add('has-current');
    caret.addEventListener('click',()=>{
      const open=!group.classList.contains('is-open');
      closeDropdowns(group);
      group.classList.toggle('is-open',open);
      caret.setAttribute('aria-expanded',String(open));
    });
    group.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.stopPropagation();closeDropdowns();caret.focus();}
    });
    group.addEventListener('focusout',e=>{
      if(!group.contains(e.relatedTarget))closeDropdowns();
    });
    head.append(mainLink,caret);
    group.append(head,menu);
    groups.push(group);
    return group;
  }

  links.appendChild(make('Home','index.html','mmgc-top-home'));
  links.appendChild(makeGroup('Company','about.html',[
    ['About MMGC','about.html','Who we are'],
    ['Our Portfolio','portfolio.html','Projects and experience'],
    ['Industries','industries.html','Sectors we support'],
    ['Why Choose Us','why-mmgc.html','Our approach and values']
  ]));
  links.appendChild(makeGroup('Services','services.html',[
    ['All Services','services.html','What we offer'],
    ['Tender Support','tender-support.html','Procurement and RFQ help'],
    ['Drone Services & T55','drone-services.html','Agriculture, mapping and inspections'],
    ['Smart Homes & Starlink','smart-home.html','Connected properties'],
    ['Cameras & Alarms','smart-security.html','Connected security solutions'],
    ['Standard Services','standard-services.html','Everyday business support']
  ]));
  if(user) {
    links.appendChild(makeGroup('Marketplace','products.html',[
      ['Products Catalogue','products.html','Equipment, office and supplies'],
      ['Smart Home','smart-home.html','Smart devices and connectivity'],
      ['Stationery','stationery.html','Office essentials'],
      ['Supplier Marketplace','suppliers.html','Suppliers and enquiries']
    ]));
    links.appendChild(makeGroup('Opportunities','opportunities.html',[
      ['Browse Opportunities','opportunities.html','All current opportunities'],
      ['Tenders & RFQs','tenders.html','Procurement opportunities'],
      ['Jobs & Consultancies','jobs.html','Vacancies and placements'],
      ['My Applications','applications.html','Application resources'],
      ['South African Tenders','south-africa-tenders.html','Regional procurement'],
      ['South African Jobs','south-africa-jobs.html','Regional vacancies']
    ]));
    links.appendChild(makeGroup('Business Tools','tools.html',[
      ['Dashboards & Calculators','tools.html','Pricing and cash flow'],
      ['Tender Cost Calculator','tender-calculator.html','Bid-cost estimation'],
      ['Tender Checklists','checklists.html','Submission readiness'],
      ['Tender Alerts','alerts.html','Opportunity tracking'],
      ['Tender Categories','categories.html','Explore by sector']
    ]));
  }
  actions.appendChild(make('Get a Quote','index.html#quote','mmgc-action-quote'));
  if(user) {
    actions.appendChild(make('My Account','account.html','mmgc-action-signin'));
    const out=document.createElement('button');
    out.type='button';
    out.className='mmgc-action-signout';
    out.textContent='Sign Out';
    out.addEventListener('click',async()=>{
      out.disabled=true;
      out.textContent='Signing out…';
      try {const {error}=await client.auth.signOut();if(error)throw error;}
      catch(_){out.textContent='Try Sign Out Again';out.disabled=false;return;}
      location.replace('index.html');
    });
    actions.appendChild(out);
  } else {
    actions.appendChild(make('Sign In',loginURL('login',location.pathname+location.search),'mmgc-action-signin'));
    actions.appendChild(make('Create Account',loginURL('signup',location.pathname+location.search),'mmgc-action-signup'));
  }
  nav.replaceChildren(links,actions);
  nav.id='mmgc-main-navigation';
  if(toggle&&label&&!toggle.dataset.mmgcModernBound){
    toggle.dataset.mmgcModernBound='1';
    label.setAttribute('role','button');
    label.setAttribute('tabindex','0');
    label.setAttribute('aria-label','Toggle navigation menu');
    label.setAttribute('aria-controls','mmgc-main-navigation');
    label.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        toggle.checked=!toggle.checked;
        toggle.dispatchEvent(new Event('change'));
      }
    });
    toggle.addEventListener('change',()=>{
      label.setAttribute('aria-expanded',String(toggle.checked));
      document.body.classList.toggle('mmgc-menu-open',toggle.checked&&innerWidth<=1180);
      if(!toggle.checked)closeDropdowns();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
    document.addEventListener('click',e=>{
      if(!header.contains(e.target)){closeDropdowns();if(toggle?.checked)closeMenu();}
    });
    window.addEventListener('resize',()=>{if(innerWidth>1180)closeMenu();});
  }
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