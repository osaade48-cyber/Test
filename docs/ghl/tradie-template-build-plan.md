# TradeBooked: GoHighLevel "Tradie Template" build plan (v2)

> **v2 changes (from the first build):** add yourself as a user before building (calendars need a team member); owner alerts go to an **Owner Mobile** custom value instead of "assigned owner"; notes on GoHighLevel menus that differ from the plan.

This is the master setup every TradeBooked client gets. Build it once in a sub-account called **Tradie Template**, test it, then save it as a **snapshot** and load it into each client (starting with Avera Earthworx).

---

## Prompt to paste into Claude in Chrome

> You're helping me set up GoHighLevel for my marketing agency, TradeBooked (we market Australian tradies). I'm logged in to GoHighLevel in this browser. Follow the build plan below step by step, inside the sub-account called **Tradie Template** only.
>
> Rules:
> - Work only in the **Tradie Template** sub-account. Never change other sub-accounts or agency billing.
> - Never enter card details, buy phone numbers, or change payment or plan settings. Stop and ask me instead.
> - Never send a text, email or call to anyone. Leave every workflow as **Draft** (not published) until I review it.
> - Use Australian spelling. Copy message text exactly as written, including the {{custom value}} placeholders.
> - If a menu name differs from the plan, find the closest match, tell me what you did, and carry on.
> - After each Part, give me a short summary of what you built and anything you couldn't do.
>
> Start with Part 1 and tell me when each Part is done.
>
> [paste the rest of this document below]

---

## Part 0: Done by you (not Claude)

