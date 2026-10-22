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

## Required before public account signup
1. Open the project's **Authentication → URL Configuration** in the Supabase Dashboard.
   - Site URL: \`https://mmgcgeneraltrading.github.io\`
   - Add \`https://mmgcgeneraltrading.github.io/auth.html**\` under allowed redirects, or an explicit wildcard covering the account verification and password reset URLs.
   - If users also use another production domain (such as a custom .com), add matching redirect URLs for it.
2. Open **Authentication → SMTP Settings** and configure a verified, legitimate email sender through a compatible provider (for example Resend, AWS SES, Brevo). Supabase's built-in SMTP cannot send signup/confirmation emails to arbitrary external customers.
3. Keep email confirmations enabled for public registrations. Test signup, confirmation, signin, password reset and signout with a non-team email address after SMTP and URL settings are in place.
4. Consider enabling CAPTCHA/rate limiting to reduce scripted signups.
5. Keep user credentials private. Never ask customers to email their passwords or PINs to staff.

## Important security boundary
GitHub Pages is a static host. Client-side route guards protect the **normal website browsing experience** but do not secure raw HTML, JavaScript or public files from someone who requests the original files directly. **Do not put private tender files, invoices, customer details, service-role keys or administrative data inside this public repository or in client-side JavaScript.**

To store protected customer data, put it in Supabase tables with RLS (ownership checks based on \`auth.uid()\`), or another backend that verifies user sessions for every read/write. Separate staff/admin access must be authorized server-side, not with \`user_metadata\` or \`localStorage\`.

## Release checklist
- [x] Public Sign In and Create Account links
- [x] Registration form (individual/company), email/password
- [x] Sign-in, sign-out, forgot password and password-update logic
- [x] Account landing page
- [x] Client-side page gating on pages currently listed in \`sitemap.xml\` plus business tools
- [x] Supabase project restored and connected
- [ ] Configure Supabase production Site URL and redirects
- [ ] Configure custom SMTP and test with an external email
- [ ] Production browser acceptance test from GitHub Pages address
- [ ] Implement server-side authorization/RLS before storing any customer data
