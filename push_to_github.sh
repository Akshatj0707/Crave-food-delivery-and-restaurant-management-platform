#!/bin/bash
# ============================================================
#  Crave — Push to GitHub
#  Usage: ./push_to_github.sh <your-github-username> [repo-name]
#  Example: ./push_to_github.sh johndoe crave-food-app
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

GITHUB_USER="${1:-YOUR_GITHUB_USERNAME}"
REPO_NAME="${2:-crave-food-app}"

if [ "$GITHUB_USER" = "YOUR_GITHUB_USERNAME" ]; then
  echo -e "${RED}Usage: ./push_to_github.sh <github-username> [repo-name]${NC}"
  echo -e "Example: ./push_to_github.sh johndoe crave-food-app"
  exit 1
fi

echo -e "${ORANGE}${BOLD}📦 Pushing Crave to GitHub${NC}"
echo -e "  User: ${BOLD}$GITHUB_USER${NC}"
echo -e "  Repo: ${BOLD}$REPO_NAME${NC}"
echo ""

# ── Init git if needed ────────────────────────────────────
if [ ! -d ".git" ]; then
  git init
  echo -e "${GREEN}✓ Git initialized${NC}"
fi

# ── Configure git ─────────────────────────────────────────
git config --local core.autocrlf false
git config --local core.eol lf

# ── Stage all files ───────────────────────────────────────
git add .
git status --short

echo ""
read -p "Commit message [Initial commit: Crave full-stack platform]: " COMMIT_MSG
COMMIT_MSG="${COMMIT_MSG:-Initial commit: Crave full-stack food delivery platform}"

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✓ Committed${NC}"

# ── Set branch to main ────────────────────────────────────
git branch -M main

# ── Add remote ────────────────────────────────────────────
REMOTE_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi
echo -e "${GREEN}✓ Remote set to $REMOTE_URL${NC}"

# ── Create repo on GitHub via CLI (if gh is installed) ────
if command -v gh &>/dev/null; then
  echo -e "${BLUE}Creating GitHub repository...${NC}"
  gh repo create "$REPO_NAME" --public --push --source=. \
    --description "🍽️ Crave — Full-stack food delivery platform (Delivery, Takeaway, Dine-in)" \
    2>/dev/null || true
  echo -e "${GREEN}✓ Repository created and pushed via GitHub CLI${NC}"
else
  echo -e "${ORANGE}GitHub CLI (gh) not found. Pushing manually...${NC}"
  echo -e "${BLUE}Please create the repo first at: https://github.com/new${NC}"
  echo -e "  Name: ${BOLD}$REPO_NAME${NC}"
  echo -e "  Visibility: Public (or Private)"
  echo -e "  Do NOT initialize with README (we already have one)"
  echo ""
  read -p "Press Enter after creating the repo on GitHub..."
  
  git push -u origin main
fi

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ Crave pushed to GitHub!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}Repository:${NC} https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo -e "  ${BOLD}Next — Deploy:${NC}"
echo -e "  • Backend:  railway.app → New Project → GitHub → backend/"
echo -e "  • Frontend: vercel.com  → New Project → GitHub → frontend/"
echo ""
echo -e "  ${BOLD}Or run:${NC} ./deploy.sh"
echo ""
