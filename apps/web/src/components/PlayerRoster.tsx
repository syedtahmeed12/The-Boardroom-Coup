import React from 'react';
import { PublicPlayer } from '@boardroom/contracts';

interface Props {
  players: PublicPlayer[];
  hostId: string;
  myId: string;
}

export function PlayerRoster({ players, hostId, myId }: Props) {
  return (
    <div className="glass-card">
      <div className="section-header" style={{ marginBottom: 12 }}>
        <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
          Board Members
        </span>
        <span className="badge badge-neutral">
          {players.length} of 8 Seated
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p) => {
          const isMe = p.id === myId;
          const isHost = p.id === hostId;

          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                background: isMe ? 'var(--primary-light)' : 'var(--bg-subtle)',
                border: `1px solid ${isMe ? 'var(--primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Clean Initial Circle */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isMe ? 'var(--primary)' : 'var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#ffffff',
                  }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: isMe ? 800 : 600, fontSize: 13, color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    {isMe && (
                      <span className="badge badge-blue" style={{ fontSize: 9 }}>
                        You
                      </span>
                    )}
                  </div>
                  {p.corporateTitle && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginTop: 1 }}>
                      {p.corporateTitle}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span className={`dot ${p.connected ? 'dot-green' : 'dot-muted'}`} />
                    <span style={{ fontSize: 11, color: p.connected ? 'var(--text-muted)' : 'var(--text-subtle)' }}>
                      {p.connected ? 'Online' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {isHost && (
                  <span className="badge badge-amber">
                    Host
                  </span>
                )}
                {p.hasCommitted && (
                  <span className="badge badge-green">
                    Committed
                  </span>
                )}
                {p.ready && !p.hasCommitted && (
                  <span className="badge badge-blue">
                    Ready
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
