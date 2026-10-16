import React, { useState } from 'react';
import { gameSocket } from '../services/socket';
import { PublicRoomState } from '@boardroom/contracts';
import { PlayerRoster } from '../components/PlayerRoster';
import { sound } from '../services/sound';

interface Props {
  room: PublicRoomState;
  sessionToken: string;
  playerId: string;
  onLeave: () => void;
}

export function LobbyPage({ room, sessionToken, playerId, onLeave }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostPlayerId === playerId;
  const myPlayer = room.players.find((p) => p.id === playerId);
  const isReady = myPlayer?.ready ?? false;
  const allReady = room.players.length >= 2 && room.players.every((p) => p.ready);

  function handleReady() {
    sound.playSelect();
    gameSocket.send({ type: 'ready', sessionToken });
  }

  function handleStart() {
    sound.playCommit();
    gameSocket.send({ type: 'start_match', sessionToken });
  }

  function handleCopyCode() {
    sound.playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="app-header-brand">The Boardroom Coup</div>
        <button className="btn btn-ghost btn-sm" onClick={onLeave}>
          Leave Room
        </button>
      </header>

      <div className="page-center">
        <div style={{ width: '100%', maxWidth: 540 }}>
          {/* Room Code Card */}
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            <div className="label-xs" style={{ marginBottom: 8, color: 'var(--text-muted)' }}>
              ROOM CODE
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                marginBottom: 10,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  color: 'var(--primary)',
                }}
              >
                {room.code}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
              >
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Share this code with other players so they can join from their browser.
            </p>
          </div>

          {/* Seated Player Roster */}
          <PlayerRoster players={room.players} hostId={room.hostPlayerId} myId={playerId} />

          {/* Action Area */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!isReady && (
              <button
                className="btn btn-success btn-lg"
                style={{ width: '100%' }}
                onClick={handleReady}
              >
                Confirm Ready
              </button>
            )}

            {isReady && !isHost && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 14,
                  background: 'var(--success-light)',
                  border: '1px solid rgba(5, 150, 105, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--success)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Status: Ready. Waiting for host to start match...
              </div>
            )}

            {isHost && (
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={!allReady}
                onClick={handleStart}
              >
                {allReady
                  ? 'Start Match'
                  : `Waiting for Players (${room.players.filter((p) => p.ready).length}/${room.players.length} ready)`}
              </button>
            )}
          </div>

          {/* Rules Overview */}
          <div
            className="glass-card"
            style={{
              marginTop: 18,
              padding: 16,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="label-xs" style={{ marginBottom: 6 }}>
              BOARDROOM STRUCTURE
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
              6 crisis rounds. 3 shared company vital signs (Budget, Public Trust, Employee Morale). If any metric reaches 0%, the company suffers immediate liquidation. Each director receives a confidential corporate agenda and title.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
