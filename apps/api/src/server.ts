import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import { config } from './config.js';
import { applyRateLimit } from './lib/rateLimit.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerLeaderboardRoutes } from './routes/leaderboards.js';
import { registerOfficialRoutes } from './routes/official.js';
import { registerProfileRoutes } from './routes/profiles.js';

const app = Fastify({
  logger: true,
  bodyLimit: config.apiBodyLimitBytes
});

await app.register(cookie);
app.addHook('onRequest', applyRateLimit);
await registerAuthRoutes(app);
await registerOfficialRoutes(app);
await registerLeaderboardRoutes(app);
await registerProfileRoutes(app);
await registerAdminRoutes(app);

app.get('/health', async () => ({
  status: 'ok',
  service: 'api'
}));

const start = async () => {
  try {
    await app.listen({ port: config.apiPort, host: config.apiHost });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
