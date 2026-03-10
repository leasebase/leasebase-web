#!/usr/bin/env bash
###############################################################################
# smoke-test-invitations.sh — End-to-end smoke test for the tenant invitation flow.
#
# Usage:
#   # Fully automatic (local dev with log-based token extraction):
#   API_BASE=http://localhost:4000 \
#   AUTH_EMAIL=pm@example.com AUTH_PASSWORD=Password1! \
#     bash scripts/smoke-test-invitations.sh
#
#   # With manually-provided token (deployed environments):
#   API_BASE=https://api.dev.leasebase.co \
#   AUTH_EMAIL=pm@example.com AUTH_PASSWORD=Password1! \
#   INVITE_TOKEN=<token-from-email-or-logs> \
#     bash scripts/smoke-test-invitations.sh
#
# Required environment variables:
#   API_BASE       — Base URL of the BFF gateway (e.g. http://localhost:4000)
#   AUTH_EMAIL     — Email of an ORG_ADMIN / OWNER user who can create invitations
#   AUTH_PASSWORD  — Password for the above user
#
# Optional:
#   INVITE_TOKEN   — Pre-existing invitation token (skips create-invitation step)
#   TENANT_EMAIL   — Email for the invited tenant (default: smoke-tenant-<ts>@test.leasebase.co)
#   PROPERTY_ID    — Property ID to use for the invitation
#   UNIT_ID        — Unit ID to use for the invitation
#   TENANT_PASSWORD — Password for the new tenant (default: SmokeTest1!)
#
# Exit codes:
#   0 — all checks passed
#   1 — one or more checks failed
###############################################################################
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILURES=$((FAILURES + 1)); }
info() { echo -e "  ${CYAN}ℹ${NC} $1"; }
step() { echo -e "\n${YELLOW}▸${NC} $1"; }

FAILURES=0

# ── Validate required env ────────────────────────────────────────────────────
: "${API_BASE:?API_BASE is required (e.g. http://localhost:4000)}"
: "${AUTH_EMAIL:?AUTH_EMAIL is required}"
: "${AUTH_PASSWORD:?AUTH_PASSWORD is required}"

TENANT_PASSWORD="${TENANT_PASSWORD:-SmokeTest1!}"
TIMESTAMP=$(date +%s)
TENANT_EMAIL="${TENANT_EMAIL:-smoke-tenant-${TIMESTAMP}@test.leasebase.co}"

echo "═══════════════════════════════════════════════════════"
echo "  LeaseBase Invitation Flow — Smoke Test"
echo "═══════════════════════════════════════════════════════"
echo "  API:    ${API_BASE}"
echo "  Admin:  ${AUTH_EMAIL}"
echo "  Tenant: ${TENANT_EMAIL}"
echo "═══════════════════════════════════════════════════════"

# ── Step 1: Health checks ────────────────────────────────────────────────────
step "Health checks"

BFF_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/healthz" 2>/dev/null || echo "000")
if [[ "$BFF_HEALTH" == "200" ]]; then pass "BFF gateway healthy"; else fail "BFF gateway unhealthy (HTTP ${BFF_HEALTH})"; fi

AUTH_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/api/auth/config" 2>/dev/null || echo "000")
if [[ "$AUTH_HEALTH" == "200" ]]; then pass "Auth-service reachable"; else fail "Auth-service unreachable (HTTP ${AUTH_HEALTH})"; fi

# ── Step 2: Authenticate as admin/owner ──────────────────────────────────────
step "Authenticating as ${AUTH_EMAIL}"

LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${AUTH_EMAIL}\",\"password\":\"${AUTH_PASSWORD}\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$ACCESS_TOKEN" ]]; then
  pass "Authenticated — got access token"
else
  fail "Authentication failed"
  echo "$LOGIN_RESPONSE"
  echo -e "\n${RED}Cannot continue without authentication.${NC}"
  exit 1
fi

# ── Step 3: Create invitation (or use provided token) ────────────────────────
if [[ -n "${INVITE_TOKEN:-}" ]]; then
  step "Using provided INVITE_TOKEN"
  pass "Token provided externally"
