/* MMGC POS daily closeout — read only; uses existing authenticated Supabase shop-scoped records. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const db = window.MMGC_AUTH_CLIENT;
  const money = value => 'M' + (Number(value) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const dateLocal = value => new Intl.DateTimeFormat('en-ZA', { timeZone:'Africa/Maseru', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(value));
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone:'Africa/Maseru', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
  const state = { sales:[],shopId:null,day:null,busy:false,complete:false };
  const setStatus = (message, error=false) => { $('status').textContent=message; $('status').classList.toggle('error',error); };
  const setOutputEnabled = enabled => { $('export').disabled=!enabled; $('print').disabled=!enabled; };
  const sum = values => Math.round(values.reduce((total,value)=>total+Number(value||0),0)*100)/100;

  function reset() {
    state.sales=[];state.complete=false;setOutputEnabled(false);
    $('total').textContent=money(0);$('count').textContent='0';$('cash').textContent=money(0);$('missing').textContent='0';
    $('methods').innerHTML='<tr><td colspan="3">No data loaded</td></tr>';
    $('rows').innerHTML='<tr><td colspan="6">No data loaded</td></tr>';
    $('expected').textContent=money(0);$('difference').textContent='—';
    $('salesNote').textContent='Select a date and refresh.';
  }

  function getBounds(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Select a valid business date.');
    const start = new Date(day + 'T00:00:00+02:00');
    if (!Number.isFinite(start.valueOf()) || new Intl.DateTimeFormat('sv-SE',{timeZone:'Africa/Maseru'}).format(start)!==day) {
      throw Error('Invalid business date.');
    }
    return [start.toISOString(), new Date(start.valueOf()+86400000).toISOString()];
  }

  function cashCount() {
    const cash = sum(state.sales.filter(x=>x.method==='cash').map(x=>x.total));
    $('expected').textContent = money(cash);
    const raw=$('counted').value.trim();
    const box=$('difference');
    if (!raw || !Number.isFinite(Number(raw)) || Number(raw)<0) {
      box.textContent='—';box.removeAttribute('data-state');return;
    }
    const difference = Math.round((Number(raw)-cash)*100)/100;
    box.textContent=(difference>0?'+':'')+money(difference);
    box.dataset.state=difference<0?'short':difference>0?'over':'even';
  }

  function render() {
    const sales=state.sales;
    const grouped=new Map();
    for(const sale of sales) {
      const method=String(sale.method||'unknown').toLowerCase();
      if(!grouped.has(method)) grouped.set(method,{count:0,total:0});
      const item=grouped.get(method);item.count++;item.total+=Number(sale.total)||0;
    }
    const cash = sum(sales.filter(x=>x.method==='cash').map(x=>x.total));
    $('total').textContent = money(sum(sales.map(x=>x.total)));
    $('count').textContent = String(sales.length);
    $('cash').textContent = money(cash);
    $('missing').textContent = String(sales.filter(x=>x.method!=='cash' && !String(x.payment_reference||'').trim()).length);
    $('methods').innerHTML = [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([method,info]) =>
      '<tr><td>'+esc(method.toUpperCase())+'</td><td>'+info.count+'</td><td>'+money(info.total)+'</td></tr>'
    ).join('') || '<tr><td colspan="3">No sales recorded on this date</td></tr>';
    $('rows').innerHTML = sales.map(s =>
      '<tr><td>'+esc(s.receipt_number)+'</td><td>'+esc(dateLocal(s.created_at))+'</td><td>'+esc(String(s.method||'').toUpperCase())+
      '</td><td>'+esc(s.customer_name||'Walk-in')+'</td><td>'+esc(s.payment_reference||'—')+'</td><td>'+money(s.total)+'</td></tr>'
    ).join('') || '<tr><td colspan="6">No sales found for the selected date</td></tr>';
    $('salesNote').textContent = 'Read-only results for ' + state.day + ', timezone Africa/Maseru. Includes all rows retrieved for this shop and date.';
    cashCount();
    state.complete=true;setOutputEnabled(true);
  }

  async function load() {
    if(state.busy)return;
    const shopId=$('shop').value,day=$('day').value;
    if(!shopId){setStatus('Select an authorised shop.',true);return;}
    let bounds;
    try{bounds=getBounds(day);}catch(error){setStatus(error.message,true);return;}
    state.busy=true;$('load').disabled=true;reset();$('counted').value='';
    setStatus('Reading sales; no orders or stock will be modified…');
    try {
      const sales=[];
      for(let offset=0;offset<10000;offset+=500) {
        const {data,error}=await db.from('pos_sales')
          .select('id,receipt_number,created_at,method,payment_reference,customer_name,total,amount_received,change_amount')
          .eq('shop_id',shopId).gte('created_at',bounds[0]).lt('created_at',bounds[1])
          .order('created_at',{ascending:true}).range(offset,offset+499);
        if(error)throw error;
        sales.push(...(data||[]));
        if(!data||data.length<500)break;
        if(offset+500>=10000)throw Error('More than 10,000 records may exist for the selected date. Export from the database with an administrator rather than use an incomplete closeout.');
      }
      if($('shop').value!==shopId || $('day').value!==day) throw Error('Shop or date changed while loading. Please review again.');
      state.shopId=shopId;state.day=day;state.sales=sales;
      render();setStatus('Complete: '+sales.length+' recorded sale(s), read only.');
    }catch(error){reset();setStatus('Could not load a complete closeout: '+(error?.message||String(error)),true);}
    finally{state.busy=false;$('load').disabled=false;}
  }

  function safeCell(value) {
    let text=String(value??'').replace(/\r?\n/g,' ');
    if(/^\s*[=+\-@]/.test(text)) text="'"+text; // Spreadsheet formula injection guard.
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function exportCSV() {
    if(!state.complete)return;
    const rows=[
      ['MMGC Shop POS — daily closeout'],
      ['Business date',state.day],
      ['Shop', $('shop').selectedOptions[0]?.textContent||''],
      ['Currency','LSL'],[],
      ['Receipt','Date/time (SAST)','Payment method','Customer','Payment reference','Sale total (LSL)','Amount received (LSL)','Change (LSL)'],
      ...state.sales.map(s=>[s.receipt_number,new Intl.DateTimeFormat('sv-SE',{timeZone:'Africa/Maseru',dateStyle:'short',timeStyle:'short'}).format(new Date(s.created_at)),s.method,s.customer_name,s.payment_reference,s.total,s.amount_received,s.change_amount]),
      [],['Recorded total',sum(state.sales.map(s=>s.total))],
      ['Recorded cash sales',sum(state.sales.filter(s=>s.method==='cash').map(s=>s.total))],
      ['Note','Recorded transactions only; not proof of bank, mobile money or cash settlement.']
    ];
    const text='\uFEFF'+rows.map(row=>row.map(safeCell).join(',')).join('\r\n');
    const blob=new Blob([text],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mmgc-pos-closeout-'+state.day+'.csv';document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function init(){
    if(!db){setStatus('POS login connection unavailable. Reload the page.',true);return;}
    $('day').value=today();
    $('load').addEventListener('click',load);
    $('export').addEventListener('click',exportCSV);
    $('print').addEventListener('click',()=>{if(state.complete)window.print();});
    $('counted').addEventListener('input',cashCount);
    $('shop').addEventListener('change',()=>{reset();setStatus('Shop changed. Review date to load data.');});
    $('day').addEventListener('change',()=>{reset();setStatus('Date changed. Review date to load data.');});
    try{
      const {data:userData,error:userError}=await db.auth.getUser();
      if(userError)throw userError;
      if(!userData?.user){location.replace('auth.html?mode=login&next='+encodeURIComponent('/pos-closeout.html'));return;}
      const [shops,members] = await Promise.all([
        db.from('pos_shops').select('id,name').order('name'),
        db.from('pos_memberships').select('shop_id,role')
      ]);
      if(shops.error)throw shops.error;if(members.error)throw members.error;
      const allowed = new Set((members.data||[]).map(m=>m.shop_id));
      const visible=(shops.data||[]).filter(shop=>allowed.has(shop.id));
      if(!visible.length){setStatus('No shop membership available for this account. Set up a shop in the POS first.',true);return;}
      $('shop').innerHTML=visible.map(shop=>'<option value="'+esc(shop.id)+'">'+esc(shop.name)+'</option>').join('');
      $('shop').disabled=false;const current=localStorage.getItem('mmgc-pos-selected-shop');
      if(visible.some(shop=>shop.id===current)) $('shop').value=current;
      await load();
    }catch(error){reset();setStatus('Could not verify POS access: '+(error?.message||String(error)),true);}
  }
  init();
})();