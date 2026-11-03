# Lotus 8 Group website

A static website (HTML, CSS and a little JavaScript, no build step), in the `site/` folder.

## Deploy on Netlify
1. In Netlify: **Add new site → Import an existing project → GitHub**, then pick this repo.
2. Leave the build command empty. `netlify.toml` already sets the publish directory to `site`.
3. Deploy, then go to **Domain management** and add `lotus8group.com.au`.
4. The quote form uses **Netlify Forms**. Submissions show up under *Forms*. Turn on email notifications under *Forms → Notifications*.

Or drag and drop the `site` folder onto https://app.netlify.com/drop.

## Things to update before going live
Search the HTML files for these placeholders and replace them:
- ~~Phone~~ (done: 0411 219 139)
- Email `info@lotus8group.com.au`
- Service area `Sydney & surrounds`
- `ABN 00 000 000 000`
- Stats (10+ years, 500+ projects), testimonials, and the Facebook/Instagram links (`href="#"`)
- Photos: see `site/images/README.md`
