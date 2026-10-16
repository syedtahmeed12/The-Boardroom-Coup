import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { resolveSession } from '../auth/session.service.js';
import {
  CreateRoomCommandSchema,
  JoinRoomCommandSchema,
  ReadyCommandSchema,
  StartMatchCommandSchema,
  SubmitVoteCommandSchema,
  RejoinCommandSchema,
  VoteOption,
} from '@boardroom/contracts';
import {
  createRoom,
  joinRoom,
  setReady,
  startMatch,
  submitVote,
  setConnected,
  setBroadcastFn,
} from '../rooms/room.service.js';

interface AuthedSocket extends WebSocket {
  playerId?: string;
  roomId?: string;
  isAlive?: boolean;
}

// roomId → Set<socket>
const roomSockets = new Map<string, Set<AuthedSocket>>();
// playerId → socket
const playerSocket = new Map<string, AuthedSocket>();

export function setupGateway(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Register broadcast function with room service
  setBroadcastFn((roomId, playerId, payload) => {
    const json = JSON.stringify(payload);
    if (playerId) {
      const sock = playerSocket.get(playerId);
      if (sock?.readyState === WebSocket.OPEN) {
        sock.send(json);
      }
    } else {
      const sockets = roomSockets.get(roomId);
      if (sockets) {
        for (const s of sockets) {
          if (s.readyState === WebSocket.OPEN) {
            s.send(json);
          }
        }
      }
    }
  });

  wss.on('connection', (ws: AuthedSocket, req: IncomingMessage) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      let msg: unknown;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        sendError(ws, 'PARSE_ERROR', 'Invalid JSON');
        return;
      }

      if (typeof msg !== 'object' || msg === null || !('type' in msg)) {
        sendError(ws, 'INVALID_COMMAND', 'Missing type field');
        return;
      }

      handleCommand(ws, msg as Record<string, unknown>);
    });

    ws.on('close', () => {
      if (ws.playerId && ws.roomId) {
        const sockets = roomSockets.get(ws.roomId);
        sockets?.delete(ws);
        playerSocket.delete(ws.playerId);
        setConnected(ws.playerId, false);
      }
    });

    ws.on('error', (err) => {
      console.error('[WS] socket error:', err.message);
    });
  });

  // Heartbeat to prune dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const s = ws as AuthedSocket;
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

function registerSocket(ws: AuthedSocket, playerId: string, roomId: string): void {
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

function send(ws: WebSocket, payload: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendError(ws: WebSocket, code: string, message: string): void {
  send(ws, { type: 'error', code, message });
}

function handleCommand(ws: AuthedSocket, msg: Record<string, unknown>): void {
  switch (msg.type) {
    case 'create_room': {
      const parsed = CreateRoomCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid create_room command'); return; }
      const result = createRoom(parsed.data.playerName);
      registerSocket(ws, result.playerId, result.roomId);
      setConnected(result.playerId, true);
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
      const parsed = JoinRoomCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid join_room command'); return; }
      const result = joinRoom(parsed.data.roomCode, parsed.data.playerName);
      if ('error' in result) { sendError(ws, result.error, result.error); return; }
      registerSocket(ws, result.playerId, result.roomId);
      setConnected(result.playerId, true);
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
      const parsed = RejoinCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid rejoin command'); return; }
      const session = resolveSession(parsed.data.sessionToken);
      if (!session) { sendError(ws, 'INVALID_SESSION', 'Session not found'); return; }
      registerSocket(ws, session.playerId, session.roomId);
      setConnected(session.playerId, true);
      send(ws, { type: 'session_created', sessionToken: parsed.data.sessionToken, playerId: session.playerId, roomId: session.roomId, roomCode: '' });
      break;
    }

    case 'ready': {
      const parsed = ReadyCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid ready command'); return; }
      const session = resolveSession(parsed.data.sessionToken);
      if (!session) { sendError(ws, 'INVALID_SESSION', 'Session not found'); return; }
      setReady(session.playerId);
      break;
    }

    case 'start_match': {
      const parsed = StartMatchCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid start_match command'); return; }
      const session = resolveSession(parsed.data.sessionToken);
      if (!session) { sendError(ws, 'INVALID_SESSION', 'Session not found'); return; }
      const err = startMatch(session.playerId);
      if (err) { sendError(ws, err.error, err.error); return; }
      break;
    }

    case 'submit_vote': {
      const parsed = SubmitVoteCommandSchema.safeParse(msg);
      if (!parsed.success) { sendError(ws, 'VALIDATION_ERROR', 'Invalid submit_vote command'); return; }
      const session = resolveSession(parsed.data.sessionToken);
      if (!session) { sendError(ws, 'INVALID_SESSION', 'Session not found'); return; }
      const err = submitVote(
        session.playerId,
        parsed.data.roundNumber,
        parsed.data.option as VoteOption,
        parsed.data.influenceSpent
      );
      if (err) { sendError(ws, err.error, err.error); return; }
      break;
    }

    default:
      sendError(ws, 'UNKNOWN_COMMAND', `Unknown command type: ${msg.type}`);
  }
}
