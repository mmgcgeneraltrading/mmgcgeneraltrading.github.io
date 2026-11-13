import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

// Only the public, publishable key is used. User passwords are never sent to MMGC's website.
const client = createClient(
  'https://avgudubydtofgoaaukby.supabase.co',
  'sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const safeNext=value=>{
  if(!value)return 'account.html';
  try{
    const url=new URL(value,location.origin);
    if(url.origin!==location.origin || /\/auth\.html$/i.test(url.pathname)||url.pathname.startsWith('//'))return 'account.html';
    return url.pathname+url.search+url.hash;
  }catch(_){return 'account.html';}
};
const next=safeNext(params.get('next'));
let currentMode=params.get('mode')||'login';
const productionOrigin='https://mmgcgeneraltrading.github.io';
const hashParams=new URLSearchParams(location.hash.replace(/^#/,''));
const passwordRecoveryLinkInProgress=Boolean(
  params.get('code') || params.get('token_hash') ||
  hashParams.has('access_token') || hashParams.get('type')==='recovery'
);
const recoveryError=hashParams.get('error_code')||hashParams.get('error');
let recoveryReady=false;
function returnUrl(mode){
 return productionOrigin+'/auth.html?mode='+encodeURIComponent(mode);
}

function message(value,type=''){
  const node=$('authMessage');
  node.textContent=value;
  node.className='auth-message '+type;
}
function showMode(mode,preserveMessage=false){
  if(!['signup','login','forgot','reset'].includes(mode))mode='login';
  currentMode=mode;
  document.querySelectorAll('.auth-form').forEach(form=>{form.hidden=form.dataset.form!==mode;});
  document.querySelectorAll('.mode-tab').forEach(tab=>{
    tab.setAttribute('aria-selected',String(tab.dataset.mode===mode));
  });
  $('authSubtitle').textContent=mode==='signup'?'Create your MMGC account':
    mode==='forgot'?'Recover your password':
    mode==='reset'?'Set a new password':'Welcome back to MMGC';
  if(!preserveMessage)message('');
  // Never strip a recovery token, OAuth code, or PKCE exchange parameters
  // until Supabase has handled them; the auth client needs the original URL.
  if(!passwordRecoveryLinkInProgress && !recoveryError){
    history.replaceState(null,'','auth.html?mode='+encodeURIComponent(mode)+'&next='+encodeURIComponent(next));
  }
}
function submitBusy(formId,busy){
  const button=$(formId).querySelector('button[type="submit"]');
  if(!button)return;
  if(!button.dataset.original)button.dataset.original=button.textContent;
  button.disabled=busy;
  button.textContent=busy?'Please wait…':button.dataset.original;
}
function errorText(err){
  let msg=err?.message||'Unable to complete the request. Please try again.';
  if(/phone.*(disabled|not enabled|provider)/i.test(msg)||/sms provider not found/i.test(msg)){
    return 'Phone account registration is not yet enabled by the MMGC administrator. Please use email for now.';
  }
  if(/email.*(not confirmed|confirmation)/i.test(msg)){
    return 'Please check your email for the verification link, then sign in. If registration did not complete, contact MMGC support.';
  }
  return msg;
}
function normalizePhone(input){
  const raw=String(input||'').trim().replace(/[()\s.-]/g,'');
  const formatted=raw.startsWith('00')?'+'+raw.slice(2):
    raw.startsWith('+')?raw:
    /^\d{8}$/.test(raw)?'+266'+raw:
    /^266\d{8}$/.test(raw)?'+'+raw:'+'+raw;
  if(!/^\+[1-9]\d{7,14}$/.test(formatted))throw new Error('Enter a valid mobile number, for example +266 58 123 456. For Lesotho you can also enter 8 digits.');
  return formatted;
}
function signupUsing(){
  return document.querySelector('input[name="signupIdentityType"]:checked')?.value||'email';
}
function refreshIdentityFields(){
  const byPhone=signupUsing()==='phone';
  $('signupEmailWrap').hidden=byPhone;
  $('signupPhoneWrap').hidden=!byPhone;
  $('optionalContactWrap').hidden=byPhone;
  $('signupEmail').required=!byPhone;
  $('signupEmail').disabled=byPhone;
  $('signupPhone').required=byPhone;
  $('signupPhone').disabled=!byPhone;
}
function accountTypeChanged(){
  const show=$('accountType').value==='company';
  $('companyWrap').hidden=!show;
  $('companyName').required=show;
}

document.querySelectorAll('[data-mode]').forEach(btn=>{
  btn.addEventListener('click',()=>showMode(btn.dataset.mode));
});
document.querySelectorAll('input[name="signupIdentityType"]').forEach(input=>{
  input.addEventListener('change',refreshIdentityFields);
});
$('accountType').addEventListener('change',accountTypeChanged);

$('signupForm').addEventListener('submit',async function(event){
  event.preventDefault();
  if(!this.reportValidity())return;
  const password=$('signupPassword').value;
  if(password.length<8){message('Your password needs at least 8 characters.','error');return;}
  if(password!==$('confirmPassword').value){message('The two passwords do not match.','error');return;}
  let identity;
  try {
    if(signupUsing()==='phone'){
      identity={phone:normalizePhone($('signupPhone').value)};
    } else {
      identity={email:$('signupEmail').value.trim().toLowerCase()};
    }
  }catch(e){message(errorText(e),'error');return;}
  submitBusy('signupForm',true);
  try{
    const options={emailRedirectTo:returnUrl('login')+'&verified=1',data:{
      full_name:$('fullName').value.trim(),
      account_type:$('accountType').value,
      company_name:$('accountType').value==='company'?$('companyName').value.trim():'',
      ...(identity.email?{contact_phone:$('mobile').value.trim()}:{}),
      registration_method:identity.phone?'phone':'email'
    }};
    // The backend controls account confirmation; client code cannot bypass that security setting.
    const {data,error}=await client.auth.signUp({...identity,password,options});
    if(error)throw error;
    if(data?.session && data?.user){
      message('Your account is ready. Opening MMGC…','success');
      location.replace(next);
      return;
    }
    if(identity.email){
      message('Please check your email to verify your account, then return to sign in. If it is not in your inbox, check your spam or junk folder.','success');
    } else {
      message('Your phone registration was received. Please follow any confirmation instructions sent to your phone before signing in.','success');
    }
  }catch(err){message(errorText(err),'error');}
  finally{submitBusy('signupForm',false);}
});

$('loginForm').addEventListener('submit',async function(event){
  event.preventDefault();
  if(!this.reportValidity())return;
  const value=$('loginIdentity').value.trim();
  let identity;
  try{
    identity=value.includes('@')?{email:value.toLowerCase()}:{phone:normalizePhone(value)};
  }catch(err){message(errorText(err),'error');return;}
  submitBusy('loginForm',true);
  try{
    const {data,error}=await client.auth.signInWithPassword({...identity,password:$('loginPassword').value});
    if(error)throw error;
    if(!data?.user||!data?.session)throw new Error('Sign-in was not completed.');
    location.replace(next);
  }catch(err){message(errorText(err),'error');submitBusy('loginForm',false);}
});

$('forgotForm').addEventListener('submit',async function(event){
  event.preventDefault();
  if(!this.reportValidity())return;
  submitBusy('forgotForm',true);
  try{
    const {error}=await client.auth.resetPasswordForEmail($('forgotEmail').value.trim().toLowerCase(),{
      redirectTo:productionOrigin+'/auth.html'
    });
    if(error)throw error;
    message('If the account exists, a reset link will be sent to the email address.','success');
  }catch(err){message(errorText(err),'error');}
  finally{submitBusy('forgotForm',false);}
});

$('resetForm').addEventListener('submit',async function(event){
  event.preventDefault();
  if(!this.reportValidity())return;
  const password=$('resetPassword').value;
  if(password.length<8){message('Choose a password with at least 8 characters.','error');return;}
  submitBusy('resetForm',true);
  try{
    const {data:sessionData}=await client.auth.getSession();
    if(!sessionData?.session)throw new Error('This reset link is expired or invalid. Please request a new reset email.');
    const {error}=await client.auth.updateUser({password});
    if(error)throw error;
    message('Password updated. Continue to your account.','success');
    const link=document.createElement('a');
    link.href='account.html';link.textContent=' Open My Account →';
    $('authMessage').appendChild(link);
  }catch(err){message(errorText(err),'error');}
  finally{submitBusy('resetForm',false);}
});

client.auth.onAuthStateChange(event=>{
  if(event==='PASSWORD_RECOVERY'){
    recoveryReady=true;
    showMode('reset',true);
    message('Recovery link verified. Enter your new password below.','success');
  }
});
async function finishRecoveryLink(){
  if(recoveryError){
    showMode('forgot',true);
    message('The reset link has expired or is invalid. Request a new email and use the newest link.','error');
    history.replaceState(null,'','auth.html?mode=forgot');
    return;
  }
  if(!passwordRecoveryLinkInProgress)return;
  try {
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    if(data?.session){
      recoveryReady=true;
      showMode('reset',true);
      message('Recovery link verified. Choose a new password.','success');
    }else{
      showMode('forgot',true);
      message('Recovery link expired or invalid. Request a new password reset email.','error');
    }
  }catch(_){
    showMode('forgot',true);
    message('Unable to verify this recovery link. Please request another.','error');
  }
  // Do not retain URL tokens in browser history.
  history.replaceState(null,'','auth.html?mode='+(recoveryReady?'reset':'forgot'));
}

refreshIdentityFields();
accountTypeChanged();
showMode(currentMode);
finishRecoveryLink();
if(params.get('verified'))message('You can sign in to your account.','success');
client.auth.getUser().then(({data})=>{
  if(data?.user && currentMode!=='reset' && !passwordRecoveryLinkInProgress)location.replace(next);
}).catch(()=>{});
