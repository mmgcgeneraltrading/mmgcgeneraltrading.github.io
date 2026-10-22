import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

const client = createClient(
  'https://avgudubydtofgoaaukby.supabase.co',
  'sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const safeNext = function(value){
  if (!value) return 'account.html';
  try {
    const url = new URL(value,location.origin);
    if (url.origin!==location.origin || /\/auth\.html$/i.test(url.pathname)) return 'account.html';
    return url.pathname+url.search;
  } catch(_) {return 'account.html';}
};
const next = safeNext(params.get('next'));
const setMsg = function(msg,type) {
  $('authMessage').textContent = msg;
  $('authMessage').className = 'auth-message '+(type||'');
};
function setMode(mode) {
  if (!['signup','login','forgot','reset'].includes(mode)) mode='login';
  document.querySelectorAll('.auth-form').forEach(form=>form.hidden=form.dataset.form!==mode);
  document.querySelectorAll('.mode-tab').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.mode===mode)));
  $('authSubtitle').textContent = mode==='signup'?'Create a free MMGC account':mode==='forgot'?'Request a password reset email':mode==='reset'?'Choose a new password':'Welcome back to MMGC';
  $('authMessage').textContent='';
  history.replaceState(null,'','auth.html?mode='+mode+'&next='+encodeURIComponent(next));
}
function busy(id, yes) { const button=$(id).querySelector('button[type=submit]');button.disabled=yes;button.dataset.original ||= button.textContent;button.textContent=yes?'Please wait…':button.dataset.original; }
function errorText(err) {return err && err.message?err.message:'Could not complete the request. Please try again.';}
document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
$('accountType').addEventListener('change',function(){ $('companyWrap').hidden=this.value!=='company'; });
$('signupForm').addEventListener('submit',async function(ev){
 ev.preventDefault();if(!this.reportValidity()) return;
 const password=$('signupPassword').value;
 if(password.length<8){setMsg('Use at least eight characters for your password.','error');return;}
 if(password!==$('confirmPassword').value){setMsg('Passwords do not match.','error');return;}
 busy('signupForm',true);
 try {
  const values={email:$('signupEmail').value.trim(),password:password,options:{
   data:{full_name:$('fullName').value.trim(),account_type:$('accountType').value,
    company_name:$('accountType').value==='company'?$('companyName').value.trim():'',
    phone:$('mobile').value.trim()},
   emailRedirectTo:location.origin+'/auth.html?verified=1&next='+encodeURIComponent(next)
  }};
  const {data,error}=await client.auth.signUp(values);
  if(error) throw error;
  if(data.session){location.replace(next);return;}
  setMsg('Registration submitted. Check your email for a confirmation link before signing in. If no email arrives, contact MMGC.','success');
  this.reset();$('companyWrap').hidden=true;
 } catch(e){setMsg(errorText(e),'error');}
 finally{busy('signupForm',false);}
});
$('loginForm').addEventListener('submit',async function(ev){
 ev.preventDefault(); if(!this.reportValidity())return;
 busy('loginForm',true);
 try{
  const {data,error}=await client.auth.signInWithPassword({email:$('loginEmail').value.trim(),password:$('loginPassword').value});
  if(error)throw error;
  if(!data.user)throw new Error('Login was not completed.');
  location.replace(next);
 }catch(e){setMsg(errorText(e),'error');busy('loginForm',false);}
});
$('forgotForm').addEventListener('submit',async function(ev){
 ev.preventDefault();busy('forgotForm',true);
 try{
  const {error}=await client.auth.resetPasswordForEmail($('forgotEmail').value.trim(),{
   redirectTo:location.origin+'/auth.html?mode=reset'});
  if(error)throw error;
  setMsg('If the account exists, a password reset message will arrive by email.','success');
 }catch(e){setMsg(errorText(e),'error');}
 finally{busy('forgotForm',false);}
});
$('resetForm').addEventListener('submit',async function(ev){
 ev.preventDefault();const pw=$('resetPassword').value;
 if(pw.length<8){setMsg('Use at least eight characters.','error');return;}
 busy('resetForm',true);
 try{
  const {error}=await client.auth.updateUser({password:pw});
  if(error)throw error;
  setMsg('Password updated. You can open your account now.','success');
  setTimeout(()=>location.replace('account.html'),1100);
 }catch(e){setMsg(errorText(e),'error');busy('resetForm',false);}
});
client.auth.onAuthStateChange((event)=>{
 if(event==='PASSWORD_RECOVERY')setMode('reset');
});
if(params.get('verified'))setMsg('Email confirmed. Sign in to continue.','success');
else setMode(params.get('mode')||'login');
const status=await client.auth.getUser().catch(()=>({data:{user:null}}));
if(status.data?.user && params.get('mode')!=='reset' && !params.get('verified'))location.replace(next);