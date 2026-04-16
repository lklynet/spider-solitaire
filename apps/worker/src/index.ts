import { config } from './config.js';
import { finalizeClosedChallenges, syncChallengeSchedule } from './challenges.js';
import { pool } from './db.js';

const runTick = async () => {
  const rows = await syncChallengeSchedule({
    timeZone: config.officialTimezone,
    openHour: config.officialOpenHour,
    durationHours: config.officialDurationHours,
    rulesVersion: config.officialRulesVersion
  });
  await finalizeClosedChallenges();

  console.log(
    `[worker] scheduler heartbeat ${new Date().toISOString()} synced ${rows.length} challenges`
  );
};

const bootstrap = async () => {
  await runTick();

  setInterval(() => {
    void runTick().catch((error) => {
      console.error(error);
    });
  }, config.tickMs);
};

void bootstrap().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
