#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/sql/2026-02-18-enable-rls-public.sql"
ENV_FILE="${1:-$ROOT_DIR/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$SQL_FILE" ]]; then
  echo "SQL file not found: $SQL_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Missing DATABASE_URL in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${SUPABASE_PROD_DATABASE_URL:-}" ]]; then
  echo "Missing SUPABASE_PROD_DATABASE_URL in $ENV_FILE" >&2
  exit 1
fi

strip_query() {
  local url="$1"
  echo "${url%%\?*}"
}

verify_disabled_count_zero() {
  local url="$1"
  local count
  count="$(psql "$url" -Atc "select count(*) from pg_tables where schemaname='public' and not rowsecurity;")"
  if [[ "$count" != "0" ]]; then
    echo "RLS verification failed: $count public table(s) still have RLS disabled." >&2
    exit 1
  fi
}

apply_target() {
  local label="$1"
  local raw_url="$2"
  local url
  url="$(strip_query "$raw_url")"

  echo "Applying RLS baseline to $label..."
  psql "$url" -v ON_ERROR_STOP=1 -f "$SQL_FILE" >/dev/null
  verify_disabled_count_zero "$url"
  echo "$label: OK (0 public tables with RLS disabled)"
}

apply_target "staging" "$DATABASE_URL"
apply_target "production" "$SUPABASE_PROD_DATABASE_URL"

echo "Done."

