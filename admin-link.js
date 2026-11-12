import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
const db=createClient('https://avgudubydtofgoaaukby.supabase.co','sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
async function showLink(){
 try{
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data,error}=await db.rpc('mmgc_is_admin');if(error||data!==true)return;
 const list=document.querySelector('.account-list');if(!list||list.querySelector('[href="admin.html"]'))return;
 const a=document.createElement('a');a.href='admin.html';a.className='account-item';
 const h=document.createElement('h2');h.textContent='🔐 MMGC Admin Dashboard';
 const p=document.createElement('p');p.textContent='Manage published products, customer enquiries, dealer authorizations and quotations.';
 const strong=document.createElement('strong');strong.textContent='Open secured business workspace →';
 a.append(h,p,strong);list.prepend(a);
 }catch(_){/* Never display admin link if role verification fails. */}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',showLink);else showLink();