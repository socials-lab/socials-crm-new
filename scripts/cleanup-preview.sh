#!/bin/bash
# Clean up a PR preview on the VPS
# Usage: cleanup-preview.sh <PR_NUMBER>
set -euo pipefail

PR_NUMBER="$1"
CONTAINER_NAME="socials-preview-pr-${PR_NUMBER}"
CADDY_SNIPPET="/etc/caddy/previews/pr-${PR_NUMBER}.caddy"

echo "==> Stopping container..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "==> Removing Caddy config..."
rm -f "$CADDY_SNIPPET"

echo "==> Reloading Caddy..."
caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

echo "==> Preview for PR #${PR_NUMBER} cleaned up"
