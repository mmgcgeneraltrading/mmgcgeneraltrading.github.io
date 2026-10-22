import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

const client = createClient(
  'https://avgudubydtofgoaaukby.supabase.co',
  'sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
window.MMGC_AUTH_CLIENT = client;

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
  const nav = document.querySelector('.main-nav') || document.querySelector('header nav');
  if (!nav || nav.querySelector('.mmgc-account-link')) return;
  const protectedRoutes = new Set([
    'tools.html','products.html','opportunities.html','tenders.html','jobs.html',
    'job.html','job-apply.html','applications.html','suppliers.html','stationery.html',
    'south-africa-jobs.html','south-africa-tenders.html','past-tenders.html',
    'tender-details.html','tender-calculator.html','checklists.html','alerts.html',
    'issuers.html','categories.html','smart-home.html','smart-builder.html',
    'smart-security.html','smart-life.html','smart-energy.html','smart-vehicle.html',
    'ai-tech.html','account.html'
  ]);
  if (!user) {
    nav.querySelectorAll('a[href]').forEach(function(a) {
      const link = (a.getAttribute('href') || '').split('#')[0].split('?')[0].replace(/^\.\//, '').toLowerCase();
      if (protectedRoutes.has(link)) a.style.display='none';
    });
  }
  const signIn = document.createElement('a');
  signIn.className = 'mmgc-account-link';
  const signUp = document.createElement('a');
  signUp.className = 'mmgc-account-link';
  if (user) {
    signIn.href = 'account.html';
    signIn.textContent = 'My Account';
    signUp.href = '#';
    signUp.textContent = 'Sign Out';
    signUp.addEventListener('click', async function(event) {
      event.preventDefault();
      signUp.textContent = 'Signing out…';
      try { await client.auth.signOut(); } catch (_) {}
      location.replace('index.html');
    });
  } else {
    signIn.href = loginURL('login', location.pathname + location.search);
    signIn.textContent = 'Sign In';
    signUp.href = loginURL('signup', location.pathname + location.search);
    signUp.textContent = 'Create Account';
  }
  signUp.style.cssText = 'padding:10px 14px;border-radius:999px;background:#13853f;color:#fff;font-weight:800;';
  nav.append(signIn,signUp);
}
async function run() {
  if (current === 'auth.html') { show(); return; }
  if (publicPage) show();
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