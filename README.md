# RangeList

A farm-to-farm cattle marketplace demo inspired by [Herd Yard](https://herdyard.com) (“the Zillow of cattle”).

This is an original frontend: new name, layout, copy, and sample ranches. It is not affiliated with Herd Yard.

## What it includes

- Landing page with recent listings, stats, plans, and testimonials
- Browse view with breed / class / category filters
- Nationwide map (Leaflet + OpenStreetMap) with listing pins
- Listing detail, photo gallery, contact + follow (gated to signed-in buyers)
- Producer / ranch profile pages
- List-cattle form (saves to `localStorage`)
- Sign up / sign in / account dashboard (browser-only)
- Pricing and FAQ

## Run it

Open `index.html` in a browser, or from this folder:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

Needs internet for fonts, Leaflet, map tiles, and Unsplash photos.

## Not included (on purpose)

Payments, real messaging, verification, and a backend. Those would be the next build step (auth + Postgres + object storage + Stripe).
