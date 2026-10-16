import { useEffect } from 'react';
import { gameSocket, getWebSocketUrl } from '../services/socket';
import { ServerEvent } from '@boardroom/contracts';
import { GameState } from '../state/gameState';
import { sound } from '../services/sound';

export function useGameSocket(
  state: GameState,
  update: (patch: Partial<GameState>) => void
) {
  useEffect(() => {
    gameSocket.connect(getWebSocketUrl(), state.sessionToken ?? undefined);

    const unsub = gameSocket.subscribe((event: ServerEvent) => {
      switch (event.type) {
        case 'session_created':
          sessionStorage.setItem('sessionToken', event.sessionToken);
          sound.playSelect();
          update({
            sessionToken: event.sessionToken,
            playerId: event.playerId,
            roomId: event.roomId,
            roomCode: event.roomCode || state.roomCode,
            connecting: false,
            error: null,
            screen: 'lobby',
          });
          break;

        case 'room_update':
          update({ room: event.room });
          break;

        case 'match_update':
          if (event.match.phase === 'crisis_briefing' || event.match.phase === 'voting') {
            sound.playAlert();
          } else if (event.match.phase === 'resolving') {
            sound.playReveal();
          }
          update({
            match: event.match,
            screen: event.match.phase === 'finished' ? 'results' : 'match',
          });
          break;

        case 'private_state':
          update({ privateState: event.state });
          break;

        case 'match_result':
          sound.playReveal();
          update({ result: event.result, screen: 'results' });
          break;

        case 'error':
          // If session or room was lost, reset to clean home screen
          if (event.code === 'INVALID_SESSION' || event.code === 'ROOM_NOT_FOUND' || event.code === 'ROOM_EXPIRED') {
            sessionStorage.removeItem('sessionToken');
            update({
              sessionToken: null,
              screen: 'home',
              error: `Session expired or invalid: ${event.message}`,
              connecting: false,
            });
          } else {
            update({ error: event.message, connecting: false });
          }
          break;
      }
    });

    return () => {
      unsub();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
