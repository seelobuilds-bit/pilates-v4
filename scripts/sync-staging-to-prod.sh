#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

PG_DUMP_BIN="${PG_DUMP_BIN:-}"
PG_RESTORE_BIN="${PG_RESTORE_BIN:-}"

if [[ -z "$PG_DUMP_BIN" || -z "$PG_RESTORE_BIN" ]]; then
  if [[ -x "/opt/homebrew/opt/postgresql@17/bin/pg_dump" && -x "/opt/homebrew/opt/postgresql@17/bin/pg_restore" ]]; then
    PG_DUMP_BIN="/opt/homebrew/opt/postgresql@17/bin/pg_dump"
    PG_RESTORE_BIN="/opt/homebrew/opt/postgresql@17/bin/pg_restore"
  else
    PG_DUMP_BIN="${PG_DUMP_BIN:-$(command -v pg_dump)}"
    PG_RESTORE_BIN="${PG_RESTORE_BIN:-$(command -v pg_restore)}"
  fi
fi

if [[ -z "$PG_DUMP_BIN" || -z "$PG_RESTORE_BIN" ]]; then
  echo "pg_dump/pg_restore not found"
  exit 1
fi

echo "Using pg_dump: $PG_DUMP_BIN"
echo "Using pg_restore: $PG_RESTORE_BIN"

extract_env() {
  local key="$1"
  local line
  line=$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$ENV_FILE" | tail -n 1 || true)
  if [[ -z "$line" ]]; then
    printf ''
    return 0
  fi

  local value="${line#*=}"
  value="$(printf '%s' "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

  if [[ ${#value} -ge 2 && "${value:0:1}" == '"' && "${value: -1}" == '"' ]]; then
    value="${value:1:${#value}-2}"
  fi

  if [[ ${#value} -ge 2 && "${value:0:1}" == "'" && "${value: -1}" == "'" ]]; then
    value="${value:1:${#value}-2}"
  fi

  printf '%s' "$value"
}

STAGING_URL="$(extract_env SUPABASE_STAGING_DIRECT_URL)"
PROD_URL="$(extract_env SUPABASE_PROD_DIRECT_URL)"

if [[ -z "$STAGING_URL" || -z "$PROD_URL" ]]; then
  echo "Missing SUPABASE_STAGING_DIRECT_URL or SUPABASE_PROD_DIRECT_URL in $ENV_FILE"
  exit 1
fi

if [[ "$STAGING_URL" == "$PROD_URL" ]]; then
  echo "Staging and prod URLs are identical. Aborting."
  exit 1
fi

DUMP_FILE="/tmp/supabase_staging_to_prod_$(date +%s).dump"

echo "Dumping staging public schema to $DUMP_FILE"
PGCONNECT_TIMEOUT=20 "$PG_DUMP_BIN" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --schema=public \
  --dbname "$STAGING_URL" > "$DUMP_FILE"

echo "Restoring public schema dump into production"
PGCONNECT_TIMEOUT=20 "$PG_RESTORE_BIN" \
  --clean \
  --if-exists \
  --exit-on-error \
  --no-owner \
  --no-privileges \
  --schema=public \
  --dbname "$PROD_URL" "$DUMP_FILE"

echo "SYNC_COMPLETE $DUMP_FILE"
