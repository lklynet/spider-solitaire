const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://spider:change-me@localhost:5432/spider_solitaire',
  tickMs: toNumber(process.env.WORKER_TICK_MS, 60000),
  officialTimezone: process.env.OFFICIAL_TIMEZONE ?? 'America/New_York',
  officialOpenHour: toNumber(process.env.OFFICIAL_OPEN_HOUR, 8),
  officialDurationHours: toNumber(process.env.OFFICIAL_DURATION_HOURS, 12),
  officialRulesVersion: process.env.OFFICIAL_RULES_VERSION ?? 'v1'
};
