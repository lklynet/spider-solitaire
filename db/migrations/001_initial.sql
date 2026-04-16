CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS player_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_seed TEXT,
  avatar_url TEXT,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY,
  challenge_date DATE NOT NULL UNIQUE,
  timezone TEXT NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  seed TEXT NOT NULL UNIQUE,
  rules_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'open', 'closed', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_status ON daily_challenges(status);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_opens_at ON daily_challenges(opens_at);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_closes_at ON daily_challenges(closes_at);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number = 1),
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('started', 'submitted', 'expired', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_challenge_id ON challenge_attempts(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user_id ON challenge_attempts(user_id);

CREATE TABLE IF NOT EXISTS attempt_results (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL UNIQUE REFERENCES challenge_attempts(id) ON DELETE CASCADE,
  raw_time_ms INT NOT NULL CHECK (raw_time_ms > 0),
  hint_count INT NOT NULL DEFAULT 0 CHECK (hint_count >= 0),
  undo_count INT NOT NULL DEFAULT 0 CHECK (undo_count >= 0),
  adjusted_time_ms INT NOT NULL CHECK (adjusted_time_ms > 0),
  is_win BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_rankings (
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  best_attempt_result_id UUID REFERENCES attempt_results(id) ON DELETE SET NULL,
  rank INT,
  points_awarded INT NOT NULL DEFAULT 0,
  finalized_at TIMESTAMPTZ,
  PRIMARY KEY (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS badge_counters (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wins_1st INT NOT NULL DEFAULT 0,
  finishes_top3 INT NOT NULL DEFAULT 0,
  finishes_top5 INT NOT NULL DEFAULT 0,
  finishes_top10 INT NOT NULL DEFAULT 0,
  days_played INT NOT NULL DEFAULT 0,
  days_submitted INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
