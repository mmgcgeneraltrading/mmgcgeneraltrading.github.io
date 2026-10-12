#!/usr/bin/env python3
"""Refresh source discoveries without replacing curated/verified MMGC records."""
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'data' / 'opportunity-discoveries.json'
FEED = 'https://selibeng.com/category/opportunities/tenders/feed/'

def request(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'MMGC-Opportunity-Updater/1.0', 'Accept': 'application/json, application/rss+xml, application/xml'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return response.read()

def safe_url(value):
    parsed = urllib.parse.urlsplit(value or '')
    return value if parsed.scheme in ('http', 'https') and parsed.hostname and not parsed.username else None

def tender_feed(raw):
    tree = ET.fromstring(raw)
    rows = []
    for item in tree.findall('./channel/item'):
        title = (item.findtext('title') or '').strip()
        url = safe_url((item.findtext('link') or '').strip())
        if title and url:
            rows.append({'id': hashlib.sha256(url.encode()).hexdigest()[:20], 'title': title, 'url': url, 'source': 'Selibeng', 'published': item.findtext('pubDate') or '', 'deadline': None})
    if not rows:
        raise ValueError('Feed returned no tender entries; previous successful results retained')
    return rows

def google_jobs(api_key, fetch=request):
    rows, seen, tokens = [], set(), set()
    token = None
    # Paginate all results the API supplies. Refuse partial publication on loops/limits.
    for _ in range(100):
        params = {'engine': 'google_jobs', 'q': 'jobs lesotho', 'api_key': api_key}
        if token:
            params['next_page_token'] = token
        payload = json.loads(fetch('https://serpapi.com/search.json?' + urllib.parse.urlencode(params)))
        if payload.get('error'):
            raise ValueError('Search API returned an error; previous successful results retained')
        jobs = payload.get('jobs_results', [])
        if not isinstance(jobs, list):
            raise ValueError('Unexpected search response')
        for job in jobs:
            options = job.get('apply_options') or []
            url = next((safe_url(x.get('link')) for x in options if safe_url(x.get('link'))), None)
            # A result without an application/source link cannot be usefully published.
            if not url or not job.get('title'):
                continue
            identity = str(job.get('job_id') or url)
            if identity in seen:
                continue
            seen.add(identity)
            rows.append({'id': hashlib.sha256(identity.encode()).hexdigest()[:20], 'title': job['title'], 'employer': job.get('company_name') or 'Employer not supplied', 'location': job.get('location') or 'Location not supplied', 'url': url, 'source': job.get('via') or 'Google Jobs', 'summary': str(job.get('description') or '')[:1200], 'deadline': None})
        token = (payload.get('serpapi_pagination') or {}).get('next_page_token')
        if not token:
            if not rows:
                raise ValueError('Search returned no usable jobs; previous successful results retained')
            return rows
        if token in tokens:
            raise ValueError('Repeated pagination token; refusing partial results')
        tokens.add(token)
    raise ValueError('Search pagination exceeded 100 pages; refusing partial results')

def main(sources=('tenders', 'jobs')):
    data = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {'jobs': {'items': []}, 'tenders': {'items': []}}
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    failed = False
    for name, loader in [('tenders', lambda: tender_feed(request(FEED))), ('jobs', lambda: google_jobs(os.environ['SERPAPI_API_KEY']))]:
        if name not in sources:
            continue
        section = data.setdefault(name, {'items': []})
        section['lastAttempt'] = now
        try:
            section['items'] = loader()
            section['updatedAt'] = now
            section['status'] = 'ok'
            section.pop('error', None)
            print(name + ': ' + str(len(section['items'])) + ' source discoveries refreshed')
        except Exception as exc:
            # Never log request URLs or exception strings: they may include API keys.
            section['status'] = 'error'
            section['error'] = 'Refresh failed; previous results retained. Check source access and API configuration.'
            print(name + ': refresh failed (' + type(exc).__name__ + '); previous successful data retained')
            failed = True
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)
    return int(failed)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tenders-only', action='store_true', help='Refresh Selibeng notices without using Google Jobs API quota')
    args = parser.parse_args()
    raise SystemExit(main(('tenders',) if args.tenders_only else ('tenders', 'jobs')))
