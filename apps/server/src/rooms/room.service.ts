import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import {
  RoomStatus,
  MatchPhase,
  VoteOption,
  AgendaType,
  EndReason,
  CompanyMeters,
  PublicRoomState,
  PublicMatchState,
  PublicPlayer,
  PublicCrisisView,
  PublicEventEntry,
  PublicVoteReveal,
  PrivatePlayerState,
  PlayerFinalScore,
  MatchResult,
  CrisisCard,
} from '@boardroom/contracts';
import {
  CRISIS_DECK,
  AGENDA_DEFINITIONS,
  BALANCE_RULES,
  validAgendas,
} from '@boardroom/game-content';
import { generateRoomCode } from './room-code.js';
import { createSession } from '../auth/session.service.js';

// ─── Internal data structures ─────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  roomId: string;
  connected: boolean;
  ready: boolean;
  corporateTitle?: string;
}

interface VoteCommitment {
  option: VoteOption;
  influenceSpent: number;
  submittedAt: Date;
}

interface PlayerMatchState {
  influence: number;
  agendaType: AgendaType;
  commitment: VoteCommitment | null;
  interventionsWon: number;
  hasAbstained: boolean;
}

interface RoundResolution {
  winningOption: VoteOption.A | VoteOption.B | 'tie_default';
  effectiveDefault: VoteOption.A | VoteOption.B;
  reveals: PublicVoteReveal[];
  metersBefore: CompanyMeters;
  metersAfter: CompanyMeters;
  resolvedAt: Date;
}

interface MatchState {
  id: string;
  roomId: string;
  phase: MatchPhase;
  roundNumber: number;
  deadlineAt: Date | null;
  meters: CompanyMeters;
  crisisSequence: CrisisCard[];
  currentCrisis: CrisisCard | null;
  playerStates: Map<string, PlayerMatchState>;
  eventHistory: PublicEventEntry[];
  revealedVotes: PublicVoteReveal[] | null;
  resolutions: RoundResolution[];
  result: MatchResult | null;
  version: number;
  resolvedRounds: Set<number>;
}

interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  hostPlayerId: string;
  players: Map<string, Player>;
  match: MatchState | null;
  createdAt: Date;
  expiresAt: Date;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();           // roomId → Room
const roomsByCode = new Map<string, string>();   // code → roomId
const playerRooms = new Map<string, string>();   // playerId → roomId

// ─── Broadcast callback ───────────────────────────────────────────────────────

type BroadcastFn = (roomId: string, playerId: string | null, payload: object) => void;
let broadcastFn: BroadcastFn = () => {};

export function setBroadcastFn(fn: BroadcastFn): void {
  broadcastFn = fn;
}

function broadcast(roomId: string, payload: object): void {
  broadcastFn(roomId, null, payload);
}

