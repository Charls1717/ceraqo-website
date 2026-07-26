# Q-ARMOR — Shopify installation

This package moves the full scroll site into Shopify as its own page
(no embeds, no iframes). It is split exactly as requested:

| Folder | What it is | Where it goes in Shopify |
|---|---|---|
| `cdn-assets/` | (a) the built JS, CSS and font files | Theme **Assets** folder |
| `page-template/` | (b) the HTML/Liquid page template | Theme **Templates** |
| `frames-upload/` (four zips + misc) | (c) the scroll-sequence frames | **Content > Files** (drag & drop) |

## 1. Upload the code files (once per rebuild)

Online Store → Themes → ⋯ → **Edit code** → Assets → *Add a new asset*:
upload **every file in `cdn-assets/`** (qa-index.js, qa-index.css, the
qa-space-grotesk-… fonts, qa-favicon.svg). File names are stable across
rebuilds — a future update only needs qa-index.js / qa-index.css
re-uploaded.

## 2. Upload the frame images (once)

Content → **Files** → drag in everything from the frame zips:

- `qarmor-frames-desktop.zip` — 485 files (desktop tier)
- `qarmor-frames-hidpi.zip` — 485 files (retina desktop tier)
- `qarmor-frames-mobile.zip` — 485 files (landscape-phone tier)
- `qarmor-frames-mobile-portrait.zip` — 485 files (portrait-phone tier)
- plus the poster + stills included in the core zip (`qa-poster.webp`,
  `qa-frames-stills-z1.webp` … `z5.webp`)

**Names must stay exactly as they are.** Shopify Files has no folders,
which is why every file carries its tier in its name
(`qa-frames-desktop-f0001.webp`, …). If a name already exists Shopify
silently renames the new upload (`…_1.webp`) and that frame will 404 —
if in doubt, search Files for the name first and delete the old copy.
Upload in batches (a few hundred at a time) if the uploader struggles
with 1,940 files at once.

## 3. Install the page template

Edit code → Templates → *Add a new template* → type **page**, format
**liquid**, name **q-armor** → paste the contents of
`page-template/page.q-armor.liquid` → Save.

Then: Online Store → Pages → *Add page* → title "Q-ARMOR" → in
**Theme template** pick `q-armor` → Save → View. The page is a normal
Shopify page — title/URL/SEO editable in the admin like any other.

## 4. Point the buy buttons at your product  ← the one-line switch

In `page.q-armor.liquid` find:

    window.QARMOR_PREORDER_URL = '';

and set it to your product page, e.g.

    window.QARMOR_PREORDER_URL = '/products/q-armor';

Every "Pre-order — €169" control (floating pill, inline button,
pre-order block) becomes a direct link to it. While it stays `''` the
buttons show the disabled "Pre-orders open shortly" state. No rebuild
needed — it's read at page load.

## Notes & limits

- **Blank canvas**: the template uses `layout none`, so the theme
  header/footer and theme-injected scripts (analytics, pixels, chat
  apps) do not load on this page. Add any tags you need directly in
  the template's `<head>`.
- **Partnership form**: the bottom "Send inquiry" form currently
  stores submissions in the visitor's browser only — same as before.
  Tell us where inquiries should go (email/app) and we wire it; a
  Shopify-native contact form is also an option on this template.
- **Rebuilds**: `npm run build:shopify` regenerates `cdn-assets/`
  with identical names; `scripts/build-shopify-package.sh` rebuilds
  this whole package including the renamed frames.
- The GitHub Pages deployment is unaffected — same code serves both;
  the template's two `window.QARMOR_*` globals are what switch it
  into Shopify mode.
