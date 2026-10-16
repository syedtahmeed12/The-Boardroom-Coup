import React, { useState } from 'react';
import { PrivatePlayerState } from '@boardroom/contracts';
import { sound } from '../services/sound';

interface Props {
  privateState: PrivatePlayerState;
}

export function AgendaPanel({ privateState }: Props) {
  const [concealed, setConcealed] = useState(false);
  const { agenda, influence } = privateState;

  function toggleConceal() {
    sound.playClick();
    setConcealed(!concealed);
  }

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="label-xs" style={{ color: 'var(--accent-purple)' }}>
            Secret Agenda
          </span>
          <span className="badge badge-purple" style={{ fontSize: 9 }}>
            Private
          </span>
        </div>
        <button
          onClick={toggleConceal}
          className="btn btn-ghost btn-sm"
          style={{ padding: '3px 8px', fontSize: 11 }}
        >
          {concealed ? 'Show Details' : 'Hide Details'}
        </button>
      </div>

      {/* Secret Objective Body */}
      <div style={{ marginBottom: 16 }}>
        {concealed ? (
          <div
            style={{
              padding: 12,
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-card)',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Agenda hidden for screen privacy. Click "Show Details" above.
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4, color: 'var(--text-primary)' }}>
              {agenda.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600, marginBottom: 8 }}>
              {agenda.objective}
            </p>
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>Condition: </strong>
              {agenda.successDescription}
            </div>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Influence Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
            Influence Balance
          </span>
          <p style={{ color: 'var(--text-subtle)', fontSize: 11 }}>
            +1 recovered on active vote (max 5)
          </p>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--primary)',
            background: 'var(--primary-light)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {influence}
        </div>
      </div>
    </div>
  );
}
