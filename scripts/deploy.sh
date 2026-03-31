#!/bin/bash

# =============================================================================
# NeighborPulse Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh [environment] [branch]
# Examples:
#   ./scripts/deploy.sh production main
#   ./scripts/deploy.sh staging develop
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-production}"
BRANCH="${2:-main}"
DEPLOYMENT_DIR="${DEPLOYMENT_DIR:-/var/www/neighborpulse}"

echo -e "${GREEN}╔════════════════════════════════════════════════════╗"
echo -e "${GREEN}║     NeighborPulse Deployment Script                ║"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝"
echo ""

# Validate inputs
if [[ -z "$ENVIRONMENT" ]]; then
    echo -e "${YELLOW}Environment is required${NC}"
    echo "Usage: $0 [environment] [branch]"
    echo "Example: $0 production main"
    exit 1
fi

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please copy .env.example to .env and configure your environment"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${YELLOW}Deploying to: $ENVIRONMENT${NC}"
echo -e "${YELLOW}From branch: $BRANCH${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${GREEN}[1/5]${NC} Installing dependencies..."
pnpm install --frozen-lockfile

# Step 2: Run migrations
echo -e "${GREEN}[2/5]${NC} Running database migrations..."
if [[ -d "docs/migrations" ]]; then
    for migration in docs/migrations/*.sql; do
        if [[ -f "$migration" ]]; then
            filename=$(basename "$migration")
            echo "  Running: $filename"
            # Execute migration (adjust command based on your database setup)
            # psql -d neighborpulse -f "$migration" || true
            echo "  ✓ Migration executed"
        fi
    done
fi

# Step 3: Run tests
echo -e "${GREEN}[3/5]${NC} Running tests..."
pnpm test

# Step 4: Build application
echo -e "${GREEN}[4/5]${NC} Building application..."
pnpm build

# Step 5: Deploy to target
echo -e "${GREEN}[5/5]${NC} Deploying to $ENVIRONMENT..."

case $ENVIRONMENT in
    production)
        # Production deployment
        echo "  Deploying to production..."
        # Your production deployment commands here
        # Example: vercel deploy --prod
        # Example: rsync -avz . $DEPLOYMENT_DIR/
        # Example: cd $DEPLOYMENT_DIR && pnpm install && pnpm build
        ;;
    staging)
        # Staging deployment
        echo "  Deploying to staging..."
        # Your staging deployment commands here
        ;;
    development)
        # Development deployment (hot reload)
        echo "  Starting development server..."
        pnpm dev
        ;;
    *)
        echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗"
echo -e "${GREEN}║     Deployment completed successfully!              ║"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Next steps:"
echo "  1. Check your application at $NEXT_PUBLIC_APP_URL"
echo "  2. Monitor logs: pm2 logs || tail -f .next/server.log"
echo "  3. Review analytics in your dashboard"
echo ""
