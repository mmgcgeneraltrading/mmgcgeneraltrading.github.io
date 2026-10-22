/* Decorative enhancement for MMGC procurement directories.
 * Original directory.js remains responsible for authentic data and links.
 */
document.addEventListener('DOMContentLoaded',function(){
  'use strict';
  const host=document.getElementById('directory-grid');
  if(!host)return;
  const cards=Array.from(host.querySelectorAll('a.directory-card'));
  const svgNS='http://www.w3.org/2000/svg';
  const icons={
    goods:'<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    services:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13c5 3 13 3 18 0"/>',
    works:'<path d="m4 21 8-18 8 18M6 16h12M8 11h8M2 21h20"/>',
    ict:'<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8M12 18v4"/>',
    printing:'<path d="M6 9V2h12v7M6 18H3V9h18v9h-3M6 15h12v7H6zM17 12h1"/>',
    cleaning:'<path d="M8 7h8v15H7V9zM10 3h5v4M15 4h5M20 4v3M19 10h2"/>',
    issuer:'<path d="m2 9 10-6 10 6v2H2zM5 11v9M9 11v9m6-9v9m4-9v9M2 21h20"/>'
  };
  const element=function(tag,cls,txt){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(txt!==undefined)n.textContent=txt;
    return n;
  };
  cards.forEach(function(card){
    const title=card.querySelector('h2')?.textContent||'Procurement category';
    const desc=card.querySelector('p')?.textContent||'Browse MMGC procurement listings.';
    const countText=card.querySelector('span')?.textContent||'0';
    const count=Number(countText.match(/\d+/)?.[0]||0);
    const url=new URL(card.href,location.href);
    const kind=url.searchParams.get('category')||'issuer';
    card.dataset.kind=kind;
    card.dataset.search=(title+' '+desc).toLowerCase();
    const head=element('div','directory-card-header');
    const icon=element('span','directory-card-icon');
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.innerHTML=icons[kind]||icons.issuer;
    icon.appendChild(svg);
    const countBadge=element('span','directory-count'+(count?'':' none'),count===1?'1 listing to check':count+' listings to check');
    head.append(icon,countBadge);
    const heading=element('h2',null,title);
    const description=element('p',null,desc);
    const footer=element('span','directory-card-action');
    footer.append(element('span',null,kind==='issuer'?'View issuer opportunities':'Browse category'));
    const arrow=element('span','arrow','→');
    arrow.setAttribute('aria-hidden','true');
    footer.appendChild(arrow);
    card.replaceChildren(head,heading,description,footer);
  });
  const input=document.getElementById('directory-search');
  const info=document.getElementById('directory-count');
  const empty=document.getElementById('directory-empty');
  function updateSearch(){
    const value=(input?.value||'').trim().toLowerCase();
    let shown=0;
    cards.forEach(function(card){
      const match=(card.dataset.search||'').includes(value);
      card.classList.toggle('is-hidden',!match);
      if(match)shown++;
    });
    if(info)info.textContent=shown+' of '+cards.length+(document.body.dataset.directory==='issuers'?' issuers':' categories')+' shown';
    if(empty)empty.hidden=shown!==0;
  }
  input?.addEventListener('input',updateSearch);
  updateSearch();
});
