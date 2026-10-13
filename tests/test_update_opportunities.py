import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch
from tempfile import TemporaryDirectory

spec = importlib.util.spec_from_file_location('updater', Path(__file__).parents[1] / 'scripts/update_opportunities.py')
u = importlib.util.module_from_spec(spec)
spec.loader.exec_module(u)

class DiscoveryTests(unittest.TestCase):
    def test_feed_only_publishes_safe_source_links(self):
        raw = b'<rss><channel><item><title>Supply equipment</title><link>https://selibeng.com/equipment/</link></item><item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>'
        rows = u.tender_feed(raw)
        self.assertEqual(len(rows), 1)
        self.assertIsNone(rows[0]['deadline'])

    def test_jobs_paginate_deduplicate_and_keep_deadline_unknown(self):
        job = {'job_id': 'one', 'title': 'Engineer', 'company_name': 'Employer', 'apply_options': [{'link': 'https://employer.example/jobs/1'}]}
        responses = iter([{'jobs_results': [job], 'serpapi_pagination': {'next_page_token': 'next'}}, {'jobs_results': [job, {**job, 'job_id': 'two', 'title': 'Accountant'}]}])
        urls = []
        def fetch(url):
            urls.append(url)
            return json.dumps(next(responses)).encode()
        rows = u.google_jobs('test-key', fetch)
        self.assertEqual(len(rows), 2)
        self.assertIn('next_page_token=next', urls[1])
        self.assertTrue(all(row['deadline'] is None for row in rows))

    def test_api_failure_and_pagination_loop_do_not_publish_partial_data(self):
        with self.assertRaises(ValueError):
            u.google_jobs('test', lambda url: b'{"error":"denied"}')
        with self.assertRaises(ValueError):
            u.google_jobs('test', lambda url: b'{"jobs_results":[],"serpapi_pagination":{"next_page_token":"same"}}')

    def test_overnight_refresh_does_not_touch_jobs_or_call_search_api(self):
        with TemporaryDirectory() as folder:
            output = Path(folder) / 'results.json'
            previous = {'jobs': {'items': [{'title': 'Existing job'}], 'updatedAt': 'old'}, 'tenders': {'items': []}}
            output.write_text(json.dumps(previous))
            feed = b'<rss><channel><item><title>New tender</title><link>https://selibeng.com/new-tender/</link></item></channel></rss>'
            with patch.object(u, 'OUTPUT', output), patch.object(u, 'request', return_value=feed), patch.object(u, 'google_jobs') as search:
                self.assertEqual(u.main(('tenders',)), 0)
                search.assert_not_called()
            current = json.loads(output.read_text())
            self.assertEqual(current['jobs'], previous['jobs'])
            self.assertEqual(current['tenders']['items'][0]['title'], 'New tender')

    def test_local_jobs_feed_can_refresh_without_a_google_key(self):
        with TemporaryDirectory() as folder:
            output = Path(folder) / 'results.json'
            feed = b'<rss><channel><item><title>Sales role</title><link>https://selibeng.com/sales/</link></item></channel></rss>'
            with patch.object(u, 'OUTPUT', output), patch.object(u, 'request', return_value=feed), patch.dict(u.os.environ, {}, clear=True):
                self.assertEqual(u.main(('local_jobs',)), 0)
            current = json.loads(output.read_text())
            self.assertEqual(current['local_jobs']['status'], 'ok')
            self.assertIsNone(current['local_jobs']['items'][0]['deadline'])

    def test_source_failure_preserves_previous_successful_results(self):
        with TemporaryDirectory() as folder:
            output = Path(folder) / 'results.json'
            previous = {'jobs': {'items': [{'title': 'Existing job'}], 'updatedAt': 'old'}, 'tenders': {'items': [{'title': 'Existing tender'}], 'updatedAt': 'old'}}
            output.write_text(json.dumps(previous))
            with patch.object(u, 'OUTPUT', output), patch.object(u, 'request', side_effect=OSError('offline')), patch.dict(u.os.environ, {}, clear=True):
                self.assertEqual(u.main(), 1)
            current = json.loads(output.read_text())
            for kind in ('jobs', 'tenders'):
                self.assertEqual(current[kind]['items'], previous[kind]['items'])
                self.assertEqual(current[kind]['updatedAt'], 'old')
                self.assertEqual(current[kind]['status'], 'error')

if __name__ == '__main__':
    unittest.main()
