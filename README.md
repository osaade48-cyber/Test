# Avera Earthworx website

The static website for **averaearthworx.com.au**. It's plain HTML and CSS with no build step, made for free hosting on Netlify.

## What's in here

| File | What it is |
|---|---|
| `index.html` | Home page |
| `services.html` | All 9 services |
| `about.html` | About page |
| `contact.html` | Quote form (with photo upload) |
| `thanks.html` | Shown after someone sends the form |
| `404.html` | "Page not found" page |
| `css/style.css` | All the styling (colours are set at the top) |
| `js/main.js` | Menu, animations, service switcher |
| `netlify.toml` | Netlify settings + redirects from the old Shopify links |
| `tools/download-images.sh` | Copies your photos off Shopify into `images/` |

## Going live on Netlify

1. **Copy the photos off Shopify first.** The pages currently load the photos from Shopify's servers, and they stop working once the Shopify store closes. Run this once on a computer (Mac, Linux, or Windows with Git Bash):
   ```bash
   bash tools/download-images.sh
   ```
   Then commit the new `images/` folder. You can also ask Claude to do it.
2. Go to <https://app.netlify.com>, sign up, then click **Add new site → Import an existing project → GitHub** and pick this repository. Leave the build command empty and set the publish directory to `.`.
3. **Turn on the quote form.** In Netlify, open **Site configuration → Forms** and click **Enable form detection**, then redeploy. Under **Forms → Form notifications**, add an email notification to `info@averaearthworx.com.au` so every enquiry lands in your inbox.
4. **Connect the domain.** In Netlify, go to **Domain management → Add a domain** and enter `averaearthworx.com.au`. Netlify shows you the DNS records to set. Change them wherever the domain is managed (Shopify, if you bought it through Shopify, or your registrar). Netlify adds free HTTPS automatically.
5. Check the site works on the real domain and send yourself a test enquiry. **Only then** cancel the Shopify plan. If the domain was bought through Shopify, transfer it out before you close the store.

## Editing text

Open the `.html` file and change the words between the tags. The phone number and email appear in several places, so use find-and-replace across all files.
