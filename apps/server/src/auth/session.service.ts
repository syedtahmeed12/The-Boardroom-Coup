import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory session store.
 * Production: replace with DB-backed hashed tokens.
 */
interface SessionRecord {
  playerId: string;
  roomId: string;
  tokenHash: string;
  createdAt: Date;
}

const sessions = new Map<string, SessionRecord>(); // tokenHash → session

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSession(playerId: string, roomId: string): string {
  const token = generateSessionToken();
  const hash = hashToken(token);
  sessions.set(hash, { playerId, roomId, tokenHash: hash, createdAt: new Date() });
  return token;
}

export function resolveSession(token: string): SessionRecord | null {
  const hash = hashToken(token);
  return sessions.get(hash) ?? null;
}

export function invalidateSession(token: string): void {
  const hash = hashToken(token);
  sessions.delete(hash);
}
