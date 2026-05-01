import '@fastify/cookie';
import Fastify from 'fastify';
import { config } from './config.js';

const app = Fastify({
  logger: true,
  bodyLimit: config.apiBodyLimitBytes
});

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
