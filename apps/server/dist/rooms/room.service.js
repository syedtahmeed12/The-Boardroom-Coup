"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBroadcastFn = setBroadcastFn;
exports.createRoom = createRoom;
exports.joinRoom = joinRoom;
exports.setReady = setReady;
exports.setConnected = setConnected;
exports.getPlayerRoom = getPlayerRoom;
exports.startMatch = startMatch;
exports.submitVote = submitVote;
exports.getRoomByCode = getRoomByCode;
exports.startDeadlineWorker = startDeadlineWorker;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const contracts_1 = require("@boardroom/contracts");
const game_content_1 = require("@boardroom/game-content");
const room_code_js_1 = require("./room-code.js");
const session_service_js_1 = require("../auth/session.service.js");
// ─── In-memory store ──────────────────────────────────────────────────────────
const rooms = new Map(); // roomId → Room
const roomsByCode = new Map(); // code → roomId
const playerRooms = new Map(); // playerId → roomId
let broadcastFn = () => { };
function setBroadcastFn(fn) {
    broadcastFn = fn;
}
function broadcast(roomId, payload) {
    broadcastFn(roomId, null, payload);
}
function sendPrivate(roomId, playerId, payload) {
    broadcastFn(roomId, playerId, payload);
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v) {
    return Math.max(0, Math.min(100, v));
}
function applyEffects(meters, effects) {
    return {
        budget: clamp(meters.budget + effects.budget),
        publicTrust: clamp(meters.publicTrust + effects.publicTrust),
        morale: clamp(meters.morale + effects.morale),
    };
}
function isCollapsed(meters) {
    return meters.budget <= 0 || meters.publicTrust <= 0 || meters.morale <= 0;
}
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = crypto_1.default.randomInt(0, i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function nextSequence(match) {
    return match.eventHistory.length + 1;
}
function addEvent(match, type, summary, extra) {
    match.eventHistory.push({
        sequence: nextSequence(match),
        type,
        summary,
        createdAt: new Date().toISOString(),
        ...extra,
    });
}
// ─── Public view builders ─────────────────────────────────────────────────────
function buildPublicPlayer(player, match) {
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
function buildPublicCrisisView(card) {
    return {
        id: card.id,
        title: card.title,
        category: card.category,
        narrative: card.narrative,
        options: card.options,
        tieDefault: card.tieDefault,
    };
}
function buildPublicMatchState(match, room) {
    const players = Array.from(room.players.values()).map((p) => buildPublicPlayer(p, match));
    return {
        matchId: match.id,
        phase: match.phase,
        roundNumber: match.roundNumber,
        totalRounds: game_content_1.BALANCE_RULES.TOTAL_ROUNDS,
        deadlineAt: match.deadlineAt?.toISOString() ?? null,
        meters: { ...match.meters },
        crisis: match.currentCrisis ? buildPublicCrisisView(match.currentCrisis) : null,
        players,
        eventHistory: [...match.eventHistory],
        revealedVotes: match.revealedVotes,
    };
}
function buildPublicRoomState(room) {
    const players = Array.from(room.players.values()).map((p) => buildPublicPlayer(p, room.match));
    return {
        roomId: room.id,
        code: room.code,
        status: room.status,
        hostPlayerId: room.hostPlayerId,
        players,
        match: room.match ? buildPublicMatchState(room.match, room) : null,
    };
}
function buildPrivateState(match, playerId) {
    const ps = match.playerStates.get(playerId);
    const agenda = game_content_1.AGENDA_DEFINITIONS.find((a) => a.type === ps.agendaType);
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
function broadcastRoomUpdate(room) {
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
function createRoom(playerName) {
    const roomId = (0, uuid_1.v4)();
    const playerId = (0, uuid_1.v4)();
    const code = (0, room_code_js_1.generateRoomCode)();
    const player = {
        id: playerId,
        name: playerName,
        roomId,
        connected: true,
        ready: false,
        corporateTitle: EXECUTIVE_TITLES[0],
    };
    const room = {
        id: roomId,
        code,
        status: contracts_1.RoomStatus.Lobby,
        hostPlayerId: playerId,
        players: new Map([[playerId, player]]),
        match: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h TTL
    };
    rooms.set(roomId, room);
    roomsByCode.set(code, roomId);
    playerRooms.set(playerId, roomId);
    const token = (0, session_service_js_1.createSession)(playerId, roomId);
    broadcastRoomUpdate(room);
    return { token, playerId, roomId, roomCode: code };
}
function joinRoom(roomCode, playerName) {
    const roomId = roomsByCode.get(roomCode.toUpperCase());
    if (!roomId)
        return { error: 'ROOM_NOT_FOUND' };
    const room = rooms.get(roomId);
    if (!room)
        return { error: 'ROOM_NOT_FOUND' };
    if (room.status !== contracts_1.RoomStatus.Lobby)
        return { error: 'ROOM_NOT_OPEN' };
    if (room.players.size >= (game_content_1.BALANCE_RULES.MAX_PLAYERS ?? 8))
        return { error: 'ROOM_FULL' };
    if (room.expiresAt < new Date())
        return { error: 'ROOM_EXPIRED' };
    // Check duplicate name
    for (const p of room.players.values()) {
        if (p.name.toLowerCase() === playerName.toLowerCase())
            return { error: 'NAME_TAKEN' };
    }
    const playerId = (0, uuid_1.v4)();
    const playerIndex = room.players.size;
    const player = {
        id: playerId,
        name: playerName,
        roomId,
        connected: true,
        ready: false,
        corporateTitle: EXECUTIVE_TITLES[playerIndex % EXECUTIVE_TITLES.length],
    };
    room.players.set(playerId, player);
    playerRooms.set(playerId, roomId);
    const token = (0, session_service_js_1.createSession)(playerId, roomId);
    broadcastRoomUpdate(room);
    return { token, playerId, roomId, roomCode: room.code };
}
function setReady(playerId) {
    const roomId = playerRooms.get(playerId);
    if (!roomId)
        return;
    const room = rooms.get(roomId);
    if (!room)
        return;
    const player = room.players.get(playerId);
    if (!player)
        return;
    player.ready = true;
    broadcastRoomUpdate(room);
}
function setConnected(playerId, connected) {
    const roomId = playerRooms.get(playerId);
    if (!roomId)
        return;
    const room = rooms.get(roomId);
    if (!room)
        return;
    const player = room.players.get(playerId);
    if (!player)
        return;
    player.connected = connected;
    if (!connected && room.match?.phase === contracts_1.MatchPhase.Voting) {
        // Their commitment (or lack thereof) stands; deadline will handle the rest.
    }
    if (!connected && room.status === contracts_1.RoomStatus.Lobby) {
        // Transfer host if host disconnected
        if (room.hostPlayerId === playerId) {
            const next = Array.from(room.players.values()).find((p) => p.id !== playerId && p.connected);
            if (next)
                room.hostPlayerId = next.id;
        }
    }
    broadcastRoomUpdate(room);
}
function getPlayerRoom(playerId) {
    const roomId = playerRooms.get(playerId);
    if (!roomId)
        return null;
    return rooms.get(roomId) ?? null;
}
// ─── Match lifecycle ──────────────────────────────────────────────────────────
function startMatch(requestingPlayerId) {
    const room = getPlayerRoom(requestingPlayerId);
    if (!room)
        return { error: 'ROOM_NOT_FOUND' };
    if (room.hostPlayerId !== requestingPlayerId)
        return { error: 'NOT_HOST' };
    if (room.status !== contracts_1.RoomStatus.Lobby)
        return { error: 'MATCH_ALREADY_ACTIVE' };
    if (room.match)
        return { error: 'MATCH_ALREADY_ACTIVE' };
    const playerCount = room.players.size;
    if (playerCount < 2)
        return { error: 'NOT_ENOUGH_PLAYERS' };
    for (const p of room.players.values()) {
        if (!p.ready)
            return { error: 'PLAYERS_NOT_READY' };
    }
    // Assign agendas
    const pool = shuffleArray((0, game_content_1.validAgendas)(playerCount));
    const playerIds = Array.from(room.players.keys());
    const playerStates = new Map();
    playerIds.forEach((pid, i) => {
        playerStates.set(pid, {
            influence: game_content_1.BALANCE_RULES.STARTING_INFLUENCE,
            agendaType: pool[i % pool.length].type,
            commitment: null,
            interventionsWon: 0,
            hasAbstained: false,
        });
    });
    // Shuffle crisis deck
    const crisisSequence = shuffleArray(game_content_1.CRISIS_DECK).slice(0, game_content_1.BALANCE_RULES.TOTAL_ROUNDS);
    const matchId = (0, uuid_1.v4)();
    const match = {
        id: matchId,
        roomId: room.id,
        phase: contracts_1.MatchPhase.Dealing,
        roundNumber: 0,
        deadlineAt: null,
        meters: { ...game_content_1.BALANCE_RULES.STARTING_METERS },
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
    room.status = contracts_1.RoomStatus.Active;
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
function advanceToCrisisBriefing(roomId) {
    const room = rooms.get(roomId);
    if (!room || !room.match)
        return;
    const match = room.match;
    match.roundNumber += 1;
    if (match.roundNumber > game_content_1.BALANCE_RULES.TOTAL_ROUNDS) {
        finalizeMatch(roomId, contracts_1.EndReason.Survival);
        return;
    }
    const crisis = match.crisisSequence[match.roundNumber - 1];
    match.currentCrisis = crisis;
    match.phase = contracts_1.MatchPhase.CrisisBriefing;
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
function advanceToDiscussion(roomId) {
    const room = rooms.get(roomId);
    if (!room?.match)
        return;
    const match = room.match;
    if (match.phase !== contracts_1.MatchPhase.CrisisBriefing)
        return;
    match.phase = contracts_1.MatchPhase.Discussion;
    match.deadlineAt = new Date(Date.now() + game_content_1.BALANCE_RULES.DISCUSSION_WINDOW_SECONDS * 1000);
    broadcastRoomUpdate(room);
    const remaining = match.deadlineAt.getTime() - Date.now();
    setTimeout(() => advanceToVoting(roomId, match.roundNumber), remaining);
}
function advanceToVoting(roomId, forRound) {
    const room = rooms.get(roomId);
    if (!room?.match)
        return;
    const match = room.match;
    if (match.phase !== contracts_1.MatchPhase.Discussion)
        return;
    if (match.roundNumber !== forRound)
        return;
    match.phase = contracts_1.MatchPhase.Voting;
    match.deadlineAt = new Date(Date.now() + game_content_1.BALANCE_RULES.VOTING_WINDOW_SECONDS * 1000);
    broadcastRoomUpdate(room);
    const remaining = match.deadlineAt.getTime() - Date.now();
    setTimeout(() => checkVotingComplete(roomId, match.roundNumber, match.version), remaining);
}
function submitVote(playerId, roundNumber, option, influenceSpent) {
    const room = getPlayerRoom(playerId);
    if (!room?.match)
        return { error: 'NO_ACTIVE_MATCH' };
    const match = room.match;
    if (match.phase !== contracts_1.MatchPhase.Voting)
        return { error: 'WRONG_PHASE' };
    if (match.roundNumber !== roundNumber)
        return { error: 'WRONG_ROUND' };
    if (match.deadlineAt && new Date() > match.deadlineAt)
        return { error: 'DEADLINE_PASSED' };
    const ps = match.playerStates.get(playerId);
    if (!ps)
        return { error: 'PLAYER_NOT_IN_MATCH' };
    if (ps.commitment)
        return { error: 'ALREADY_VOTED' };
    if (option !== contracts_1.VoteOption.Abstain) {
        if (influenceSpent < 0 || influenceSpent > game_content_1.BALANCE_RULES.MAX_INFLUENCE_SPEND_PER_VOTE)
            return { error: 'INVALID_INFLUENCE_AMOUNT' };
        if (influenceSpent > ps.influence)
            return { error: 'INSUFFICIENT_INFLUENCE' };
        if (![contracts_1.VoteOption.A, contracts_1.VoteOption.B].includes(option))
            return { error: 'INVALID_OPTION' };
    }
    else {
        influenceSpent = 0;
    }
    ps.commitment = { option, influenceSpent, submittedAt: new Date() };
    match.version++;
    broadcastRoomUpdate(room);
    checkVotingComplete(room.id, roundNumber, match.version);
    return null;
}
function checkVotingComplete(roomId, forRound, atVersion) {
    const room = rooms.get(roomId);
    if (!room?.match)
        return;
    const match = room.match;
    if (match.phase !== contracts_1.MatchPhase.Voting)
        return;
    if (match.roundNumber !== forRound)
        return;
    if (match.resolvedRounds.has(forRound))
        return;
    const connectedPlayers = Array.from(room.players.values()).filter((p) => p.connected);
    const allCommitted = connectedPlayers.every((p) => match.playerStates.get(p.id)?.commitment !== null);
    const deadlinePassed = match.deadlineAt ? new Date() >= match.deadlineAt : false;
    if (allCommitted || deadlinePassed) {
        // Apply automatic abstentions for missing votes
        for (const ps of match.playerStates.values()) {
            if (!ps.commitment) {
                ps.commitment = { option: contracts_1.VoteOption.Abstain, influenceSpent: 0, submittedAt: new Date() };
                ps.hasAbstained = true;
            }
        }
        resolveCrisis(roomId, forRound);
    }
}
function resolveCrisis(roomId, forRound) {
    const room = rooms.get(roomId);
    if (!room?.match)
        return;
    const match = room.match;
    if (match.resolvedRounds.has(forRound))
        return; // exactly-once guard
    match.resolvedRounds.add(forRound);
    match.phase = contracts_1.MatchPhase.Resolving;
    match.deadlineAt = null;
    match.version++;
    const crisis = match.currentCrisis;
    // Tally weights
    let weightA = 0;
    let weightB = 0;
    const reveals = [];
    for (const [pid, ps] of match.playerStates.entries()) {
        const c = ps.commitment;
        const player = room.players.get(pid);
        if (c.option === contracts_1.VoteOption.A) {
            const w = 1 + c.influenceSpent;
            weightA += w;
            reveals.push({ playerId: pid, playerName: player.name, option: c.option, influenceSpent: c.influenceSpent, weight: w });
            ps.influence = Math.max(0, ps.influence - c.influenceSpent);
        }
        else if (c.option === contracts_1.VoteOption.B) {
            const w = 1 + c.influenceSpent;
            weightB += w;
            reveals.push({ playerId: pid, playerName: player.name, option: c.option, influenceSpent: c.influenceSpent, weight: w });
            ps.influence = Math.max(0, ps.influence - c.influenceSpent);
        }
        else {
            reveals.push({ playerId: pid, playerName: player.name, option: contracts_1.VoteOption.Abstain, influenceSpent: 0, weight: 0 });
        }
    }
    // Determine winner
    let winningOption;
    let tieOccurred = false;
    if (weightA > weightB) {
        winningOption = contracts_1.VoteOption.A;
    }
    else if (weightB > weightA) {
        winningOption = contracts_1.VoteOption.B;
    }
    else {
        winningOption = crisis.tieDefault;
        tieOccurred = true;
    }
    // Apply effects
    const metersBefore = { ...match.meters };
    const effectOption = crisis.options.find((o) => o.id === winningOption);
    const metersAfter = applyEffects(metersBefore, effectOption.effects);
    match.meters = metersAfter;
    // Influence recovery (+1 for valid submitters, not auto-abstainers)
    for (const ps of match.playerStates.values()) {
        if (!ps.hasAbstained) {
            ps.influence = Math.min(game_content_1.BALANCE_RULES.MAX_INFLUENCE, ps.influence + 1);
        }
        // Count interventions won
        if (ps.commitment?.option === winningOption && (ps.commitment?.influenceSpent ?? 0) >= 1) {
            ps.interventionsWon++;
        }
        ps.hasAbstained = false;
    }
    match.revealedVotes = reveals;
    addEvent(match, 'crisis_resolved', `${crisis.title}: ${effectOption.label} ${tieOccurred ? '(tie — default applied)' : `wins (A:${weightA} vs B:${weightB})`}`, { metersBefore, metersAfter });
    broadcastRoomUpdate(room);
    // Check collapse
    if (isCollapsed(metersAfter)) {
        setTimeout(() => finalizeMatch(roomId, contracts_1.EndReason.Collapse), 2000);
    }
    else if (match.roundNumber >= game_content_1.BALANCE_RULES.TOTAL_ROUNDS) {
        setTimeout(() => finalizeMatch(roomId, contracts_1.EndReason.Survival), 2000);
    }
    else {
        setTimeout(() => advanceToCrisisBriefing(roomId), 4000);
    }
}
// ─── Scoring ──────────────────────────────────────────────────────────────────
function checkAgendaCompleted(agendaType, finalMeters, endReason) {
    switch (agendaType) {
        case contracts_1.AgendaType.Reformer:
            return endReason !== contracts_1.EndReason.Collapse &&
                finalMeters.budget >= 50 && finalMeters.publicTrust >= 50 && finalMeters.morale >= 50;
        case contracts_1.AgendaType.Financier:
            return endReason !== contracts_1.EndReason.Collapse && finalMeters.budget >= 70;
        case contracts_1.AgendaType.Publicist:
            return endReason !== contracts_1.EndReason.Collapse && finalMeters.publicTrust >= 70;
        case contracts_1.AgendaType.PeoplesChampion:
            return endReason !== contracts_1.EndReason.Collapse && finalMeters.morale >= 70;
        case contracts_1.AgendaType.Liquidator:
            return endReason === contracts_1.EndReason.Collapse &&
                finalMeters.budget <= 0 && finalMeters.publicTrust > 0;
        case contracts_1.AgendaType.Disruptor:
            return endReason === contracts_1.EndReason.Collapse && finalMeters.publicTrust <= 0;
        case contracts_1.AgendaType.Whistleblower:
            return endReason !== contracts_1.EndReason.Collapse &&
                finalMeters.budget <= 55 && finalMeters.publicTrust >= 50;
        case contracts_1.AgendaType.GoldenParachute:
            return endReason !== contracts_1.EndReason.Collapse && ((finalMeters.budget >= 20 && finalMeters.budget <= 50) ||
                (finalMeters.publicTrust >= 25 && finalMeters.publicTrust <= 55));
        case contracts_1.AgendaType.HostileTakeover:
            return (endReason !== contracts_1.EndReason.Collapse && finalMeters.budget <= 35) ||
                (endReason === contracts_1.EndReason.Collapse && finalMeters.budget <= 0);
        case contracts_1.AgendaType.ShortSeller:
            if (endReason === contracts_1.EndReason.Collapse)
                return true;
            return [finalMeters.budget, finalMeters.publicTrust, finalMeters.morale].filter(v => v <= 35).length >= 2;
        case contracts_1.AgendaType.Turnaround:
            return endReason !== contracts_1.EndReason.Collapse &&
                finalMeters.budget >= 60 && finalMeters.publicTrust >= 60 && finalMeters.morale >= 60;
        case contracts_1.AgendaType.StripAndFlip:
            return endReason !== contracts_1.EndReason.Collapse &&
                finalMeters.budget >= 65 && finalMeters.morale <= 45;
        default:
            return false;
    }
}
function computeCompanyPoints(meters) {
    let pts = 0;
    for (const v of [meters.budget, meters.publicTrust, meters.morale]) {
        if (v >= game_content_1.BALANCE_RULES.COMPANY_LOWER_THRESHOLD)
            pts++;
        if (v >= game_content_1.BALANCE_RULES.COMPANY_UPPER_THRESHOLD)
            pts++;
    }
    return pts;
}
function finalizeMatch(roomId, endReason) {
    const room = rooms.get(roomId);
    if (!room?.match)
        return;
    const match = room.match;
    if (match.phase === contracts_1.MatchPhase.Finished)
        return;
    match.phase = contracts_1.MatchPhase.Finished;
    match.deadlineAt = null;
    match.version++;
    const finalMeters = { ...match.meters };
    const companyPoints = computeCompanyPoints(finalMeters);
    const scores = [];
    for (const [pid, ps] of match.playerStates.entries()) {
        const player = room.players.get(pid);
        const agendaCompleted = checkAgendaCompleted(ps.agendaType, finalMeters, endReason);
        const agendaPoints = agendaCompleted ? game_content_1.BALANCE_RULES.AGENDA_POINTS : 0;
        const interventionPoints = Math.min(ps.interventionsWon * game_content_1.BALANCE_RULES.INTERVENTION_POINTS, game_content_1.BALANCE_RULES.INTERVENTION_CAP);
        const restraintPoints = ps.influence >= game_content_1.BALANCE_RULES.RESTRAINT_THRESHOLD ? game_content_1.BALANCE_RULES.RESTRAINT_POINTS : 0;
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
        if (b.totalPoints !== a.totalPoints)
            return b.totalPoints - a.totalPoints;
        if (b.agendaCompleted !== a.agendaCompleted)
            return b.agendaCompleted ? 1 : -1;
        // influence tie-breaker (we don't store final influence here; use agenda as fallback)
        return 0;
    });
    const topScore = scores[0].totalPoints;
    const topPlayers = scores.filter((s) => s.totalPoints === topScore);
    const tie = topPlayers.length > 1 && topPlayers.every((p) => p.agendaCompleted === topPlayers[0].agendaCompleted);
    const winnerId = tie ? null : scores[0].playerId;
    const result = {
        matchId: match.id,
        endReason,
        finalMeters,
        scores,
        winnerId,
        tie,
    };
    match.result = result;
    room.status = contracts_1.RoomStatus.Finished;
    const endMsg = endReason === contracts_1.EndReason.Collapse
        ? `The company has collapsed. Final meters: Budget ${finalMeters.budget}%, Trust ${finalMeters.publicTrust}%, Morale ${finalMeters.morale}%.`
        : `Match complete. The company survived all ${game_content_1.BALANCE_RULES.TOTAL_ROUNDS} crises.`;
    addEvent(match, 'match_ended', endMsg);
    broadcastRoomUpdate(room);
    broadcast(roomId, { type: 'match_result', result });
}
function getRoomByCode(code) {
    const id = roomsByCode.get(code.toUpperCase());
    return id ? rooms.get(id) ?? null : null;
}
// ─── Deadline worker (polls every 5 seconds for missed timers) ─────────────────
function startDeadlineWorker() {
    setInterval(() => {
        for (const room of rooms.values()) {
            const match = room.match;
            if (!match)
                continue;
            if (!match.deadlineAt)
                continue;
            if (new Date() < match.deadlineAt)
                continue;
            if (match.phase === contracts_1.MatchPhase.Discussion) {
                advanceToVoting(room.id, match.roundNumber);
            }
            else if (match.phase === contracts_1.MatchPhase.Voting) {
                checkVotingComplete(room.id, match.roundNumber, match.version);
            }
        }
    }, 5000);
}
