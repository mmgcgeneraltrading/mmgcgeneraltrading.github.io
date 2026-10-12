document.addEventListener('DOMContentLoaded', async () => {
  const host = document.getElementById('source-discoveries');
  if (!host) return;
  const kind = host.dataset.kind;
  const status = document.createElement('p');
  status.textContent = 'Loading source discoveries…';
  host.append(status);
  try {
    const response = await fetch('data/opportunity-discoveries.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Source data unavailable');
    const section = (await response.json())[kind];
    if (!section || !Array.isArray(section.items)) throw new Error('Invalid source data');
    const updated = section.updatedAt ? new Date(section.updatedAt).toLocaleString('en-GB', {timeZone: 'Africa/Maseru'}) : null;
    status.textContent = updated ? `Last successful refresh: ${updated} (Lesotho time). ${section.status === 'ok' ? '' : 'Latest refresh failed; showing retained results.'}` : 'Daily imports have not completed yet.';
    const rows = document.createElement('div');
    rows.className = 'job-list';
    for (const item of section.items) {
      let url;
      try { url = new URL(item.url); } catch { continue; }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
      const card = document.createElement('article');
      card.className = 'job-card';
      const content = document.createElement('div');
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = url.href; link.target = '_blank'; link.rel = 'noopener'; link.textContent = item.title;
      heading.append(link); content.append(heading);
      for (const text of [item.employer, item.location, item.summary, `Source: ${item.source}. Deadline and availability: confirm with the issuer or employer.`].filter(Boolean)) {
        const p = document.createElement('p'); p.textContent = text; content.append(p);
      }
      card.append(content); rows.append(card);
    }
    if (!rows.childElementCount) {
      const p = document.createElement('p'); p.textContent = 'No imported results are available yet. Use the source link below to browse current opportunities.'; rows.append(p);
    }
    host.append(rows);
  } catch {
    status.textContent = 'Source discoveries are unavailable. Use the source link below or browse the curated listings above.';
  }
});
