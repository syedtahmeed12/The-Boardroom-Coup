import React, { useEffect, useState } from 'react';

interface Props {
  deadlineAt: string | null;
  phase: string;
}

export function PhaseTimer({ deadlineAt, phase }: Props) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!deadlineAt) {
      setRemaining(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [deadlineAt]);

  if (!deadlineAt) return null;

  const urgent = remaining <= 10;
  const phaseLabel = phase === 'discussion' ? 'Debate' : 'Voting';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 12px',
        background: urgent ? 'var(--danger-light)' : 'var(--bg-card)',
        border: `1px solid ${urgent ? 'var(--danger)' : 'var(--border-card)'}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="label-xs" style={{ color: urgent ? 'var(--danger)' : 'var(--text-muted)' }}>
        {phaseLabel}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: urgent ? 'var(--danger)' : 'var(--text-primary)',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {remaining}s
      </span>
    </div>
  );
}
