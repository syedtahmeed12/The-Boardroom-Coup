import React, { useState } from 'react';
import { useGameState } from './state/gameState';
import { useGameSocket } from './hooks/useGameSocket';
import { HomePage } from './app/HomePage';
import { LobbyPage } from './app/LobbyPage';
import { MatchPage } from './app/MatchPage';
import { ResultsPage } from './app/ResultsPage';
import { gameSocket, getWebSocketUrl } from './services/socket';
import { sound } from './services/sound';

export default function App() {
  const { state, update } = useGameState();
  const [soundOn, setSoundOn] = useState(true);

  useGameSocket(state, update);

  function handleError(msg: string) {
    sound.playAlert();
    update({ error: msg });
    setTimeout(() => update({ error: null }), 4500);
  }

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('boardroom_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // Executive Dark Mode by default
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('boardroom_theme', theme);
  }, [theme]);

  function toggleTheme() {
    sound.playClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function toggleAudio() {
    const next = sound.toggle();
    setSoundOn(next);
  }

  function handlePlayAgain() {
    sessionStorage.removeItem('sessionToken');
    gameSocket.disconnect();
    update({
      screen: 'home',
      sessionToken: null,
      playerId: null,
      roomId: null,
      roomCode: null,
      room: null,
      match: null,
      privateState: null,
      result: null,
      error: null,
    });
    setTimeout(() => gameSocket.connect(getWebSocketUrl()), 100);
  }

  return (
    <>
      {/* Floating Medieval Tavern Utility Dock (Bottom-Right, Never Obscures Header) */}
      <aside className="tavern-control-dock" aria-label="Tavern controls">
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm tavern-dock-btn"
          title={theme === 'dark' ? 'Switch to Daylight Parchment (Light Mode)' : 'Switch to Candlelit Tavern (Night Mode)'}
        >
          <span className="tavern-dock-icon">{theme === 'dark' ? '📜' : '🕯️'}</span>
          <span className="tavern-dock-text">{theme === 'dark' ? 'DAYLIGHT' : 'TORCHLIGHT'}</span>
        </button>

        <button
          onClick={toggleAudio}
          className="btn btn-secondary btn-sm tavern-dock-btn"
          title="Toggle Tavern Audio SFX"
        >
          <span className="tavern-dock-icon">{soundOn ? '🔔' : '🔕'}</span>
          <span className="tavern-dock-text">{soundOn ? 'SFX ON' : 'MUTED'}</span>
        </button>
      </aside>

      {/* Global Error Notification */}
      {state.error && (
        <div
          style={{
            position: 'fixed',
            top: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            minWidth: 320,
            maxWidth: 540,
          }}
        >
          <div className="error-msg" style={{ textAlign: 'center' }}>
            {state.error}
          </div>
        </div>
      )}

      {/* Screen 1: Home */}
      {state.screen === 'home' && (
        <HomePage onError={handleError} />
      )}

      {/* Screen 2: Lobby */}
      {state.screen === 'lobby' && (
        state.room && state.sessionToken && state.playerId ? (
          <LobbyPage
            room={state.room}
            sessionToken={state.sessionToken}
            playerId={state.playerId}
            onLeave={handlePlayAgain}
          />
        ) : (
          <div className="page page-center">
            <div className="glass-card" style={{ textAlign: 'center', maxWidth: 420, padding: 36 }}>
              <div className="label-xs" style={{ marginBottom: 8, color: 'var(--primary)' }}>
                CONNECTING
              </div>
              <h3 style={{ marginBottom: 8 }}>Accessing Boardroom Session</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                Establishing real-time connection with the game server.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={handlePlayAgain}>
                Cancel & Return Home
              </button>
            </div>
          </div>
        )
      )}

      {/* Screen 3: Match */}
      {state.screen === 'match' && (
        state.match && state.sessionToken && state.playerId ? (
          <MatchPage
            match={state.match}
            privateState={state.privateState}
            sessionToken={state.sessionToken}
            playerId={state.playerId}
            hostId={state.room?.hostPlayerId ?? ''}
          />
        ) : (
          <div className="page page-center">
            <div className="glass-card" style={{ textAlign: 'center', maxWidth: 420, padding: 36 }}>
              <div className="label-xs" style={{ marginBottom: 8, color: 'var(--primary)' }}>
                SYNCHRONIZING
              </div>
              <h3 style={{ marginBottom: 8 }}>Loading Crisis Briefing</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                Retrieving active round policy data and private agendas.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={handlePlayAgain}>
                Return to Lobby
              </button>
            </div>
          </div>
        )
      )}

      {/* Screen 4: Results */}
      {state.screen === 'results' && (
        state.result && state.playerId ? (
          <ResultsPage
            result={state.result}
            playerId={state.playerId}
            onPlayAgain={handlePlayAgain}
          />
        ) : (
          <div className="page page-center">
            <div className="glass-card" style={{ textAlign: 'center', maxWidth: 420, padding: 36 }}>
              <h3 style={{ marginBottom: 8 }}>Finalizing Audit</h3>
              <button className="btn btn-primary btn-sm" onClick={handlePlayAgain}>
                Play Again
              </button>
            </div>
          </div>
        )
      )}

      {/* Reconnecting Status Pill (Bottom-Left) */}
      {state.connecting && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 24,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 1000,
          }}
        >
          <span className="dot dot-amber" />
          <span>Reconnecting to guild hall...</span>
        </div>
      )}
    </>
  );
}
