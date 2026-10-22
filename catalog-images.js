/* MMGC catalogue illustration engine.
 * Every product has an image. An OFFICIAL image is displayed only when the
 * specific catalog record confirms both a manufacturer and its image URL.
 * Otherwise we create a product-specific illustration locally in the browser.
 * No private data is transmitted and no external image provider is required.
 */
(function () {
  'use strict';
  const safe=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const categoryColors={
    'smart-home-packages':['#0b4850','#1aa079'],
    'connectivity-networking':['#10476a','#50a6c5'],
    'smart-security':['#203959','#31a5ad'],
    'smart-lighting-power':['#735a1e','#e5a944'],
    'smart-entertainment':['#40305e','#a47ac6'],
    'smart-appliances':['#39586a','#86a9b1'],
    'ai-automation':['#3b4388','#7991db'],
    'smart-energy':['#17634b','#6cb78a'],
    'smart-vehicle':['#354963','#7996b4'],
    'ai-high-tech':['#374579','#909bda'],
    'stationery':['#1d6275','#69acc4'],
    'cartridges':['#404963','#8096be'],
    'computer-accessories':['#35526a','#83a9c7'],
    'printers-office':['#29465b','#709bb5'],
    'cleaning':['#186875','#63bdc5'],
    'electrical':['#715023','#d4a75f'],
    'furniture':['#69513d','#bf9c7e'],
    'ppe':['#68481c','#e8af51'],
    'general-supplies':['#42606c','#96b0b7']
  };
  // Icons are clear vector product illustrations, chosen by *item*, not random category photos.
  // Shapes use 24x24 coordinates and are embedded into a branded-free catalogue artwork.
  const glyphs={
    paper:'<path d="M6 2h9l4 4v16H6z"/><path d="M15 2v5h4M9 11h7M9 15h7M9 19h5"/>',
    pen:'<path d="m4 20 4.6-1.1L20 7.5 16.5 4 5.1 15.4 4 20Z"/><path d="m13.8 6.7 3.5 3.5M7 17l2 2"/>',
    file:'<path d="M4 2h16v20H4zM8 2v20M12 7h5M12 11h5M12 15h5"/><circle cx="6" cy="12" r="1"/>',
    folder:'<path d="M2 6V4h8l2 3h10v13H2V6Z"/><path d="M3 11h18"/>',
    stapler:'<path d="M4 11h15l2 4v4H3v-6zM4 11V7l10-3h4v7M7 19v2M17 19v2"/>',
    punch:'<path d="M4 17h16v4H4zM7 17V8h10v9M8 8V3h8v5"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/>',
    box:'<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    camera:'<rect x="2" y="5" width="20" height="15" rx="3"/><circle cx="12" cy="12" r="5"/><path d="M8 5l2-3h4l2 3M4 9h2"/>',
    alarm:'<path d="M5 18h14L17 6H7L5 18ZM3 21h18M9 5V3h6v2M12 10v4"/>',
    sensor:'<rect x="4" y="2" width="16" height="20" rx="4"/><circle cx="12" cy="11" r="3"/><path d="M9 17h6"/>',
    lock:'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M7 10V7a5 5 0 1 1 10 0v3M12 15v3"/>',
    wifi:'<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0"/><circle cx="12" cy="20" r="1"/>',
    router:'<rect x="3" y="12" width="18" height="8" rx="2"/><path d="M7 12V3M17 12V3M6 16h1M10 16h1M14 16h4"/>',
    network:'<rect x="2" y="9" width="20" height="11" rx="2"/><path d="M5 13h2M9 13h2M13 13h2M17 13h2M5 17h14"/>',
    plug:'<path d="M8 3v7m8-7v7M6 10h12v3a6 6 0 0 1-12 0v-3ZM12 19v3"/>',
    bulb:'<path d="M9 17v-2a7 7 0 1 1 6 0v2M9 17h6M10 20h4M10 22h4"/>',
    monitor:'<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8M12 18v4"/>',
    laptop:'<path d="M4 5h16v11H4zM2 20h20l-2-4H4z"/>',
    keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M6 16h12"/>',
    mouse:'<rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 2v9M7 11h10"/>',
    printer:'<path d="M6 9V2h12v7M6 18H3V9h18v9h-3M6 15h12v7H6zM17 12h1"/>',
    cartridge:'<path d="M4 7h16v14H4zM7 3h10v4M8 12h8M8 16h5"/>',
    usb:'<path d="M10 3h4v9h-4zM8 12h8v9H8zM12 12v9M10 6h4"/>',
    cable:'<path d="M4 5h5v5H4zM15 15h5v5h-5zM9 7h4a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h4"/>',
    tv:'<rect x="2" y="3" width="20" height="16" rx="2"/><path d="M8 22h8M12 19v3M8 8l8 5"/>',
    speaker:'<rect x="5" y="2" width="14" height="20" rx="3"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="6" r="1"/>',
    fridge:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 11h12M9 5v3M9 14v4"/>',
    appliance:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="13" r="6"/><path d="M7 6h1M11 6h6"/>',
    chair:'<path d="M6 3h12v11H6zM5 14h14v5H5zM8 19v3m8-3v3"/>',
    desk:'<path d="M2 7h20v4H2zM5 11v11M19 11v11M9 15h6"/>',
    solar:'<path d="M3 9h18l-2 11H5L3 9ZM6 13h12M9 9l-1 11M15 9l1 11M12 3v4M4 5l2 2M20 5l-2 2"/>',
    battery:'<rect x="4" y="6" width="17" height="13" rx="2"/><path d="M21 10h2v5h-2M10 9l-2 5h4l-2 3"/>',
    charger:'<path d="M8 3v6M16 3v6M5 9h14v4a7 7 0 0 1-14 0V9ZM12 20v2"/>',
    car:'<path d="M4 12 6 6h12l2 6v7H4zM3 12h18M7 19v2M17 19v2M7 16h2M15 16h2"/>',
    tracker:'<path d="M12 22s7-8 7-13a7 7 0 1 0-14 0c0 5 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/>',
    hardhat:'<path d="M4 16a8 8 0 0 1 16 0M3 16h18v4H3zM12 4v10"/>',
    glove:'<path d="M6 13V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v11c0 3-2 5-5 5H9c-3 0-5-2-5-5v-4z"/>',
    boot:'<path d="M5 2h8v12l4 3h5v5H2v-6l3-3zM3 19h18"/>',
    spray:'<path d="M8 7h8v15H7V9zM10 3h5v4M15 4h5M20 4v3M19 10h2"/>',
    broom:'<path d="M13 2 9 15M6 15h8l2 7H4zM6 19h10"/>',
    ladder:'<path d="M8 2 4 22M16 2l4 20M8 8h8M7 13h10M6 18h12"/>',
    tools:'<path d="M14 3a6 6 0 0 0-7 7L2 15l7 7 5-5a6 6 0 0 0 7-7l-4 4-4-4 4-4z"/>',
    drone:'<rect x="8" y="9" width="8" height="6" rx="2"/><path d="M4 6l5 5M20 6l-5 5M4 18l5-5M20 18l-5-5"/><circle cx="4" cy="6" r="3"/><circle cx="20" cy="6" r="3"/><circle cx="4" cy="18" r="3"/><circle cx="20" cy="18" r="3"/>',
    shield:'<path d="M12 2 21 6v6c0 5-4 9-9 10-5-1-9-5-9-10V6zM8 12l3 3 5-6"/>',
    package:'<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>'
  };
  const pattern=[
    [/\bpaper\b|copy paper|sticky notes|laminating pouches/i,'paper'],
    [/ballpoint|pens?\b|typing|stationery pen/i,'pen'],
    [/lever arch|filing cabinet|ring bind|folder/i,'file'],
    [/filing sleeve|clear pocket|envelope|document sleeve/i,'folder'],
    [/staples?\b/i,'stapler'],
    [/hole punch|\bpunch\b/i,'punch'],
    [/toner|ink cartridge|ink bottle|drum unit/i,'cartridge'],
    [/printer|designjet|multifunction|laserjet|shredder/i,'printer'],
    [/\bmouse\b/i,'mouse'],
    [/keyboard/i,'keyboard'],
    [/usb|flash drive|external (?:hdd|ssd)/i,'usb'],
    [/ethernet cable|hdmi|power lead|network cord|wire|cabling/i,'cable'],
    [/laptop|notebook/i,'laptop'],
    [/desktop|computer|mini pc|tablet|control tablet/i,'monitor'],
    [/router|access point|starlink|mesh wi-fi|vehicle wi-fi/i,'router'],
    [/network switch|network installation/i,'network'],
    [/smart camera|security camera|cctv|dash.?cam|video door|camera|cam\b/i,'camera'],
    [/door lock|smart lock|fingerprint safe|biometric|deadbolt/i,'lock'],
    [/alarm|siren|smoke detector/i,'alarm'],
    [/motion sensor|door.?window sensor|temperature sensor|humidity|water.?leak|occupancy|environment sensor/i,'sensor'],
    [/solar panel|solar security light/i,'solar'],
    [/battery|power station|power backup|ups\b/i,'battery'],
    [/inverter|energy meter|load control|energy monitoring/i,'charger'],
    [/light|bulb|led tube|dimmer/i,'bulb'],
    [/smart plug|socket|smart switch|extension lead/i,'plug'],
    [/speaker|soundbar|home cinema|audio/i,'speaker'],
    [/smart tv|tv streaming|tv box|projector/i,'tv'],
    [/smart fridg|refrigerator/i,'fridge'],
    [/washing machine|dryer|microwave|kettle|oven|heater|fan|air conditioner|vacuum|air.?quality|pet feeder|coffee maker|smart scale/i,'appliance'],
    [/curtain|blind/i,'folder'],
    [/office chair/i,'chair'],
    [/office desk|workstation/i,'desk'],
    [/safety boots/i,'boot'],
    [/hard hat|helmet/i,'hardhat'],
    [/high.?vis|vest/i,'shield'],
    [/gloves/i,'glove'],
    [/cleaning|detergent|disinfectant|toilet cleaner|glass cleaner|hand soap/i,'spray'],
    [/mop|bucket|broom|dustpan|brush/i,'broom'],
    [/drill|hand tools|tool set/i,'tools'],
    [/ladder/i,'ladder'],
    [/vehicle|parking|car\b|tpms|head unit|ev charger/i,'car'],
    [/tracking|gps|fleet/i,'tracker'],
    [/smart home package|secure start|connected home|smart family/i,'shield'],
    [/drone/i,'drone']
  ];
  function glyph(p){
    const title=String(p.name||'');
    const match=pattern.find(([rule])=>rule.test(title));
    if(match)return match[1];
    return ({
      'stationery':'paper','cartridges':'cartridge','computer-accessories':'keyboard',
      'printers-office':'printer','cleaning':'spray','electrical':'plug',
      'furniture':'chair','ppe':'hardhat','general-supplies':'package',
      'smart-home-packages':'shield','connectivity-networking':'router',
      'smart-security':'camera','smart-lighting-power':'bulb',
      'smart-entertainment':'tv','smart-appliances':'appliance',
      'ai-automation':'monitor','smart-energy':'battery',
      'smart-vehicle':'car','ai-high-tech':'laptop'
    })[p.category]||'package';
  }
  function lines(text){
    const words=String(text||'Product').split(/\s+/),out=[],max=26;
    let current='';
    for(const word of words){
      if((current+' '+word).trim().length>max&&current){out.push(current);current=word;}
      else current=(current+' '+word).trim();
    }
    if(current)out.push(current);
    return out.slice(0,2).map(safe);
  }
  function svg(p){
    const [dark,accent]=categoryColors[p.category]||['#3b5063','#81a6b0'];
    const type=glyph(p), path=glyphs[type]||glyphs.package;
    const display=lines(p.name);
    const nameText=display.map((line,i)=>'<text x="480" y="'+(425+i*39)+'" font-family="Arial,sans-serif" font-weight="700" font-size="'+(display.length>1?29:33)+'" fill="#12334d" text-anchor="middle">'+line+'</text>').join('');
    const categoryLabel=safe(String(p.category||'product').replaceAll('-',' ').toUpperCase());
    const visual='<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">'+
      '<defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f5f9fb"/><stop offset="1" stop-color="#e8f2f4"/></linearGradient>'+
      '<linearGradient id="product" x1="0" x2="1" y1="0" y2="1"><stop stop-color="'+dark+'"/><stop offset="1" stop-color="'+accent+'"/></linearGradient>'+
      '<filter id="shadow"><feDropShadow dx="0" dy="13" stdDeviation="18" flood-color="#13405e" flood-opacity=".14"/></filter></defs>'+
      '<rect width="960" height="560" fill="url(#bg)"/>'+
      '<circle cx="832" cy="87" r="165" fill="'+accent+'" opacity=".075"/><circle cx="103" cy="505" r="192" fill="'+dark+'" opacity=".055"/>'+
      '<rect x="315" y="64" width="330" height="276" rx="40" fill="#fff" filter="url(#shadow)"/>'+
      '<rect x="347" y="92" width="266" height="226" rx="35" fill="url(#product)"/>'+
      '<g transform="translate(403 111) scale(6.3)" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">'+path+'</g>'+
      '<rect x="345" y="354" width="270" height="3" rx="2" fill="'+accent+'" opacity=".36"/>'+
      nameText+
      '<text x="480" y="516" font-family="Arial,sans-serif" letter-spacing="2.3" font-size="16" font-weight="700" text-anchor="middle" fill="'+dark+'" opacity=".69">'+categoryLabel+'</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(visual);
  }
  function resolve(p){
    const hasOfficial= p && p.fixedManufacturer===true &&
      typeof p.officialImage==='string' && /^https:\/\//i.test(p.officialImage) &&
      Boolean(String(p.brand||'').trim()) && Boolean(String(p.model||'').trim());
    if(hasOfficial){
      return {
        src:p.officialImage,
        alt:p.brand+' '+p.model+' — official manufacturer product image',
        label:'Official image · '+p.brand+' '+p.model,
        official:true
      };
    }
    if(p && typeof p.illustrativeImage==='string' && /^https:\/\//i.test(p.illustrativeImage)){
      return {
        src:p.illustrativeImage,
        alt:p.name+' — representative image; exact make/model subject to quotation',
        label:'Illustrative image – exact make/model subject to quotation',
        official:false
      };
    }
    return {
      src:svg(p||{}),
      alt:'Illustration of '+String(p?.name||'product')+' — exact make/model subject to quotation',
      label:'Illustrative image – exact make/model subject to quotation',
      official:false
    };
  }
  window.MMGC_CATALOG_IMAGES={resolve,illustration:svg};
})();
