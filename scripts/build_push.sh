#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# build_push.sh — Build Docker image, scan with Trivy, push to ECR
#
# Required environment variables:
#   DEPLOY_CONFIG  — path to deploy JSON (e.g. deploy.dev.json)
#   GITHUB_SHA     — full commit SHA (set by GitHub Actions)
#
# Optional:
#   NEXT_PUBLIC_API_BASE_URL — API base URL baked into the client JS bundle
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Region guardrail ─────────────────────────────────────────────────────────
assert_region() {
  local region="$1"
  local allowed="${LEASEBASE_ALLOW_REGION:-us-west-2}"
  if [[ "$region" != "$allowed" ]]; then
    echo "ERROR: Region guardrail: refusing to push to '${region}' (expected '${allowed}'). Set LEASEBASE_ALLOW_REGION=${region} to override." >&2
    exit 1
  fi
}

# ── Load config ──────────────────────────────────────────────────────────────
CONFIG="$REPO_ROOT/${DEPLOY_CONFIG:?DEPLOY_CONFIG is required}"
AWS_REGION=$(jq -r '.aws_region' "$CONFIG")
AWS_ACCOUNT_ID=$(jq -r '.aws_account_id' "$CONFIG")
ECR_REPO=$(jq -r '.ecr_repository' "$CONFIG")

assert_region "$AWS_REGION"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_BASE="${ECR_REGISTRY}/${ECR_REPO}"
IMAGE_SHA="${IMAGE_BASE}:${GITHUB_SHA}"
IMAGE_LATEST="${IMAGE_BASE}:dev-latest"

echo "▸ Building image: ${IMAGE_SHA}"

# ── Build ────────────────────────────────────────────────────────────────────────
BUILD_ARGS=()
if [[ -n "${NEXT_PUBLIC_API_BASE_URL:-}" ]]; then
  BUILD_ARGS+=(--build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}")
fi
BUILD_ARGS+=(--build-arg "NEXT_PUBLIC_BUILD_SHA=${GITHUB_SHA}")

docker buildx build \
  --no-cache \
  "${BUILD_ARGS[@]}" \
  --tag "${IMAGE_SHA}" \
  --tag "${IMAGE_LATEST}" \
  --load \
  --file "${REPO_ROOT}/Dockerfile" \
  "${REPO_ROOT}"

# ── Post-build domain validation ─────────────────────────────────────────────
# Fail fast if the built JS bundle still references the old domain.
# NEXT_PUBLIC_* env vars are baked at build time; a stale GitHub Actions
# variable would silently produce a broken client bundle.
BLOCKED_DOMAINS=("api.dev.leasebase.co" "api.leasebase.co")
echo "▸ Checking built bundle for stale domain references..."
STALE_FOUND=0
for domain in "${BLOCKED_DOMAINS[@]}"; do
  if docker run --rm "${IMAGE_SHA}" sh -c "grep -r '${domain}' /app/.next/static/ 2>/dev/null" | head -3; then
    echo "ERROR: Built JS bundle contains blocked domain '${domain}'" >&2
    echo "       Check the NEXT_PUBLIC_API_BASE_URL GitHub Actions variable." >&2
    STALE_FOUND=1
  fi
done
if [[ "$STALE_FOUND" -eq 1 ]]; then
  echo "::error::Domain validation failed — stale API domain baked into client bundle."
  exit 1
fi
echo "✓ No stale domain references found in built bundle."

# ── Trivy scan ───────────────────────────────────────────────────────────────
echo "▸ Scanning image with Trivy..."
trivy image \
  --exit-code 1 \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  --no-progress \
  "${IMAGE_SHA}" || {
    echo "⚠ Trivy found vulnerabilities (see above). Continuing with push..."
  }

# ── Push to ECR ──────────────────────────────────────────────────────────────
echo "▸ Pushing ${IMAGE_SHA}"
docker push "${IMAGE_SHA}"

echo "▸ Pushing ${IMAGE_LATEST}"
docker push "${IMAGE_LATEST}"

# ── Print build info ─────────────────────────────────────────────────────────
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "${IMAGE_LATEST}" 2>/dev/null | sed 's/.*@//' || echo "unknown")
echo "✓ Done — pushed ${IMAGE_SHA} and ${IMAGE_LATEST}"
echo "  Commit SHA : ${GITHUB_SHA}"
echo "  Image digest: ${DIGEST}"

# ── Export for downstream steps ──────────────────────────────────────────────
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "image=${IMAGE_LATEST}" >> "$GITHUB_OUTPUT"
  echo "image_sha=${IMAGE_SHA}" >> "$GITHUB_OUTPUT"
  echo "sha=${GITHUB_SHA}" >> "$GITHUB_OUTPUT"
  echo "digest=${DIGEST}" >> "$GITHUB_OUTPUT"
fi
