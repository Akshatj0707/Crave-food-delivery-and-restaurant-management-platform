#!/bin/bash
# ============================================================
#  Crave — One-command local setup
#  Usage: chmod +x setup.sh && ./setup.sh
# ============================================================

set -e

ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${ORANGE}${BOLD}"
echo "  ██████╗██████╗  █████╗ ██╗   ██╗███████╗"
echo " ██╔════╝██╔══██╗██╔══██╗██║   ██║██╔════╝"
echo " ██║     ██████╔╝███████║██║   ██║█████╗  "
echo " ██║     ██╔══██╗██╔══██║╚██╗ ██╔╝██╔══╝  "
echo " ╚██████╗██║  ██║██║  ██║ ╚████╔╝ ███████╗"
echo "  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝"
echo -e "${NC}"
echo -e "${BOLD}  Full Stack Food Delivery Platform — Local Setup${NC}"
echo ""

# ── Check prerequisites ────────────────────────────────────
check_cmd() {
  if ! command -v $1 &>/dev/null; then
    echo -e "${RED}✗ $1 not found. Please install $1 first.${NC}"
    exit 1
  else
    echo -e "${GREEN}✓ $1 found${NC}"
  fi
}

echo -e "${BLUE}${BOLD}Checking prerequisites...${NC}"
check_cmd node
check_cmd npm
check_cmd psql

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 16 ]; then
  echo -e "${RED}✗ Node.js 16+ required. Found: $(node -v)${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}${BOLD}Setting up backend...${NC}"

# ── Backend env ────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo -e "${GREEN}✓ Created backend/.env from example${NC}"
  echo -e "${ORANGE}⚠  Please edit backend/.env with your database and Stripe credentials${NC}"
else
  echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

# ── Install backend deps ───────────────────────────────────
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend && npm install --silent && cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# ── Frontend env ───────────────────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}Setting up frontend...${NC}"
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${GREEN}✓ Created frontend/.env from example${NC}"
else
  echo -e "${GREEN}✓ frontend/.env already exists${NC}"
fi

# ── Install frontend deps ──────────────────────────────────
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend && npm install --silent && cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# ── Database setup ─────────────────────────────────────────
echo ""
echo -e "${BLUE}${BOLD}Database setup...${NC}"

read -p "Run database migration now? (requires DATABASE_URL in backend/.env) [y/N]: " RUN_MIGRATE
if [[ "$RUN_MIGRATE" =~ ^[Yy]$ ]]; then
  cd backend
  node src/config/migrate.js && echo -e "${GREEN}✓ Migration complete${NC}"
  
  read -p "Seed demo data? [y/N]: " RUN_SEED
  if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
    node src/config/seed.js && echo -e "${GREEN}✓ Seed data loaded${NC}"
  fi
  cd ..
fi

# ── Done ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ Setup complete!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Start backend:${NC}  cd backend && npm run dev"
echo -e "  ${BOLD}Start frontend:${NC} cd frontend && npm start"
echo ""
echo -e "  ${BOLD}Demo accounts:${NC}"
echo -e "    Customer:    customer@crave.com / password123"
echo -e "    Partner:     partner1@crave.com / password123"
echo -e "    Admin:       admin@crave.com / password123"
echo ""
echo -e "  ${BOLD}Stripe test card:${NC} 4242 4242 4242 4242 · 12/29 · 123"
echo ""
