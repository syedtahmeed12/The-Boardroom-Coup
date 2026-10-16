import React, { useState } from 'react';
import { PublicMatchState, VoteOption } from '@boardroom/contracts';
import { sound } from '../services/sound';

interface Props {
  match: PublicMatchState;
  sessionToken: string;
  playerId: string;
  influence: number;
  hasVoted: boolean;
  onVote: (option: VoteOption, influence: number) => void;
}

export function CrisisPanel({
  match,
  influence,
  hasVoted,
  onVote,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<VoteOption | null>(null);
  const [influenceSpend, setInfluenceSpend] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const crisis = match.crisis;
  if (!crisis) return null;

  const inVoting = match.phase === 'voting';
  const inDiscussion = match.phase === 'discussion';
  const canVote = inVoting && !hasVoted;

  function handleSelect(optId: VoteOption) {
    if (!canVote) return;
    sound.playSelect();
    setSelectedOption(optId);
  }

  function handleSpendChange(amt: number) {
    sound.playClick();
    setInfluenceSpend(amt);
  }

  function handleSubmit() {
    if (!selectedOption) return;
    sound.playCommit();
    setSubmitting(true);
    onVote(selectedOption, influenceSpend);
    setTimeout(() => setSubmitting(false), 1000);
  }

  function handleAbstain() {
    sound.playClick();
    setSubmitting(true);
    onVote(VoteOption.Abstain, 0);
    setTimeout(() => setSubmitting(false), 1000);
  }

  return (
    <div className="glass-card">
      {/* Category & Round Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-blue">
            Round {match.roundNumber} of {match.totalRounds}
          </span>
          <span className="badge badge-neutral">{crisis.category}</span>
        </div>
        {crisis.tieDefault && (
          <span className="badge badge-amber" style={{ fontSize: 10 }}>
            Tie Default: Option {crisis.tieDefault}
          </span>
        )}
      </div>

      <h2 style={{ fontSize: 22, marginBottom: 8, color: 'var(--text-primary)' }}>
        {crisis.title}
      </h2>

      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
        {crisis.narrative}
      </p>

      {/* Decision Option Cards */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {crisis.options.map((opt) => {
          const isSelected = selectedOption === opt.id;
          const isDefault = crisis.tieDefault === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id as VoteOption)}
              className={`glass-card ${canVote ? 'glass-card-interactive' : ''} ${isSelected ? 'glass-card-active' : ''}`}
              style={{
                padding: 16,
                cursor: canVote ? 'pointer' : 'default',
                background: isSelected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-card)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={`badge ${isSelected ? 'badge-blue' : 'badge-neutral'}`}>
                  Option {opt.id}
                </span>
                {isDefault && (
                  <span className="badge badge-amber" style={{ fontSize: 9 }}>
                    Tie Default
                  </span>
                )}
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
                {opt.label}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, lineHeight: 1.5, minHeight: 38 }}>
                {opt.description}
              </p>

              {/* Meter Delta Pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <DeltaTag label="Budget" value={opt.effects.budget} />
                <DeltaTag label="Trust" value={opt.effects.publicTrust} />
                <DeltaTag label="Morale" value={opt.effects.morale} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Influence Allocation Area */}
      {canVote && selectedOption && selectedOption !== VoteOption.Abstain && (
        <div
          style={{
            marginBottom: 18,
            padding: 14,
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span className="label-xs" style={{ color: 'var(--text-primary)' }}>
                Commit Influence Points
              </span>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                Each point adds 1 vote to your chosen option (max 2 per round).
              </p>
            </div>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
              Available: {influence}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((amt) => {
              const disabled = amt > influence;
              const active = influenceSpend === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSpendChange(amt)}
                  disabled={disabled}
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <span>{amt === 0 ? 'Normal (Weight 1)' : `+${amt} (Weight ${1 + amt})`}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Voting Controls */}
      {canVote && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
            disabled={!selectedOption || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? 'Submitting...'
              : selectedOption
              ? `Commit Option ${selectedOption} (${1 + influenceSpend} Vote Weight)`
              : 'Select Option A or B to Vote'}
          </button>
          <button
            className="btn btn-ghost"
            disabled={submitting}
            onClick={handleAbstain}
          >
            Abstain
          </button>
        </div>
      )}

      {/* Already Voted Banner */}
      {hasVoted && inVoting && (
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
          Vote submitted. Waiting for other players to submit their commitments...
        </div>
      )}

      {/* Discussion Phase Note */}
      {inDiscussion && (
        <div
          style={{
            textAlign: 'center',
            padding: 14,
            background: 'var(--primary-light)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Discussion window open. Voting begins when the countdown timer expires.
        </div>
      )}
    </div>
  );
}

function DeltaTag({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--text-muted)';
  const prefix = isPositive ? '+' : '';

  return (
    <span
      className="mono"
      style={{
        fontSize: 12,
        padding: '3px 8px',
        borderRadius: 4,
        background: isPositive ? 'var(--success-light)' : isNegative ? 'var(--danger-light)' : 'var(--bg-subtle)',
        border: `1px solid ${isPositive ? 'var(--success)' : isNegative ? 'var(--danger)' : 'var(--border-card)'}`,
        color,
        fontWeight: 700,
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label} </span>
      {prefix}{value}%
    </span>
  );
}
