#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

curl -fsS -c "$COOKIE_JAR" "$BASE_URL/login-as/STAFF" >/dev/null

HTML="$(curl -fsS -b "$COOKIE_JAR" "$BASE_URL/inventory/locations")"
TOKEN="$(printf '%s' "$HTML" | sed -n 's/.*name="csrf_token" value="\([^"]*\)".*/\1/p' | head -n1)"

if [[ -z "$TOKEN" ]]; then
  echo "FAIL: csrf token missing from GET /inventory/locations"
  exit 1
fi

echo "PASS: csrf token present in GET /inventory/locations"

STATUS_NO_TOKEN="$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" -X POST "$BASE_URL/inventory/locations" \
  -d 'name=CSRF Test Location')"

if [[ "$STATUS_NO_TOKEN" != "403" ]]; then
  echo "FAIL: expected 403 without csrf token, got $STATUS_NO_TOKEN"
  exit 1
fi

echo "PASS: POST /inventory/locations without csrf token returns 403"

STATUS_WITH_TOKEN="$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" -X POST "$BASE_URL/inventory/locations" \
  -d "csrf_token=$TOKEN" \
  -d 'name=CSRF Test Location')"

if [[ "$STATUS_WITH_TOKEN" != "302" ]]; then
  echo "FAIL: expected 302 with csrf token, got $STATUS_WITH_TOKEN"
  exit 1
fi

echo "PASS: POST /inventory/locations with csrf token succeeds"
