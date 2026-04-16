CREATE TABLE IF NOT EXISTS attempt_replays (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL UNIQUE REFERENCES challenge_attempts(id) ON DELETE CASCADE,
  event_count INT NOT NULL DEFAULT 0,
  replay_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
