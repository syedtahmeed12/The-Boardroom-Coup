"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGateway = setupGateway;
const ws_1 = require("ws");
const session_service_js_1 = require("../auth/session.service.js");
const contracts_1 = require("@boardroom/contracts");
const room_service_js_1 = require("../rooms/room.service.js");
// roomId → Set<socket>
const roomSockets = new Map();
// playerId → socket
const playerSocket = new Map();
function setupGateway(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    // Register broadcast function with room service
    (0, room_service_js_1.setBroadcastFn)((roomId, playerId, payload) => {
        const json = JSON.stringify(payload);
        if (playerId) {
            const sock = playerSocket.get(playerId);
            if (sock?.readyState === ws_1.WebSocket.OPEN) {
                sock.send(json);
            }
        }
        else {
            const sockets = roomSockets.get(roomId);
            if (sockets) {
                for (const s of sockets) {
                    if (s.readyState === ws_1.WebSocket.OPEN) {
                        s.send(json);
                    }
                }
            }
        }
    });
    wss.on('connection', (ws, req) => {
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('message', (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                sendError(ws, 'PARSE_ERROR', 'Invalid JSON');
                return;
            }
            if (typeof msg !== 'object' || msg === null || !('type' in msg)) {
                sendError(ws, 'INVALID_COMMAND', 'Missing type field');
                return;
            }
            handleCommand(ws, msg);
        });
        ws.on('close', () => {
            if (ws.playerId && ws.roomId) {
                const sockets = roomSockets.get(ws.roomId);
                sockets?.delete(ws);
                playerSocket.delete(ws.playerId);
                (0, room_service_js_1.setConnected)(ws.playerId, false);
            }
        });
        ws.on('error', (err) => {
            console.error('[WS] socket error:', err.message);
        });
    });
    // Heartbeat to prune dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const s = ws;
            if (!s.isAlive) {
                s.terminate();
                return;
            }
            s.isAlive = false;
            s.ping();
        });
    }, 30_000);
    wss.on('close', () => clearInterval(interval));
}
function registerSocket(ws, playerId, roomId) {
    ws.playerId = playerId;
    ws.roomId = roomId;
    let sockets = roomSockets.get(roomId);
    if (!sockets) {
        sockets = new Set();
        roomSockets.set(roomId, sockets);
    }
    // Remove any existing socket for this player
    const existing = playerSocket.get(playerId);
    if (existing && existing !== ws) {
        existing.terminate();
        sockets.delete(existing);
    }
    sockets.add(ws);
    playerSocket.set(playerId, ws);
}
function send(ws, payload) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    }
}
function sendError(ws, code, message) {
    send(ws, { type: 'error', code, message });
}
function handleCommand(ws, msg) {
    switch (msg.type) {
        case 'create_room': {
            const parsed = contracts_1.CreateRoomCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid create_room command');
                return;
            }
            const result = (0, room_service_js_1.createRoom)(parsed.data.playerName);
            registerSocket(ws, result.playerId, result.roomId);
            (0, room_service_js_1.setConnected)(result.playerId, true);
            send(ws, {
                type: 'session_created',
                sessionToken: result.token,
                playerId: result.playerId,
                roomId: result.roomId,
                roomCode: result.roomCode,
            });
            break;
        }
        case 'join_room': {
            const parsed = contracts_1.JoinRoomCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid join_room command');
                return;
            }
            const result = (0, room_service_js_1.joinRoom)(parsed.data.roomCode, parsed.data.playerName);
            if ('error' in result) {
                sendError(ws, result.error, result.error);
                return;
            }
            registerSocket(ws, result.playerId, result.roomId);
            (0, room_service_js_1.setConnected)(result.playerId, true);
            send(ws, {
                type: 'session_created',
                sessionToken: result.token,
                playerId: result.playerId,
                roomId: result.roomId,
                roomCode: result.roomCode,
            });
            break;
        }
        case 'rejoin': {
            const parsed = contracts_1.RejoinCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid rejoin command');
                return;
            }
            const session = (0, session_service_js_1.resolveSession)(parsed.data.sessionToken);
            if (!session) {
                sendError(ws, 'INVALID_SESSION', 'Session not found');
                return;
            }
            registerSocket(ws, session.playerId, session.roomId);
            (0, room_service_js_1.setConnected)(session.playerId, true);
            send(ws, { type: 'session_created', sessionToken: parsed.data.sessionToken, playerId: session.playerId, roomId: session.roomId, roomCode: '' });
            break;
        }
        case 'ready': {
            const parsed = contracts_1.ReadyCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid ready command');
                return;
            }
            const session = (0, session_service_js_1.resolveSession)(parsed.data.sessionToken);
            if (!session) {
                sendError(ws, 'INVALID_SESSION', 'Session not found');
                return;
            }
            (0, room_service_js_1.setReady)(session.playerId);
            break;
        }
        case 'start_match': {
            const parsed = contracts_1.StartMatchCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid start_match command');
                return;
            }
            const session = (0, session_service_js_1.resolveSession)(parsed.data.sessionToken);
            if (!session) {
                sendError(ws, 'INVALID_SESSION', 'Session not found');
                return;
            }
            const err = (0, room_service_js_1.startMatch)(session.playerId);
            if (err) {
                sendError(ws, err.error, err.error);
                return;
            }
            break;
        }
        case 'submit_vote': {
            const parsed = contracts_1.SubmitVoteCommandSchema.safeParse(msg);
            if (!parsed.success) {
                sendError(ws, 'VALIDATION_ERROR', 'Invalid submit_vote command');
                return;
            }
            const session = (0, session_service_js_1.resolveSession)(parsed.data.sessionToken);
            if (!session) {
                sendError(ws, 'INVALID_SESSION', 'Session not found');
                return;
            }
            const err = (0, room_service_js_1.submitVote)(session.playerId, parsed.data.roundNumber, parsed.data.option, parsed.data.influenceSpent);
            if (err) {
                sendError(ws, err.error, err.error);
                return;
            }
            break;
        }
        default:
            sendError(ws, 'UNKNOWN_COMMAND', `Unknown command type: ${msg.type}`);
    }
}
