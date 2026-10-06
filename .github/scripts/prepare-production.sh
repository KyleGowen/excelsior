#!/usr/bin/env bash

set -euo pipefail

: "${ECR_IMAGE:?ECR_IMAGE is required}"
: "${EXPECTED_MIGRATION:?EXPECTED_MIGRATION is required}"

AWS_REGION="${AWS_REGION:-us-west-2}"
PARAMETER_PREFIX="${PARAMETER_PREFIX:-/op-deckbuilder/dev}"
APP_DIR="${EXCELSIOR_APP_DIRECTORY:-/opt/app}"
ENV_FILE="$APP_DIR/.env"

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
CDN_BASE_URL="$(get_parameter app/cdn_base_url)"
JWT_SECRET="$(get_parameter app/jwt_secret true)"

for required_value in \
  "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USER" "$DB_PASSWORD" \
  "$CDN_BASE_URL" "$JWT_SECRET"; do
  if [[ -z "$required_value" || "$required_value" == "None" ]]; then
    echo "A required production SSM parameter is missing or empty." >&2
    exit 1
  fi
done

# Build the application URL from the same canonical fields used by Flyway.
# URI-encode credentials and require TLS so a stale aggregate URL parameter
# cannot silently remove transport security.
DB_USER_URI="$(jq -rn --arg value "$DB_USER" '$value|@uri')"
DB_PASSWORD_URI="$(jq -rn --arg value "$DB_PASSWORD" '$value|@uri')"
DATABASE_URL="postgresql://${DB_USER_URI}:${DB_PASSWORD_URI}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

FIREBASE_API_KEY="$(get_optional_parameter firebase/api_key)"
FIREBASE_AUTH_DOMAIN="$(get_optional_parameter firebase/auth_domain)"
FIREBASE_PROJECT_ID="$(get_optional_parameter firebase/project_id)"
FIREBASE_APP_ID="$(get_optional_parameter firebase/app_id)"
FIREBASE_SERVICE_ACCOUNT_JSON="$(
  get_optional_parameter firebase/service_account_json true | jq -c . 2>/dev/null || true
)"

# Opt-in only after the TLS origin and zero-cache edge behaviors are established.
# The BMG secret stays with BMG; Excelsior stores its digest and its own native credential.
DATABASE_SERVICE_ENABLED="$(get_optional_parameter app/database_service_enabled)"
case "$DATABASE_SERVICE_ENABLED" in
  ''|None|0) DATABASE_SERVICE_ENABLED=0 ;;
  1) ;;
  *) echo "Invalid database service activation setting." >&2; exit 1 ;;
esac
mkdir -p "$APP_DIR/service-access"
chmod 700 "$APP_DIR/service-access"
if [[ "$DATABASE_SERVICE_ENABLED" == 1 ]]; then
  umask 077
  REGISTRY_TEMP="$(mktemp "$APP_DIR/service-access"/registry.XXXXXX)"
  NATIVE_TEMP="$(mktemp "$APP_DIR/service-access"/native.XXXXXX)"
  trap 'rm -f "$REGISTRY_TEMP" "$NATIVE_TEMP"' EXIT
  get_parameter app/database_service_config true > "$REGISTRY_TEMP"
  get_parameter app/native_database_credentials true > "$NATIVE_TEMP"
  jq -e '.environment == "production" and (.clients | length == 2) and ([.clients[].id] | sort == ["bmg-database-ui","excelsior-web"]) and all(.clients[]; .enabled == true and .scopes == ["catalog:read"])' "$REGISTRY_TEMP" >/dev/null
  jq -e '.environment == "production" and (.clients | length == 1) and .clients[0].clientId == "excelsior-web"' "$NATIVE_TEMP" >/dev/null
  chmod 600 "$REGISTRY_TEMP" "$NATIVE_TEMP"
  mv "$REGISTRY_TEMP" "$APP_DIR/service-access"/registry.json
  mv "$NATIVE_TEMP" "$APP_DIR/service-access"/native.json
  trap - EXIT
fi

mkdir -p "$APP_DIR"
umask 077
TEMP_ENV_FILE="$(mktemp "$APP_DIR/.env.XXXXXX")"
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
  if [[ "$DATABASE_SERVICE_ENABLED" == 1 ]]; then
    printf 'ENABLE_SERVICE_ACCESS=1\nENABLE_DATABASE_SERVICE_GATEWAY=1\nENABLE_NATIVE_DATABASE_SERVICE=1\n'
    printf 'SERVICE_ACCESS_CONFIG_FILE=/app/runtime/service-access/registry.json\n'
    printf 'APPLICATION_ACCESS_CREDENTIALS_FILE=/app/runtime/service-access/native.json\n'
  fi

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

if [[ "$DATABASE_SERVICE_ENABLED" == 1 ]]; then
  echo "Validating production service identity (values withheld)..."
  docker run --rm --env-file "$ENV_FILE" \
    -v "$APP_DIR/service-access:/app/runtime/service-access:ro" --entrypoint node "$ECR_IMAGE" \
    -e 'try { const {ServiceAccessService}=require("./dist/api/access/serviceAccessService"); const {NativeDatabaseAccess}=require("./dist/api/access/nativeDatabaseAccess"); const {readApplicationClientCredentials}=require("./dist/api/access/applicationClientCredentials"); new NativeDatabaseAccess(new ServiceAccessService(),()=>readApplicationClientCredentials("excelsior-web")).authenticate(); } catch { console.error("Production database service configuration is invalid"); process.exit(1); }'
fi

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
