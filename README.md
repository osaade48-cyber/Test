# TradeBooked website

The website for [tradebooked.com.au](https://tradebooked.com.au): the marketing agency for Aussie tradies (websites, branding, SEO, Meta and Google ads, AI receptionist, AI lead caller, chatbot, CRM).

## What's where

```
site.config.json   Phone number, email, ABN, your name, bundle prices, ad spend minimums, form endpoint. Change once, updates every page.
src/pages/         One file per page: home, how it works, services (overview + 9 service pages), bundles, my story, FAQ, book, thanks, privacy, terms, 404
src/partials/      Shared bits used on every page: head, header + mobile thumb bar, Book a chat strip, footer, phone mockup
src/assets/        styles.css, main.js (animations, call demo, calculator, form), favicon, work/ (website preview images)
src/static/        robots.txt and sitemap.xml
build.js           Puts it all together into site/
site/              The finished website. This is the folder you host.
plan/              The original layout plan
preview/           (generated, not committed) every page bundled into one file for the claude.ai preview link
```

## Making changes

1. Edit files in `src/` or `site.config.json`. Don't edit `site/` directly; it gets overwritten.
2. Run `node build.js` (needs Node.js; no other installs).
3. Open `site/index.html` in a browser, or run `python3 -m http.server -d site` and visit http://localhost:8000.

- **Wording on a page:** `src/pages/<page>.html`
- **Menu or footer:** `src/partials/header.html` / `footer.html`
- **Sample calls in the phone:** the `SCRIPTS` list near the top of `src/assets/main.js`
- **Colours and fonts:** the `:root` block at the top of `src/assets/styles.css`

## Before going live

Search the pages for `class="ph"`: every highlighted placeholder needs your real details. The main ones:

- [ ] Demo phone number (`demoPhone` and `demoPhoneTel` in `site.config.json`)
- [ ] Your name, email, ABN (`site.config.json`)
- [ ] Your photo and story (`src/pages/my-story.html`, and the teaser on the home page)
- [ ] Your before/after numbers (`my-story.html`)
- [ ] Bundle prices and contents (`site.config.json`, `bundles.html`), contract terms, GST
- [ ] Replace concept work with real work as you get it: website screenshots in `src/assets/work/` and the galleries in `websites.html`, `branding.html` and `meta-ads.html`. Concept and sample items are labelled on the page; keep them labelled until they're swapped.
- [ ] Setup time and supported calendars (`faq.html`, `book.html`)
- [ ] Privacy policy and terms reviewed by a lawyer (`privacy.html`, `terms.html`)
- [ ] Real call recordings (the demo currently plays animated transcripts)
- [ ] **Connect the form**, see below

### Connecting the Book a chat form

Right now the form goes straight to the thanks page and **the enquiry isn't sent anywhere**. The thanks page shows a warning until it's connected. To fix it:

1. Create a form at a service like [Formspree](https://formspree.io) (free tier is fine). It emails you each enquiry.
2. Copy the endpoint URL it gives you (looks like `https://formspree.io/f/abcd1234`).
3. Paste it into `formEndpoint` in `site.config.json` and run `node build.js`.

### The statistics

The home page stats were checked before use:

- **62% unanswered:** 411 Locals call study, Jan 2016 (85 US businesses). Counts calls that went to voicemail as unanswered.
- **78% have given up on a business / 1 in 5 call a competitor straight away:** CallRail survey of 1,000 US consumers, 2025. Found via secondary reports; link the original CallRail report if you can find it.

The often-quoted "85% never call back" and "80% won't leave a voicemail" figures were left out because no primary source could be found for them.

## Hosting

Any static host works. Point it at the `site/` folder.

- **Netlify:** connect the repo. `netlify.toml` already sets the build command and folder. Pretty URLs (`/pricing` instead of `/pricing.html`) work automatically.
- **Vercel / Cloudflare Pages:** build command `node build.js`, output directory `site`.

Then point tradebooked.com.au at the host in your domain registrar's DNS settings.
