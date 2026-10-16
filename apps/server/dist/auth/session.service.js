"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionToken = generateSessionToken;
exports.createSession = createSession;
exports.resolveSession = resolveSession;
exports.invalidateSession = invalidateSession;
const crypto_1 = __importDefault(require("crypto"));
const sessions = new Map(); // tokenHash → session
function generateSessionToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function createSession(playerId, roomId) {
    const token = generateSessionToken();
    const hash = hashToken(token);
    sessions.set(hash, { playerId, roomId, tokenHash: hash, createdAt: new Date() });
    return token;
}
function resolveSession(token) {
    const hash = hashToken(token);
    return sessions.get(hash) ?? null;
}
function invalidateSession(token) {
    const hash = hashToken(token);
    sessions.delete(hash);
}
