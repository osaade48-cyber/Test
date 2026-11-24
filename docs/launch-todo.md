# TradeBooked site launch to-do

Do these when tradebooked.com.au goes live on Cloudflare Pages.

- [ ] Move tradebooked.com.au DNS to Cloudflare; deploy the site from this repo (build `node build.js`, output `site`)
- [ ] Set up info@/hello@ email forwarding in Cloudflare
- [ ] **Connect the website forms to the TradeBooked GHL sub-account** (onboarding, booking/text-us, quiz result, chatbot leads): set `formEndpoint` in `site.config.json`, or embed GHL forms. Each submission creates a contact with name, email, mobile and answers
- [ ] TradeBooked sub-account workflow: new website enquiry → instant reply text/email + alert to me + follow-ups if they go quiet
- [ ] TradeBooked sub-account workflow **`app-ready`**: when I add the tag `app-ready` to a client contact → send the "TB – App setup" snippet (uses {{contact.first_name}} and {{contact.email}}, so the client login must use the same email as the onboarding form)
- [ ] Onboarding form: add a proof-of-address upload for the client's GHL phone number (regulatory bundle)
- [ ] GST decision and real ABN in the footer
- [ ] Search Console + sitemap for tradebooked.com.au
