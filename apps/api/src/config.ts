const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  apiHost: process.env.API_HOST ?? '0.0.0.0',
  apiPort: toNumber(process.env.API_PORT, 3000),
  apiBodyLimitBytes: toNumber(process.env.API_BODY_LIMIT_BYTES, 262144),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://spider:change-me@localhost:5432/spider_solitaire',
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'spider_session',
  sessionMaxAgeSeconds: toNumber(process.env.SESSION_MAX_AGE_SECONDS, 60 * 60 * 24 * 30),
  adminUsernames: (process.env.ADMIN_USERNAMES ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
  officialTimezone: process.env.OFFICIAL_TIMEZONE ?? 'America/New_York',
  officialOpenHour: toNumber(process.env.OFFICIAL_OPEN_HOUR, 8),
  officialDurationHours: toNumber(process.env.OFFICIAL_DURATION_HOURS, 12),
  officialRulesVersion: process.env.OFFICIAL_RULES_VERSION ?? 'v1',
  officialReplayEventLimit: toNumber(process.env.OFFICIAL_REPLAY_EVENT_LIMIT, 5000)
};
