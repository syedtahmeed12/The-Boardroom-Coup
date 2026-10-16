"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejoinCommandSchema = exports.SubmitVoteCommandSchema = exports.StartMatchCommandSchema = exports.ReadyCommandSchema = exports.JoinRoomCommandSchema = exports.CreateRoomCommandSchema = exports.EndReason = exports.AgendaType = exports.VoteOption = exports.MatchPhase = exports.RoomStatus = void 0;
const zod_1 = require("zod");
// ─── Enums ────────────────────────────────────────────────────────────────────
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["Lobby"] = "lobby";
    RoomStatus["Active"] = "active";
    RoomStatus["Finished"] = "finished";
    RoomStatus["Expired"] = "expired";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var MatchPhase;
(function (MatchPhase) {
    MatchPhase["Dealing"] = "dealing";
    MatchPhase["CrisisBriefing"] = "crisis_briefing";
    MatchPhase["Discussion"] = "discussion";
    MatchPhase["Voting"] = "voting";
    MatchPhase["Resolving"] = "resolving";
    MatchPhase["Finished"] = "finished";
})(MatchPhase || (exports.MatchPhase = MatchPhase = {}));
var VoteOption;
(function (VoteOption) {
    VoteOption["A"] = "A";
    VoteOption["B"] = "B";
    VoteOption["Abstain"] = "abstain";
})(VoteOption || (exports.VoteOption = VoteOption = {}));
var AgendaType;
(function (AgendaType) {
    AgendaType["Reformer"] = "reformer";
    AgendaType["Financier"] = "financier";
    AgendaType["Publicist"] = "publicist";
    AgendaType["PeoplesChampion"] = "peoples_champion";
    AgendaType["Liquidator"] = "liquidator";
    AgendaType["Disruptor"] = "disruptor";
    AgendaType["Whistleblower"] = "whistleblower";
    AgendaType["GoldenParachute"] = "golden_parachute";
    AgendaType["HostileTakeover"] = "hostile_takeover";
    AgendaType["ShortSeller"] = "short_seller";
    AgendaType["Turnaround"] = "turnaround";
    AgendaType["StripAndFlip"] = "strip_and_flip";
})(AgendaType || (exports.AgendaType = AgendaType = {}));
var EndReason;
(function (EndReason) {
    EndReason["Collapse"] = "collapse";
    EndReason["Survival"] = "survival";
    EndReason["Abandoned"] = "abandoned";
})(EndReason || (exports.EndReason = EndReason = {}));
// ─── WebSocket command schemas (client → server) ───────────────────────────────
exports.CreateRoomCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('create_room'),
    playerName: zod_1.z.string().min(2).max(20).trim(),
});
exports.JoinRoomCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('join_room'),
    roomCode: zod_1.z.string().length(6).toUpperCase(),
    playerName: zod_1.z.string().min(2).max(20).trim(),
});
exports.ReadyCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('ready'),
    sessionToken: zod_1.z.string(),
});
exports.StartMatchCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('start_match'),
    sessionToken: zod_1.z.string(),
});
exports.SubmitVoteCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('submit_vote'),
    sessionToken: zod_1.z.string(),
    roundNumber: zod_1.z.number().int().min(1),
    option: zod_1.z.nativeEnum(VoteOption),
    influenceSpent: zod_1.z.number().int().min(0).max(2),
});
exports.RejoinCommandSchema = zod_1.z.object({
    type: zod_1.z.literal('rejoin'),
    sessionToken: zod_1.z.string(),
});
//# sourceMappingURL=index.js.map