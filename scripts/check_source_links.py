#!/usr/bin/env python3
"""Check access to the curated source directory, without inventing vacancy status."""
import concurrent.futures
import datetime as dt
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

OUTPUT = Path(__file__).resolve().parents[1] / 'data/lesotho-sources.json'

def check(source):
    result = dict(source)
    result['checkedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
    parsed = urllib.parse.urlsplit(source['url'])
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Source must be a credential-free HTTPS URL')
    try:
        req = urllib.request.Request(source['url'], headers={'User-Agent': 'MMGC-Source-Directory/1.0'})
        with urllib.request.urlopen(req, timeout=20) as response:
            response.read(1024)
            result['status'] = 'reachable'
            result['httpStatus'] = response.status
            result['resolvedUrl'] = response.url
        result.pop('error', None)
    except urllib.error.HTTPError as exc:
        result['status'] = 'access_error'
        result['httpStatus'] = exc.code
        result['error'] = 'Source returned an HTTP error; try opening it directly.'
        result.pop('resolvedUrl', None)
    except (urllib.error.URLError, TimeoutError, OSError):
        result['status'] = 'unconfirmed'
        result['error'] = 'Automated access could not be confirmed; try opening the source directly.'
        result.pop('httpStatus', None)
        result.pop('resolvedUrl', None)
    return result

def main():
    data = json.loads(OUTPUT.read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        data['sources'] = list(pool.map(check, data['sources']))
    data['checkedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
    temporary = OUTPUT.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(OUTPUT)
    reached = sum(x['status'] == 'reachable' for x in data['sources'])
    print(f'{reached}/{len(data["sources"])} source pages responded; remaining links retain explicit access status')

if __name__ == '__main__':
    main()
