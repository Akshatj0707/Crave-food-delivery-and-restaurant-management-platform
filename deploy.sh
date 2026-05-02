#!/bin/bash
# ============================================================
#  Crave — Production Deploy Script
#  Deploys backend to Railway, frontend to Vercel
#  Usage: ./deploy.sh
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${ORANGE}${BOLD}🚀 Crave Production Deploy${NC}"
echo ""

# ── Check CLIs ────────────────────────────────────────────
install_if_missing() {
  if ! command -v $1 &>/dev/null; then
    echo -e "${BLUE}Installing $1...${NC}"
    npm install -g $2
  fi
}

install_if_missing railway @railway/cli
install_if_missing vercel vercel

# ── Deploy Backend to Railway ─────────────────────────────
echo -e "${BLUE}${BOLD}[1/3] Deploying backend to Railway...${NC}"
cd backend

if ! railway whoami &>/dev/null; then
  echo -e "${ORANGE}Not logged in to Railway. Opening browser...${NC}"
  railway login
fi

railway up --service crave-api
BACKEND_URL=$(railway domain 2>/dev/null | head -1 || echo "")
echo -e "${GREEN}✓ Backend deployed${NC}"
if [ -n "$BACKEND_URL" ]; then
  echo -e "  URL: ${BOLD}https://$BACKEND_URL${NC}"
fi
cd ..

# ── Run DB migrations on Railway ─────────────────────────
echo ""
echo -e "${BLUE}${BOLD}[2/3] Running database migrations...${NC}"
cd backend
railway run node src/config/migrate.js && echo -e "${GREEN}✓ Migration complete${NC}"
read -p "Seed demo data on production? [y/N]: " SEED_PROD
if [[ "$SEED_PROD" =~ ^[Yy]$ ]]; then
  railway run node src/config/seed.js && echo -e "${GREEN}✓ Seed complete${NC}"
fi
cd ..

# ── Deploy Frontend to Vercel ─────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}[3/3] Deploying frontend to Vercel...${NC}"
cd frontend

if ! vercel whoami &>/dev/null; then
  echo -e "${ORANGE}Not logged in to Vercel. Opening browser...${NC}"
  vercel login
fi

# Prompt for backend URL if not set
if [ -n "$BACKEND_URL" ]; then
  API_URL="https://$BACKEND_URL/api"
else
  read -p "Enter your backend URL (e.g. https://crave-api.railway.app): " MANUAL_URL
  API_URL="$MANUAL_URL/api"
fi

# Set env vars
vercel env add REACT_APP_API_URL production <<< "$API_URL" 2>/dev/null || true

read -p "Enter Stripe Publishable Key (pk_live_... or pk_test_...): " STRIPE_PK
vercel env add REACT_APP_STRIPE_PUBLISHABLE_KEY production <<< "$STRIPE_PK" 2>/dev/null || true

# Build and deploy
CI=false npm run build
vercel deploy --prebuilt --prod
FRONTEND_URL=$(vercel ls --prod 2>/dev/null | head -1 || echo "")

echo -e "${GREEN}✓ Frontend deployed${NC}"
cd ..

# ── Summary ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🎉 Crave is LIVE!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${NC}"
echo ""
[ -n "$BACKEND_URL" ] && echo -e "  ${BOLD}API:${NC}      https://$BACKEND_URL"
[ -n "$FRONTEND_URL" ] && echo -e "  ${BOLD}Frontend:${NC} $FRONTEND_URL"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. Set up Stripe webhook:"
echo -e "     https://dashboard.stripe.com/webhooks"
echo -e "     Endpoint: https://YOUR_BACKEND/api/payments/webhook"
echo -e "     Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded"
echo ""
echo -e "  2. Update FRONTEND_URL env on Railway to your Vercel URL"
echo ""
