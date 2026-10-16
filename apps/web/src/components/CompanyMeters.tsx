import React from 'react';
import { CompanyMeters as IMeters } from '@boardroom/contracts';

interface Props {
  meters: IMeters;
}

function getMeterConfig(value: number) {
  if (value >= 60) {
    return {
      barColor: '#059669',
      status: 'STABLE',
      badgeClass: 'badge-green',
    };
  }
  if (value >= 35) {
    return {
      barColor: '#d97706',
      status: 'VULNERABLE',
      badgeClass: 'badge-amber',
    };
  }
  return {
    barColor: '#dc2626',
    status: 'CRITICAL',
    badgeClass: 'badge-red',
  };
}

function MeterRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const config = getMeterConfig(value);

  return (
    <div className="meter-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${config.badgeClass}`} style={{ fontSize: 9 }}>
            {config.status}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              minWidth: 40,
              textAlign: 'right',
            }}
          >
            {value}%
          </span>
        </div>
      </div>

      <div className="meter-track">
        <div
          className="meter-fill"
          style={{
            width: `${value}%`,
            background: config.barColor,
          }}
        />
      </div>
    </div>
  );
}

export function CompanyMeters({ meters }: Props) {
  const anyCritical = meters.budget <= 25 || meters.publicTrust <= 25 || meters.morale <= 25;

  return (
    <div className="glass-card">
      <div className="section-header">
        <span className="label-xs" style={{ color: 'var(--text-muted)' }}>
          Company Dashboard
        </span>
        {anyCritical && (
          <span className="badge badge-red" style={{ fontSize: 10 }}>
            COLLAPSE WARNING
          </span>
        )}
      </div>

      <MeterRow label="Budget" value={meters.budget} />
      <MeterRow label="Public Trust" value={meters.publicTrust} />
      <MeterRow label="Employee Morale" value={meters.morale} />

      <div
        style={{
          marginTop: 6,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Collapse point: 0%</span>
        <span>Clamp limit: 100%</span>
      </div>
    </div>
  );
}
