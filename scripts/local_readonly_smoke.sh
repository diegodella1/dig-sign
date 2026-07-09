#!/usr/bin/env bash
set -euo pipefail
trap 'node scripts/record_smoke_status.mjs fail local-readonly >/dev/null || true' ERR

base_url="${DIGSIGN_BASE_URL:-http://127.0.0.1:3450}"
base_url="${base_url%/}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

curl -sS "$base_url/api/health" >"$tmp_dir/health.json"
node scripts/assert_health_no_non_smoke_fail.mjs "$tmp_dir/health.json"
curl -fsS "$base_url/" >/dev/null
curl -fsS "$base_url/business" >/dev/null
curl -fsS "$base_url/manual" >/dev/null
curl -fsS "$base_url/admin/login" >/dev/null
state_query=""
output_query="?debug=true"
if [[ -n "${OUTPUT_CAPTURE_TOKEN:-}" ]]; then
  state_query="?token=${OUTPUT_CAPTURE_TOKEN}"
  output_query="?debug=true&token=${OUTPUT_CAPTURE_TOKEN}"
fi
curl -fsS "$base_url/api/output/channel/state${state_query}" >/dev/null
curl -fsS "$base_url/output/live/main${output_query}" >/dev/null

node scripts/record_smoke_status.mjs ok local-readonly >/dev/null
echo "local read-only smoke ok"
