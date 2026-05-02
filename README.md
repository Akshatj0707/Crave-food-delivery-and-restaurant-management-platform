# 🍽️ Crave — Full Stack Food Delivery Platform

> Delivery · Takeaway · Dine-in — One platform for everything.

[![Deploy Backend](https://img.shields.io/badge/Deploy%20Backend-Railway-blueviolet?logo=railway)](https://railway.app)
[![Deploy Frontend](https://img.shields.io/badge/Deploy%20Frontend-Vercel-black?logo=vercel)](https://vercel.com)

---

## ✨ Features

| Module | Features |
|--------|---------|
| **Customer** | Browse restaurants, filter by cuisine/mode, full menu, cart, Stripe payments, order tracking, reviews, profile |
| **Partner Hub** | Live order management, menu CRUD, restaurant setup, stats dashboard |
| **Admin Panel** | User management, restaurant verification, order oversight, revenue analytics |
| **Payments** | Stripe (Card, UPI, Net Banking), 3D Secure, webhooks, refunds |
| **Auth** | JWT, role-based (Customer / Partner / Admin / Super Admin), bcrypt |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/crave-food-app.git
cd crave-food-app

# 2. Setup (installs deps, creates .env files)
chmod +x setup.sh && ./setup.sh

# 3. Start backend
cd backend && npm run dev

# 4. Start frontend (new terminal)
cd frontend && npm start
```

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@crave.com | password123 |
| Partner | partner1@crave.com | password123 |
| Admin | admin@crave.com | password123 |
| Super Admin | superadmin@crave.com | password123 |

---

## 💳 Stripe Test Cards

| Scenario | Card Number |
|----------|------------|
| ✅ Success | `4242 4242 4242 4242` |
| 🔐 3D Secure | `4000 0025 0000 3155` |
| ❌ Declined | `4000 0000 0000 9995` |

**Expiry**: Any future date · **CVC**: Any 3 digits

---

## 📦 Push to GitHub

```bash
chmod +x push_to_github.sh
./push_to_github.sh YOUR_GITHUB_USERNAME crave-food-app
```

Or manually:
```bash
git init && git add .
git commit -m "Initial commit: Crave full-stack platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crave-food-app.git
git push -u origin main
```

---

## 🌐 Deploy to Production

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub → select `backend/` as root
2. Add Plugin → **PostgreSQL** (auto-sets DATABASE_URL)
3. Set environment variables:
```env
NODE_ENV=production
JWT_SECRET=<32+ char random string>
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=https://your-app.vercel.app
```
4. Run in Railway shell:
```bash
node src/config/migrate.js && node src/config/seed.js
```

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import GitHub repo → root: `frontend/`
2. Set environment variables:
```env
REACT_APP_API_URL=https://crave-api-xxxx.railway.app/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```
3. Deploy → copy URL → update `FRONTEND_URL` on Railway

### Stripe Webhooks

Stripe Dashboard → Webhooks → Add Endpoint:
- URL: `https://crave-api-xxxx.railway.app/api/payments/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### Auto-Deploy via GitHub Actions

Add these secrets in GitHub → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `RAILWAY_TOKEN` | Railway → Account → Tokens |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Team Settings → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings |
| `REACT_APP_API_URL` | `https://your-backend.railway.app/api` |
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard |

Every push to `main` auto-deploys both frontend and backend.

---

## 🗃️ Database (13 tables)

`users` · `addresses` · `restaurants` · `business_hours` · `menu_categories` · `menu_items` · `item_customizations` · `customization_options` · `restaurant_tables` · `orders` · `order_items` · `reviews` · `notifications`

---

## 🔌 API Endpoints (35+)

```
POST  /api/auth/signup|login
GET   /api/auth/me
GET   /api/restaurants          ?mode=delivery&cuisine=Pizza&search=...
GET   /api/restaurants/:id      Full detail + menu
POST  /api/orders               Place order
PATCH /api/orders/:id/status    Partner updates status
POST  /api/payments/create-intent
POST  /api/payments/webhook
GET   /api/admin/stats
GET   /api/admin/users|restaurants|orders
```

---

## 🔒 Security

- bcrypt password hashing (12 rounds)
- JWT auth, role-based route guards
- Rate limiting, Helmet.js headers
- CORS restricted to allowed origins
- Stripe webhook signature verification
- Parameterized SQL (no injection)
- `.env` never committed to git

---

## 📄 License

MIT
