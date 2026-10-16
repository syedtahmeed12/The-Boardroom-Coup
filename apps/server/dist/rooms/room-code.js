"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomCode = generateRoomCode;
exports.validateRoomCode = validateRoomCode;
const crypto_1 = __importDefault(require("crypto"));
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I ambiguity
const CODE_LENGTH = 6;
function generateRoomCode() {
    const bytes = crypto_1.default.randomBytes(CODE_LENGTH);
    return Array.from(bytes)
        .map((b) => ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length])
        .join('');
}
function validateRoomCode(code) {
    if (code.length !== CODE_LENGTH)
        return false;
    return Array.from(code).every((c) => ROOM_CODE_CHARS.includes(c));
}
