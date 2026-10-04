# HornHub Shopify theme

A custom Shopify Online Store 2.0 theme for **HornHub**, which sells wireless programmable car horns.

It's built to sell one hero product: a dark, premium automotive look with orange accents, a slide-out cart, a sticky buy bar on mobile, and every piece of text, image and setting editable in Shopify's theme editor. Prices, images, variants, stock, cart and checkout all come from your store, so nothing about the product itself is hardcoded.

---

## 1. Get the theme into Shopify

You need a Shopify store first. A free trial works: <https://www.shopify.com>.

### Option A: Connect GitHub (recommended, no tools to install)

1. In Shopify admin, go to **Online Store → Themes**.
2. Scroll to **Theme library** and click **Add theme → Connect from GitHub**.
3. Log in to GitHub and authorise Shopify, then pick the repository **`hennersbenners200-web/horhub`** and the branch that holds this theme.
4. The theme appears in your theme library. Click **Customize** to edit it, or **Publish** when you're ready to go live.

From then on, changes pushed to that branch update the theme automatically, and changes you make in the theme editor are committed back to GitHub.

### Option B: Shopify CLI (for local development)

Install [Node.js](https://nodejs.org) (LTS), then in a terminal:

```bash
npm install -g @shopify/cli
git clone https://github.com/hennersbenners200-web/horhub.git
cd horhub
shopify theme dev --store your-store-name.myshopify.com
```

This opens a live preview at `http://127.0.0.1:9292` that reloads as you edit files. Use `shopify theme push` to upload, and `shopify theme check` to lint.

---

## 2. Set up your store (about 20 minutes)

Do these in Shopify admin, in this order.

### a. Create the product

**Products → Add product**

- **Title**, for example *HornHub Wireless Programmable Horn*
- **Price**, plus **Compare-at price** if you're running a genuine discount (the theme then shows the saving automatically)
- **Media**: upload at least 4 square photos (2000 × 2000px). The first one is the main image.
- **Description**: shown in the "Description" tab on the product page
- **Variants** (optional), for example *Kit: Standard / Twin button*. The product page shows them as selectable pills automatically.

### b. Connect the product to the homepage

**Online Store → Themes → Customize**. On the homepage, choose your product in each of these sections:

| Section | Setting |
| --- | --- |
| Hero | Featured product |
| Product showcase | Product |
| Final call to action | Product |
| Reviews | Product for rating summary |

### c. Navigation menu

**Online Store → Navigation → Main menu**. Replace the default links with:

| Label | Link |
| --- | --- |
| Shop | your product (or *Collections → All products*) |
| How it works | `/#how-it-works` |
| FAQ | `/#faq` |
| Contact | `/pages/contact` |

Also edit the **Footer** menu with the links you want in the footer.

### d. Contact page

**Online Store → Pages → Add page**. Title it **Contact**, and under *Theme template* choose **contact**. Leave the content empty to use the theme's default intro text.

### e. Policies

**Settings → Policies**: fill in Refund, Shipping, Privacy and Terms. They're linked in the footer automatically.

### f. Payments

**Settings → Payments**: turn on Shopify Payments, Shop Pay, Apple Pay and so on. The product page's express checkout buttons and the footer's payment icons appear automatically for whatever you enable.

---

## 3. Replace placeholder images

Every image slot shows a labelled placeholder with a **suggested filename, size and description** until you upload a photo. In the theme editor, click the section and use its image setting.

| Where | Suggested file | Size |
| --- | --- | --- |
| Hero | `hero-hornhub-kit.jpg` | 1600 × 2000 |
| Product showcase | `showcase-horn-unit.jpg` | 1800 × 1800 |
| How it works (×4) | `step-1-connect.jpg` … `step-4-use-it.jpg` | 1200 × 900 |
| Sound lab | `sound-remote-in-hand.jpg` | 1800 × 1800 |
| Lifestyle gallery (×5) | `lifestyle-night-meet.jpg` (large), plus four 1200 × 1500 tiles | see editor |
| Final call to action | `final-cta-kit-contents.jpg` | 1600 × 1600 |

If you leave the Hero, Showcase or Final CTA images empty, they use your product photos instead. Shopify resizes and compresses everything automatically, so upload high quality.

Also set your **logo**, **favicon** and **social sharing image** in **Theme settings → Brand**.

---

## 4. Reviews: use real ones only

The Reviews section ships with **three clearly labelled placeholder cards**. They show a yellow "Placeholder" badge and a notice on the live site, so they can't be mistaken for real feedback. Before launch:

1. Install a reviews app (for example *Judge.me* or *Shopify Product Reviews*).
2. In the theme editor, open the **Reviews** section → **Add block** → pick the app's widget.
3. Delete the placeholder review blocks.

Once your app publishes ratings, star ratings appear automatically in the hero, on the product page, on product cards and in Google results. Nothing is shown until real ratings exist.

You can also add a review manually, but only one you have permission to publish: untick "This is a placeholder review".

---

## 5. Optional: playable sound previews

In the **Sound lab** section, each sound can have an audio file. Upload short MP3s in **Content → Files**, copy each file's URL, and paste it into the matching *Sound audio URL* field. Sounds with audio get a play button; sounds without one display as a list only.

---

## 6. Before you launch: check every claim

The copy matches the product description in your store: your own MP3/WAV sounds loaded via USB, a wireless 4-button remote, up to 130dB, 12V vehicles, installed alongside your existing horn. **Make sure these still match your supplier's specs and your policies**, and edit anything that doesn't:

- [ ] **Shipping**: "Free tracked shipping", "dispatched within 1 working day" (announcement bar, trust strip, product page, FAQ, mobile menu)
- [ ] **Returns**: "30-day returns" (and that your refund policy says the same)
- [ ] **Warranty**: "12-month warranty"
- [ ] **Product specs**: 130dB, MP3/WAV via USB, wireless 4-button remote, 12V, works alongside the existing horn
- [ ] **What's in the box** (product page → *Specs & what's included*): currently lists only the horn unit and remote. Add the wiring, mounts, USB stick and so on if they're included.
- [ ] **Compare-at ("was") price**: only use one if you genuinely sold at that price
- [ ] **Horn-use notice**: edit in **Theme settings → Search engine & legal**. Horn laws vary by country and region, so the theme never claims the product is road legal.
- [ ] Remove or replace all **placeholder reviews**

---

## 7. What's in this repository

```
layout/      Page shell (theme.liquid) and the password page layout
templates/   Which sections appear on each page type (JSON, editable in the theme editor)
sections/    Page sections: hero, sound lab, FAQ, product page, cart drawer, …
snippets/    Reusable pieces: icons, price, product form, images, structured data
assets/      base.css (design system), product.css, global.js, favicon
config/      Theme settings (colours, fonts, cart, social links, legal notice)
locales/     All interface text (buttons, cart, accessibility labels)
```

**Design system:** colours and fonts live in **Theme settings** and feed CSS variables in `layout/theme.liquid`. Every section has a *Colour scheme* option (Dark, Dark grey, Light).

**JavaScript** (`assets/global.js`, no libraries) adds the cart drawer, live cart updates, variant switching, the gallery, the sticky buy bar and sound previews. Every purchase path still works with JavaScript turned off.

**SEO:** page titles and meta descriptions, Open Graph tags, and structured data for Organization, WebSite, Product (with price, stock and ratings) and FAQ.
