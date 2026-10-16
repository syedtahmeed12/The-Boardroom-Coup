import React from 'react';
import { PublicVoteReveal } from '@boardroom/contracts';

interface Props {
  reveals: PublicVoteReveal[];
}

export function VoteRevealTable({ reveals }: Props) {
  return (
    <div className="glass-card">
      <div className="section-header" style={{ marginBottom: 12 }}>
        <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
          Simultaneous Vote Audit
        </span>
        <span className="badge badge-green">Resolved</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Executive', 'Ballot Cast', 'Influence Spent', 'Vote Weight'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reveals.map((r) => {
              const isOptionA = r.option === 'A';
              const isOptionB = r.option === 'B';
              const isAbstain = r.option === 'abstain';

              return (
                <tr
                  key={r.playerId}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {r.playerName}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <span
                      className={`badge ${
                        isOptionA ? 'badge-blue' : isOptionB ? 'badge-amber' : 'badge-neutral'
                      }`}
                    >
                      {isAbstain ? 'Abstain' : `Option ${r.option}`}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                    {r.influenceSpent > 0 ? `+${r.influenceSpent} points` : '0 points'}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <span
                      className="mono"
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {r.weight}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
