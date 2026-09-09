#!/usr/bin/env bash

set -euo pipefail

: "${ECR_IMAGE:?ECR_IMAGE is required}"
: "${EXPECTED_MIGRATION:?EXPECTED_MIGRATION is required}"

AWS_REGION="${AWS_REGION:-us-west-2}"
PARAMETER_PREFIX="${PARAMETER_PREFIX:-/op-deckbuilder/dev}"
ENV_FILE="/opt/app/.env"

get_parameter() {
  local name="$1"
  local decrypt="${2:-false}"
  local args=(
    ssm get-parameter
    --region "$AWS_REGION"
    --name "$PARAMETER_PREFIX/$name"
    --query Parameter.Value
    --output text
  )

  if [[ "$decrypt" == "true" ]]; then
    args+=(--with-decryption)
  fi

  aws "${args[@]}"
}

get_optional_parameter() {
  get_parameter "$@" 2>/dev/null || true
}

echo "Loading the production environment from SSM Parameter Store..."
DB_HOST="$(get_parameter database/host)"
DB_PORT="$(get_parameter database/port)"
DB_NAME="$(get_parameter database/name)"
DB_USER="$(get_parameter database/username true)"
DB_PASSWORD="$(get_parameter database/password true)"
DATABASE_URL="$(get_parameter database/url true)"
CDN_BASE_URL="$(get_parameter app/cdn_base_url)"
JWT_SECRET="$(get_parameter app/jwt_secret true)"

for required_value in \
  "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASSWORD" \
  "$DATABASE_URL" "$CDN_BASE_URL" "$JWT_SECRET"; do
  if [[ -z "$required_value" || "$required_value" == "None" ]]; then
    echo "A required production SSM parameter is missing or empty." >&2
    exit 1
  fi
done

FIREBASE_API_KEY="$(get_optional_parameter firebase/api_key)"
FIREBASE_AUTH_DOMAIN="$(get_optional_parameter firebase/auth_domain)"
FIREBASE_PROJECT_ID="$(get_optional_parameter firebase/project_id)"
FIREBASE_APP_ID="$(get_optional_parameter firebase/app_id)"
FIREBASE_SERVICE_ACCOUNT_JSON="$(
  get_optional_parameter firebase/service_account_json true | jq -c . 2>/dev/null || true
)"

mkdir -p /opt/app
umask 077
TEMP_ENV_FILE="$(mktemp /opt/app/.env.XXXXXX)"
trap 'rm -f "$TEMP_ENV_FILE"' EXIT

{
  printf 'DATABASE_URL=%s\n' "$DATABASE_URL"
  printf 'DB_HOST=%s\n' "$DB_HOST"
  printf 'DB_PORT=%s\n' "$DB_PORT"
  printf 'DB_NAME=%s\n' "$DB_NAME"
  printf 'DB_USER=%s\n' "$DB_USER"
  printf 'DB_USERNAME=%s\n' "$DB_USER"
  printf 'DB_PASSWORD=%s\n' "$DB_PASSWORD"
  printf 'NODE_ENV=production\n'
  printf 'PORT=3000\n'
  printf 'NODE_TLS_REJECT_UNAUTHORIZED=0\n'
  printf 'FLYWAY_URL=jdbc:postgresql://%s:%s/%s?sslmode=require\n' \
    "$DB_HOST" "$DB_PORT" "$DB_NAME"
  printf 'FLYWAY_USER=%s\n' "$DB_USER"
  printf 'FLYWAY_PASSWORD=%s\n' "$DB_PASSWORD"
  printf 'CDN_BASE_URL=%s\n' "$CDN_BASE_URL"
  printf 'JWT_SECRET=%s\n' "$JWT_SECRET"

  [[ -n "$FIREBASE_API_KEY" && "$FIREBASE_API_KEY" != "None" ]] && \
    printf 'FIREBASE_API_KEY=%s\n' "$FIREBASE_API_KEY"
  [[ -n "$FIREBASE_AUTH_DOMAIN" && "$FIREBASE_AUTH_DOMAIN" != "None" ]] && \
    printf 'FIREBASE_AUTH_DOMAIN=%s\n' "$FIREBASE_AUTH_DOMAIN"
  [[ -n "$FIREBASE_PROJECT_ID" && "$FIREBASE_PROJECT_ID" != "None" ]] && \
    printf 'FIREBASE_PROJECT_ID=%s\n' "$FIREBASE_PROJECT_ID"
  [[ -n "$FIREBASE_APP_ID" && "$FIREBASE_APP_ID" != "None" ]] && \
    printf 'FIREBASE_APP_ID=%s\n' "$FIREBASE_APP_ID"
  [[ -n "$FIREBASE_SERVICE_ACCOUNT_JSON" ]] && \
    printf 'FIREBASE_SERVICE_ACCOUNT_JSON=%s\n' "$FIREBASE_SERVICE_ACCOUNT_JSON"
} > "$TEMP_ENV_FILE"

chmod 600 "$TEMP_ENV_FILE"
mv "$TEMP_ENV_FILE" "$ENV_FILE"
trap - EXIT
echo "Production environment loaded from SSM (values withheld)."

ECR_REGISTRY="${ECR_IMAGE%%/*}"
echo "Pulling the exact deployment image..."
aws ecr get-login-password --region "$AWS_REGION" |
  docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null
timeout 480 docker pull "$ECR_IMAGE"

echo "Running the one authoritative Flyway migrate command..."
docker run --rm \
  --env-file "$ENV_FILE" \
  --entrypoint /usr/local/bin/flyway \
  "$ECR_IMAGE" \
  -locations=filesystem:/app/migrations \
  migrate

echo "Verifying the exact production schema version with psql..."
ACTUAL_MIGRATION="$(
  docker run --rm \
    --env-file "$ENV_FILE" \
    --entrypoint sh \
    "$ECR_IMAGE" \
    -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atc "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1"'
)"

if [[ "$ACTUAL_MIGRATION" != "$EXPECTED_MIGRATION" ]]; then
  echo "Production schema version $ACTUAL_MIGRATION does not match expected $EXPECTED_MIGRATION." >&2
  exit 1
fi

echo "Production schema is current at version $ACTUAL_MIGRATION."
