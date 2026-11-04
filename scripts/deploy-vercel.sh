#!/usr/bin/env bash
# Deploy Adegan ke Vercel (production dari branch main).
# Usage:
#   ./scripts/deploy-vercel.sh           # production
#   ./scripts/deploy-vercel.sh preview   # preview deployment
#
# Butuh: Vercel CLI + login, ATAU env VERCEL_TOKEN (+ opsional VERCEL_ORG_ID, VERCEL_PROJECT_ID)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-production}"

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: Node/npx tidak ditemukan. Install Node 20+ dulu."
  exit 1
fi

# Pastikan di main (sumber benar, bukan gh-pages)
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
  echo "Peringatan: branch saat ini = '$BRANCH' (bukan main)."
  echo "Production Vercel harus dari main. Lanjut dalam 3 detik..."
  sleep 3
fi

echo "→ Install Vercel CLI (npx, tanpa global)..."
VERCEL=(npx --yes vercel@latest)

ARGS=()
if [[ "$MODE" == "production" || "$MODE" == "prod" ]]; then
  ARGS+=(--prod)
  echo "→ Mode: PRODUCTION"
else
  echo "→ Mode: PREVIEW"
fi

# Token dari env (CI / non-interactive)
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  ARGS+=(--token "$VERCEL_TOKEN")
  echo "→ Auth: VERCEL_TOKEN"
fi

if [[ -n "${VERCEL_ORG_ID:-}" ]]; then
  export VERCEL_ORG_ID
fi
if [[ -n "${VERCEL_PROJECT_ID:-}" ]]; then
  export VERCEL_PROJECT_ID
fi

ARGS+=(--yes)

echo "→ Deploy..."
"${VERCEL[@]}" "${ARGS[@]}"

echo ""
echo "Selesai. Cek URL di output di atas / dashboard Vercel."
echo "Live: https://blaze-frost-solar-ruby.vercel.app"
