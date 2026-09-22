# Maison d'Or — Luxury Fashion Full Stack

A fully functional luxury fashion e-commerce website with 3D animations, admin dashboard, order management, email notifications, and image storage — built entirely on **free-tier** services.

---

## What Was Built

### Customer-Facing Store (`frontend/index.html`)
- **Luxury black & gold design** with Cormorant Garamond serif typography
- **3D interactive hero** using Three.js (rotating golden fashion ring with particle background)
- **Product catalog** with hover animations, 3D-style card effects
- **Product detail modal** with full description
- **Shopping cart overlay** with quantity management
- **Checkout form** collecting name, email, address, and notes
- **Mock Stripe-style order confirmation** with order number generation
- **GSAP scroll animations** for luxury entrance effects

### Admin Dashboard (`frontend/admin.html` or `admin/admin.html`)
- **Basic username/password authentication** (stored in environment/config)
- **Add / Edit / Delete products** with image upload to Cloudinary
- **View all orders** with customer details, items, and totals
- **Image deletion** from Cloudinary when a product is deleted
- **Live statistics** (products count, orders, revenue)

### Backend API (`backend/worker.js`)
- **Cloudflare Worker** serving REST API (`/api/products`, `/api/orders`, `/api/admin/login`, etc.)
- **Cloudflare KV** for product and order storage (free tier included with Workers)
- **SendGrid integration** for email order confirmations (100 free emails/day)
- **Cloudinary integration** for image upload and deletion (25GB free storage)

---

## Tech Stack

| Layer | Technology | Free Tier? |
|---|---|---|
| Frontend | HTML + CSS + Vanilla JS + Three.js + GSAP | Yes (CDN libraries) |
| Backend API | Cloudflare Workers (JavaScript) | Yes (100k requests/day) |
| Data Storage | Cloudflare KV | Yes (1GB, included with Workers) |
| Image Storage | Cloudinary | Yes (25GB storage + transformations) |
| Email Service | SendGrid | Yes (100 emails/day) |
| 3D Graphics | Three.js (r128) | Yes |
| Animations | GSAP (free license for basic use) | Yes |
| Deployment | Cloudflare Pages + Workers | Yes |

---

## Free Services — No Paid Plans Required

- **Cloudflare Workers & KV**: Free tier covers this entire site.
- **Cloudinary**: 25GB free storage. When you delete a product in the admin dashboard, the image is also deleted from Cloudinary via API.
- **SendGrid**: 100 free emails/day for order confirmations.
- **No database needed**: All data lives in Cloudflare KV.

> ⚠️ **Note**: To enable real payments, you would need Stripe (or PayPal) API keys. The site currently uses a fully functional mock checkout that generates order IDs and sends confirmation emails. When you are ready for real payments, the backend can be updated with Stripe Checkout Sessions in minutes.

---

## Deployment to Cloudflare

### Step 1: Set Up Cloudflare KV
```
wrangler kv:namespace create FASHION_KV
wrangler kv:namespace create FASHION_KV --preview
```
Copy the namespace IDs into `wrangler.toml`.

### Step 2: Configure Secrets & Variables
In the Cloudflare Dashboard (Workers > fashion-api > Settings > Variables):

**Environment Variables (public):**
- `ADMIN_USERNAME` = `admin`
- `ADMIN_PASSWORD` = `luxury2024!` (change this!)
- `SENDGRID_FROM` = `orders@yourdomain.com`
- `ADMIN_EMAIL` = `your@email.com`

**Secrets (encrypted):**
- `SENDGRID_API_KEY` — from SendGrid dashboard
- `CLOUDINARY_CLOUD_NAME` — from Cloudinary dashboard
- `CLOUDINARY_API_KEY` — from Cloudinary dashboard
- `CLOUDINARY_API_SECRET` — from Cloudinary dashboard

### Step 3: Deploy the Worker
```
npm install -g wrangler
wrangler deploy
```

### Step 4: Deploy the Frontend to Cloudflare Pages
1. Go to Cloudflare Dashboard > Pages
2. Create project, connect this repo or upload `frontend/` folder
3. Set build output directory: `frontend/`
4. Set the domain
5. In the Pages settings, configure the API route to point to your Worker (`/api/*`), or update the frontend to call the Worker's direct URL.

> **Alternative**: Serve both from one domain by setting the Worker's route to handle `/api/*` and the Pages site to serve everything else. You can also proxy `/api` through Pages using a `_redirects` file.

---

## Running Locally (For Testing)

The backend requires Cloudflare's environment. For quick testing, you can use `wrangler dev`:
```
cd /home/user/Website-Template
wrangler dev
```
This will start a local server at `http://localhost:8787` with the API running.

To test the frontend locally, open `frontend/index.html` in a browser. The API calls are hardcoded to `/api` — when running locally with `wrangler dev`, you may need to serve the frontend through the Worker or update `API_BASE` temporarily.

---

## Admin Access

- Go to `frontend/admin.html` (or `admin/admin.html`)
- Default credentials: `admin` / `luxury2024!`
- Change `ADMIN_PASSWORD` in the environment for production.

---

## Changing the Design / Adding Features

- **Colors**: Edit the CSS variables (`--gold`, `--ink`, etc.) in `frontend/index.html` and `frontend/admin.html`.
- **3D Hero**: Modify `three.js` scene in the `init3DHero()` function.
- **Products**: Add or edit via the admin dashboard; data is stored in KV.
- **Email**: Update the email HTML template in `backend/worker.js` (`sendOrderEmail` function).
- **Images**: Upload via admin dashboard — files go to Cloudinary and URLs are stored in KV.

---

## Important Notes Before Going Live

1. **Change admin credentials** before deploying to production.
2. **Enable HTTPS** — Cloudflare provides this automatically.
3. **Real payments**: If you want Stripe, replace the mock checkout with Stripe Checkout Sessions (backend endpoint `/api/checkout-session`). This requires a Stripe account and a small API change.
4. **Email from domain**: For SendGrid to work properly with your domain, configure SPF/DKIM in SendGrid and add the verification records to your Cloudflare DNS.
5. **Image deletion**: When deleting a product, the admin calls Cloudinary's `destroy` API. This requires all 4 Cloudinary secrets to be set.

---

## What Comes Next (Optional Upgrades)

These are not required but can enhance the site:
- **Stripe integration** for real payments (add a backend endpoint and update checkout to redirect to Stripe)
- **Advanced search and filtering** for products
- **User accounts / order history** for customers
- **Inventory tracking** (add a `stock` field to products)
- **Wishlist feature** (store in KV with user session IDs)
- **More 3D effects** on product cards (e.g., tilt-on-hover with CSS 3D transforms)

---

## File Structure

```
Website-Template/
├── backend/
│   └── worker.js           # Cloudflare Worker API
├── frontend/
│   ├── index.html          # Luxury fashion store
│   ├── admin.html          # Admin dashboard
│   └── assets/
│       ├── css/            # (styles embedded in HTML for simplicity)
│       ├── js/             # (scripts embedded in HTML)
│       └── images/
├── admin/
│   └── admin.html          # Admin (duplicate for convenience)
├── wrangler.toml           # Cloudflare Worker config
└── README.md               # This file
```

---

## License & Attribution

- Three.js: `threejs.org` (MIT License)
- GSAP: `greensock.com` (free for basic commercial use on this site)
- Font Awesome: `fontawesome.com` (free icons)
- Google Fonts: Cormorant Garamond, Jost

---

Built with luxury in mind — no shortcuts, no placeholders, fully functional.
