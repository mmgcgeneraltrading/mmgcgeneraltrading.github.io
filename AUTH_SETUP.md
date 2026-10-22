# MMGC website accounts — administrator setup

Implemented: October 22, 2026.

## Routes
- \`/auth.html?mode=login\` — existing member sign-in.
- \`/auth.html?mode=signup\` — create an individual or company account.
- \`/auth.html?mode=forgot\` — password-reset request.
- \`/account.html\` — landing page for authenticated members.
- Authenticated pages import \`auth-guard.js\` and redirect unauthenticated browsers to sign-in.
- General-information pages (homepage, about, services, standard services, portfolio, industries, why-MMGC, tender support) remain available to all visitors.

## Supabase project
- Name: MMGC General Trading
- Project: \`avgudubydtofgoaaukby\`
- Public API host: \`https://avgudubydtofgoaaukby.supabase.co\`
- This repository uses a Supabase **publishable** key, safe for front-end applications. Never commit a \`service_role\` or secret key.

## Required Supabase settings for temporary no-verification registration
1. Open **[MMGC Supabase → Authentication → Providers](https://supabase.com/dashboard/project/avgudubydtofgoaaukby/auth/providers)**.
   - Under **Email**, keep email/password enabled and turn **Confirm Email OFF** for immediate email/password signup.
   - Under **Phone**, enable phone/password accounts, and turn **Confirm Phone OFF** for phone/password signup without SMS codes.
   - Keep **Allow new users to sign up ON** in Auth settings.
   - Do not confuse disabling confirmations with disabling the phone provider. Phone/password still needs its provider enabled.
2. Under **Authentication → URL Configuration**, set the site URL to `https://mmgcgeneraltrading.github.io` and allow `https://mmgcgeneraltrading.github.io/auth.html**` for email password recovery.
3. Email is used only for users who choose email registration. Phone registration uses the `phone` identifier in Supabase Auth; it is not a fake email address and does not require a synthetic email.
4. For phone-only accounts, password reset by SMS is **not provided** while verification/SMS is disabled. Advise such users to contact MMGC through a secure identity-check process for recovery. Do not reset an account based only on an unverified phone number.
5. Test email signup/login, phone signup/login, invalid passwords, duplicates, logout and member-only redirects with user-controlled testing identities. Check that Supabase returns a session from `auth.signUp`; without it, confirmations remain enabled.
6. Keep rate limiting and bot protection, especially with verification disabled. Avoid storing private customer data until RLS and actual backend authorisation are in place.
7. Once possible, re-enable verification for stronger account ownership guarantees, or add verified MFA, especially before invoices, payments, sensitive documents or account recovery go live.

**Security trade-off:** No-confirmation signup means a new customer can register with someone else's phone or email. Treat those values as **unverified claims**; don't use them to infer trust, identity, company ownership or right to access data.

## Important security boundary
GitHub Pages is a static host. Client-side route guards protect the **normal website browsing experience** but do not secure raw HTML, JavaScript or public files from someone who requests the original files directly. **Do not put private tender files, invoices, customer details, service-role keys or administrative data inside this public repository or in client-side JavaScript.**

To store protected customer data, put it in Supabase tables with RLS (ownership checks based on \`auth.uid()\`), or another backend that verifies user sessions for every read/write. Separate staff/admin access must be authorized server-side, not with \`user_metadata\` or \`localStorage\`.

## Release checklist
- [x] Public Sign In and Create Account links
- [x] Registration form (individual/company), email **or phone** with password
- [x] Sign-in, sign-out, forgot password and password-update logic
- [x] Account landing page
- [x] Client-side page gating on pages currently listed in \`sitemap.xml\` plus business tools
- [x] Supabase project restored and connected
- [ ] Configure Supabase production Site URL and redirects
- [ ] Switch off Confirm Email / Confirm Phone, enable Phone provider, test instant signup
- [ ] Configure SMTP when email password recovery and notifications are required
- [ ] Production browser acceptance test from GitHub Pages address
- [ ] Implement server-side authorization/RLS before storing any customer data
