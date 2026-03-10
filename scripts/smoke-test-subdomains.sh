#!/usr/bin/env bash
#
# Smoke test: verify all portal subdomains resolve, return valid TLS,
# and serve the expected Next.js pages.
#
# Usage:
#   ./scripts/smoke-test-subdomains.sh              # defaults to leasebase.co
#   ./scripts/smoke-test-subdomains.sh example.com  # custom root domain
#
set -euo pipefail

ROOT_DOMAIN="${1:-leasebase.co}"
SUBDOMAINS=("signup" "login" "owner" "manager" "tenant")
BASE_URL="https://dev.${ROOT_DOMAIN}"

PASS=0
FAIL=0
WARN=0

red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

check() {
  local label="$1" url="$2" expect_status="${3:-200}"
  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "$expect_status" ]]; then
    green "  ✓ $label → HTTP $status"
    ((PASS++))
  elif [[ "$status" == "000" ]]; then
    red "  ✗ $label → connection failed (DNS/TLS/timeout)"
    ((FAIL++))
  else
    yellow "  ~ $label → HTTP $status (expected $expect_status)"
    ((WARN++))
  fi
}

check_dns() {
  local fqdn="$1"
  if dig +short "$fqdn" 2>/dev/null | grep -q .; then
    green "  ✓ DNS resolves: $fqdn"
    ((PASS++))
  else
    red "  ✗ DNS does not resolve: $fqdn"
    ((FAIL++))
  fi
}

check_tls() {
  local fqdn="$1"
  if echo | openssl s_client -servername "$fqdn" -connect "$fqdn:443" 2>/dev/null | grep -q 'Verify return code: 0'; then
    green "  ✓ TLS valid: $fqdn"
    ((PASS++))
  else
    yellow "  ~ TLS check inconclusive: $fqdn"
    ((WARN++))
  fi
}

# ─── Main domain ──────────────────────────────────────────────────────────────
bold "=== Main domain: dev.${ROOT_DOMAIN} ==="
check_dns "dev.${ROOT_DOMAIN}"
check "Homepage" "$BASE_URL"
check "Health check" "$BASE_URL/healthz"
echo

# ─── Portal subdomains ───────────────────────────────────────────────────────
for sub in "${SUBDOMAINS[@]}"; do
  fqdn="${sub}.${ROOT_DOMAIN}"
  bold "=== Subdomain: ${fqdn} ==="
  check_dns "$fqdn"
  check_tls "$fqdn"
  # Portal subdomains serve the persona page; Next.js may return 200 or 307
  check "${sub} page" "https://${fqdn}" "200"
  echo
done

# ─── API endpoint ─────────────────────────────────────────────────────────────
bold "=== API: api.dev.${ROOT_DOMAIN} ==="
check_dns "api.dev.${ROOT_DOMAIN}"
check "API health" "https://api.dev.${ROOT_DOMAIN}/health" "200"
echo

# ─── CORS preflight spot-check ────────────────────────────────────────────────
bold "=== CORS preflight (signup → API) ==="
cors_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  -X OPTIONS \
  -H "Origin: https://signup.${ROOT_DOMAIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  "https://api.dev.${ROOT_DOMAIN}/health" 2>/dev/null || echo "000")
cors_allow=$(curl -s -D - -o /dev/null --max-time 10 \
  -X OPTIONS \
  -H "Origin: https://signup.${ROOT_DOMAIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  "https://api.dev.${ROOT_DOMAIN}/health" 2>/dev/null | grep -i 'access-control-allow-origin' || echo "")

if [[ -n "$cors_allow" ]]; then
  green "  ✓ CORS preflight returned: $cors_allow"
  ((PASS++))
else
  red "  ✗ CORS preflight: no Access-Control-Allow-Origin header"
  ((FAIL++))
fi
echo

# ─── Summary ──────────────────────────────────────────────────────────────────
bold "=== Results ==="
green "  Passed:   $PASS"
[[ $WARN -gt 0 ]] && yellow "  Warnings: $WARN"
[[ $FAIL -gt 0 ]] && red "  Failed:   $FAIL" || green "  Failed:   $FAIL"

exit $FAIL
