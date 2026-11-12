import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
const db=createClient('https://avgudubydtofgoaaukby.supabase.co','sb_publishable_AgqMGdhjjLXKJDEFcRLvpQ_hPSlqYBk',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const TABLES={products:'mmgc_admin_products',enquiries:'mmgc_enquiries',suppliers:'mmgc_suppliers',quotes:'mmgc_quotations'};
const data={products:[],enquiries:[],suppliers:[],quotes:[]};let currentTab='overview';let editType=null;let editRecord=null;
const fieldSets={
 products:[
 ['name','Product name','text',true],['source_id','Website catalogue ID','text'],['category','Category','text',true],['description','Description','textarea'],['supplier','Supplier / manufacturer','text'],['image_url','Image HTTPS URL','url'],['product_url','Product details URL','text'],['price_lsl','Confirmed retail price (LSL)','number'],['price_note','Pricing terms / last verified','text'],['stock_status','Stock / sourcing status','select',false,['enquiry','available','preorder','unavailable']],['authorization_status','Dealer authorization','select',false,['unverified','pending','authorized','not_required']],['published','Publish to online catalogue','checkbox']
 ],
 enquiries:[['customer_name','Customer / contact name','text',true],['customer_email','Email address','email'],['customer_phone','Telephone','text'],['subject','Product or service enquiry','text',true],['details','Customer request','textarea'],['source','Source','select',false,['manual','WhatsApp','email','phone','website']],['status','Follow-up status','select',false,['new','contacted','quoted','closed']],['notes','Internal follow-up notes','textarea']],
 suppliers:[['name','Supplier / manufacturer','text',true],['brands','Relevant brands / product lines','text'],['contact_email','Contact email','email'],['contact_person','Contact person','text'],['website','Official website','url'],['authorization_status','Authorization status','select',false,['researching','requested','applied','pending','authorized','declined','expired']],['authorized_territory','Approved territory','text'],['approval_reference','Written authorization reference','text'],['approval_expires_on','Approval expiry date','date'],['approved_price_list_url','Approved pricing / secure file reference','text'],['notes','Internal notes','textarea']],
 quotes:[['quote_number','Quotation number','text',true],['customer_name','Customer name','text',true],['customer_email','Customer email','email'],['customer_phone','Customer phone','text'],['issue_date','Issue date','date',true],['expires_on','Valid until','date'],['currency','Currency','select',false,['LSL','ZAR']],['status','Quotation status','select',false,['draft','sent','accepted','declined','expired']],['items','Quote line items','lines'],['tax','Tax amount (enter only if applicable)','number'],['notes','Quote terms / delivery notes','textarea']]
};
function note(msg,error=false){$('notice').textContent=msg;$('notice').className=error?'error':'';}
function money(num,cur='LSL'){return String(cur)+' '+Number(num||0).toFixed(2);}
function today(){return new Date().toISOString().slice(0,10);}
function textNode(tag,value,className){const el=document.createElement(tag);el.textContent=value??'';if(className)el.className=className;return el;}
function el(tag,cls){const n=document.createElement(tag);if(cls)n.className=cls;return n;}
function status(str){const s=textNode('span',str||'—','status');if(['authorized','published','available','accepted','sent'].includes(str))s.classList.add('live');else if(['requested','pending','applied','preorder'].includes(str))s.classList.add('pending');return s;}
function setGate(message,allowLogin=true){$('gate').hidden=false;$('workspace').hidden=true;$('gate-message').textContent=message;$('signin').hidden=!allowLogin;}
async function boot(){
 try{
 const {data:auth,error:ae}=await db.auth.getUser();
 if(ae||!auth?.user){setGate('Sign in to your MMGC account to request access to the private dashboard.');return;}
 const {data:admin,error:re}=await db.rpc('mmgc_is_admin');
 if(re){setGate('Secure database setup is still required. The admin SQL schema must be installed by the Supabase project owner. No private records are accessible until it is configured.',false);return;}
 if(admin!==true){setGate('This account has no administrator permission. Ask the Supabase project owner to grant your verified user ID access. Registration alone does not grant access.',false);return;}
 $('gate').hidden=true;$('workspace').hidden=false;$('welcome').textContent='Signed in as '+(auth.user.email||'MMGC administrator');
 await loadAll();
 }catch(e){setGate('Could not confirm administrator access: '+String(e.message||e),false);}
}
async function loadAll(){
 note('Loading secured records…');
 const requests=Object.entries(TABLES).map(async ([key,table])=>{
  const {data:rows,error}=await db.from(table).select('*').order('created_at',{ascending:false}).limit(500);
  if(error)throw Error(key+': '+error.message);
  data[key]=rows||[];
 });
 try{await Promise.all(requests);note('Business records loaded. All changes are saved to the secured MMGC database.');render();}catch(e){note('Database error: '+e.message,true);}
}
function setTab(tab){
 currentTab=tab;
 document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
 document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==tab);
 const titles={overview:'Dashboard overview',products:'Product catalogue',enquiries:'Customer enquiries',suppliers:'Supplier authorizations',quotes:'Quotations & sales'};
 $('page-title').textContent=titles[tab];render();
}
function addCell(row,value){const td=el('td');if(value instanceof Node)td.append(value);else td.textContent=String(value??'—');row.append(td);return td;}
function rows(table,records,toRow){const body=$(table+'-rows');body.replaceChildren();if(!records.length){const tr=el('tr');const td=addCell(tr,'No records yet. Add the first record to get started.');td.colSpan=6;body.append(tr);return;}records.forEach(record=>{const tr=el('tr');toRow(tr,record);const edit=el('button');edit.textContent='Edit';edit.type='button';edit.addEventListener('click',()=>openEditor(table,record));addCell(tr,edit);body.append(tr)});}
function render(){
 ['products','enquiries','suppliers','quotes'].forEach(type=>{const v=$('k-'+type);if(v)v.textContent=data[type].length;});
 const filter=($('product-filter')?.value||'').toLowerCase();
 rows('product',data.products.filter(p=>[p.name,p.category,p.supplier].join(' ').toLowerCase().includes(filter)),(tr,r)=>{addCell(tr,r.name);addCell(tr,status(r.stock_status));addCell(tr,r.price_lsl==null?'On request':money(r.price_lsl));addCell(tr,status(r.published?'published':'draft'));});
 rows('enquiry',data.enquiries,(tr,r)=>{addCell(tr,r.customer_name);addCell(tr,r.subject);addCell(tr,r.source);addCell(tr,status(r.status));addCell(tr,new Date(r.created_at).toLocaleDateString());});
 rows('supplier',data.suppliers,(tr,r)=>{addCell(tr,r.name);addCell(tr,r.brands);addCell(tr,status(r.authorization_status));addCell(tr,r.authorized_territory||'Not confirmed');});
 rows('quote',data.quotes,(tr,r)=>{addCell(tr,r.quote_number);addCell(tr,r.customer_name);addCell(tr,money(r.total,r.currency));addCell(tr,status(r.status));const b=el('button');b.textContent='Print';b.type='button';b.addEventListener('click',()=>printQuote(r));addCell(tr,b);});
}
function formField([name,label,type,required=false,values=[]],record){
 const wrap=el('label','field'+(['description','details','notes','items'].includes(name)?' full':''));
 wrap.htmlFor='field-'+name;wrap.append(textNode('span',label));
 let input;
 if(type==='select'){input=el('select');values.forEach(v=>{const op=el('option');op.value=v;op.textContent=v.replace(/_/g,' ');input.append(op)});}
 else if(type==='textarea')input=el('textarea');
 else if(type==='checkbox'){wrap.classList.add('check');input=el('input');input.type='checkbox';}
 else if(type==='lines'){return quoteLines(record);}
 else{input=el('input');input.type=type;if(type==='number'){input.min='0';input.step='0.01';}}
 input.id='field-'+name;input.name=name;input.required=!!required;
 if(type==='checkbox')input.checked=Boolean(record?.[name]);
 else input.value=record?.[name]??(name==='issue_date'?today():name==='stock_status'?'enquiry':name==='authorization_status'?(editType==='products'?'unverified':'requested'):name==='currency'?'LSL':name==='status'?(editType==='enquiries'?'new':'draft'):'');
 wrap.append(input);return wrap;
}
function quoteLines(record){
 const wrap=el('div','quote-lines');wrap.append(textNode('strong','Line items (quantity × unit price)'));
 const lines=el('div');lines.id='quote-lines';
 function addLine(item={}){
  const line=el('div','line');
  const title=el('input');title.placeholder='Item description';title.value=item.description||'';title.dataset.item='description';title.maxLength=250;title.required=true;
  const qty=el('input');qty.type='number';qty.min='0.01';qty.step='0.01';qty.value=item.quantity||1;qty.dataset.item='quantity';qty.required=true;
  const price=el('input');price.type='number';price.min='0';price.step='0.01';price.value=item.unit_price||0;price.dataset.item='unit_price';price.required=true;
  const remove=el('button');remove.type='button';remove.textContent='✕';remove.title='Remove line';remove.onclick=()=>{line.remove();recalc()};
  line.append(title,qty,price,remove);line.addEventListener('input',recalc);lines.append(line);
 }
 function recalc(){
  const subtotal=[...lines.children].reduce((n,line)=>n+Number(line.querySelector('[data-item=quantity]').value||0)*Number(line.querySelector('[data-item=unit_price]').value||0),0);
  const tax=Number(document.querySelector('#field-tax')?.value||0);
  const x=$('quote-estimate');if(x)x.textContent='Estimated total: '+money(subtotal+tax,document.querySelector('#field-currency')?.value||'LSL');
 }
 wrap.append(lines);const add=el('button','outline');add.type='button';add.textContent='+ Add line';add.onclick=()=>addLine();wrap.append(add);const t=el('div','quote-total');t.id='quote-estimate';wrap.append(t);
 (Array.isArray(record?.items)&&record.items.length?record.items:[{}]).forEach(addLine);
 setTimeout(recalc,0);return wrap;
}
function openEditor(type,record=null){
 editType=type;editRecord=record;
 const title={products:'product',enquiries:'enquiry',suppliers:'supplier',quotes:'quotation'}[type];
 $('editor-title').textContent=(record?'Edit ':'New ')+title;
 const box=$('editor-fields');box.replaceChildren();const fields=el('div','fields');fieldSets[type].forEach(spec=>fields.append(formField(spec,record)));box.append(fields);
 if(type==='products'){
 const p=el('p','hint');p.textContent='Published changes will appear in the public digital catalogue only after the secure database connection is activated. Never claim authorization unless evidence is verified.';box.append(p);
 }
 $('remove').hidden=!record;const dialog=$('editor');dialog.showModal();
}
function formData(){
 const raw={};
 for(const [name,,type,required] of fieldSets[editType]){
  if(type==='lines'){raw.items=[...$('quote-lines').children].map(line=>({description:line.querySelector('[data-item=description]').value.trim(),quantity:Number(line.querySelector('[data-item=quantity]').value),unit_price:Number(line.querySelector('[data-item=unit_price]').value)})).filter(x=>x.description);
   if(!raw.items.length)throw Error('Add at least one quotation item.');
   if(raw.items.some(x=>x.quantity<=0||x.unit_price<0||!Number.isFinite(x.quantity+x.unit_price)))throw Error('Enter valid quotation quantities and prices.');
  }else{
   const node=$('field-'+name);let v=type==='checkbox'?node.checked:node.value.trim();
   if(required&&(!String(v).trim()))throw Error('Complete '+name.replaceAll('_',' ')+'.');
   if(type==='number')v=v===''?null:Number(v);
   if(type==='date'&&!v)v=null;
   if(type==='email'&&v&&!/^\S+@\S+\.\S+$/.test(v))throw Error('Enter a valid email.');
   if(type==='url'&&v&&!/^https:\/\//i.test(v))throw Error('Use a full HTTPS URL for '+name+'.');
   raw[name]=v;
  }
 }
 if(editType==='quotes'){
 raw.subtotal=Math.round(raw.items.reduce((sum,x)=>sum+x.quantity*x.unit_price,0)*100)/100;
 raw.tax=Number(raw.tax||0);raw.total=Math.round((raw.subtotal+raw.tax)*100)/100;
 }
 if(editType==='products'&&raw.published){
 if(raw.authorization_status==='authorized'&&!raw.supplier)throw Error('Provide supplier information before claiming an authorized product.');
 if(raw.price_lsl!==null&&!raw.price_note)throw Error('Provide pricing verification/terms before publishing an actual price.');
 }
 return raw;
}
async function saveRecord(event){
 event.preventDefault();
 const save=$('save');save.disabled=true;save.textContent='Saving…';
 try{
 const record=formData(),table=TABLES[editType];
 const query=editRecord?db.from(table).update(record).eq('id',editRecord.id):db.from(table).insert(record);
 const {error}=await query.select('id').single();if(error)throw error;
 $('editor').close();note('Record saved successfully.');await loadAll();
 }catch(e){note('Save failed: '+e.message,true);}
 finally{save.disabled=false;save.textContent='Save record';}
}
async function deleteRecord(){
 if(!editRecord||!confirm('Delete this record permanently? This cannot be undone.'))return;
 try{const {error}=await db.from(TABLES[editType]).delete().eq('id',editRecord.id);if(error)throw error;$('editor').close();note('Record deleted.');await loadAll();}catch(e){note('Delete failed: '+e.message,true);}
}
function importFromCatalogue(){
 const id=$('catalogue-import').value;const item=(window.MMGC_PRODUCTS||[]).find(x=>x.id===id);
 if(!item){note('Select an existing product first.',true);return;}
 const exists=data.products.find(x=>x.source_id===item.id);if(exists){openEditor('products',exists);return;}
 openEditor('products',{name:item.name,source_id:item.id,category:item.category,description:item.description,supplier:'',image_url:item.image||'',product_url:item.url||'',price_lsl:null,price_note:'',stock_status:'enquiry',authorization_status:'unverified',published:false});
 // Imported items are unsaved drafts; the operator must explicitly save and publish.
 editRecord=null;$('remove').hidden=true;
}
function printQuote(q){
 const w=window.open('','_blank');if(!w){note('Allow pop-ups to print the quotation.',true);return;}
 const safe=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const lines=(q.items||[]).map(x=>'<tr><td>'+safe(x.description)+'</td><td>'+safe(x.quantity)+'</td><td>'+safe(money(x.unit_price,q.currency))+'</td><td>'+safe(money(x.quantity*x.unit_price,q.currency))+'</td></tr>').join('');
 const html='<html><head><title>'+safe(q.quote_number)+'</title><style>body{font:14px Arial;margin:42px;color:#173348}h1{color:#0a7058}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{border:1px solid #d6e3e6;padding:10px;text-align:left}.totals{text-align:right;font-size:17px}small{color:#697d86}@media print{button{display:none}}</style></head><body><h1>MMGC GENERAL TRADING</h1><p>Maseru, Lesotho · +266 5831 1808 · mmgcgeneraltrading@gmail.com</p><hr><h2>QUOTATION '+safe(q.quote_number)+'</h2><p><b>Customer:</b> '+safe(q.customer_name)+'<br><b>Issue date:</b> '+safe(q.issue_date)+'<br><b>Valid until:</b> '+safe(q.expires_on||'As agreed')+'</p><table><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>'+lines+'</tbody></table><p class="totals">Subtotal: '+safe(money(q.subtotal,q.currency))+'<br>Tax (if applicable): '+safe(money(q.tax,q.currency))+'<br><strong>Total: '+safe(money(q.total,q.currency))+'</strong></p><p>'+safe(q.notes||'Prices and availability subject to written confirmation.')+'</p><small>Prepared by MMGC General Trading. This document does not establish manufacturer authorization.</small><p><button onclick="window.print()">Print / Save PDF</button></p></body></html>';
 w.document.write(html);w.document.close();w.focus();
}
function wire(){
 document.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>setTab(x.dataset.tab));
 document.querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>setTab(x.dataset.go));
 ['product','enquiry','supplier','quote'].forEach(name=>{$('new-'+name).onclick=()=>openEditor(({product:'products',enquiry:'enquiries',supplier:'suppliers',quote:'quotes'})[name])});
 $('refresh').onclick=loadAll;$('product-filter').oninput=render;$('import-product').onclick=importFromCatalogue;
 const select=$('catalogue-import');(window.MMGC_PRODUCTS||[]).forEach(p=>{const o=el('option');o.value=p.id;o.textContent=p.name;select.append(o)});
 $('record-form').onsubmit=saveRecord;$('cancel').onclick=()=>$('editor').close();$('remove').onclick=deleteRecord;
 $('logout').onclick=async()=>{await db.auth.signOut();location.replace('auth.html?mode=login&next=admin.html')};
}
wire();boot();
