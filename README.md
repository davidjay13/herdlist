# RangeList

Farm-to-farm cattle marketplace with real accounts and a shared database file.

## Run locally

Needs Node 18+. No `npm install` required.

```bash
cd rangelist
node http-server.js
```

Open http://localhost:8080

## What is real now

- Email + password accounts (passwords hashed with scrypt)
- Session cookie
- Users, ranches, listings, follows, and messages saved in `data/store.json`
- Same data on every device that hits this server

## DigitalOcean — replace the static site

The static App Platform app cannot run this. Use a **Web Service** or a Droplet.

### App Platform Web Service

1. Push this folder to GitHub (`http-server.js`, `store.js`, `seed-json.js`, `public/`).
2. Create App → GitHub → this repo.
3. Resource type: **Web Service**
4. Build command: leave empty
5. Run command: `node http-server.js`
6. HTTP port: `8080`

Live URL will be `https://….ondigitalocean.app`.

App Platform disks reset on deploy, so accounts created before a redeploy can disappear. For a durable demo use a Droplet.

### Droplet

```bash
sudo apt update && sudo apt install -y git nodejs
git clone https://github.com/YOUR_USER/rangelist.git
cd rangelist
PORT=8080 node http-server.js
```

Or keep it running with pm2: `pm2 start http-server.js --name rangelist`


## Transactional email

Set one of these on the DigitalOcean App Platform service:

- `RESEND_API_KEY` (preferred)
- or `SENDGRID_API_KEY`

Optional:

- `MAIL_FROM` — default `Herd Yard <hello@herd-yard.com>` (domain must be verified with the provider)
- `MAIL_NOTIFY` — default `david@davidjay.com` (copy of new-account emails)

Sends on: account created, listing published, new message, ranch followed.
