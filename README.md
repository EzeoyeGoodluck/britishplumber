# The British Plumber — website

The British Plumber site (britishplumber.uk), rebuilt from the old Durnovaria WordPress site into plain HTML/CSS/JS. Nothing to install.
All 8 pages keep their original addresses (`/about/`, `/plumbing/`, `/central-heating/`, `/boiler-installation/`, `/boiler-repairs/`, `/emergency-call-out/`, `/contact/`), so Google rankings and existing links carry over.
Colours (navy `#010D1D`, gold `#B7862A`) and the Outfit font match the old site. The logo is in `public/assets/img/logo.png` (also used for the favicon and the image shown when the link is shared).

## Folder layout

```
site.config.json     ← mobile, landline, email, address, form address, image links (edit once, updates every page)
src/pages/           ← one file per page (the content)
src/partials/        ← shared bits: header/footer layout, service sidebar, stats strip
public/              ← the finished site (generated — don't edit its .html files directly)
public/assets/       ← styles.css (colours at the top), main.js, favicon, images
build.mjs            ← stitches pages + partials into public/
download-images.mjs  ← copies the images off the old WordPress site (run once — see below)
vercel.json          ← Vercel settings
```

## 1. Copy the images off WordPress — do this BEFORE cancelling WordPress
The photos are still loaded from the old WordPress site (the logo is already included). Run this once on your computer, in this folder:

```bash
node download-images.mjs
```

It saves all the images into `public/assets/img/`, points the site at them, and rebuilds. Then commit and push.

## 2. Put it on GitHub and Vercel
```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```
On vercel.com → **Add New → Project** → import the repo → leave Framework Preset as **Other** → **Deploy**.
Then **Settings → Domains** → add `britishplumber.uk` and `www.britishplumber.uk`, and set the DNS records Vercel shows you at your domain registrar.

## 3. Activate the contact form (once)
The contact form emails messages to **thebritishplumber@aol.com** through FormSubmit (free, no account).
1. Once the site is live, send a test message from the Contact page.
2. FormSubmit emails thebritishplumber@aol.com an **activation link**. Click it (check spam).
3. Every message after that arrives as an email: name, post code, phone, email and message. Pressing **Reply** answers the customer.

To use a different inbox, change `formsubmitAddress` in `site.config.json`. If you activate on the `.vercel.app` address and later switch to `britishplumber.uk`, you may get one more activation email; just click it again.

## Editing later
Change a page in `src/pages/` or a setting in `site.config.json`, then push. Vercel rebuilds automatically.
To preview on your own computer: `npm run preview`.

## Also included
SEO titles and descriptions for every page, Plumber schema for Google, `sitemap.xml`, `robots.txt`, a 404 page, a mobile menu, and a sticky "Call now / Message us" bar on phones.

## Old domain
If you keep durnovaria.uk, point it at the same Vercel project (**Settings → Domains → add durnovaria.uk → Redirect to britishplumber.uk**). Old links and Google results then land on the new site.
