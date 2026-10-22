/* MMGC SHOP POS — shop-scoped client; privileged operations validated server-side. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const db=window.MMGC_AUTH_CLIENT;
const state={user:null,shops:[],memberships:[],shop:null,role:null,products:[],sales:[],cart:new Map(),stats:null,tab:'checkout',staff:[]};
const money=n=>'M'+(Number(n)||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Maseru',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
const okay=()=>state.role==='owner'||state.role==='manager';
let toastTimer;
function flash(msg,error=false){
 const el=$('toast');el.textContent=msg;el.classList.toggle('error',!!error);el.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,6000);
}
function setBusy(button,busy,label){button.disabled=busy;if(busy){button.dataset.oldText=button.textContent;button.textContent=label||'Saving…';}else{button.textContent=button.dataset.oldText||button.textContent;}}
function messageError(error){flash(error?.message||String(error)||'Operation failed',true);}
function showMode(mode){
 $('posLoading').hidden=true;
 $('posOnboarding').hidden=mode!=='onboard';
 $('posWorkbench').hidden=mode!=='shop';
 if(mode==='onboard'&&state.shops.length&&!document.getElementById('backToShop')){
  const b=document.createElement('button');b.id='backToShop';b.type='button';b.className='pos-button white';b.style.marginTop='16px';b.textContent='← Back to existing shop';
  b.addEventListener('click',()=>showMode('shop'));$('shopForm').parentElement.appendChild(b);
 }
}
async function loadShops(prefer){
 const [s,m]=await Promise.all([
  db.from('pos_shops').select('id,name,phone,address,created_by,created_at').order('created_at',{ascending:false}),
  db.from('pos_memberships').select('shop_id,role')
 ]);
 if(s.error)throw s.error;if(m.error)throw m.error;
 state.shops=s.data||[];state.memberships=m.data||[];
 if(!state.shops.length){state.shop=null;showMode('onboard');return;}
 const stored=prefer||localStorage.getItem('mmgc-pos-selected-shop');
 state.shop=state.shops.find(x=>x.id===stored)||state.shops[0];
 $('shopSelect').innerHTML=state.shops.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
 $('shopSelect').value=state.shop.id;
 showMode('shop');
 await activateShop();
}
async function activateShop(){
 if(!state.shop)return;
 state.role=state.memberships.find(m=>m.shop_id===state.shop.id)?.role||'cashier';
 localStorage.setItem('mmgc-pos-selected-shop',state.shop.id);
 $('shopRole').textContent=state.role.charAt(0).toUpperCase()+state.role.slice(1)+' access';
 $('shopMeta').textContent=(state.shop.address||'Lesotho')+(state.shop.phone?' · '+state.shop.phone:'');
 state.cart.clear();
 document.querySelector('[data-tab="team"]').hidden=false;
 $('addProduct').hidden=!okay();
 $('staffForm').reset();
 $('teamOwner').hidden=state.role!=='owner';
 $('teamNoOwner').hidden=state.role==='owner';
 setTab('checkout');
 await refresh();
}
async function refresh(){
 if(!state.shop)return;
 try{
  const id=state.shop.id;
  const [p,s,k]=await Promise.all([
   db.from('pos_products').select('id,shop_id,sku,name,category,unit,price,quantity,reorder_level,active').eq('shop_id',id).order('name',{ascending:true}),
   db.from('pos_sales').select('id,receipt_number,shop_id,created_at,method,payment_reference,customer_name,total,amount_received,change_amount').eq('shop_id',id).order('created_at',{ascending:false}).limit(300),
   db.rpc('pos_dashboard',{p_shop_id:id})
  ]);
  if(p.error)throw p.error;if(s.error)throw s.error;if(k.error)throw k.error;
  if(state.shop?.id!==id)return;
  state.products=p.data||[];state.sales=s.data||[];state.stats=k.data||{};
  renderAll();
 }catch(e){messageError(e);}
}
function renderAll(){
 const st=state.stats||{};
 $('statRevenue').textContent=money(st.today_revenue);
 $('statTransactions').textContent=String(st.today_transactions||0);
 $('statProducts').textContent=String(st.active_products||0);
 $('statLowStock').textContent=String(st.low_stock||0);
 renderProducts();renderInventory();renderCart();renderSales();renderReports();
}
function setTab(tab){
 state.tab=tab;
 document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==tab);
 document.querySelectorAll('[data-tab]').forEach(x=>{x.classList.toggle('active',x.dataset.tab===tab);x.setAttribute('aria-pressed',x.dataset.tab===tab?'true':'false');});
 if(tab==='team'&&state.role==='owner')loadStaff();
}
function renderProducts(){
 const cats=[...new Set(state.products.filter(p=>p.active).map(p=>p.category||'General'))].sort();
 const selected=$('categoryFilter').value;
 $('categoryFilter').innerHTML='<option value="">All categories</option>'+cats.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 $('categoryFilter').value=cats.includes(selected)?selected:'';
 const term=$('productSearch').value.toLowerCase().trim(),category=$('categoryFilter').value;
 const displayed=state.products.filter(p=>p.active&&(!term||[p.name,p.sku,p.category].some(x=>String(x||'').toLowerCase().includes(term)))&&(!category||p.category===category));
 $('productCards').innerHTML=displayed.length?displayed.map(p=>{
  const inCart=state.cart.get(p.id)||0,remaining=p.quantity-inCart;
  return '<button class="pos-product" type="button" data-add="'+esc(p.id)+'" '+(remaining<=0?'disabled':'')+'><strong>'+esc(p.name)+'</strong><small>'+esc(p.category||'General')+(p.sku?' · '+esc(p.sku):'')+'</small><small>'+esc(p.quantity)+' '+esc(p.unit)+' in stock'+(inCart?' · '+inCart+' in basket':'')+'</small><span class="price">'+money(p.price)+'</span></button>';
 }).join(''):'<p class="pos-empty" style="grid-column:1/-1">No available products. Add your first product under Products & Stock.</p>';
}
function add(id){
 const p=state.products.find(p=>p.id===id&&p.active);if(!p)return;
 const n=state.cart.get(id)||0;if(n>=p.quantity){flash('No more stock available for '+p.name,true);return;}
 state.cart.set(id,n+1);renderCart();renderProducts();
}
function cartDetails(){
 const lines=[...state.cart].map(([id,qty])=>({p:state.products.find(p=>p.id===id),qty})).filter(x=>x.p&&x.qty>0);
 const total=Math.round(lines.reduce((sum,x)=>sum+Number(x.p.price)*x.qty,0)*100)/100;
 return {lines,total,count:lines.reduce((sum,x)=>sum+x.qty,0)};
}
function renderCart(){
 const c=cartDetails();
 $('cartRows').innerHTML=c.lines.length?c.lines.map(({p,qty})=>
  '<div class="cart-row"><div><strong>'+esc(p.name)+'</strong><small>'+money(p.price)+' / '+esc(p.unit)+'</small></div>'+
  '<div class="counter"><button type="button" data-less="'+esc(p.id)+'" aria-label="Remove one">−</button><b>'+qty+'</b><button type="button" data-more="'+esc(p.id)+'" aria-label="Add one" '+(qty>=p.quantity?'disabled':'')+'>+</button></div>'+
  '<span class="cart-total">'+money(Number(p.price)*qty)+'</span></div>'
 ).join(''):'<p class="pos-muted" style="padding:18px 0">Your basket is empty.</p>';
 $('cartTotal').textContent=money(c.total);$('cartCount').textContent=String(c.count);
 const cash=$('paymentMethod').value==='cash';
 $('receivedWrap').hidden=!cash;
 $('cashChangeRow').hidden=!cash||!c.lines.length;
 const paid=Number($('amountReceived').value);
 $('cashChange').textContent=money(Math.max(0,paid-c.total));
 $('checkoutButton').disabled=!c.lines.length||(cash&&(!Number.isFinite(paid)||paid<c.total));
}
function renderInventory(){
 const search=$('inventorySearch').value.toLowerCase().trim();
 const products=state.products.filter(p=>[p.name,p.sku,p.category].some(v=>String(v||'').toLowerCase().includes(search)));
 $('inventoryRows').innerHTML=products.map(p=>
  '<tr><td><b>'+esc(p.name)+'</b><div class="pos-muted">'+esc(p.sku||'No SKU')+' · '+esc(p.unit)+'</div></td>'+
  '<td>'+esc(p.category)+'</td><td>'+money(p.price)+'</td><td class="'+(p.quantity<=p.reorder_level?'pos-bad':'pos-good')+'">'+p.quantity+'</td><td>'+p.reorder_level+'</td><td>'+(p.active?'Active':'Inactive')+'</td>'+
  '<td>'+(okay()?'<button class="pos-button white small" type="button" data-edit="'+esc(p.id)+'">Edit</button>':'View only')+'</td></tr>'
 ).join('')||'<tr><td colspan="7">No products found.</td></tr>';
}
function renderSales(){
 $('salesRows').innerHTML=state.sales.map(s=>
  '<tr><td><b>#'+s.receipt_number+'</b></td><td>'+esc(date(s.created_at))+'</td><td>'+esc(s.method.toUpperCase())+'</td><td>'+esc(s.customer_name||'Walk-in')+'</td><td><b>'+money(s.total)+'</b></td>'+
  '<td><button class="pos-button white small" type="button" data-receipt="'+esc(s.id)+'">Print receipt</button></td></tr>'
 ).join('')||'<tr><td colspan="6">No sales yet. Use Checkout to record a sale.</td></tr>';
}
function renderReports(){
 const st=state.stats||{};
 const methods={};state.sales.forEach(s=>{const k=s.method;methods[k]??={amount:0,count:0};methods[k].amount+=Number(s.total);methods[k].count++;});
 $('reportContent').innerHTML=
  '<div class="pos-stats" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-top:16px"><div class="pos-stat"><span>LAST 30 DAYS REVENUE</span><b>'+money(st.last_30d_revenue)+'</b></div><div class="pos-stat"><span>LAST 30 DAYS TRANSACTIONS</span><b>'+esc(st.last_30d_transactions||0)+'</b></div></div>'+
  '<h3>Payment mix in the latest 300 sales</h3><div class="pos-tablewrap"><table class="pos-table"><thead><tr><th>Method</th><th>Transactions</th><th>Total</th></tr></thead><tbody>'+
  (Object.keys(methods).length?Object.keys(methods).sort().map(k=>'<tr><td>'+esc(k.toUpperCase())+'</td><td>'+methods[k].count+'</td><td>'+money(methods[k].amount)+'</td></tr>').join(''):'<tr><td colspan="3">No transactions recorded</td></tr>')+
  '</tbody></table></div><p class="pos-muted">Totals are sales recorded in this system, not independently verified bank receipts or accounting statements. Refunds and tax configuration are not included in this version.</p>';
}
function openProduct(id){
 if(!okay()){flash('Only owners and managers can edit products',true);return;}
 const p=id?state.products.find(x=>x.id===id):null;
 const f=$('productForm');f.reset();
 f.elements.namedItem('id').value=p?.id||'';
 f.elements.namedItem('name').value=p?.name||'';
 f.elements.namedItem('sku').value=p?.sku||'';
 f.elements.namedItem('category').value=p?.category||'General';
 f.elements.namedItem('unit').value=p?.unit||'each';
 f.elements.namedItem('price').value=p?.price??'';
 f.elements.namedItem('quantity').value=p?.quantity??0;
 f.elements.namedItem('reorder_level').value=p?.reorder_level??5;
 f.elements.namedItem('active').checked=p?p.active:true;
 $('productDialogHeading').textContent=p?'Edit Product & Stock':'Add Product';
 $('productDialog').showModal();
}
async function saveProduct(ev){
 ev.preventDefault();if(!okay())return;
 const f=ev.currentTarget,button=f.querySelector('[type=submit]');
 const id=f.elements.namedItem('id').value;
 const sku=f.elements.namedItem('sku').value.trim()||null;
 const product={
  name:f.elements.namedItem('name').value.trim(),sku,
  category:f.elements.namedItem('category').value.trim()||'General',
  unit:f.elements.namedItem('unit').value,price:Number(f.elements.namedItem('price').value),
  quantity:Number(f.elements.namedItem('quantity').value),
  reorder_level:Number(f.elements.namedItem('reorder_level').value),
  active:f.elements.namedItem('active').checked
 };
 if(!product.name||!Number.isFinite(product.price)||product.price<0||!Number.isInteger(product.quantity)||product.quantity<0||!Number.isInteger(product.reorder_level)||product.reorder_level<0){flash('Check product details and quantities',true);return;}
 setBusy(button,true);
 try{
  const res=id
   ?await db.from('pos_products').update(product).eq('id',id).eq('shop_id',state.shop.id)
   :await db.from('pos_products').insert({...product,shop_id:state.shop.id});
  if(res.error)throw res.error;
  $('productDialog').close();flash(id?'Product updated':'Product created');
  await refresh();
 }catch(e){messageError(e);}
 finally{setBusy(button,false);}
}
async function checkout(){
 const {lines,total}=cartDetails();if(!lines.length)return;
 if(lines.some(x=>x.qty>x.p.quantity)){flash('Stock changed. Review your basket.',true);return;}
 const method=$('paymentMethod').value,received=method==='cash'?Number($('amountReceived').value):total;
 if(method==='cash'&&(!Number.isFinite(received)||received<total)){flash('Cash received must cover the sale total',true);return;}
 if(method!=='cash'&&!confirm('Have you independently confirmed the '+method.toUpperCase()+' payment was received?'))return;
 const btn=$('checkoutButton');setBusy(btn,true,'Recording sale…');
 try{
  const {data,error}=await db.rpc('pos_checkout',{
   p_shop_id:state.shop.id,
   p_items:lines.map(x=>({product_id:x.p.id,quantity:x.qty})),
   p_method:method,p_received:received,
   p_customer_name:$('customerName').value.trim(),
   p_payment_reference:$('paymentReference').value.trim()
  });
  if(error)throw error;
  state.cart.clear();$('customerName').value='';$('amountReceived').value='';$('paymentReference').value='';
  flash('Sale #'+data.receipt_number+' recorded successfully');
  await refresh();
  await printReceipt(data.sale_id);
 }catch(e){messageError(e);}
 finally{setBusy(btn,false);renderCart();}
}
async function printReceipt(id){
 try{
  const sale=state.sales.find(s=>s.id===id);
  if(!sale)throw new Error('Receipt not found. Refresh sales.');
  const {data:items,error}=await db.from('pos_sale_items').select('product_name,quantity,unit_price,line_total').eq('shop_id',state.shop.id).eq('sale_id',id).order('product_name');
  if(error)throw error;
  const shop=state.shop;
  $('receipt').innerHTML=
   '<div class="r-center"><img src="assets/mmgc-logo.png" alt="MMGC" style="height:52px"><h2>'+esc(shop.name)+'</h2>'+
   '<div>'+esc(shop.address||'Lesotho')+'</div><div>'+esc(shop.phone||'')+'</div><div>Powered by MMGC Shop POS</div></div><hr>'+
   '<div>Receipt: #'+esc(sale.receipt_number)+'</div><div>Date: '+esc(date(sale.created_at))+'</div><div>Customer: '+esc(sale.customer_name||'Walk-in')+'</div><hr>'+
   '<table><thead><tr><th>Item / Qty</th><th>Amount</th></tr></thead><tbody>'+
   (items||[]).map(i=>'<tr><td>'+esc(i.product_name)+'<br>'+esc(i.quantity)+' × '+money(i.unit_price)+'</td><td>'+money(i.line_total)+'</td></tr>').join('')+
   '</tbody></table><hr><div><b>Total: '+money(sale.total)+'</b></div><div>Paid by: '+esc(sale.method.toUpperCase())+'</div>'+
   (sale.payment_reference?'<div>Reference: '+esc(sale.payment_reference)+'</div>':'')+
   '<div>Received: '+money(sale.amount_received)+'</div><div>Change: '+money(sale.change_amount)+'</div><hr>'+
   '<div class="r-center">Thank you for shopping with us!</div><div class="r-center">Receipt generated by MMGC General Trading</div>';
  window.print();
 }catch(e){messageError(e);}
}
function csvDownload(rows,filename){
 const clean=value=>{
  let v=String(value??'').replace(/\r?\n/g,' ');
  if(/^[\s]*[=+\-@]/.test(v))v="'"+v;
  return '"'+v.replace(/"/g,'""')+'"';
 };
 const text=rows.map(row=>row.map(clean).join(',')).join('\r\n');
 const blob=new Blob(['\uFEFF'+text],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function loadStaff(){
 try{
  const {data,error}=await db.rpc('pos_list_staff',{p_shop_id:state.shop.id});
  if(error)throw error;
  state.staff=data||[];
  $('staffRows').innerHTML=state.staff.map(s=>
   '<tr><td>'+esc(s.email)+'</td><td>'+esc(s.role)+'</td><td>'+(s.role!=='owner'?'<button class="pos-button danger small" data-remove-user="'+esc(s.user_id)+'" type="button">Remove</button>':'Shop owner')+'</td></tr>'
  ).join('')||'<tr><td colspan="3">No staff added</td></tr>';
 }catch(e){messageError(e);}
}
async function staffSubmit(event){
 event.preventDefault();if(state.role!=='owner')return;
 const f=event.currentTarget,btn=f.querySelector('[type=submit]');
 setBusy(btn,true);
 try{
  const {error}=await db.rpc('pos_add_staff',{p_shop_id:state.shop.id,p_email:f.elements.namedItem('email').value.trim(),p_role:f.elements.namedItem('role').value});
  if(error)throw error;f.reset();flash('Staff access updated');await loadStaff();
 }catch(e){messageError(e);}
 finally{setBusy(btn,false);}
}
async function removeStaff(id){
 if(!confirm('Remove this member from the shop?'))return;
 try{const {error}=await db.rpc('pos_remove_staff',{p_shop_id:state.shop.id,p_user_id:id});if(error)throw error;flash('Staff member removed');await loadStaff();}
 catch(e){messageError(e);}
}
async function createShop(event){
 event.preventDefault();const f=event.currentTarget,button=f.querySelector('[type=submit]');
 setBusy(button,true,'Creating shop…');
 try{
  const {data,error}=await db.rpc('pos_create_shop',{p_name:f.elements.namedItem('name').value.trim(),p_phone:f.elements.namedItem('phone').value.trim(),p_address:f.elements.namedItem('address').value.trim()});
  if(error)throw error;
  f.reset();flash('Shop created. Add products to start selling.');
  await loadShops(data);
  setTab('inventory');openProduct(null);
 }catch(e){messageError(e);}
 finally{setBusy(button,false);}
}
function bind(){
 $('shopForm').addEventListener('submit',createShop);
 $('shopSelect').addEventListener('change',async e=>{state.shop=state.shops.find(s=>s.id===e.target.value);await activateShop();});
 $('newShop').addEventListener('click',()=>showMode('onboard'));
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
 $('productSearch').addEventListener('input',renderProducts);
 $('categoryFilter').addEventListener('change',renderProducts);
 $('inventorySearch').addEventListener('input',renderInventory);
 $('productSearch').addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  e.preventDefault();
  const search=e.currentTarget.value.trim().toLowerCase();
  const matches=state.products.filter(p=>p.active&&p.quantity>(state.cart.get(p.id)||0)&&String(p.sku||'').toLowerCase()===search);
  if(matches.length===1){add(matches[0].id);e.currentTarget.select();}
 });
 $('productCards').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)add(b.dataset.add);});
 $('cartRows').addEventListener('click',e=>{
  const b=e.target.closest('[data-less],[data-more]');if(!b)return;
  const id=b.dataset.less||b.dataset.more;
  if(b.dataset.more)add(id);
  else{const n=(state.cart.get(id)||0)-1;if(n<=0)state.cart.delete(id);else state.cart.set(id,n);renderCart();renderProducts();}
 });
 $('clearCart').addEventListener('click',()=>{state.cart.clear();renderCart();renderProducts();});
 $('paymentMethod').addEventListener('change',renderCart);$('amountReceived').addEventListener('input',renderCart);
 $('checkoutButton').addEventListener('click',checkout);
 $('addProduct').addEventListener('click',()=>openProduct(null));
 $('inventoryRows').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)openProduct(b.dataset.edit);});
 $('productForm').addEventListener('submit',saveProduct);
 $('cancelProduct').addEventListener('click',()=>$('productDialog').close());
 $('refreshSales').addEventListener('click',refresh);
 $('salesRows').addEventListener('click',e=>{const b=e.target.closest('[data-receipt]');if(b)printReceipt(b.dataset.receipt);});
 $('exportStock').addEventListener('click',()=>csvDownload([['Product','SKU','Category','Unit','Selling price (M)','Quantity','Low stock threshold','Active'],...state.products.map(p=>[p.name,p.sku,p.category,p.unit,p.price,p.quantity,p.reorder_level,p.active])],'mmgc-pos-stock.csv'));
 $('exportSales').addEventListener('click',()=>csvDownload([['Receipt','Date Lesotho','Payment method','Customer','Payment reference','Total (M)','Received (M)','Change (M)'],...state.sales.map(s=>[s.receipt_number,date(s.created_at),s.method,s.customer_name,s.payment_reference,s.total,s.amount_received,s.change_amount])],'mmgc-pos-sales-last-300.csv'));
 $('staffForm').addEventListener('submit',staffSubmit);
 $('staffRows').addEventListener('click',e=>{const b=e.target.closest('[data-remove-user]');if(b)removeStaff(b.dataset.removeUser);});
}
async function init(){
 if(!db){$('posLoading').textContent='POS login connection unavailable. Reload the page.';return;}
 bind();
 try{
  const {data,error}=await db.auth.getUser();
  if(error)throw error;
  if(!data?.user){location.href='auth.html?mode=login&next='+encodeURIComponent('/pos.html');return;}
  state.user=data.user;
  await loadShops();
 }catch(e){$('posLoading').textContent='Unable to load the POS. Check your internet connection and reload.';messageError(e);}
}
init();
})();