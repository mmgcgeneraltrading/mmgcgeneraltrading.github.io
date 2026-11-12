/* MMGC unified catalogue: shared, read-only browser search index. */
(function(){
'use strict';
// Published product overrides come from Supabase, with server-enforced RLS.
let publishedOverrides=[];
const routes=[
 {id:'service-procurement',type:'Service',category:'Business Services',name:'Tender preparation & procurement support',description:'BOQ pricing, RFQ preparation, supplier sourcing and tender advice.',url:'tender-support.html',tags:['tender','procurement','boq','rfq','business']},
 {id:'service-drone',type:'Service',category:'Drone Technology',name:'Agricultural drones and inspections',description:'Drone technology enquiries for agriculture, surveying and site inspection, subject to approvals.',url:'drone-services.html',tags:['agricultural','drone','DJI','spraying','survey']},
 {id:'service-security',type:'Service',category:'Smart Security',name:'CCTV cameras and alarm systems',description:'Smart cameras, alarms, sensors, networks and connected security.',url:'smart-security.html',tags:['camera','alarm','cctv','sensor','security']},
 {id:'service-superpay',type:'Project',category:'Payment Technology',name:'SuperPay Gateway demonstration',description:'Proposed payment gateway for M-Pesa and EcoCash. Simulations only, not live payments.',url:'superpay/',tags:['superpay','mpesa','ecocash','merchant','payments','api']},
 {id:'service-tenders',type:'Directory',category:'Opportunities',name:'Tenders and RFQs',description:'Procurement opportunities and tender notices. Verify all deadlines with issuers.',url:'tenders.html',tags:['tender','bids','rfq','contracts','opportunities']},
 {id:'service-jobs',type:'Directory',category:'Opportunities',name:'Jobs and consultancies',description:'Employment and consultancy opportunities with source checks.',url:'jobs.html',tags:['jobs','work','career','opportunities']},
 {id:'service-stationery',type:'Directory',category:'Office Supplies',name:'Stationery and office supplies',description:'Browse school, office and printing-related supplies.',url:'stationery.html',tags:['stationery','office','paper','printer']},
 {id:'service-quotations',type:'Service',category:'MMGC Services',name:'Request a quotation',description:'Send product, supply, project or service requirements for quotation.',url:'index.html#quote',tags:['quote','enquiry','pricing']}
];
function fromPublished(x){
 return {id:x.source_id||x.id,type:'Product',category:x.category||'general-supplies',name:x.name,description:x.description||'',price:x.price_lsl==null?'':'LSL '+Number(x.price_lsl).toFixed(2),unit:'each',tags:[x.supplier||'',x.stock_status||''].filter(Boolean),image:x.image_url||'',url:x.product_url||'catalogue.html?q='+encodeURIComponent(x.name),stock_status:x.stock_status||'enquiry',authorization_status:x.authorization_status||'unverified'};
}
function catalogue(){
 const p=Array.isArray(window.MMGC_PRODUCTS)?window.MMGC_PRODUCTS:[];
 const replacementMap=new Map(publishedOverrides.filter(x=>x.source_id).map(x=>[x.source_id,x]));
 const items=p.map(x=>{
 const override=replacementMap.get(x.id);
 return override?fromPublished(override):{id:String(x.id),type:'Product',category:x.category||'General Supplies',name:x.name||x.id,description:x.description||'',price:x.price||'',unit:x.unit||'',tags:x.tags||[],image:x.image||'',url:x.url||'catalogue.html?q='+encodeURIComponent(x.name||'')};
 });
 const newItems=publishedOverrides.filter(x=>!x.source_id||!p.some(i=>i.id===x.source_id)).map(fromPublished);
 return items.concat(newItems,routes);
}
function matches(query,item){
 const words=String(query||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
 if(!words.length)return true;
 const hay=[item.name,item.description,item.category,item.type,(item.tags||[]).join(' ')].join(' ').toLowerCase();
 return words.every(w=>hay.includes(w));
}
function search(query,limit=50){
 const terms=String(query||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
 return catalogue().filter(x=>matches(query,x)).sort((a,b)=>{
 const score=x=>terms.reduce((n,w)=>n+(x.name.toLowerCase().startsWith(w)?5:0)+(x.name.toLowerCase().includes(w)?3:0)+(String(x.category).toLowerCase().includes(w)?1:0),0);
 return score(b)-score(a)||a.name.localeCompare(b.name);
 }).slice(0,limit);
}
window.MMGC_CATALOGUE={all:catalogue,search,matches,routes,refresh:loadPublished};
async function loadPublished(){
 try{
 const url='https://avgudubydtofgoaaukby.supabase.co/rest/v1/mmgc_admin_products?select=id,source_id,name,category,description,image_url,product_url,price_lsl,stock_status,authorization_status,published,supplier&published=eq.true&limit=1000';
 const anon='sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk';
 const response=await fetch(url,{headers:{apikey:anon,Accept:'application/json'}});
 if(!response.ok)return; // Until schema installation, retain the fully working static catalogue.
 const rows=await response.json();
 if(!Array.isArray(rows))return;
 publishedOverrides=rows.filter(x=>x.published===true);
 window.dispatchEvent(new CustomEvent('mmgc-catalogue-updated',{detail:{published:publishedOverrides.length}}));
 }catch(_){/* Offline or not configured: static catalogue remains available. */}
}
loadPublished();
})();