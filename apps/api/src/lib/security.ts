import { createHash, randomBytes, randomUUID } from 'node:crypto';

export const createId = () => randomUUID();

export const createSessionToken = () => randomBytes(32).toString('hex');

export const hashValue = (value: string) =>
  createHash('sha256').update(value).digest('hex');
