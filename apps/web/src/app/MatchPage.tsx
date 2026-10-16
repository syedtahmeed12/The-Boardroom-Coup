import React from 'react';
import { gameSocket } from '../services/socket';
import { PublicMatchState, PrivatePlayerState, VoteOption } from '@boardroom/contracts';
import { CompanyMeters } from '../components/CompanyMeters';
import { CrisisPanel } from '../components/CrisisPanel';
import { PlayerRoster } from '../components/PlayerRoster';
import { AgendaPanel } from '../components/AgendaPanel';
import { EventHistory } from '../components/EventHistory';
import { PhaseTimer } from '../components/PhaseTimer';
import { VoteRevealTable } from '../components/VoteRevealTable';

interface Props {
  match: PublicMatchState;
  privateState: PrivatePlayerState | null;
  sessionToken: string;
  playerId: string;
  hostId: string;
}

export function MatchPage({
  match,
  privateState,
  sessionToken,
  playerId,
  hostId,
}: Props) {
  const myPlayer = match.players.find((p) => p.id === playerId);
  const hasVoted = myPlayer?.hasCommitted ?? false;

  function handleVote(option: VoteOption, influenceSpent: number) {
    gameSocket.send({
      type: 'submit_vote',
      sessionToken,
      roundNumber: match.roundNumber,
      option,
      influenceSpent,
    });
  }

  const phaseConfig: Record<string, { label: string; badge: string }> = {
    dealing: { label: 'Assigning Roles', badge: 'badge-purple' },
    crisis_briefing: { label: 'Crisis Briefing', badge: 'badge-cyan' },
    discussion: { label: 'Discussion', badge: 'badge-blue' },
    voting: { label: 'Voting', badge: 'badge-amber' },
    resolving: { label: 'Resolving', badge: 'badge-green' },
    finished: { label: 'Match Ended', badge: 'badge-purple' },
  };

  const currentPhase = phaseConfig[match.phase] ?? {
    label: match.phase,
    badge: 'badge-blue',
  };

  return (
    <div className="page">
      {/* Clean App Header */}
      <header className="app-header">
        <div className="app-header-brand">
          The Boardroom Coup
        </div>

        {/* Phase & Round Bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="badge badge-neutral" style={{ fontSize: 12 }}>
            Round {match.roundNumber} of {match.totalRounds}
          </span>
          <span className={`badge ${currentPhase.badge}`} style={{ fontSize: 12 }}>
            {currentPhase.label}
          </span>
          <PhaseTimer deadlineAt={match.deadlineAt} phase={match.phase} />
        </div>
      </header>

      {/* Main Arena */}
      <div className="page-content">
        <div
          className="match-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: '340px 1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Metrics & Player State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CompanyMeters meters={match.meters} />
            {privateState && <AgendaPanel privateState={privateState} />}
            <PlayerRoster players={match.players} hostId={hostId} myId={playerId} />
          </div>

          {/* Right Column: Crisis & Events */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {match.crisis && (
              <CrisisPanel
                match={match}
                sessionToken={sessionToken}
                playerId={playerId}
                influence={privateState?.influence ?? 0}
                hasVoted={hasVoted}
                onVote={handleVote}
              />
            )}

            {/* Revealed Votes Table */}
            {match.phase === 'resolving' && match.revealedVotes && (
              <VoteRevealTable reveals={match.revealedVotes} />
            )}

            {/* Briefing Note */}
            {match.phase === 'crisis_briefing' && match.crisis && (
              <div
                className="glass-card"
                style={{
                  textAlign: 'center',
                  padding: 18,
                  background: 'var(--primary-light)',
                  border: '1px solid rgba(79, 70, 229, 0.2)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>
                  Crisis Briefing Active
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Review policy choices above. Boardroom discussion window will open in moments.
                </p>
              </div>
            )}

            <EventHistory events={match.eventHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
