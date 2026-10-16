import { AgendaDefinition, CrisisCard } from '@boardroom/contracts';
export declare const CRISIS_DECK: CrisisCard[];
export declare const AGENDA_DEFINITIONS: AgendaDefinition[];
/** Agendas valid for a given player count */
export declare function validAgendas(playerCount: number): AgendaDefinition[];
export declare const BALANCE_RULES: {
    readonly TOTAL_ROUNDS: 6;
    readonly STARTING_INFLUENCE: 3;
    readonly MAX_INFLUENCE: 5;
    readonly MAX_PLAYERS: 8;
    readonly MIN_PLAYERS: 2;
    readonly MAX_INFLUENCE_SPEND_PER_VOTE: 2;
    readonly STARTING_METERS: {
        readonly budget: 70;
        readonly publicTrust: 70;
        readonly morale: 70;
    };
    readonly DISCUSSION_WINDOW_SECONDS: 45;
    readonly VOTING_WINDOW_SECONDS: 30;
    readonly RECONNECT_GRACE_SECONDS: 60;
    /** Points for agenda completion */
    readonly AGENDA_POINTS: 5;
    /** Points per successful intervention (max INTERVENTION_CAP) */
    readonly INTERVENTION_POINTS: 2;
    readonly INTERVENTION_CAP: 6;
    /** Points for ending with ≥3 influence */
    readonly RESTRAINT_POINTS: 1;
    readonly RESTRAINT_THRESHOLD: 3;
    /** Company performance: 1 pt per meter ≥ 40%, +1 per meter ≥ 70% */
    readonly COMPANY_LOWER_THRESHOLD: 40;
    readonly COMPANY_UPPER_THRESHOLD: 70;
};
export { CRISIS_DECK as crises, AGENDA_DEFINITIONS as agendas };
//# sourceMappingURL=index.d.ts.map