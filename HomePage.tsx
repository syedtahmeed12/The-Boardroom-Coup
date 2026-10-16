import React, { useState } from 'react';
import { gameSocket } from '../services/socket';
import { sound } from '../services/sound';

interface Props {
  onError: (msg: string) => void;
}

export function HomePage({ onError }: Props) {
  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    sound.playClick();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      onError('Display name must be 2–20 characters');
      return;
    }
    setLoading(true);
    gameSocket.send({ type: 'create_room', playerName: trimmed });
    setTimeout(() => setLoading(false), 3000);
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    sound.playClick();
    const trimmed = name.trim();
    const c = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) {
      onError('Display name must be 2–20 characters');
      return;
    }
    if (c.length !== 6) {
      onError('Room code must be exactly 6 characters');
      return;
    }
    setLoading(true);
    gameSocket.send({ type: 'join_room', roomCode: c, playerName: trimmed });
    setTimeout(() => setLoading(false), 3000);
  }

  return (
    <div className="page page-center">
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-amber">⚔️ Tavern Conclave & Corporate Coup</span>
            <span className="badge badge-neutral">2–8 Seated</span>
          </div>

          <h1 style={{ fontSize: 34, lineHeight: 1.2, marginBottom: 12, color: 'var(--text-primary)' }}>
            The Boardroom Coup
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            A high-stakes corporate crisis simulation and social deduction conspiracy. Convene in the shadow council, navigate catastrophic scandals, and privately fulfill your confidential agenda.
          </p>
        </div>

        {/* Initial Choice: Create or Join */}
        {mode === 'none' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={() => { sound.playClick(); setMode('create'); }}
            >
              Create Executive Boardroom
            </button>
            <button
              className="btn btn-secondary btn-lg"
              style={{ width: '100%' }}
              onClick={() => { sound.playClick(); setMode('join'); }}
            >
              Join Board Session
            </button>

            <div
              style={{
                marginTop: 8,
                padding: '12px 14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="label-xs" style={{ marginBottom: 4, color: 'var(--text-secondary)' }}>
                Session Specifications
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                2–8 Board Members across C-Suite and Independent Directors. Matches last 6 crisis rounds (~15–20 min). Zero friction: no account required to join.
              </p>
            </div>
          </div>
        )}

        {/* Create Room Form */}
        {mode === 'create' && (
          <div className="glass-card">
            <div className="section-header" style={{ marginBottom: 18 }}>
              <h3>Create Room</h3>
              <span className="badge badge-blue">Host</span>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-xs" style={{ display: 'block', marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alexandra Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { sound.playClick(); setMode('none'); }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <div className="glass-card">
            <div className="section-header" style={{ marginBottom: 18 }}>
              <h3>Join Room</h3>
              <span className="badge badge-neutral">Participant</span>
            </div>

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-xs" style={{ display: 'block', marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Webb"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div>
                <label className="label-xs" style={{ display: 'block', marginBottom: 6 }}>
                  Room Code (6 Characters)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2QKU6J"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="mono"
                  style={{
                    fontSize: 20,
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => { sound.playClick(); setMode('none'); }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