1. Agency view → **Sub-accounts → Create sub-account → Blank**.
   - Name: `Tradie Template`
   - Your email, mobile and address (it's a test account)
   - Time zone: **Australia/Sydney**
2. In the new sub-account: set the **AI spending limit** to **$20/month** for now.
3. **Settings → My Staff / Users → Add user:** add yourself (user type Account, role Admin). Calendars can't be created without a team member.
4. Don't buy a phone number for the template. Clients get their own.
5. When creating the sub-account: turn **off** "Include sample data" and choose **"This is my client's account"**. Check the business name is `Tradie Template` (GoHighLevel can fill it in from the address search).

---

## Part 1: Custom values

**Settings → Custom Values → Add.** These make every message personal for each client. Create each one with the example value shown (we replace them per client).

| Name | Example value (template) |
|---|---|
| Business Name | Dazza's Landscaping |
| Owner First Name | Dazza |
| Owner Mobile | 0400 000 000 (where owner alerts are sent) |
| Business Phone | 0400 000 000 |
| Business Email | hello@example.com.au |
| Website URL | https://example.com.au |
| Review Link | https://g.page/r/EXAMPLE/review |
| Service Area | the Hills District |
| Trade | landscaping |
| Business Hours | Mon–Sat 7am–5pm |
| Booking Link | (leave blank for now, add the calendar link after Part 5) |
| Booking Mode | book (or "callback" for clients who don't want automatic bookings; the AI receptionist, lead caller and chatbot read this) |

In messages these are inserted as `{{custom_values.business_name}}`, `{{custom_values.owner_first_name}}` and so on. If GoHighLevel shows a different key, use the custom value picker in the message editor instead of typing.

---

## Part 2: Custom fields and tags

### Contact custom fields
**Settings → Custom Fields → Add field** (object: Contact). Put them in a folder called **Job details**.

| Field | Type | Options |
|---|---|---|
| Lead Source | Dropdown (single) | Google Ads, Meta Ads, Website form, Phone call, Google profile, Referral, Job finder, Other |
| Job Type | Single line text | |
| Suburb | Single line text | |
| Job Details | Multi line text | |
| Access Notes | Single line text | |
| Preferred Contact | Dropdown (single) | Text, Call |
| Quote Amount | Monetary | |
| Quote Sent Date | Date (or "Date & time" set to date only) | |

### Tags
**Settings → Tags** (or create them as you go): `new-lead`, `missed-call`, `site-visit-booked`, `quote-sent`, `won`, `job-completed`, `lost`, `review-requested`, `review-left`, `no-marketing`

---

## Part 3: Pipeline

**Opportunities (CRM) → Pipelines → Create pipeline.**
- Name: **Jobs**
- Stages, in this order:
  1. New lead
  2. Contacted
  3. Site visit booked
  4. Quote sent
  5. Won (job booked)
  6. Job completed
  7. Lost

---

## Part 4: Opportunity settings
- Default opportunity name: `{{contact.name}} – {{contact.job_type}}` (or just the contact name if that isn't available).
- Make sure "Lost reason" is available, with reasons: Too expensive, Went with someone else, Not ready yet, No response, Not our type of job.

---

## Part 5: Calendar

**Calendars → Create calendar → simple round robin / personal booking** (whichever is "single person").
- Name: **Free site visit**
- Description: `Book a free site visit and quote. We'll come out, look at the job and give you a clear price. No obligation.`
- Duration: **45 minutes**, with **30 minutes buffer** after.
- Availability: **Mon–Sat, 7:00am–4:00pm** (Australia/Sydney).
- Minimum notice: **24 hours**. Booking window: **30 days** ahead.
- Booking form fields: First name, Last name, Mobile, Email (optional), **Suburb**, **Job Details**, **Access Notes**.
- Turn **off** the calendar's own default emails and texts (Workflow 3 sends them instead).
- After saving, copy the calendar's **booking link** into the **Booking Link** custom value (Part 1).

---

## Part 6: Missed-call text-back

**Settings → Phone Numbers → (advanced / phone settings)** → turn on **Missed Call Text Back** if it exists as a setting, with this message:

> Hi, it's {{custom_values.owner_first_name}} from {{custom_values.business_name}}. Sorry I missed your call, I'm on a job. What can I help you with? Reply here and I'll get back to you shortly.

If the setting isn't available, build it as **Workflow 2** below instead (don't do both).

---

## Part 7: Text templates (snippets)

**Marketing → Snippets / Templates → SMS → Add.** Save each with the name shown, so workflows and manual replies can reuse them.

**T1 – New lead reply**
> Hi {{contact.first_name}}, thanks for getting in touch with {{custom_values.business_name}}! I'm on a job right now but I'll call you back shortly. If it's easier, you can book a free site visit here: {{custom_values.booking_link}}

**T2 – Missed call**
> Hi, it's {{custom_values.owner_first_name}} from {{custom_values.business_name}}. Sorry I missed your call, I'm on a job. What can I help you with? Reply here and I'll get back to you shortly.

**T3 – Site visit confirmed**
> Hi {{contact.first_name}}, you're booked in for a free site visit with {{custom_values.business_name}} on {{appointment.start_time}}. If anything changes, just reply to this text. See you then!

**T4 – Site visit reminder (day before)**
> Hi {{contact.first_name}}, just a reminder that {{custom_values.owner_first_name}} from {{custom_values.business_name}} is coming out for your site visit tomorrow at {{appointment.start_time}}. Reply here if you need to change the time.

**T5 – Quote follow-up 1 (day 2)**
> Hi {{contact.first_name}}, it's {{custom_values.owner_first_name}} from {{custom_values.business_name}}. Just checking you got the quote OK. Happy to answer any questions.

**T6 – Quote follow-up 2 (day 5)**
> Hi {{contact.first_name}}, any questions about the quote? If you'd like to go ahead, just reply YES and I'll lock in a start date.

**T7 – Quote follow-up 3 (day 10)**
> Hi {{contact.first_name}}, I'll close off your quote for now so I'm not bugging you. If you'd still like it done down the track, just reply here and I'll sort it. Cheers, {{custom_values.owner_first_name}}

**T8 – Review request**
> Hi {{contact.first_name}}, thanks again for choosing {{custom_values.business_name}}! If you're happy with the job, a quick Google review would really help my small business: {{custom_values.review_link}} Cheers, {{custom_values.owner_first_name}}. Reply STOP to opt out.

**T9 – Review reminder**
> Hi {{contact.first_name}}, just a gentle nudge on that review if you get a sec: {{custom_values.review_link}} No worries if not, appreciate it either way! Reply STOP to opt out.

**T10 – Owner alert: new lead** (sent to {{custom_values.owner_mobile}}, not the customer)
> New lead: {{contact.name}}, {{contact.phone}}. Suburb: {{contact.suburb}}. Job: {{contact.job_details}}. Source: {{contact.lead_source}}

---

## Part 7b: Email templates (added v5)

Emails run alongside the texts. **Owner email alerts are permanent.** Customer emails cover the gap before a client's number is approved, and they back up the texts afterwards. Every email: From name `{{custom_values.business_name}}`, reply-to `{{custom_values.business_email}}`. GoHighLevel skips customer emails when the contact has no email address.

**E1 – New lead reply (customer)**. Subject: `Thanks for getting in touch, {{contact.first_name}}`
> Hi {{contact.first_name}},
> Thanks for contacting {{custom_values.business_name}}. We've got your enquiry and {{custom_values.owner_first_name}} will call you back shortly (usually within a few hours during business hours).
> If it's easier, you can book a free site visit here: {{custom_values.booking_link}}
> Cheers, {{custom_values.owner_first_name}}
> {{custom_values.business_name}} · {{custom_values.business_phone}} · {{custom_values.website_url}}

**E3 – Site visit confirmed (customer)**. Subject: `Your free site visit is booked`
> Hi {{contact.first_name}}, you're booked in for a free site visit with {{custom_values.business_name}} on {{appointment.start_time}}. If anything changes, reply to this email or call {{custom_values.business_phone}}. See you then!

**E5 – Quote follow-up (customer, day 2)**. Subject: `Your quote from {{custom_values.business_name}}`
> Hi {{contact.first_name}}, just checking you received your quote OK. Happy to answer any questions or walk through it on the phone: {{custom_values.business_phone}}. If you'd like to go ahead, just reply to this email and we'll lock in a start date. Cheers, {{custom_values.owner_first_name}}

**E8 – Review request (customer)**. Subject: `Thanks for choosing {{custom_values.business_name}}`
> Hi {{contact.first_name}}, thanks again for choosing {{custom_values.business_name}}. If you're happy with the job, a quick Google review would really help our small business. It takes 30 seconds: {{custom_values.review_link}} Cheers, {{custom_values.owner_first_name}}

**EA – Owner alert: new lead** (to `{{custom_values.business_email}}`). Subject: `New enquiry: {{contact.name}}`
> New enquiry from {{contact.name}}
> Phone: {{contact.phone}}
> Email: {{contact.email}}
> Suburb: {{contact.suburb}}
> Job: {{contact.job_details}}
> Source: {{contact.lead_source}}
> Call them back as soon as you can. Photos and full details are in GoHighLevel.

**EB – Owner alert: site visit booked**. Subject: `Site visit booked: {{contact.name}}`
> {{contact.name}} ({{contact.phone}}) booked a free site visit for {{appointment.start_time}} in {{contact.suburb}}.

**EC – Owner alert: missed call**. Subject: `Missed call from {{contact.phone}}`
> You missed a call from {{contact.phone}}. A text-back was sent automatically. Call them back when you can.

**Where they go:** Workflow 1 → EA right after the trigger (before any SMS), and E1 after T1. Workflow 2 → EC. Workflow 3 → E3 after T3, EB with the owner text. Workflow 4 → E5 alongside T5. Workflow 5 → E8 alongside T8.

---

## Part 8: Workflows (Automations)

**Automations → Workflows → Create workflow → Start from scratch.** Build each one, then leave it as **Draft**.

General settings on every workflow:
- **Owner alerts:** every "internal notification" goes out twice: an SMS to `{{custom_values.owner_mobile}}` **and** an email to `{{custom_values.business_email}}` (Part 7b). Don't use "Assigned owners". This works in every client account without user setup, and the email works before the client's number is approved.
- **Opportunity name:** set `{{contact.name}} – {{contact.job_type}}` inside the create-opportunity steps (there's no account-wide setting).
- **Allow re-entry:** off (unless stated).
- **Time window / quiet hours:** customer texts only send **Mon–Sat 7am–7pm** (Australia/Sydney). If a text would send outside that, wait until the window opens.

### Workflow 1 – New lead: instant reply + alert
- **Triggers** (add all that exist):
  - Form submitted (any form)
  - Facebook lead form submitted
  - Contact tag added: `new-lead`
- **Actions:**
  1. Create/update opportunity → pipeline **Jobs**, stage **New lead**.
  2. Add tag `new-lead`.
  3. Send SMS to contact → template **T1**.
  4. Send internal notification SMS to the **owner/assigned user** → template **T10**.
  5. Wait **10 minutes**.
  6. Find opportunity (GoHighLevel needs this step before checking the stage).
  7. If/else: opportunity still in **New lead** → send owner an internal notification: `Reminder: call {{contact.name}} ({{contact.phone}}) back, they enquired 10 mins ago.`

### Workflow 2 – Missed call text-back (only if Part 6 setting isn't available)
- **Trigger:** Call status → inbound call **missed / no answer**.
- **Actions:**
  1. Send SMS → template **T2**.
  2. Add tag `missed-call`.
  3. If no open opportunity: create opportunity → **Jobs / New lead**, Lead Source = Phone call.
  4. Internal notification to owner: `Missed call from {{contact.phone}}. Text-back sent.`

### Workflow 3 – Site visit booked
- **Trigger:** Appointment status = **booked/confirmed**, calendar **Free site visit**.
- **Actions:**
  1. Move opportunity → **Site visit booked**. Add tag `site-visit-booked`.
  2. Send SMS → **T3**.
  3. Wait until **24 hours before** the appointment.
  4. Send SMS → **T4**.
  5. Internal notification to owner on booking: `Site visit booked: {{contact.name}}, {{appointment.start_time}}, {{contact.suburb}}.`

### Workflow 4 – Quote follow-up
- **Trigger:** Pipeline stage changed → **Quote sent** (pipeline Jobs).
- **Settings:** **Stop on response** = on (if the customer replies, the follow-ups stop).
- **Actions:**
  1. Add tag `quote-sent`. Update field **Quote Sent Date** = today.
  2. Wait **2 days** → if still **Quote sent** → SMS **T5**.
  3. Wait **3 days** → if still **Quote sent** → SMS **T6**.
  4. Wait **5 days** → if still **Quote sent** → SMS **T7**, then internal notification to owner: `No reply on quote for {{contact.name}} after 10 days. Mark won/lost?`
- **Goal/exit:** stage changes to **Won**, **Job completed** or **Lost** → end workflow.

### Workflow 5 – Job completed → review request
- **Trigger:** Pipeline stage changed → **Job completed**.
- **Actions:**
  1. Add tag `job-completed`.
  2. If contact has tag `no-marketing` → end.
  3. Wait **2 hours** (inside the time window).
  4. Send SMS → **T8**. Add tag `review-requested`.
  5. Wait **4 days** → if contact does **not** have tag `review-left` → send SMS **T9**.
  6. End.

### Workflow 6 – Won → owner checklist
- **Trigger:** Pipeline stage changed → **Won (job booked)**.
- **Actions:**
  1. Add tag `won`. Remove tag `quote-sent`.
  2. Internal notification to owner: `Job won: {{contact.name}}. Remember to move it to "Job completed" when finished so the review request goes out.`

### Workflow 7 – Lost → tidy up
- **Trigger:** Pipeline stage changed → **Lost**.
- **Actions:** add tag `lost`, remove `quote-sent`. (Later: a 3-month "still need it done?" check-in.)

---

## Part 9: Reputation (reviews)

- **Reputation → Settings:** set the review request channel to **SMS** and the review link to `{{custom_values.review_link}}` (or the connected Google profile once a client connects theirs).
- Turn **off** any automatic review requests in Reputation settings, because Workflow 5 handles them (avoids double texts).
- Per client later: connect their **Google Business Profile** (Settings → Integrations) so reviews show in GoHighLevel and can be replied to.

---

## Part 10: AI chatbot (Conversation AI): draft only

**AI → Conversation AI (or AI Agents) → Create bot.** Keep it **off / suggestive mode** in the template.
- Name: **Website assistant**
- Channels: **Web chat**, **SMS**, Facebook and Instagram (later, per client).
- Goal: answer questions and **book a free site visit** using the **Free site visit** calendar, or collect name, mobile, suburb and job details.
- Personality / instructions:
  > You're the friendly assistant for {{custom_values.business_name}}, a {{custom_values.trade}} business servicing {{custom_values.service_area}}. Hours: {{custom_values.business_hours}}. Keep replies short, friendly and Australian. Your job is to understand what the customer needs (job type, suburb, rough size, access), then book a free site visit or take their details for {{custom_values.owner_first_name}} to call back. Never promise exact prices or dates; say {{custom_values.owner_first_name}} will confirm after the site visit. If someone is upset or it's urgent, take their number and say they'll get a call back as soon as possible.
- Knowledge base: add the client's **website URL** (per client) and a short FAQ.

---

## Part 11: Save the snapshot

Agency view → **Account Snapshots → Create new snapshot** → source: **Tradie Template** → name: `TradeBooked Tradie Setup v2` (bump the number each time you re-save).

To load into a client: create their sub-account **from this snapshot**, then update all **Custom Values**, connect their number, calendar, Google profile and website form, and turn on the workflows.

---

## Part 12: Test before using with real customers

Use your own mobile as a test contact in **Tradie Template**:
1. Submit a test form → you get **T1**, owner alert **T10**, opportunity appears in **New lead**.
2. Book the calendar → **T3**, moved to **Site visit booked**.
3. Move to **Quote sent** → check waits are set (temporarily change 2 days to 2 minutes to test, then change back).
4. Reply to a follow-up → follow-ups stop.
5. Move to **Job completed** → **T8** with the review link.
6. Check all texts show real values, not blank placeholders.

---

## Per-client setup checklist (after the snapshot)
- [ ] Create sub-account from the latest snapshot (latest version, currently `TradeBooked Tradie Setup v4`), time zone Australia/Sydney
- [ ] Add the owner (and you) as users; reassign the **Free site visit** calendar to the client's user
- [ ] **Activate the Free site visit calendar** (snapshots bring calendars across as Inactive, so the booking link shows "Page Not Found") and re-set its hours to Mon–Sat 7am–4pm (they reset to weekdays 8–5)
- [ ] Custom values come across **blank** from the snapshot: fill in every one
- [ ] Check Workflow 3's calendar filter, the chatbot's booking calendar and Workflow 1's form trigger all point to **this account's** calendar and form, not the template's
- [ ] Fill in every Custom Value (name, owner, **owner mobile**, phone, email, website, review link, area, trade, hours, **booking mode**)
- [ ] **Review Link:** open the client's Google Business Profile (the onboarding form gets you added as a manager) → **Ask for reviews** → copy the link → paste into the Review Link custom value. Takes 1 minute. If they have no profile yet, create and verify it first. Review requests can't work without it
- [ ] **Booking Link:** copy the client's own "Free site visit" calendar link into the Booking Link custom value (each account gets a new link)
- [ ] Check Business Profile and user time zones are the client's city (e.g. Australia/Sydney, not Brisbane)
- [ ] Workflow 1 trigger: limit to the client's website quote form (never the booking form)
- [ ] Phone number (start on day 1, approval takes 1–3 business days): Settings → Phone System → Regulatory Bundles
  - First create an **Address Bundle** (business address), then a **Regulatory Bundle** (Australia → Business or Individual → **Mobile**) and select that address
  - Documents: proof of name (ABN Lookup PDF, or driver's licence for Individual) and proof of address dated in the last 3 months (utility or phone bill, ATO notice, council rates, lease). The name and address must match exactly
  - Once approved: Add Number → Australia → Mobile, friendly name "<Business> Main", forward to the owner's mobile
  - Owner sets their mobile to forward **unanswered** calls to the GHL number (missed-call text-back)
- [ ] Email: Settings → Email Services → **Dedicated domain** `mail.<clientdomain>`; add its DNS records in Cloudflare so follow-ups don't land in spam
- [ ] Connect their calendar (Google/Outlook) to the user
- [ ] Website Quote Form: check the file upload field (site photos) is there, set **On submit → Redirect to URL** `https://<clientdomain>/thanks` (Google Ads counts the lead on that page), then Integrate → embed on the client's contact page
- [ ] Website is hosted on **Cloudflare Pages** (see `docs/hosting.md`), with a `/thanks` page set to noindex
- [ ] Connect Google Business Profile (reviews) and Facebook page (leads/messages)
- [ ] **Client app handover** (see "Client app setup" below): add them as a user, text them the app steps, do the 5-minute run-through, send a test lead together
- [ ] Turn on workflows 1–7 (publish), then send one test lead

---

## Client app setup (LeadConnector)

LeadConnector is GoHighLevel's free mobile app: the inbox, pipeline, contacts, calendar, notifications and reviews on the client's phone.

### 1. Add the client as a user
1. In the client's sub-account: **Settings → Team / Users → Add user**. Enter their name, email and mobile.
2. **Role: User** (not Admin).
3. Permissions **on**: Conversations, Contacts, Opportunities, Calendars. **Off**: Automations, Settings, Sites, Marketing.
4. Turn on their notifications for new leads, new messages and new bookings.
5. Set a temporary password, or send GoHighLevel's login invite.
6. Reassign the **Free site visit** calendar to them if it isn't already.

### 2. Text the client the setup steps
Saved as the snippet **"TB – App setup"** in TradeBooked's own sub-account (create it once that account exists; until then copy from here).

> G'day [Name], your new lead system is ready! Set up the app on your phone (2 mins):
> 1. Download "LeadConnector" from the App Store or Google Play
> 2. Log in with: [their email]
>    Password: check the email from us, or use [temp password] and change it once you're in
> 3. Allow notifications when it asks, so you're alerted to every new lead
>
> Let me know once you're in and I'll give you a quick 5-min run-through.

### 3. Five-minute run-through (phone or screen share)
1. **Conversations**: where customer replies land, and how to reply.
2. **Opportunities**: drag a lead to **Site visit booked** after calling, **Quote sent** after quoting, **Job completed** when done (that sends the review request).
3. **Calendar**: booked site visits.
4. **Contact page**: job details and photos from the quote form.

### 4. Test together
Submit a test lead on their website during the call, so they see the notification arrive. Then delete the test contact.

Notes: the app is free and shows LeadConnector branding (a white-label app with TradeBooked branding costs extra, so it's only worth it later). Password resets are on the app's login screen.