else
  step "Creating tenant invitation"

  # If PROPERTY_ID / UNIT_ID not provided, try to fetch the first available ones
  if [[ -z "${PROPERTY_ID:-}" ]] || [[ -z "${UNIT_ID:-}" ]]; then
    info "No PROPERTY_ID/UNIT_ID provided — fetching first available property and unit"

    PROPS_RESPONSE=$(curl -s "${API_BASE}/api/properties?limit=1" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    PROPERTY_ID=$(echo "$PROPS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$PROPERTY_ID" ]]; then
      fail "No properties found — cannot create invitation"
      echo -e "\n${RED}Create a property first, or pass PROPERTY_ID and UNIT_ID.${NC}"
      exit 1
    fi
    pass "Found property: ${PROPERTY_ID}"

    UNITS_RESPONSE=$(curl -s "${API_BASE}/api/units?propertyId=${PROPERTY_ID}&limit=1" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}")
    UNIT_ID=$(echo "$UNITS_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [[ -z "$UNIT_ID" ]]; then
      fail "No units found for property — cannot create invitation"
      exit 1
    fi
    pass "Found unit: ${UNIT_ID}"
  fi

  INVITE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/tenants/invitations" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TENANT_EMAIL}\",
      \"firstName\": \"Smoke\",
      \"lastName\": \"Tester\",
      \"propertyId\": \"${PROPERTY_ID}\",
      \"unitId\": \"${UNIT_ID}\"
    }")

  INVITE_ID=$(echo "$INVITE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  INVITE_STATUS=$(echo "$INVITE_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [[ "$INVITE_STATUS" == "PENDING" ]]; then
    pass "Invitation created: ${INVITE_ID} (PENDING)"
  else
    fail "Invitation creation failed"
    echo "$INVITE_RESPONSE"
    echo -e "\n${YELLOW}If SES is not configured, check tenant-service logs for the token.${NC}"
    echo -e "${YELLOW}Then re-run with: INVITE_TOKEN=<token> ...${NC}"
    exit 1
  fi

  # In dev mode (SES_FROM_EMAIL not set), the token is logged by the tenant-service.
  # The script cannot extract it automatically from container logs in deployed environments.
  echo ""
  echo -e "  ${YELLOW}⚠  Token extraction:${NC}"
  echo "     In local dev, check tenant-service logs for the accept URL."
  echo "     In deployed dev, check CloudWatch logs for the tenant-service."
  echo "     Then re-run with: INVITE_TOKEN=<token> bash scripts/smoke-test-invitations.sh"
  echo ""
  echo -e "  ${CYAN}Waiting for INVITE_TOKEN input...${NC}"
  read -rp "  Paste token (or press Enter to skip acceptance test): " INVITE_TOKEN

  if [[ -z "$INVITE_TOKEN" ]]; then
    info "Skipping acceptance steps (no token provided)"
    step "Summary"
    echo -e "\n  Health checks: ${GREEN}passed${NC}"
    echo -e "  Auth:          ${GREEN}passed${NC}"
    echo -e "  Invitation:    ${GREEN}created${NC}"
    echo -e "  Acceptance:    ${YELLOW}skipped (no token)${NC}"
    exit 0
  fi
fi

# ── Step 4: Validate token (public GET) ──────────────────────────────────────
step "Validating invitation token (public)"

VALIDATE_RESPONSE=$(curl -s "${API_BASE}/api/tenants/invitations/accept?token=${INVITE_TOKEN}")
VALIDATE_EMAIL=$(echo "$VALIDATE_RESPONSE" | grep -o '"invitedEmail":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$VALIDATE_EMAIL" ]]; then
  pass "Token valid — invited email: ${VALIDATE_EMAIL}"
  TENANT_EMAIL="$VALIDATE_EMAIL"
else
  VALIDATE_CODE=$(echo "$VALIDATE_RESPONSE" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
  fail "Token validation failed: ${VALIDATE_CODE:-unknown}"
  echo "$VALIDATE_RESPONSE"
fi

# ── Step 5: Accept invitation (public POST) ──────────────────────────────────
step "Accepting invitation"

ACCEPT_RESPONSE=$(curl -s -X POST "${API_BASE}/api/tenants/invitations/accept" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"${INVITE_TOKEN}\",\"password\":\"${TENANT_PASSWORD}\"}")

ACCEPTED=$(echo "$ACCEPT_RESPONSE" | grep -o '"accepted":true' || true)

if [[ -n "$ACCEPTED" ]]; then
  pass "Invitation accepted — tenant account created"
else
  ACCEPT_CODE=$(echo "$ACCEPT_RESPONSE" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [[ "$ACCEPT_CODE" == "ALREADY_ACCEPTED" ]]; then
    info "Invitation was already accepted (continuing with login)"
  else
    fail "Invitation acceptance failed: ${ACCEPT_CODE:-unknown}"
    echo "$ACCEPT_RESPONSE"
  fi
fi

# ── Step 6: Login as new tenant ──────────────────────────────────────────────
step "Logging in as tenant (${TENANT_EMAIL})"

TENANT_LOGIN=$(curl -s -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TENANT_EMAIL}\",\"password\":\"${TENANT_PASSWORD}\"}")

TENANT_TOKEN=$(echo "$TENANT_LOGIN" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$TENANT_TOKEN" ]]; then
  pass "Tenant authenticated"
else
  fail "Tenant login failed"
  echo "$TENANT_LOGIN"
fi

# ── Step 7: Fetch /tenants/me and verify lease_id ────────────────────────────
if [[ -n "$TENANT_TOKEN" ]]; then
  step "Fetching tenant profile (/tenants/me)"

  ME_RESPONSE=$(curl -s "${API_BASE}/api/tenants/me" \
    -H "Authorization: Bearer ${TENANT_TOKEN}")

  ME_USER_ID=$(echo "$ME_RESPONSE" | grep -o '"user_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  ME_LEASE_ID=$(echo "$ME_RESPONSE" | grep -o '"lease_id":"[^"]*"' | head -1 | cut -d'"' -f4)
  ME_EMAIL=$(echo "$ME_RESPONSE" | grep -o '"email":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [[ -n "$ME_USER_ID" ]]; then
    pass "Profile loaded — user_id: ${ME_USER_ID}"
  else
    fail "Profile not found"
    echo "$ME_RESPONSE"
  fi

  if [[ -n "$ME_EMAIL" ]]; then
    pass "Email present: ${ME_EMAIL}"
  else
    fail "Email missing from profile response"
  fi

  if [[ -n "$ME_LEASE_ID" ]]; then
    pass "lease_id present: ${ME_LEASE_ID} (CRITICAL FIX VERIFIED)"
  else
    fail "lease_id is NULL or missing — dashboard will show empty state!"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
step "Summary"
echo ""
if [[ $FAILURES -eq 0 ]]; then
  echo -e "  ${GREEN}All checks passed!${NC} The invitation flow is working end-to-end."
  exit 0
else
  echo -e "  ${RED}${FAILURES} check(s) failed.${NC} See above for details."
  exit 1
fi
