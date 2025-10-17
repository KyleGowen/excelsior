# Multi-stage build for OP Deckbuilder

# Build arguments for git information and cache busting
ARG GIT_COMMIT=unknown
ARG GIT_SHORT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG GIT_COMMIT_MESSAGE=unknown
ARG GIT_COMMIT_AUTHOR=unknown
ARG GIT_COMMIT_EMAIL=unknown
ARG BUILD_TIMESTAMP=0

# 1) Build stage - install deps and compile TypeScript
FROM node:20-alpine AS build
WORKDIR /app

# Cache busting - this ensures no layer caching
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}" > /tmp/build_info.txt

# Install OS deps used during build (git optional)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# 2) Runtime stage - minimal Node + Flyway + Postgres client
FROM node:20-alpine
WORKDIR /app

# Accept build arguments from build stage
ARG GIT_COMMIT=unknown
ARG GIT_SHORT_COMMIT=unknown
ARG GIT_BRANCH=unknown
ARG GIT_COMMIT_DATE=unknown
ARG GIT_COMMIT_MESSAGE=unknown
ARG GIT_COMMIT_AUTHOR=unknown
ARG GIT_COMMIT_EMAIL=unknown
ARG BUILD_TIMESTAMP=0

# Cache busting - this ensures no layer caching
RUN echo "Runtime build timestamp: ${BUILD_TIMESTAMP}" > /tmp/runtime_build_info.txt

ENV NODE_ENV=production \
    PORT=3000 \
    FLYWAY_VERSION=9.22.3 \
    GIT_COMMIT=${GIT_COMMIT} \
    GIT_SHORT_COMMIT=${GIT_SHORT_COMMIT} \
    GIT_BRANCH=${GIT_BRANCH} \
    GIT_COMMIT_DATE=${GIT_COMMIT_DATE} \
    GIT_COMMIT_MESSAGE=${GIT_COMMIT_MESSAGE} \
    GIT_COMMIT_AUTHOR=${GIT_COMMIT_AUTHOR} \
    GIT_COMMIT_EMAIL=${GIT_COMMIT_EMAIL}

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
COPY --from=build /app/dist ./dist

# Copy migrations so Flyway CLI can run in-container if needed
COPY migrations /app/migrations
# Optional: copy flyway.conf if present (won't fail if missing)
COPY flyway.conf /app/flyway.conf

# Copy static files for the web frontend
COPY public /app/public
# Copy src/resources (card images and data)
COPY src/resources /app/src/resources

# Health: Node logs to stdout by default; dumb-init forwards signals
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/index.js"]
