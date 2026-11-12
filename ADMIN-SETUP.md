# MMGC Admin Dashboard — Deployment & Security Runbook

## What has been built

The protected dashboard is at `/admin.html` and contains:
- A **Product Manager** with create, edit, delete, catalogue import, controlled publishing and confirmed-price fields.
- A **Customer Enquiries Manager** to record and track email, WhatsApp, phone and other enquiries.
- A **Supplier Authorization Tracker** for reseller applications, territory, written evidence references, deadlines and approved price-list links.
- A **Quotations Manager** for line items, totals, draft/sent status and print-to-PDF.
- A **conditional shortcut in My Account**, only visible after the Supabase admin-role check succeeds.

Data is stored in the existing Supabase project **only after the owner runs the schema**. GitHub Pages itself is static hosting and cannot safely store private orders, credentials or approvals.

## Required activation — Supabase project owner (NOT completed)

1. Sign in to the Supabase project already used for MMGC sign-in (`avgudubydtofgoaaukby`) using an owner/admin account.
2. Open **SQL Editor** and execute the **entire** file `supabase/mmgc-admin-schema.sql`. Review the SQL before running it.
3. Open **Authentication > Users** and find the unique **UUID** of the exact MMGC account that should own the dashboard. Verify the email and identity. Do not assume any email is automatically an admin.
4. In the SQL Editor, execute **only after replacing the placeholder UUID**:

   ```sql
   insert into public.mmgc_admin_users(user_id,role)
   values ('YOUR-VERIFIED-SUPABASE-USER-UUID'::uuid, 'admin')
   on conflict (user_id) do nothing;
   ```

5. Sign in through `auth.html?mode=login`, then navigate to `admin.html`. The private dashboard should load four business data tables. A dashboard shortcut also appears on **My Account** for the authorized user.
6. In Supabase **Authentication > URL Configuration**, set the production site URL to `https://mmgcgeneraltrading.github.io` and explicitly allow `https://mmgcgeneraltrading.github.io/auth.html*` as an authentication redirect. Ensure no production email template redirects to localhost. Verify with a new test registration.
7. Add a sample *unpublished* product. Confirm it does not appear in `catalogue.html`; publish a test product and ensure it appears. Remove it afterward.
8. Create sample enquiry, supplier and draft quotation. Check printable totals and delete test entries afterward.
9. **Security test:** sign in as an ordinary MMGC customer; visiting `admin.html` must show "no administrator permission" and direct REST attempts against private Supabase tables must be denied by RLS. A signed-out visitor must also be denied.
10. Back up the database before any future schema changes; enable MFA for administrators, and consider a regular recovery/export policy.

## Data visibility and limitations

- Public catalogue uses existing `product-data.js` entries unless an admin publishes a corresponding `mmgc_admin_products` record. Published records are obtained using the project's **publishable** key and Supabase **RLS**; unpublished rows and private admin tables must remain inaccessible.
- A product imported from the static catalogue is initially **unpublished**, **enquiry-only** and **authorization unverified**.
- Existing `products.html` catalogue, checkout/quotation basket and other pages are preserved as-is. Dynamic published overrides are displayed in `catalogue.html`, global search and Ask MMGC (which consume `unified-catalog.js`). The legacy `products.html` list is not yet fully migrated to database management.
- Customer WhatsApp/email inquiries **do not automatically enter the private enquiries table**. They can be entered manually; a public intake endpoint requires server-side bot protection, abuse rate limits, validation, privacy notice and secure storage.
- **Never** put Supabase service-role keys, API secrets, customer passwords, private distributor price files or authorization letters in this public repository. Price-list URLs may reveal information if external file sharing is misconfigured. Prefer secure private storage links and access checks.
- Supplier approval in the dashboard is a **staff-maintained record**, not a substitute for signed authorization issued by the supplier. Check written evidence before changing a status to authorized.
- Printed quotations are generated locally from saved draft records. They are not signed invoices, tax compliance checks, payment receipts or automatic email dispatches.
- SuperPay remains a **simulation**; the admin dashboard does not activate mobile-money payments.
- Pages use CDN-based Supabase JS, and external product images may not always load. Avoid relying on externally hosted images for critical listings.

## Developer files

- `admin.html`, `admin.css`, `admin.js`: admin experience and CRUD.
- `admin-link.js`: role-gated account shortcut.
- `supabase/mmgc-admin-schema.sql`: database schema and RLS controls.
- `unified-catalog.js`, `catalogue-page.js`: public read of published products with graceful fallback to existing static catalogue.
- `product-data.js`: preserved existing master list.

## Next-phase priorities

1. Use a server-side form endpoint (e.g. Supabase Edge Function with CAPTCHA and rate limiting) to accept public enquiries into the admin inbox.
2. Add secure private files/storage for supplier authorization letters and price lists, with signed URLs.
3. Add a searchable quotation-to-order pipeline, VAT configuration and PDF numbering rules.
4. Move the legacy marketplace product cards to the shared published catalogue API, removing duplicate inventories.
5. Implement automated backup/export and change auditing for sensitive records.
