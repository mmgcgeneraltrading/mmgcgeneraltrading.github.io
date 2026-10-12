document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('source-list');
  const search = document.getElementById('source-search');
  const filters = document.getElementById('source-filters');
  const count = document.getElementById('source-count');
  let kind = new URLSearchParams(location.search).get('type') || 'all';
  if (!['all', 'jobs', 'tenders', 'opportunities'].includes(kind)) kind = 'all';
  function filter() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of list.querySelectorAll('article')) {
      const match = (kind === 'all' || card.dataset.kinds.split(' ').includes(kind)) && card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible++;
    }
    count.textContent = visible;
    document.getElementById('source-empty').hidden = visible !== 0;
    filters.querySelectorAll('button').forEach(button => button.classList.toggle('active', button.dataset.kind === kind));
  }
  search.addEventListener('input', filter);
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-kind]');
    if (!button) return;
    kind = button.dataset.kind; filter();
  });
  filter();
  try {
    const response = await fetch('data/lesotho-sources.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Directory status unavailable');
    const data = await response.json();
    if (!Array.isArray(data.sources)) throw new Error('Invalid source data');
    const fragment = document.createDocumentFragment();
    for (const source of data.sources) {
      let url;
      try { url = new URL(source.url); } catch { continue; }
      if (url.protocol !== 'https:' || url.username || url.password) continue;
      const card = document.createElement('article');
      card.className = 'source-card'; card.dataset.kinds = source.kinds.join(' ');
      const heading = document.createElement('h2');
      const link = document.createElement('a');
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener'; link.textContent = source.name;
      heading.append(link); card.append(heading);
      const host = document.createElement('p'); host.className = 'source-host'; host.textContent = url.hostname + url.pathname; card.append(host);
      const type = document.createElement('p'); type.textContent = `${source.kinds.map(x => x === 'jobs' ? 'Jobs' : x === 'tenders' ? 'Tenders' : 'Opportunities').join(' · ')} · ${source.official ? 'Issuer / employer source' : 'Publisher / social source'}`; card.append(type);
      if (source.notes) { const note = document.createElement('p'); note.textContent = source.notes; card.append(note); }
      const status = document.createElement('p'); status.className = 'source-status';
      status.textContent = source.status === 'reachable' ? 'Page responded to access check' : source.httpStatus ? `Access check returned HTTP ${source.httpStatus}; try the link directly` : 'Automated access unconfirmed; try the link directly';
      if (source.checkedAt) status.textContent += ` · ${new Date(source.checkedAt).toLocaleDateString('en-GB', {timeZone: 'Africa/Maseru'})}`;
      card.append(status); fragment.append(card);
    }
    if (fragment.childNodes.length) { list.replaceChildren(fragment); filter(); }
  } catch {
    document.getElementById('directory-status').textContent = 'Showing the saved source directory; the latest access status could not be loaded.';
  }
});
