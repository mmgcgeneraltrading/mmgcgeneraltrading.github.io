# Daily tender and job discoveries

The site keeps curated tender/job records separate from automatically collected source discoveries. Nine unique tender records were extracted from the supplied issuer PDFs on 12 October 2026. Duplicate copies of the smartphone and IEC documents were omitted. The Public Eye tender notices already existed in the curated data. The MMGC capability statement is not a tender. The carbon-markets TOR does not state an application deadline. The ROLL issuer listing was subsequently checked and gives 16 October 2026, with no exact closing time. The stored end-of-day value supports date-based display only; the label directs readers to confirm the time with ROLL.

## Daily updates

`.github/workflows/daily-opportunities.yml` runs at 05:00 UTC (07:00 Africa/Maseru), with additional tender/source checks at 22:00 and 02:00 UTC (midnight and 04:00 Africa/Maseru), and supports **Run workflow**. GitHub schedules can be delayed and run only on the default branch; inactivity may disable schedules in public repositories.

- Selibeng: reads its tender category RSS feed. The feed contains the notices provided by Selibeng, not every historical article. These are discovery links, with deadlines marked for confirmation.
- Google Jobs: uses SerpApi's `google_jobs` engine for `jobs lesotho`, following pagination until exhausted. Google results depend on location, date and indexing; this cannot guarantee all personalised browser results. A search result is not independent employer verification. Listings are refreshed as a complete source snapshot and are not added to curated records or assigned invented deadlines.
- Display: `data/opportunity-discoveries.json` feeds the discovery sections on `jobs.html` and `tenders.html`. Each source shows its last successful refresh, and failed refreshes preserve previous data. Empty responses, repeated tokens and more than 100 pages fail rather than publish incomplete data.

## Enable on GitHub

1. Add a repository Actions secret named `SERPAPI_API_KEY` with your SerpApi key. Enter it in GitHub's secret settings, never in source files or chat. The API requires a SerpApi account and sufficient search quota for pagination.
2. Allow GitHub Actions to write repository contents. Branch protection must permit the updater's commit, or the workflow must be adapted to your review process.
3. Set GitHub Pages source to **GitHub Actions**. The updater deploys the static site explicitly because a commit made using `GITHUB_TOKEN` does not trigger the normal push-based Pages build. Existing Vercel deployments and `/api` serverless functions are separate.
4. Run **Daily opportunity discovery** once, inspect its source results and Pages deployment, and confirm the site shows the new refresh timestamp. Do not claim the schedule is active before the workflow is on the default branch and a hosted run succeeds.

No raw tender PDFs or the newspaper have been republished. Tender records link to the issuing organisations; the source filename records the supplied evidence. Always check current issuer documents and addenda.

## Local checks

```sh
cd /workspace/mmgcgeneraltrading.github.io
python3 -m unittest discover -s tests -v
python3 scripts/update_opportunities.py
python3 -m http.server 8000 --bind 127.0.0.1
```

The updater exits nonzero if any source fails, while still saving successful sources and failure status. It uses Python's standard library and verified HTTPS; no dependency installation is required. Do not log the search request URL because it includes the API key.

## Lesotho source directory

`lesotho-sources.html` lists 46 issuer, employer, recruitment and publisher links, including all 17 requested URLs and additional source pages discovered in issuer navigation. Search and filters support jobs, tenders and general opportunities; all links remain available without JavaScript. Archived individual adverts are explicitly labelled.

`scripts/check_source_links.py` checks access over verified HTTPS and updates `data/lesotho-sources.json`. The daily workflow runs this check and publishes the resulting statuses alongside source discoveries. An HTTP response only verifies page access, not that its notices are current. Four sources could not be reached during the initial 43-link check; their warnings remain visible. The directory is not an exhaustive inventory of Lesotho domains.

Overnight runs use `--tenders-only` and do not call Google Jobs or consume its API quota. These are scheduled data refreshes, not a continuously running agent or guaranteed exhaustive research. Hosted run success remains unverified until GitHub Actions access is available.
