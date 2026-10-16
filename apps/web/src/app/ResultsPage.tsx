import React from 'react';
import { MatchResult, EndReason, AgendaType } from '@boardroom/contracts';
import { sound } from '../services/sound';

interface Props {
  result: MatchResult;
  playerId: string;
  onPlayAgain: () => void;
}

const agendaNames: Record<string, string> = {
  [AgendaType.Reformer]: 'The Reformer',
  [AgendaType.Financier]: 'The Financier',
  [AgendaType.Publicist]: 'The Publicist',
  [AgendaType.PeoplesChampion]: "The People's Champion",
  [AgendaType.Liquidator]: 'The Liquidator',
  [AgendaType.Disruptor]: 'The Disruptor',
  [AgendaType.Whistleblower]: 'The Whistleblower',
  [AgendaType.GoldenParachute]: 'The Golden Parachute',
  [AgendaType.HostileTakeover]: 'The Corporate Raider',
  [AgendaType.ShortSeller]: 'The Forensic Short-Seller',
  [AgendaType.Turnaround]: 'The Turnaround Fiduciary',
  [AgendaType.StripAndFlip]: 'The LBO Asset Stripper',
};

export function ResultsPage({ result, playerId, onPlayAgain }: Props) {
  const winner = result.scores.find((s) => s.playerId === result.winnerId);
  const myScore = result.scores.find((s) => s.playerId === playerId);
  const isMeWinner = result.winnerId === playerId;
  const collapsed = result.endReason === EndReason.Collapse;

  function handleRestart() {
    sound.playClick();
    onPlayAgain();
  }

  return (
    <div className="page">
      <header className="app-header">
        <div className="app-header-brand">
          The Boardroom Coup
        </div>
        <span className={`badge ${collapsed ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 12 }}>
          {collapsed ? 'Company Liquidation' : 'Company Survived'}
        </span>
      </header>

      <div className="page-content" style={{ maxWidth: 940 }}>
        {/* Outcome Banner */}
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            marginBottom: 24,
            padding: '32px 20px',
            background: isMeWinner ? 'var(--success-light)' : collapsed ? 'var(--danger-light)' : 'var(--bg-card)',
            border: `1px solid ${isMeWinner ? 'var(--success)' : collapsed ? 'var(--danger)' : 'var(--border-card)'}`,
          }}
        >
          <div className="label-xs" style={{ marginBottom: 6, color: 'var(--text-muted)' }}>
            MATCH CONCLUSION
          </div>

          <h1 style={{ fontSize: 30, marginBottom: 8, color: 'var(--text-primary)' }}>
            {result.tie
              ? 'Draw (Stalemate)'
              : winner
              ? `${winner.playerName} Wins`
              : 'Match Complete'}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Final Company Meters: Budget {result.finalMeters.budget}% · Public Trust {result.finalMeters.publicTrust}% · Morale {result.finalMeters.morale}%
          </p>
        </div>

        {/* My Individual Performance */}
        {myScore && (
          <div
            className="glass-card"
            style={{
              marginBottom: 20,
              padding: 18,
            }}
          >
            <div className="section-header" style={{ marginBottom: 8 }}>
              <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
                Your Performance Summary
              </span>
              <span className={`badge ${myScore.agendaCompleted ? 'badge-green' : 'badge-neutral'}`}>
                {myScore.agendaCompleted ? 'Agenda Completed (+5 Pts)' : 'Agenda Incomplete (0 Pts)'}
              </span>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              Assigned role: <strong>{agendaNames[myScore.agendaType] ?? myScore.agendaType}</strong>
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {myScore.agendaCompleted
                ? 'Your hidden objective conditions were successfully met by the final company state.'
                : 'The final outcome did not fulfill your hidden objective requirements.'}
            </p>
          </div>
        )}

        {/* Scoreboard Table */}
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div className="section-header" style={{ marginBottom: 14 }}>
            <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
              Final Standings & Scoring Audit
            </span>
            <span className="badge badge-neutral">Agendas Revealed</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Rank', 'Player', 'Assigned Agenda', 'Agenda Pts', 'Interventions', 'Restraint', 'Company', 'Total'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 10px',
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
                {result.scores.map((s, i) => {
                  const isWinner = s.playerId === result.winnerId;
                  const isMe = s.playerId === playerId;

                  return (
                    <tr
                      key={s.playerId}
                      style={{
                        background: isWinner
                          ? 'var(--success-light)'
                          : isMe
                          ? 'var(--primary-light)'
                          : undefined,
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: isWinner ? 'var(--success)' : 'var(--text-muted)' }}>
                        {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                      </td>

                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{s.playerName}</span>
                        {isMe && (
                          <span className="badge badge-blue" style={{ fontSize: 9, marginLeft: 6 }}>
                            You
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{agendaNames[s.agendaType] ?? s.agendaType}</span>
                          {s.agendaCompleted && (
                            <span className="badge badge-green" style={{ fontSize: 9 }}>
                              Completed
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.agendaPoints}
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.interventionPoints}
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.restraintPoints}
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {s.companyPerformancePoints}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: isWinner ? 'var(--success)' : 'var(--text-primary)',
                          }}
                        >
                          {s.totalPoints} pts
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={handleRestart}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
