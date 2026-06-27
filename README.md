# AI Transformers Vietnam - Website

The website for the AI Transformers Vietnam community (aitransformersvietnam.com).
A static site deployed on Netlify, with a serverless function for the pitch form.

**Repository:** https://github.com/AI-Transformers-Vietnam/website

This site is part of the AI Transformers Vietnam monorepo
(`AI-Transformers-Vietnam/ai-transformers-vietnam`, under `sites/`) and is also
published to its own repo,
[AI-Transformers-Vietnam/website](https://github.com/AI-Transformers-Vietnam/website),
so it can be shared with outside collaborators. The two are kept in sync with
git subtree (see the monorepo README). It stands alone: everything needed to run
and deploy the site is in this repo.

## Structure

```
public/                       # web root (Netlify publish dir) - deployed
├── index.html                # home page
├── pitch/index.html          # "Pitch It" application page
├── favicon.svg, favicon-32x32.png, apple-touch-icon.png
└── assets/
    ├── brand/                # logo SVGs used by the pages
    ├── posters/              # event poster images
    └── gallery/
        ├── thumbs/<event>/   # gallery thumbnails (shown in the grid)
        └── full/<event>/     # full-res photos (shown in the lightbox)

netlify/functions/
└── pitch-apply.js            # POST /api/pitch-apply -> emails the team via Resend

netlify.toml                  # publish dir, /api redirect, cache headers
.env / .env.example           # RESEND_API_KEY etc. (.env gitignored)
```

## Deploy (Netlify)

Netlify connects to this repo. Leave **Base directory** blank; `netlify.toml`
sets `publish = "public"` and the `/api/pitch-apply` redirect.

- **Live (production):** the `main` branch -> aitransformersvietnam.com
- **Staging:** the `staging` branch -> a staging URL
  (e.g. `staging.aitransformersvietnam.com`). Pull requests also get their own
  Netlify deploy preview automatically.

### Promote staging -> live

Merge `staging` into `main` (Netlify rebuilds production), or in the Netlify UI:
Deploys -> pick the approved deploy -> **Publish deploy**.

## The pitch form / API

`public/pitch/index.html` POSTs to `/api/pitch-apply`, which `netlify.toml`
routes to `netlify/functions/pitch-apply.js`. That function emails applications
via Resend.

Required env var: `RESEND_API_KEY` (plus optional `PITCH_NOTIFY_TO` /
`PITCH_NOTIFY_FROM`). See `.env.example`. Set these in the Netlify UI for
production and in a local `.env` for `netlify dev`.

## Assets and the gallery manifest

All served assets live under `public/assets/`. The gallery is driven by an
inlined JSON manifest in `public/index.html`, between the `GALLERY_DATA_START` /
`GALLERY_DATA_END` markers. To add photos for an event:

1. Put thumbnails in `public/assets/gallery/thumbs/<event>/`.
2. Put full-res images in `public/assets/gallery/full/<event>/`.
3. Add matching `{ thumb, full, event, alt }` entries to the manifest.

## Local development

```bash
cp .env.example .env          # fill in real values
npx netlify dev               # http://localhost:8888 (serves public/ + functions)
```
