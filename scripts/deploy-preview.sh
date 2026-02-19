#!/bin/bash
# Deploy a PR preview on the VPS
# Usage: deploy-preview.sh <PR_NUMBER> <CONTAINER_PORT> <IMAGE_TAR>
set -euo pipefail

PR_NUMBER="$1"
CONTAINER_PORT="$2"
IMAGE_TAR="$3"

CONTAINER_NAME="socials-preview-pr-${PR_NUMBER}"
DOMAIN="pr-${PR_NUMBER}.preview.citrus.bitterlemon.co"
CADDY_SNIPPET="/etc/caddy/previews/pr-${PR_NUMBER}.caddy"

echo "==> Loading Docker image..."
docker load -i "$IMAGE_TAR"
IMAGE_ID=$(docker load -i "$IMAGE_TAR" | grep -oP 'Loaded image: \K.+')

echo "==> Stopping old container if exists..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "==> Starting container on port ${CONTAINER_PORT}..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${CONTAINER_PORT}:80" \
  "$IMAGE_ID"

echo "==> Writing Caddy config..."
cat > "$CADDY_SNIPPET" <<EOF
${DOMAIN} {
    reverse_proxy 127.0.0.1:${CONTAINER_PORT}
}
EOF

echo "==> Reloading Caddy..."
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

echo "==> Preview live at https://${DOMAIN}"
