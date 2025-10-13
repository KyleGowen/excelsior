# Multi-stage build for OP Deckbuilder

# 1) Build stage - install deps and compile TypeScript
FROM node:20-alpine AS build
WORKDIR /app

# Install OS deps used during build (git optional)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


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
