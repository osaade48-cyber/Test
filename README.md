# MAISON CANINE — luxury modular dog homes

Website and 3D configurator for a premium line of modular dog homes, designed, built and installed in Sydney.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4 and React Three Fiber. Deploys to Vercel as is.

```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # type-check
```

## Pages

| Route        | What it is                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `/`          | Full-screen dusk hero (live 3D), philosophy, materials, climate, process, gallery, CTA |
| `/configure` | The 3D configurator, with a live price, a shareable URL and a "Request this build" button |
| `/the-home`  | Specs, elevation drawings, dimensions, materials and options               |
| `/process`   | Enquiry → site visit → build slot → installation, plus optional site works  |
| `/faq`       | Frequently asked questions                                                 |
| `/enquire`   | Enquiry form, prefilled with the configuration when coming from `/configure` |
| `/render`    | Hidden, noindex: full-window still renders used to make the site imagery   |

## Where to change things

| To change…                                   | Edit                                   |
| -------------------------------------------- | -------------------------------------- |
| **Brand name** (everywhere, incl. emails)    | `src/config/brand.ts` → `name`         |
| Contact details, build time, response time   | `src/config/brand.ts`                  |
| Options, prices, defaults                    | `src/lib/configurator.ts`              |
| Dimensions and proportions of the home       | `src/lib/dimensions.ts`                |
| Colours and fonts of the site                | `src/app/globals.css` (`@theme`) and `src/app/layout.tsx` |
| Page copy                                    | `src/app/<page>/page.tsx`              |
| 3D model source (procedural or .glb)         | `src/config/model.ts`                  |

Prices are recalculated on the server when an enquiry is sent, so the email always matches `src/lib/configurator.ts`.

## Enquiry emails with Resend

The enquiry form posts to `src/app/api/enquire/route.ts`. That route validates the enquiry, recalculates the price and sends you an email with the customer's details, the full configuration, the price breakdown and a link that opens the configuration in 3D. Reply-to is set to the customer, so you can reply straight from your inbox.

1. **Create an account** at [resend.com](https://resend.com).
2. **Verify your domain**: Resend → *Domains* → *Add domain*. Add the DNS records it shows (SPF/DKIM) at your domain registrar and wait for it to verify.
   *Before your domain is verified* you can send from `onboarding@resend.dev`, but Resend only delivers those emails to the address you signed up with.
3. **Create an API key**: Resend → *API Keys* → *Create API key*, with "Sending access".
4. **Local development**: copy `.env.example` to `.env.local` and fill it in:
   ```
   RESEND_API_KEY=re_...
   ENQUIRY_TO_EMAIL=you@yourdomain.com.au
   ENQUIRY_FROM_EMAIL="MAISON CANINE <enquiries@yourdomain.com.au>"
   SEND_CUSTOMER_CONFIRMATION=false
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Without a key in development, the form still works and the email is printed to the terminal instead.
5. **Production**: in Vercel → your project → *Settings* → *Environment Variables*, add the same variables (with `NEXT_PUBLIC_SITE_URL` set to your real domain), then redeploy.

`ENQUIRY_TO_EMAIL` accepts several addresses separated by commas. Set `SEND_CUSTOMER_CONFIRMATION=true` to also send the customer a short thank-you (needs a verified domain).

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, *Add New → Project*, import the repository. The defaults (Next.js, `npm run build`) are correct.
3. Add the environment variables above, then deploy.
4. Add your domain under *Settings → Domains*.

## The 3D configurator

- `src/components/three/Scene.tsx`: canvas, lighting, camera and post-processing. It is lazy-loaded through `SceneView.tsx` (`next/dynamic`, `ssr: false`), so three.js never blocks the first paint. An elegant loading state (and, on the home page, a poster render) shows until the first frame is ready, and then the canvas fades in.
- `src/components/three/model/`: the home, built in code from `src/lib/dimensions.ts`. Each part is its own component: `Walls`, `Roof`, `Front` (slats, opening frame, sliding door and plaque), `Interior` (lining, floor, bed), `Extras` (deck, planter) and `Lighting` (LED kit).
- Materials are physically based (`materials.ts`). The reflections come from an HDRI (Poly Haven *Rooitou Park*, CC0), softened by `scripts/prepare-hdri.mjs` so the low sun and green lawn don't tint the panels.
- Day ↔ dusk, door open/close and LED glow are smoothly animated (`animation.tsx`). The camera eases to the most useful view when an option changes, and gives control back to the visitor the moment they drag (`CameraRig.tsx`).
- Performance: on phones it uses a lower pixel ratio, smaller shadow maps and no ambient occlusion. Quality degrades automatically if the frame rate drops, and rendering pauses whenever the canvas is off screen.

### Swapping in a professional .glb model

See [docs/3D-MODEL.md](docs/3D-MODEL.md). In short: export one `.glb` per size into `public/models`, follow the node-naming guide, and set `MODEL.source = "glb"` in `src/config/model.ts`.

### Textures and imagery

- `npm run textures` regenerates the tileable PBR textures in `public/textures` (timber, birch ply, vinyl, rubber, lawn, pavers…). To upgrade to photographic textures, drop CC0 JPGs from ambientCG or Poly Haven into `public/textures` using the same filenames.
- Gallery, hero poster and page images are rendered from the live model. With `npm run dev` running, use `node scripts/render-images.mjs` (needs `npm i -D playwright && npx playwright install chromium`). Re-run it after changing the model so the photos always match the configurator. You can also replace any of them with real photography in `public/images`.

## Placeholder content to review

- Brand name: `MAISON CANINE`.
- Build time ("4–6 weeks"), installation time ("usually a single day") and response time ("within two business days") in `src/config/brand.ts`.
- Contact email, phone and Instagram (blank, so hidden) in `src/config/brand.ts`.
- FAQ answers about council approval, relocation and service area in `src/app/faq/page.tsx`.
