import type { FastifyReply, FastifyRequest } from 'fastify';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitRule {
  prefix: string;
  max: number;
  windowMs: number;
}

const buckets = new Map<string, RateLimitBucket>();

const rules: RateLimitRule[] = [
  { prefix: '/auth/login', max: 10, windowMs: 15 * 60 * 1000 },
  { prefix: '/auth/register', max: 5, windowMs: 15 * 60 * 1000 },
  { prefix: '/official/attempts', max: 60, windowMs: 5 * 60 * 1000 },
  { prefix: '/admin/', max: 120, windowMs: 5 * 60 * 1000 }
];

const getClientKey = (request: FastifyRequest) =>
  request.headers['x-forwarded-for']
    ? String(request.headers['x-forwarded-for']).split(',')[0].trim()
    : request.ip;

const getRule = (url: string) => rules.find((rule) => url.startsWith(rule.prefix));

export const applyRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
  const rule = getRule(request.url);
  if (!rule) return;

  const now = Date.now();
  const key = `${rule.prefix}:${getClientKey(request)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + rule.windowMs
    });
    return;
  }

  if (bucket.count >= rule.max) {
    reply.header('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
    return reply.status(429).send({
      error: 'rate_limit_exceeded'
    });
  }

  bucket.count += 1;
};
