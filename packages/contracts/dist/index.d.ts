import { z } from 'zod';
export declare enum RoomStatus {
    Lobby = "lobby",
    Active = "active",
    Finished = "finished",
    Expired = "expired"
}
export declare enum MatchPhase {
    Dealing = "dealing",
    CrisisBriefing = "crisis_briefing",
    Discussion = "discussion",
    Voting = "voting",
    Resolving = "resolving",
    Finished = "finished"
}
export declare enum VoteOption {
    A = "A",
    B = "B",
    Abstain = "abstain"
}
export declare enum AgendaType {
    Reformer = "reformer",
    Financier = "financier",
    Publicist = "publicist",
    PeoplesChampion = "peoples_champion",
    Liquidator = "liquidator",
    Disruptor = "disruptor",
    Whistleblower = "whistleblower",
    GoldenParachute = "golden_parachute",
    HostileTakeover = "hostile_takeover",
    ShortSeller = "short_seller",
    Turnaround = "turnaround",
    StripAndFlip = "strip_and_flip"
}
export declare enum EndReason {
    Collapse = "collapse",
    Survival = "survival",
    Abandoned = "abandoned"
}
export interface CompanyMeters {
    budget: number;
    publicTrust: number;
    morale: number;
}
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
    roundHint: number;
    title: string;
    category: string;
    narrative: string;
    options: [CrisisOption, CrisisOption];
    tieDefault: VoteOption.A | VoteOption.B;
    condition?: string;
}
export interface AgendaDefinition {
    type: AgendaType;
    name: string;
    objective: string;
    successDescription: string;
    minPlayers: number;
}
export interface PublicPlayer {
    id: string;
    name: string;
    connected: boolean;
    ready: boolean;
    hasCommitted: boolean;
    corporateTitle?: string;
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
export declare const CreateRoomCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"create_room">;
    playerName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "create_room";
    playerName: string;
}, {
    type: "create_room";
    playerName: string;
}>;
export declare const JoinRoomCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"join_room">;
    roomCode: z.ZodString;
    playerName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "join_room";
    playerName: string;
    roomCode: string;
}, {
    type: "join_room";
    playerName: string;
    roomCode: string;
}>;
export declare const ReadyCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"ready">;
    sessionToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "ready";
    sessionToken: string;
}, {
    type: "ready";
    sessionToken: string;
}>;
export declare const StartMatchCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"start_match">;
    sessionToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "start_match";
    sessionToken: string;
}, {
    type: "start_match";
    sessionToken: string;
}>;
export declare const SubmitVoteCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"submit_vote">;
    sessionToken: z.ZodString;
    roundNumber: z.ZodNumber;
    option: z.ZodNativeEnum<typeof VoteOption>;
    influenceSpent: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "submit_vote";
    sessionToken: string;
    roundNumber: number;
    option: VoteOption;
    influenceSpent: number;
}, {
    type: "submit_vote";
    sessionToken: string;
    roundNumber: number;
    option: VoteOption;
    influenceSpent: number;
}>;
export declare const RejoinCommandSchema: z.ZodObject<{
    type: z.ZodLiteral<"rejoin">;
    sessionToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "rejoin";
    sessionToken: string;
}, {
    type: "rejoin";
    sessionToken: string;
}>;
export type CreateRoomCommand = z.infer<typeof CreateRoomCommandSchema>;
export type JoinRoomCommand = z.infer<typeof JoinRoomCommandSchema>;
export type ReadyCommand = z.infer<typeof ReadyCommandSchema>;
export type StartMatchCommand = z.infer<typeof StartMatchCommandSchema>;
export type SubmitVoteCommand = z.infer<typeof SubmitVoteCommandSchema>;
export type RejoinCommand = z.infer<typeof RejoinCommandSchema>;
export type ClientCommand = CreateRoomCommand | JoinRoomCommand | ReadyCommand | StartMatchCommand | SubmitVoteCommand | RejoinCommand;
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
export type ServerEvent = SessionCreatedEvent | RoomUpdateEvent | MatchUpdateEvent | PrivateStateEvent | MatchResultEvent | ErrorEvent;
//# sourceMappingURL=index.d.ts.map