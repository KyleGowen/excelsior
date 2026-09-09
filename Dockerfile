# Multi-stage build for OP Deckbuilder

# Build arguments for git information and optional build timestamp
ARG GIT_COMMIT=unknown
ARG GIT_SHORT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG GIT_COMMIT_MESSAGE=unknown
ARG GIT_COMMIT_AUTHOR=unknown
ARG GIT_COMMIT_EMAIL=unknown
ARG BUILD_TIMESTAMP=0

# 1) Build stage - gather pre-built artifacts from context (no compile in Docker)
FROM node:20-alpine AS build
WORKDIR /app

# Copy stable, large resources before commit-specific build artifacts so their
# layer remains reusable across application-only releases.
COPY src/resources ./src/resources
COPY migrations ./migrations
COPY business-operations/metrics/aws-costs.csv ./business-operations/metrics/aws-costs.csv
COPY dist ./dist
# v2 React SPA build output (produced by `npm --prefix frontend run build` in CI
# before `docker build`).
COPY frontend/dist ./frontend/dist


# 2) Runtime stage - minimal Node + Flyway + Postgres client
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    FLYWAY_VERSION=9.22.3

# Install runtime tools:
# - bash (Flyway scripts may invoke bash)
# - OpenJDK 17 JRE (Flyway requires Java)
# - curl, tar (to fetch Flyway)
# - postgresql-client (psql)
# - netcat-openbsd (nc for connectivity tests)
# - ca-certificates, tzdata (TLS and correct time)
# - dumb-init (simple init for proper PID 1 signal handling)
RUN apk add --no-cache \
    bash openjdk17-jre curl tar \
    postgresql-client netcat-openbsd ca-certificates tzdata \
    dumb-init

# Install Flyway CLI and force it to use system Java (Alpine musl)
RUN curl -fsSL https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}-linux-x64.tar.gz \
    | tar xz -C /opt \
 && ln -s /opt/flyway-${FLYWAY_VERSION}/flyway /usr/local/bin/flyway \
 && rm -rf /opt/flyway-${FLYWAY_VERSION}/jre

# Copy only what we need at runtime
COPY package*.json ./
RUN npm ci --omit=dev
# Keep the large, stable resource layer ahead of volatile application output.
COPY --from=build /app/src/resources ./src/resources
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/business-operations/metrics/aws-costs.csv ./business-operations/metrics/aws-costs.csv
# Optional: copy flyway.conf if present (won't fail if missing)
COPY flyway.conf /app/flyway.conf
COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/dist ./frontend/dist

# Apply commit-specific metadata only after the reusable runtime layers.
ARG GIT_COMMIT=unknown
ARG GIT_SHORT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG GIT_COMMIT_MESSAGE=unknown
ARG GIT_COMMIT_AUTHOR=unknown
ARG GIT_COMMIT_EMAIL=unknown
ARG BUILD_TIMESTAMP=0

ENV GIT_COMMIT=${GIT_COMMIT} \
    GIT_SHORT_COMMIT=${GIT_SHORT_COMMIT} \
    GIT_BRANCH=${GIT_BRANCH} \
    GIT_COMMIT_DATE=${GIT_COMMIT_DATE} \
    GIT_COMMIT_MESSAGE=${GIT_COMMIT_MESSAGE} \
    GIT_COMMIT_AUTHOR=${GIT_COMMIT_AUTHOR} \
    GIT_COMMIT_EMAIL=${GIT_COMMIT_EMAIL}

# Build metadata at end so it does not invalidate layer cache
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}" > /tmp/build_info.txt

# Health: Node logs to stdout by default; dumb-init forwards signals
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
