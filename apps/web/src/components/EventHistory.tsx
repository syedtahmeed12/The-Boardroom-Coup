import React from 'react';
import { PublicEventEntry } from '@boardroom/contracts';

interface Props {
  events: PublicEventEntry[];
}

export function EventHistory({ events }: Props) {
  const reversed = [...events].reverse();

  return (
    <div
      className="glass-card"
      style={{
        maxHeight: 260,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="section-header" style={{ marginBottom: 10, flexShrink: 0 }}>
        <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
          Audit Log
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
          {events.length} Events
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {reversed.map((e) => (
          <div
            key={e.sequence}
            style={{
              display: 'flex',
              gap: 10,
              padding: '8px 10px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              alignItems: 'flex-start',
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                padding: '2px 4px',
                borderRadius: 3,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                flexShrink: 0,
              }}
            >
              #{String(e.sequence).padStart(3, '0')}
            </span>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {e.summary}
              </p>

              {e.metersAfter && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                  <DeltaPill label="Budget" before={e.metersBefore?.budget} after={e.metersAfter.budget} />
                  <DeltaPill label="Trust" before={e.metersBefore?.publicTrust} after={e.metersAfter.publicTrust} />
                  <DeltaPill label="Morale" before={e.metersBefore?.morale} after={e.metersAfter.morale} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeltaPill({ label, before, after }: { label: string; before?: number; after: number }) {
  if (before === undefined) return null;
  const delta = after - before;
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const color = isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--text-muted)';
  const prefix = isPositive ? '+' : '';

  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        color,
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}: </span>
      <strong>{prefix}{delta}%</strong>
    </span>
  );
}
