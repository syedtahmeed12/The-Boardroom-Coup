import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum RoomStatus {
  Lobby = 'lobby',
  Active = 'active',
  Finished = 'finished',
  Expired = 'expired',
}

export enum MatchPhase {
  Dealing = 'dealing',
  CrisisBriefing = 'crisis_briefing',
  Discussion = 'discussion',
  Voting = 'voting',
  Resolving = 'resolving',
  Finished = 'finished',
}

export enum VoteOption {
  A = 'A',
  B = 'B',
  Abstain = 'abstain',
}

export enum AgendaType {
  Reformer = 'reformer',
  Financier = 'financier',
  Publicist = 'publicist',
  PeoplesChampion = 'peoples_champion',
  Liquidator = 'liquidator',
  Disruptor = 'disruptor',
  Whistleblower = 'whistleblower',
  GoldenParachute = 'golden_parachute',
  HostileTakeover = 'hostile_takeover',
  ShortSeller = 'short_seller',
  Turnaround = 'turnaround',
  StripAndFlip = 'strip_and_flip',
}

export enum EndReason {
  Collapse = 'collapse',
  Survival = 'survival',
  Abandoned = 'abandoned',
}

// ─── Meter state ─────────────────────────────────────────────────────────────

export interface CompanyMeters {
  budget: number;       // 0–100
  publicTrust: number;  // 0–100
  morale: number;       // 0–100
}

// ─── Crisis card ─────────────────────────────────────────────────────────────

export interface MeterEffect {
  budget: number;
  publicTrust: number;
  morale: number;
}

export interface CrisisOption {
  id: VoteOption.A | VoteOption.B;
  label: string;
  description: string;
  effects: MeterEffect;
}

export interface CrisisCard {
  id: string;
  roundHint: number;  // suggested round (1-indexed), can be shuffled
  title: string;
  category: string;
  narrative: string;
  options: [CrisisOption, CrisisOption];
  tieDefault: VoteOption.A | VoteOption.B;
  condition?: string; // optional flavor note
}

// ─── Hidden agenda ────────────────────────────────────────────────────────────

export interface AgendaDefinition {
  type: AgendaType;
  name: string;
  objective: string;
  successDescription: string;
  minPlayers: number;
}

// ─── Public state shapes sent over the wire ───────────────────────────────────

export interface PublicPlayer {
  id: string;
  name: string;
  connected: boolean;
  ready: boolean;
  hasCommitted: boolean; // current round — does NOT reveal contents
  corporateTitle?: string; // Executive Title e.g. "CEO", "CFO", "General Counsel"
}

export interface PublicVoteReveal {
  playerId: string;
  playerName: string;
  option: VoteOption;
  influenceSpent: number;
  weight: number;
}

export interface PublicEventEntry {
  sequence: number;
  type: string;
  summary: string;
  metersBefore?: CompanyMeters;
  metersAfter?: CompanyMeters;
  createdAt: string;
}

export interface PublicMatchState {
  matchId: string;
  phase: MatchPhase;
  roundNumber: number;
  totalRounds: number;
  deadlineAt: string | null;
  meters: CompanyMeters;
  crisis: PublicCrisisView | null;
  players: PublicPlayer[];
  eventHistory: PublicEventEntry[];
  revealedVotes: PublicVoteReveal[] | null;
}

export interface PublicCrisisView {
  id: string;
  title: string;
  category: string;
  narrative: string;
  options: [CrisisOption, CrisisOption];
  tieDefault: VoteOption.A | VoteOption.B;
}

export interface PublicRoomState {
  roomId: string;
  code: string;
  status: RoomStatus;
  hostPlayerId: string;
  players: PublicPlayer[];
  match: PublicMatchState | null;
}

// ─── Private state sent only to the owning player ─────────────────────────────

export interface PrivatePlayerState {
  playerId: string;
  influence: number;
  agenda: {
    type: AgendaType;
    name: string;
    objective: string;
    successDescription: string;
  };
  pendingVote?: {
    option: VoteOption;
    influenceSpent: number;
  } | null;
}

// ─── Final scores ─────────────────────────────────────────────────────────────

export interface PlayerFinalScore {
  playerId: string;
  playerName: string;
  agendaType: AgendaType;
  agendaCompleted: boolean;
  agendaPoints: number;
  interventionPoints: number;
  restraintPoints: number;
  companyPerformancePoints: number;
  totalPoints: number;
}

export interface MatchResult {
  matchId: string;
  endReason: EndReason;
  finalMeters: CompanyMeters;
  scores: PlayerFinalScore[];
  winnerId: string | null;
  tie: boolean;
}

// ─── WebSocket command schemas (client → server) ───────────────────────────────

export const CreateRoomCommandSchema = z.object({
  type: z.literal('create_room'),
  playerName: z.string().min(2).max(20).trim(),
});

export const JoinRoomCommandSchema = z.object({
  type: z.literal('join_room'),
  roomCode: z.string().length(6).toUpperCase(),
  playerName: z.string().min(2).max(20).trim(),
});

export const ReadyCommandSchema = z.object({
  type: z.literal('ready'),
  sessionToken: z.string(),
});

export const StartMatchCommandSchema = z.object({
  type: z.literal('start_match'),
  sessionToken: z.string(),
});

export const SubmitVoteCommandSchema = z.object({
  type: z.literal('submit_vote'),
  sessionToken: z.string(),
  roundNumber: z.number().int().min(1),
  option: z.nativeEnum(VoteOption),
  influenceSpent: z.number().int().min(0).max(2),
});

export const RejoinCommandSchema = z.object({
  type: z.literal('rejoin'),
  sessionToken: z.string(),
});

export type CreateRoomCommand = z.infer<typeof CreateRoomCommandSchema>;
export type JoinRoomCommand = z.infer<typeof JoinRoomCommandSchema>;
export type ReadyCommand = z.infer<typeof ReadyCommandSchema>;
export type StartMatchCommand = z.infer<typeof StartMatchCommandSchema>;
export type SubmitVoteCommand = z.infer<typeof SubmitVoteCommandSchema>;
export type RejoinCommand = z.infer<typeof RejoinCommandSchema>;

export type ClientCommand =
  | CreateRoomCommand
  | JoinRoomCommand
  | ReadyCommand
  | StartMatchCommand
  | SubmitVoteCommand
  | RejoinCommand;

// ─── WebSocket server events (server → client) ────────────────────────────────

export interface SessionCreatedEvent {
  type: 'session_created';
  sessionToken: string;
  playerId: string;
  roomId: string;
  roomCode: string;
}

export interface RoomUpdateEvent {
  type: 'room_update';
  room: PublicRoomState;
}

export interface MatchUpdateEvent {
  type: 'match_update';
  match: PublicMatchState;
}

export interface PrivateStateEvent {
  type: 'private_state';
  state: PrivatePlayerState;
}

export interface MatchResultEvent {
  type: 'match_result';
  result: MatchResult;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type ServerEvent =
  | SessionCreatedEvent
  | RoomUpdateEvent
  | MatchUpdateEvent
  | PrivateStateEvent
  | MatchResultEvent
  | ErrorEvent;
