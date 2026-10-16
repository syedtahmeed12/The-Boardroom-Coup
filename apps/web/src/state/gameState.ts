import { useState, useCallback } from 'react';
import {
  PublicRoomState,
  PublicMatchState,
  PrivatePlayerState,
  MatchResult,
} from '@boardroom/contracts';

export type Screen = 'home' | 'lobby' | 'match' | 'results';

export interface GameState {
  screen: Screen;
  sessionToken: string | null;
  playerId: string | null;
  roomId: string | null;
  roomCode: string | null;
  room: PublicRoomState | null;
  match: PublicMatchState | null;
  privateState: PrivatePlayerState | null;
  result: MatchResult | null;
  error: string | null;
  connecting: boolean;
}

const initial: GameState = {
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
  connecting: false,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(() => {
    // Restore session from sessionStorage for reconnect
    const token = sessionStorage.getItem('sessionToken');
    return { ...initial, sessionToken: token, connecting: !!token };
  });

  const update = useCallback((patch: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return { state, update };
}
