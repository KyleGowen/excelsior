-- V366/V367 are reserved by existing local work; this additive migration follows remote V365.
ALTER TABLE api_access_log
  ADD COLUMN application_id VARCHAR(80) NOT NULL DEFAULT 'unknown',
  ADD COLUMN service_client_id VARCHAR(80),
  ADD COLUMN identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN duration_ms INTEGER;

CREATE INDEX idx_api_access_log_application_ts ON api_access_log(application_id, ts);

CREATE TABLE api_application_hit_counts (
  application_id VARCHAR(80) NOT NULL,
  route_key TEXT NOT NULL,
  method VARCHAR(10) NOT NULL,
  status INTEGER NOT NULL,
  day DATE NOT NULL,
  hit_count BIGINT NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (application_id, route_key, method, status, day)
);
