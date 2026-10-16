import crypto from 'crypto';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I ambiguity
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length])
    .join('');
}

export function validateRoomCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  return Array.from(code).every((c) => ROOM_CODE_CHARS.includes(c));
}