function sendPrivate(roomId: string, playerId: string, payload: object): void {
  broadcastFn(roomId, playerId, payload);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function applyEffects(meters: CompanyMeters, effects: { budget: number; publicTrust: number; morale: number }): CompanyMeters {
  return {
    budget: clamp(meters.budget + effects.budget),
    publicTrust: clamp(meters.publicTrust + effects.publicTrust),
    morale: clamp(meters.morale + effects.morale),
  };
}

function isCollapsed(meters: CompanyMeters): boolean {
  return meters.budget <= 0 || meters.publicTrust <= 0 || meters.morale <= 0;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function nextSequence(match: MatchState): number {
  return match.eventHistory.length + 1;
}

function addEvent(match: MatchState, type: string, summary: string, extra?: Partial<PublicEventEntry>): void {
  match.eventHistory.push({
    sequence: nextSequence(match),
    type,
    summary,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}

// ─── Public view builders ─────────────────────────────────────────────────────

function buildPublicPlayer(player: Player, match: MatchState | null): PublicPlayer {
  const pState = match ? match.playerStates.get(player.id) : undefined;
  const hasCommitted = Boolean(pState && pState.commitment !== null);
  return {
    id: player.id,
    name: player.name,
    connected: player.connected,
    ready: player.ready,
    hasCommitted,
    corporateTitle: player.corporateTitle,
  };
}

function buildPublicCrisisView(card: CrisisCard): PublicCrisisView {
  return {
    id: card.id,
    title: card.title,
    category: card.category,
    narrative: card.narrative,
    options: card.options,
    tieDefault: card.tieDefault,
  };
}

function buildPublicMatchState(match: MatchState, room: Room): PublicMatchState {
  const players = Array.from(room.players.values()).map((p) =>
    buildPublicPlayer(p, match)
  );
  return {
    matchId: match.id,
    phase: match.phase,
    roundNumber: match.roundNumber,
    totalRounds: BALANCE_RULES.TOTAL_ROUNDS,
    deadlineAt: match.deadlineAt?.toISOString() ?? null,
    meters: { ...match.meters },
    crisis: match.currentCrisis ? buildPublicCrisisView(match.currentCrisis) : null,
    players,
    eventHistory: [...match.eventHistory],
    revealedVotes: match.revealedVotes,
  };
}

function buildPublicRoomState(room: Room): PublicRoomState {
  const players = Array.from(room.players.values()).map((p) =>
    buildPublicPlayer(p, room.match)
  );
  return {
    roomId: room.id,
    code: room.code,
    status: room.status,
    hostPlayerId: room.hostPlayerId,
    players,
    match: room.match ? buildPublicMatchState(room.match, room) : null,
  };
}

function buildPrivateState(match: MatchState, playerId: string): PrivatePlayerState {
  const ps = match.playerStates.get(playerId)!;
  const agenda = AGENDA_DEFINITIONS.find((a) => a.type === ps.agendaType)!;
  return {
    playerId,
    influence: ps.influence,
    agenda: {
      type: agenda.type,
      name: agenda.name,
      objective: agenda.objective,
      successDescription: agenda.successDescription,
    },
    pendingVote: ps.commitment
      ? { option: ps.commitment.option, influenceSpent: ps.commitment.influenceSpent }
      : null,
  };
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────

function broadcastRoomUpdate(room: Room): void {
  broadcast(room.id, { type: 'room_update', room: buildPublicRoomState(room) });
  if (room.match) {
    broadcast(room.id, { type: 'match_update', match: buildPublicMatchState(room.match, room) });
    // send each player their private state
    for (const playerId of room.players.keys()) {
      if (room.match.playerStates.has(playerId)) {
        sendPrivate(room.id, playerId, {
          type: 'private_state',
          state: buildPrivateState(room.match, playerId),
        });
      }
    }
  }
}

const EXECUTIVE_TITLES = [
  'Chief Executive Officer (CEO)',
  'Chief Financial Officer (CFO)',
  'Chief Operating Officer (COO)',
  'General Counsel & Legal Affairs',
  'Audit Committee Chairperson',
  'Activist Hedge Fund Raider',
  'Lead Independent Director',
  'Compliance & Whistleblower Envoy',
];

// ─── Room service ─────────────────────────────────────────────────────────────

export function createRoom(playerName: string): { token: string; playerId: string; roomId: string; roomCode: string } {
  const roomId = uuidv4();
  const playerId = uuidv4();
  const code = generateRoomCode();

  const player: Player = {
    id: playerId,
    name: playerName,
    roomId,
    connected: true,
    ready: false,
    corporateTitle: EXECUTIVE_TITLES[0],
  };

  const room: Room = {
    id: roomId,
    code,
    status: RoomStatus.Lobby,
    hostPlayerId: playerId,
    players: new Map([[playerId, player]]),
    match: null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h TTL
  };

  rooms.set(roomId, room);
  roomsByCode.set(code, roomId);
  playerRooms.set(playerId, roomId);

  const token = createSession(playerId, roomId);

  broadcastRoomUpdate(room);
  return { token, playerId, roomId, roomCode: code };
}

export function joinRoom(
  roomCode: string,
  playerName: string
): { token: string; playerId: string; roomId: string; roomCode: string } | { error: string } {
  const roomId = roomsByCode.get(roomCode.toUpperCase());
  if (!roomId) return { error: 'ROOM_NOT_FOUND' };

  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== RoomStatus.Lobby) return { error: 'ROOM_NOT_OPEN' };
  if (room.players.size >= (BALANCE_RULES.MAX_PLAYERS ?? 8)) return { error: 'ROOM_FULL' };
  if (room.expiresAt < new Date()) return { error: 'ROOM_EXPIRED' };

  // Check duplicate name
  for (const p of room.players.values()) {
    if (p.name.toLowerCase() === playerName.toLowerCase()) return { error: 'NAME_TAKEN' };
  }

  const playerId = uuidv4();
  const playerIndex = room.players.size;
  const player: Player = {
    id: playerId,
    name: playerName,
    roomId,
    connected: true,
    ready: false,
    corporateTitle: EXECUTIVE_TITLES[playerIndex % EXECUTIVE_TITLES.length],
  };

  room.players.set(playerId, player);
  playerRooms.set(playerId, roomId);

  const token = createSession(playerId, roomId);
  broadcastRoomUpdate(room);
  return { token, playerId, roomId, roomCode: room.code };
}

export function setReady(playerId: string): void {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player) return;
  player.ready = true;
  broadcastRoomUpdate(room);
}

export function setConnected(playerId: string, connected: boolean): void {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players.get(playerId);
  if (!player) return;
  player.connected = connected;

  if (!connected && room.match?.phase === MatchPhase.Voting) {
    // Their commitment (or lack thereof) stands; deadline will handle the rest.
  }

  if (!connected && room.status === RoomStatus.Lobby) {
    // Transfer host if host disconnected
    if (room.hostPlayerId === playerId) {
      const next = Array.from(room.players.values()).find(
        (p) => p.id !== playerId && p.connected
      );
      if (next) room.hostPlayerId = next.id;
    }
  }

  broadcastRoomUpdate(room);
}

export function getPlayerRoom(playerId: string): Room | null {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return null;
  return rooms.get(roomId) ?? null;
}

// ─── Match lifecycle ──────────────────────────────────────────────────────────

export function startMatch(requestingPlayerId: string): { error: string } | null {
  const room = getPlayerRoom(requestingPlayerId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.hostPlayerId !== requestingPlayerId) return { error: 'NOT_HOST' };
  if (room.status !== RoomStatus.Lobby) return { error: 'MATCH_ALREADY_ACTIVE' };
  if (room.match) return { error: 'MATCH_ALREADY_ACTIVE' };

  const playerCount = room.players.size;
  if (playerCount < 2) return { error: 'NOT_ENOUGH_PLAYERS' };
  for (const p of room.players.values()) {
    if (!p.ready) return { error: 'PLAYERS_NOT_READY' };
  }

  // Assign agendas
  const pool = shuffleArray(validAgendas(playerCount));
  const playerIds = Array.from(room.players.keys());
  const playerStates = new Map<string, PlayerMatchState>();
  playerIds.forEach((pid, i) => {
    playerStates.set(pid, {
      influence: BALANCE_RULES.STARTING_INFLUENCE,
      agendaType: pool[i % pool.length].type,
      commitment: null,
      interventionsWon: 0,
      hasAbstained: false,
    });
  });

  // Shuffle crisis deck
  const crisisSequence = shuffleArray(CRISIS_DECK).slice(0, BALANCE_RULES.TOTAL_ROUNDS);

  const matchId = uuidv4();
  const match: MatchState = {
    id: matchId,
    roomId: room.id,
    phase: MatchPhase.Dealing,
    roundNumber: 0,
    deadlineAt: null,
    meters: { ...BALANCE_RULES.STARTING_METERS },
    crisisSequence,
    currentCrisis: null,
    playerStates,
    eventHistory: [],
    revealedVotes: null,
    resolutions: [],
    result: null,
    version: 1,
    resolvedRounds: new Set(),
  };

  room.match = match;
  room.status = RoomStatus.Active;

  addEvent(match, 'match_started', 'The board has convened. The match begins.');
  broadcastRoomUpdate(room);

  // Send each player their private agenda
  for (const pid of playerIds) {
    sendPrivate(room.id, pid, {
      type: 'private_state',
      state: buildPrivateState(match, pid),
    });
  }

  // Transition to first crisis
  setTimeout(() => advanceToCrisisBriefing(room.id), 1500);
  return null;
}

function advanceToCrisisBriefing(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || !room.match) return;
  const match = room.match;

  match.roundNumber += 1;

  if (match.roundNumber > BALANCE_RULES.TOTAL_ROUNDS) {
    finalizeMatch(roomId, EndReason.Survival);
    return;
  }

  const crisis = match.crisisSequence[match.roundNumber - 1];
  match.currentCrisis = crisis;
  match.phase = MatchPhase.CrisisBriefing;
  match.revealedVotes = null;

  // Reset commitments
  for (const ps of match.playerStates.values()) {
    ps.commitment = null;
  }

  addEvent(match, 'crisis_briefing', `Round ${match.roundNumber}: ${crisis.title} — ${crisis.category}`);
  broadcastRoomUpdate(room);

  // Auto-advance to discussion
  setTimeout(() => advanceToDiscussion(roomId), 3000);
}

function advanceToDiscussion(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room?.match) return;
  const match = room.match;
  if (match.phase !== MatchPhase.CrisisBriefing) return;

  match.phase = MatchPhase.Discussion;
  match.deadlineAt = new Date(Date.now() + BALANCE_RULES.DISCUSSION_WINDOW_SECONDS * 1000);

  broadcastRoomUpdate(room);

  const remaining = match.deadlineAt.getTime() - Date.now();
  setTimeout(() => advanceToVoting(roomId, match.roundNumber), remaining);
}

function advanceToVoting(roomId: string, forRound: number): void {
  const room = rooms.get(roomId);
  if (!room?.match) return;
  const match = room.match;
  if (match.phase !== MatchPhase.Discussion) return;
  if (match.roundNumber !== forRound) return;

  match.phase = MatchPhase.Voting;
  match.deadlineAt = new Date(Date.now() + BALANCE_RULES.VOTING_WINDOW_SECONDS * 1000);

  broadcastRoomUpdate(room);

  const remaining = match.deadlineAt.getTime() - Date.now();
  setTimeout(() => checkVotingComplete(roomId, match.roundNumber, match.version), remaining);
}

export function submitVote(
  playerId: string,
  roundNumber: number,
  option: VoteOption,
  influenceSpent: number
): { error: string } | null {
  const room = getPlayerRoom(playerId);
  if (!room?.match) return { error: 'NO_ACTIVE_MATCH' };
  const match = room.match;

  if (match.phase !== MatchPhase.Voting) return { error: 'WRONG_PHASE' };
  if (match.roundNumber !== roundNumber) return { error: 'WRONG_ROUND' };
  if (match.deadlineAt && new Date() > match.deadlineAt) return { error: 'DEADLINE_PASSED' };

  const ps = match.playerStates.get(playerId);
  if (!ps) return { error: 'PLAYER_NOT_IN_MATCH' };
  if (ps.commitment) return { error: 'ALREADY_VOTED' };

  if (option !== VoteOption.Abstain) {
    if (influenceSpent < 0 || influenceSpent > BALANCE_RULES.MAX_INFLUENCE_SPEND_PER_VOTE)
      return { error: 'INVALID_INFLUENCE_AMOUNT' };
    if (influenceSpent > ps.influence) return { error: 'INSUFFICIENT_INFLUENCE' };
    if (![VoteOption.A, VoteOption.B].includes(option as VoteOption.A | VoteOption.B))
      return { error: 'INVALID_OPTION' };
  } else {
    influenceSpent = 0;
  }

  ps.commitment = { option, influenceSpent, submittedAt: new Date() };
  match.version++;

  broadcastRoomUpdate(room);
  checkVotingComplete(room.id, roundNumber, match.version);
  return null;
}

function checkVotingComplete(roomId: string, forRound: number, atVersion: number): void {
  const room = rooms.get(roomId);
  if (!room?.match) return;
  const match = room.match;
  if (match.phase !== MatchPhase.Voting) return;
  if (match.roundNumber !== forRound) return;
  if (match.resolvedRounds.has(forRound)) return;

  const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
  const allCommitted = connectedPlayers.every(
    (p) => match.playerStates.get(p.id)?.commitment !== null
  );

  const deadlinePassed = match.deadlineAt ? new Date() >= match.deadlineAt : false;

  if (allCommitted || deadlinePassed) {
    // Apply automatic abstentions for missing votes
    for (const ps of match.playerStates.values()) {
      if (!ps.commitment) {
        ps.commitment = { option: VoteOption.Abstain, influenceSpent: 0, submittedAt: new Date() };
        ps.hasAbstained = true;
      }
    }
    resolveCrisis(roomId, forRound);
  }
}

function resolveCrisis(roomId: string, forRound: number): void {
  const room = rooms.get(roomId);
  if (!room?.match) return;
  const match = room.match;

  if (match.resolvedRounds.has(forRound)) return; // exactly-once guard
  match.resolvedRounds.add(forRound);

  match.phase = MatchPhase.Resolving;
  match.deadlineAt = null;
  match.version++;

  const crisis = match.currentCrisis!;

  // Tally weights
  let weightA = 0;
  let weightB = 0;
  const reveals: PublicVoteReveal[] = [];

  for (const [pid, ps] of match.playerStates.entries()) {
    const c = ps.commitment!;
    const player = room.players.get(pid)!;

    if (c.option === VoteOption.A) {
      const w = 1 + c.influenceSpent;
      weightA += w;
      reveals.push({ playerId: pid, playerName: player.name, option: c.option, influenceSpent: c.influenceSpent, weight: w });
      ps.influence = Math.max(0, ps.influence - c.influenceSpent);
    } else if (c.option === VoteOption.B) {
      const w = 1 + c.influenceSpent;
      weightB += w;
      reveals.push({ playerId: pid, playerName: player.name, option: c.option, influenceSpent: c.influenceSpent, weight: w });
      ps.influence = Math.max(0, ps.influence - c.influenceSpent);
    } else {
      reveals.push({ playerId: pid, playerName: player.name, option: VoteOption.Abstain, influenceSpent: 0, weight: 0 });
    }
  }

  // Determine winner
  let winningOption: VoteOption.A | VoteOption.B;
  let tieOccurred = false;

  if (weightA > weightB) {
    winningOption = VoteOption.A;
  } else if (weightB > weightA) {
    winningOption = VoteOption.B;
  } else {
    winningOption = crisis.tieDefault;
    tieOccurred = true;
  }

  // Apply effects
  const metersBefore = { ...match.meters };
  const effectOption = crisis.options.find((o) => o.id === winningOption)!;
  const metersAfter = applyEffects(metersBefore, effectOption.effects);
  match.meters = metersAfter;

  // Influence recovery (+1 for valid submitters, not auto-abstainers)
  for (const ps of match.playerStates.values()) {
    if (!ps.hasAbstained) {
      ps.influence = Math.min(BALANCE_RULES.MAX_INFLUENCE, ps.influence + 1);
    }
    // Count interventions won
    if (ps.commitment?.option === winningOption && (ps.commitment?.influenceSpent ?? 0) >= 1) {
      ps.interventionsWon++;
    }
    ps.hasAbstained = false;
  }

  match.revealedVotes = reveals;

  addEvent(
    match,
    'crisis_resolved',
    `${crisis.title}: ${effectOption.label} ${tieOccurred ? '(tie — default applied)' : `wins (A:${weightA} vs B:${weightB})`}`,
    { metersBefore, metersAfter }
  );

  broadcastRoomUpdate(room);

  // Check collapse
  if (isCollapsed(metersAfter)) {
    setTimeout(() => finalizeMatch(roomId, EndReason.Collapse), 2000);
  } else if (match.roundNumber >= BALANCE_RULES.TOTAL_ROUNDS) {
    setTimeout(() => finalizeMatch(roomId, EndReason.Survival), 2000);
  } else {
    setTimeout(() => advanceToCrisisBriefing(roomId), 4000);
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function checkAgendaCompleted(agendaType: AgendaType, finalMeters: CompanyMeters, endReason: EndReason): boolean {
  switch (agendaType) {
    case AgendaType.Reformer:
      return endReason !== EndReason.Collapse &&
        finalMeters.budget >= 50 && finalMeters.publicTrust >= 50 && finalMeters.morale >= 50;
    case AgendaType.Financier:
      return endReason !== EndReason.Collapse && finalMeters.budget >= 70;
    case AgendaType.Publicist:
      return endReason !== EndReason.Collapse && finalMeters.publicTrust >= 70;
    case AgendaType.PeoplesChampion:
      return endReason !== EndReason.Collapse && finalMeters.morale >= 70;
    case AgendaType.Liquidator:
      return endReason === EndReason.Collapse &&
        finalMeters.budget <= 0 && finalMeters.publicTrust > 0;
    case AgendaType.Disruptor:
      return endReason === EndReason.Collapse && finalMeters.publicTrust <= 0;
    case AgendaType.Whistleblower:
      return endReason !== EndReason.Collapse &&
        finalMeters.budget <= 55 && finalMeters.publicTrust >= 50;
    case AgendaType.GoldenParachute:
      return endReason !== EndReason.Collapse && (
        (finalMeters.budget >= 20 && finalMeters.budget <= 50) ||
        (finalMeters.publicTrust >= 25 && finalMeters.publicTrust <= 55)
      );
    case AgendaType.HostileTakeover:
      return (endReason !== EndReason.Collapse && finalMeters.budget <= 35) ||
        (endReason === EndReason.Collapse && finalMeters.budget <= 0);
    case AgendaType.ShortSeller:
      if (endReason === EndReason.Collapse) return true;
      return [finalMeters.budget, finalMeters.publicTrust, finalMeters.morale].filter(v => v <= 35).length >= 2;
    case AgendaType.Turnaround:
      return endReason !== EndReason.Collapse &&
        finalMeters.budget >= 60 && finalMeters.publicTrust >= 60 && finalMeters.morale >= 60;
    case AgendaType.StripAndFlip:
      return endReason !== EndReason.Collapse &&
        finalMeters.budget >= 65 && finalMeters.morale <= 45;
    default:
      return false;
  }
}

function computeCompanyPoints(meters: CompanyMeters): number {
  let pts = 0;
  for (const v of [meters.budget, meters.publicTrust, meters.morale]) {
    if (v >= BALANCE_RULES.COMPANY_LOWER_THRESHOLD) pts++;
    if (v >= BALANCE_RULES.COMPANY_UPPER_THRESHOLD) pts++;
  }
  return pts;
}

function finalizeMatch(roomId: string, endReason: EndReason): void {
  const room = rooms.get(roomId);
  if (!room?.match) return;
  const match = room.match;
  if (match.phase === MatchPhase.Finished) return;

  match.phase = MatchPhase.Finished;
  match.deadlineAt = null;
  match.version++;

  const finalMeters = { ...match.meters };
  const companyPoints = computeCompanyPoints(finalMeters);

  const scores: PlayerFinalScore[] = [];
  for (const [pid, ps] of match.playerStates.entries()) {
    const player = room.players.get(pid)!;
    const agendaCompleted = checkAgendaCompleted(ps.agendaType, finalMeters, endReason);
    const agendaPoints = agendaCompleted ? BALANCE_RULES.AGENDA_POINTS : 0;
    const interventionPoints = Math.min(ps.interventionsWon * BALANCE_RULES.INTERVENTION_POINTS, BALANCE_RULES.INTERVENTION_CAP);
    const restraintPoints = ps.influence >= BALANCE_RULES.RESTRAINT_THRESHOLD ? BALANCE_RULES.RESTRAINT_POINTS : 0;
    const total = agendaPoints + interventionPoints + restraintPoints + companyPoints;

    scores.push({
      playerId: pid,
      playerName: player.name,
      agendaType: ps.agendaType,
      agendaCompleted,
      agendaPoints,
      interventionPoints,
      restraintPoints,
      companyPerformancePoints: companyPoints,
      totalPoints: total,
    });
  }

  // Determine winner
  scores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.agendaCompleted !== a.agendaCompleted) return b.agendaCompleted ? 1 : -1;
    // influence tie-breaker (we don't store final influence here; use agenda as fallback)
    return 0;
  });

  const topScore = scores[0].totalPoints;
  const topPlayers = scores.filter((s) => s.totalPoints === topScore);
  const tie = topPlayers.length > 1 && topPlayers.every((p) => p.agendaCompleted === topPlayers[0].agendaCompleted);
  const winnerId = tie ? null : scores[0].playerId;

  const result: MatchResult = {
    matchId: match.id,
    endReason,
    finalMeters,
    scores,
    winnerId,
    tie,
  };

  match.result = result;
  room.status = RoomStatus.Finished;

  const endMsg = endReason === EndReason.Collapse
    ? `The company has collapsed. Final meters: Budget ${finalMeters.budget}%, Trust ${finalMeters.publicTrust}%, Morale ${finalMeters.morale}%.`
    : `Match complete. The company survived all ${BALANCE_RULES.TOTAL_ROUNDS} crises.`;

  addEvent(match, 'match_ended', endMsg);

  broadcastRoomUpdate(room);
  broadcast(roomId, { type: 'match_result', result });
}

export function getRoomByCode(code: string): Room | null {
  const id = roomsByCode.get(code.toUpperCase());
  return id ? rooms.get(id) ?? null : null;
}

// ─── Deadline worker (polls every 5 seconds for missed timers) ─────────────────

export function startDeadlineWorker(): void {
  setInterval(() => {
    for (const room of rooms.values()) {
      const match = room.match;
      if (!match) continue;
      if (!match.deadlineAt) continue;
      if (new Date() < match.deadlineAt) continue;

      if (match.phase === MatchPhase.Discussion) {
        advanceToVoting(room.id, match.roundNumber);
      } else if (match.phase === MatchPhase.Voting) {
        checkVotingComplete(room.id, match.roundNumber, match.version);
      }
    }
  }, 5000);
}
