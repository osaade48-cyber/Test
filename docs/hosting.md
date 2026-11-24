# Hosting standard (all TradeBooked and client sites)

Every site goes on **Cloudflare Pages**. Don't use Netlify, Firebase or Vercel.

## Why
- Free with unlimited traffic, fast Sydney servers.
- Auto-deploys from GitHub on every push.
- Cloudflare also runs the domain's DNS and free email forwarding (info@ → owner's inbox).

## Per-site setup
1. The site repo contains `_redirects` (old-URL 301s) and `_headers` (security and cache headers) in the published folder. Plain HTML sites put them in the root. Astro sites put them in `public/`.
2. Forms: there are no host-built-in forms. Use the GoHighLevel form embed for tradie clients, or Formspree for simple sites. The form redirects to `/thanks` (noindex) so Google Ads can count the lead.
3. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo and production branch. Set the build command and output folder (none / `.` for plain HTML; `npm run build` / `dist` for Astro).
4. Add the domain to Cloudflare (it imports existing DNS records). Check the MX/email and Google verification TXT records came across. Then switch the nameservers at the registrar.
5. In Pages → Custom domains, add `domain.com.au` and `www.domain.com.au`. Redirect www → apex.
6. After it's live, test the main pages, old-URL redirects, the form → /thanks, and phone-tap tracking. Then delete any old host.
