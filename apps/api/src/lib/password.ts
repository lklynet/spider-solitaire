import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const verifyPassword = async (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);
