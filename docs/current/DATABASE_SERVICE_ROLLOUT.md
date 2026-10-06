# Database service rollout

Release gates and deferred BMG scope: [handoff](BMG_DATABASE_PORT_HANDOFF.md).
The native Database keeps its components, queries, cookies, player operations and
image helpers. Only its catalog transport receives verified in-process identity.

1. Kyle accepts the identified local preview and explicitly authorizes shipping.
2. Confirm origin.excelsior.cards still resolves directly to the active EC2 host.
   Provision/renew a publicly trusted origin certificate; install the service-only
   nginx template with its upstream set to /opt/app/active_port. Validate nginx
   before reloading. Do not replace the existing public HTTP configuration.
   Verify HTTPS certificate hostname/chain and service-path isolation directly.
   The origin uses Certbot 4.2.0 with the nginx authenticator in
   /opt/excelsior-certbot (Python 3.9). Install the renewal service/timer from
   infra/nginx, enable its timer, and verify the renewal dry-run. Its deploy hook
   validates nginx before reload. The account and Subscriber Agreement were
   explicitly approved by Kyle on October 6, 2026.
3. Review the Terraform plan with enable_database_service_edge=true and
   enable_native_database_edge=true. Apply only the intended HTTPS service origin
   and zero-TTL gateway behaviors; no unrelated topology changes. A state plan
   affecting other resources blocks release. Public app/image behaviors stay intact.
4. Privately provision distinct production native/BMG credentials and a separate
   service signing key. Store hashed client registry as SecureString at
   /op-deckbuilder/dev/app/database_service_config and the native-only credential
   file at /op-deckbuilder/dev/app/native_database_credentials. The registry must
   contain excelsior-web and bmg-database-ui with catalog:read only. Deliver BMG's
   secret privately to its server, never its browser/repository. No secret is
   generated, retrieved or printed by a planning/review tool call.
5. Set app/database_service_enabled=1 only after edge/origin readiness. Existing
   prepare-production loads private 0600 files, validates native identity in the
   exact image and runs Flyway V368 before the existing blue-green deployment.
   Containers mount service files read-only and bind their upstream to loopback;
   traffic switching updates both public and service nginx configurations.
6. Verify the deployed revision/health, native Database read-only browser cases,
   BMG confidential token/read/denial and matching DB records/aggregate deltas.
   Check that credentials never appear in response headers or logs. Stop for
   Kyle's explicit production acceptance before BMG implementation.

Rollback: turn off app/database_service_enabled and redeploy the accepted previous
image through existing rollback procedures. This restores direct native catalog
reads; service paths fail closed. Keep additive migration and tracking rows. Do
not remove the TLS origin or change existing public/image behaviors during an
application rollback. Config/query-cache clients refresh on reload; a stale client
still using the disabled native path may need reload. Never silently fall back
to unauthenticated service reads. Follow existing release gates before changes.

Local flags: ENABLE_SERVICE_ACCESS=1, ENABLE_DATABASE_SERVICE_GATEWAY=1,
ENABLE_NATIVE_DATABASE_SERVICE=1, private SERVICE_ACCESS_CONFIG_FILE and private
APPLICATION_ACCESS_CREDENTIALS_FILE. The broad ENABLE_EXCELSIOR_ACCESS_ADAPTER
must stay off. Nonproduction loopback HTTP is permitted for isolated tests only.
Remote confidential transports reject certificate-verification bypass.

This checkout starts from remote V365 and uses V368. The primary checkout's
unshared Skybound drafts V366/V367 remain untouched. If this release ships first,
those drafts and their test/document references must be renumbered above V368
before their later merge; otherwise Flyway will reject the pending lower versions.
Recheck migration order against remote before each release. Do not enable
out-of-order migrations or include unrelated catalog changes to bypass this.
Tracking uses bounded async best-effort writes; monitor sanitized failure
warnings. Daily aggregates survive request retention and preserve total counts.
