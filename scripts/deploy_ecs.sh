#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# deploy_ecs.sh — Register new ECS task definition and update service
#
# Required environment variables:
#   DEPLOY_CONFIG  — path to deploy JSON (e.g. deploy.dev.json)
#   IMAGE          — full image URI with tag (e.g. 123456.dkr.ecr.../:sha7)
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Load config ──────────────────────────────────────────────────────────────
CONFIG="$REPO_ROOT/${DEPLOY_CONFIG:?DEPLOY_CONFIG is required}"
AWS_REGION=$(jq -r '.aws_region' "$CONFIG")
AWS_ACCOUNT_ID=$(jq -r '.aws_account_id' "$CONFIG")
ECS_CLUSTER=$(jq -r '.ecs_cluster' "$CONFIG")
ECS_SERVICE=$(jq -r '.ecs_service' "$CONFIG")
TASK_FAMILY=$(jq -r '.task_family' "$CONFIG")
CONTAINER_NAME=$(jq -r '.container_name' "$CONFIG")

IMAGE="${IMAGE:?IMAGE is required}"

echo "▸ Deploying ${IMAGE} → ${ECS_CLUSTER}/${ECS_SERVICE}"

# ── Fetch current task definition ────────────────────────────────────────────
echo "▸ Fetching current task definition for ${TASK_FAMILY}..."
CURRENT_TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition "$TASK_FAMILY" \
  --region "$AWS_REGION" \
  --query 'taskDefinition')

# ── Build new task definition with updated image + health check ───────────────
NEW_TASK_DEF=$(echo "$CURRENT_TASK_DEF" | jq \
  --arg IMAGE "$IMAGE" \
  --arg CONTAINER "$CONTAINER_NAME" \
  '
  .containerDefinitions |= map(
    if .name == $CONTAINER then
      .image = $IMAGE
      | if .healthCheck then
          .healthCheck.command = ["CMD-SHELL",
            "wget -q -O /dev/null http://localhost:" +
            (.portMappings[0].containerPort | tostring) +
            "/healthz || exit 1"]
        else . end
    else . end
  )
  | del(.taskDefinitionArn, .revision, .status, .requiresAttributes,
        .compatibilities, .registeredAt, .registeredBy)
  ')

# ── Register new revision ────────────────────────────────────────────────────
echo "▸ Registering new task definition revision..."
NEW_ARN=$(aws ecs register-task-definition \
  --region "$AWS_REGION" \
  --cli-input-json "$NEW_TASK_DEF" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "  → New revision: ${NEW_ARN}"

# ── Update service ───────────────────────────────────────────────────────────
echo "▸ Updating ECS service ${ECS_SERVICE}..."
aws ecs update-service \
  --region "$AWS_REGION" \
  --cluster "$ECS_CLUSTER" \
  --service "$ECS_SERVICE" \
  --task-definition "$NEW_ARN" \
  --force-new-deployment \
  --query 'service.serviceName' \
  --output text > /dev/null

# ── Wait for stability ──────────────────────────────────────────────────────
echo "▸ Waiting for service to stabilize (up to 10 min)..."
aws ecs wait services-stable \
  --region "$AWS_REGION" \
  --cluster "$ECS_CLUSTER" \
  --services "$ECS_SERVICE"

echo "✓ ECS deployment complete — ${ECS_SERVICE} is stable"

# ── CloudFront cache invalidation (optional) ─────────────────────────────────
CF_DIST_ID=$(jq -r '.cloudfront_distribution_id // empty' "$CONFIG")
# Also accept env-var override (e.g. from GitHub Actions repo variable)
CF_DIST_ID="${CLOUDFRONT_DISTRIBUTION_ID:-${CF_DIST_ID}}"

if [[ -n "${CF_DIST_ID}" ]]; then
  echo "▸ Invalidating CloudFront cache (${CF_DIST_ID})..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text
  echo "✓ CloudFront invalidation created"
else
  echo "▹ Skipping CloudFront invalidation (no distribution ID configured)"
fi
