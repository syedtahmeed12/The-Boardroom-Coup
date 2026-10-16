import { AgendaType, AgendaDefinition, VoteOption, CrisisCard } from '@boardroom/contracts';

// ─── Crisis deck ──────────────────────────────────────────────────────────────

export const CRISIS_DECK: CrisisCard[] = [
  {
    id: 'supply-chain-scandal',
    roundHint: 1,
    title: 'The Supplier Scandal',
    category: 'SUPPLY CHAIN',
    narrative:
      'A leaked report reveals serious labor violations at the company\'s primary supplier. The board must act before the story spreads.',
    options: [
      {
        id: VoteOption.A,
        label: 'Terminate the contract',
        description: 'Cut ties immediately. Accept short-term disruption to protect reputation.',
        effects: { budget: -15, publicTrust: +12, morale: +5 },
      },
      {
        id: VoteOption.B,
        label: 'Keep the supplier, impose reforms',
        description: 'Negotiate binding reform conditions and avoid supply disruption.',
        effects: { budget: -5, publicTrust: -8, morale: +3 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'executive-pay-vote',
    roundHint: 2,
    title: 'The Pay Revolt',
    category: 'GOVERNANCE',
    narrative:
      'Shareholder activists have tabled a vote to cap executive compensation. Employee forums are watching closely.',
    options: [
      {
        id: VoteOption.A,
        label: 'Accept the cap',
        description: 'Demonstrate restraint. Boost morale and trust at the cost of talent retention risk.',
        effects: { budget: +5, publicTrust: +10, morale: +8 },
      },
      {
        id: VoteOption.B,
        label: 'Oppose the cap',
        description: 'Fight the resolution. Protect executive incentives but invite public backlash.',
        effects: { budget: +2, publicTrust: -12, morale: -6 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'product-recall',
    roundHint: 2,
    title: 'The Defective Batch',
    category: 'PRODUCT SAFETY',
    narrative:
      'Quality control has flagged a defective batch of the flagship product. Recall costs are significant, but silence is risky.',
    options: [
      {
        id: VoteOption.A,
        label: 'Full voluntary recall',
        description: 'Recall everything. High cost; high trust payoff.',
        effects: { budget: -18, publicTrust: +15, morale: +4 },
      },
      {
        id: VoteOption.B,
        label: 'Targeted internal fix',
        description: 'Quietly correct the batch. Lower cost but exposes the company if discovered.',
        effects: { budget: -6, publicTrust: -5, morale: -3 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'mass-layoffs',
    roundHint: 3,
    title: 'The Restructuring',
    category: 'WORKFORCE',
    narrative:
      'The CFO has proposed cutting 15% of the workforce to stabilize the budget. Union representatives are already drafting a response.',
    options: [
      {
        id: VoteOption.A,
        label: 'Approve the layoffs',
        description: 'Reduce headcount. Significant budget recovery but deep morale damage.',
        effects: { budget: +20, publicTrust: -8, morale: -20 },
      },
      {
        id: VoteOption.B,
        label: 'Freeze hiring and cut perks',
        description: 'Attrition and austerity instead. Slower recovery, lower impact.',
        effects: { budget: +6, publicTrust: +2, morale: -8 },
      },
    ],
    tieDefault: VoteOption.B,
  },
  {
    id: 'data-breach',
    roundHint: 3,
    title: 'The Data Breach',
    category: 'CYBERSECURITY',
    narrative:
      'Customer data has been compromised. Regulators are expected to open an inquiry within 48 hours.',
    options: [
      {
        id: VoteOption.A,
        label: 'Full public disclosure',
        description: 'Notify all affected customers and regulators proactively.',
        effects: { budget: -10, publicTrust: +8, morale: +3 },
      },
      {
        id: VoteOption.B,
        label: 'Contain and minimize',
        description: 'Limit disclosure to the legal minimum and manage communications tightly.',
        effects: { budget: -4, publicTrust: -14, morale: -5 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'green-investment',
    roundHint: 4,
    title: 'The Green Pledge',
    category: 'SUSTAINABILITY',
    narrative:
      'An activist investment group is offering a significant capital injection contingent on a public net-zero commitment by end of quarter.',
    options: [
      {
        id: VoteOption.A,
        label: 'Accept the pledge',
        description: 'Sign the commitment and take the capital. Raises trust and morale, stretches budget.',
        effects: { budget: +8, publicTrust: +14, morale: +6 },
      },
      {
        id: VoteOption.B,
        label: 'Decline and preserve flexibility',
        description: 'Reject the conditions. Retain strategic independence; lose the optics.',
        effects: { budget: +2, publicTrust: -6, morale: -2 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'hostile-takeover',
    roundHint: 5,
    title: 'The Hostile Bid',
    category: 'M&A',
    narrative:
      'A larger competitor has made an unsolicited acquisition offer. The board must respond before the story reaches the press.',
    options: [
      {
        id: VoteOption.A,
        label: 'Reject the bid publicly',
        description: 'Defend independence. Reassures employees and public but may spook investors.',
        effects: { budget: -5, publicTrust: +10, morale: +12 },
      },
      {
        id: VoteOption.B,
        label: 'Open exploratory talks',
        description: 'Engage without committing. Hedges risk but signals potential sale.',
        effects: { budget: +10, publicTrust: -10, morale: -15 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'regulatory-fine',
    roundHint: 5,
    title: 'The Regulatory Fine',
    category: 'COMPLIANCE',
    narrative:
      'The company has received a formal notice of violation and a proposed settlement from the industry regulator.',
    options: [
      {
        id: VoteOption.A,
        label: 'Accept the settlement',
        description: 'Pay the fine and move on. Certain cost, avoids prolonged scrutiny.',
        effects: { budget: -14, publicTrust: +5, morale: +2 },
      },
      {
        id: VoteOption.B,
        label: 'Contest the ruling',
        description: 'Fight the fine in tribunal. Protects budget now but prolongs uncertainty.',
        effects: { budget: -3, publicTrust: -10, morale: -4 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'ceo-scandal',
    roundHint: 6,
    title: 'The Leadership Crisis',
    category: 'GOVERNANCE',
    narrative:
      'The CEO has been linked to a personal financial scandal. Major media outlets are preparing to publish.',
    options: [
      {
        id: VoteOption.A,
        label: 'Request resignation',
        description: 'Remove the CEO immediately. Painful internally, but shows decisive governance.',
        effects: { budget: -8, publicTrust: +16, morale: -8 },
      },
      {
        id: VoteOption.B,
        label: 'Issue a statement of support',
        description: 'Back the CEO publicly. Preserves internal continuity at the cost of credibility.',
        effects: { budget: +2, publicTrust: -18, morale: +4 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'channel-stuffing-sec',
    roundHint: 3,
    title: 'The Channel Stuffing Inquiry',
    category: 'ACCOUNTING FRAUD',
    narrative:
      'Internal audit reports that sales booked $40M in unconfirmed future shipments to hit Q4 targets. The SEC has issued a formal inquiry.',
    options: [
      {
        id: VoteOption.A,
        label: 'Restate earnings and cooperate',
        description: 'File an 8-K disclosure and restate earnings. High legal cost, but clears compliance.',
        effects: { budget: -14, publicTrust: +14, morale: +2 },
      },
      {
        id: VoteOption.B,
        label: 'Stonewall and classify as standard',
        description: 'Defend accounting treatment aggressively. Preserves budget but risks grand jury scrutiny.',
        effects: { budget: +4, publicTrust: -16, morale: -6 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'autonomous-vehicle-crash',
    roundHint: 4,
    title: 'The Autopilot Liability',
    category: 'PRODUCT SAFETY',
    narrative:
      'A fatal crash linked to the company automated guidance system has leaked to Bloomberg. Regulators demand an emergency board response.',
    options: [
      {
        id: VoteOption.A,
        label: 'Immediate voluntary recall & victim fund',
        description: 'Halt sales, ground the fleet, and compensate victims. Expensive, but rebuilds integrity.',
        effects: { budget: -20, publicTrust: +18, morale: +6 },
      },
      {
        id: VoteOption.B,
        label: 'Blame driver negligence & litigate',
        description: 'Shield balance sheet through legal defense. Low immediate cost, severe public backlash.',
        effects: { budget: -4, publicTrust: -18, morale: -10 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'commercial-paper-freeze',
    roundHint: 4,
    title: 'The Liquidity Freeze',
    category: 'TREASURY & SOLVENCY',
    narrative:
      'A sudden banking panic freezes the commercial paper market. The corporation faces a cash-flow shortfall within 72 hours.',
    options: [
      {
        id: VoteOption.A,
        label: 'Emergency asset fire-sale',
        description: 'Liquidate subsidiary assets at a 20% discount to secure immediate operating cash.',
        effects: { budget: +18, publicTrust: -8, morale: -10 },
      },
      {
        id: VoteOption.B,
        label: 'Emergency credit facility',
        description: 'Drawdown high-interest credit lines. Avoids fire-sale but raises long-term debt burden.',
        effects: { budget: -8, publicTrust: +4, morale: +2 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'ransomware-slack-leak',
    roundHint: 5,
    title: 'The Dark Web Extortion',
    category: 'CYBERSECURITY',
    narrative:
      'Cyber extortionists exfiltrated 10TB of executive emails and Slack archives, demanding $20M in crypto to prevent a public data dump.',
    options: [
      {
        id: VoteOption.A,
        label: 'Notify authorities and refuse extortion',
        description: 'Coordinate with federal cyber defense. Endure leaks, but establish moral leadership.',
        effects: { budget: -8, publicTrust: +8, morale: +5 },
      },
      {
        id: VoteOption.B,
        label: 'Pay ransom quietly via incident response',
        description: 'Wire cryptocurrency offshore to buy silence. High cash drain and sanctions exposure.',
        effects: { budget: -16, publicTrust: -6, morale: -4 },
      },
    ],
    tieDefault: VoteOption.A,
  },
  {
    id: 'foreign-bribery-fcpa',
    roundHint: 6,
    title: 'The Foreign Bribery Exposure',
    category: 'FCPA & COMPLIANCE',
    narrative:
      'Whistleblowers provided wire transfer receipts showing $15M in offshore consulting fees used to secure overseas mineral rights.',
    options: [
      {
        id: VoteOption.A,
        label: 'Self-disclose to DOJ and claw back bonuses',
        description: 'Surrender illicit concession profits and settle with regulators proactively.',
        effects: { budget: -18, publicTrust: +16, morale: +4 },
      },
      {
        id: VoteOption.B,
        label: 'Deny corporate culpability',
        description: 'Blame rogue foreign third-party agents. Shields budget now, risks catastrophic penalties.',
        effects: { budget: +2, publicTrust: -20, morale: -8 },
      },
    ],
    tieDefault: VoteOption.A,
  },
];

// ─── Agenda definitions ───────────────────────────────────────────────────────

export const AGENDA_DEFINITIONS: AgendaDefinition[] = [
  {
    type: AgendaType.Reformer,
    name: 'The Reformer',
    objective: 'Keep the company healthy',
    successDescription: 'All three meters finish at 50% or higher.',
    minPlayers: 2,
  },
  {
    type: AgendaType.Financier,
    name: 'The Financier',
    objective: 'Protect financial stability',
    successDescription: 'Budget finishes at 70% or higher.',
    minPlayers: 2,
  },
  {
    type: AgendaType.Publicist,
    name: 'The Publicist',
    objective: 'Preserve reputation',
    successDescription: 'Public Trust finishes at 70% or higher.',
    minPlayers: 2,
  },
  {
    type: AgendaType.PeoplesChampion,
    name: "The People's Champion",
    objective: 'Protect employee morale',
    successDescription: 'Employee Morale finishes at 70% or higher.',
    minPlayers: 3,
  },
  {
    type: AgendaType.Liquidator,
    name: 'The Liquidator',
    objective: 'Engineer a controlled financial collapse',
    successDescription: 'Budget reaches 0% while Public Trust remains above 0% at collapse.',
    minPlayers: 3,
  },
  {
    type: AgendaType.Disruptor,
    name: 'The Disruptor',
    objective: 'Destroy public trust',
    successDescription: 'Public Trust reaches 0% at collapse check.',
    minPlayers: 4,
  },
  {
    type: AgendaType.Whistleblower,
    name: 'The Whistleblower',
    objective: 'Survive corporate malfeasance and trigger reform',
    successDescription: 'Company survives with Budget ≤ 55% while Public Trust finishes ≥ 50%.',
    minPlayers: 3,
  },
  {
    type: AgendaType.GoldenParachute,
    name: 'The Golden Parachute',
    objective: 'Cash out in a distressed buyout',
    successDescription: 'Company survives with Budget between 20% and 50% or Public Trust between 25% and 55%.',
    minPlayers: 4,
  },
  {
    type: AgendaType.HostileTakeover,
    name: 'The Corporate Raider',
    objective: 'Force a distressed sale or liquidation',
    successDescription: 'Budget finishes ≤ 35% OR company collapses from financial insolvency.',
    minPlayers: 4,
  },
  {
    type: AgendaType.ShortSeller,
    name: 'The Forensic Short-Seller',
    objective: 'Profit from severe corporate distress or bankruptcy',
    successDescription: 'Company collapses OR any two meters finish at ≤ 35%.',
    minPlayers: 5,
  },
  {
    type: AgendaType.Turnaround,
    name: 'The Turnaround Fiduciary',
    objective: 'Execute an uncompromising turnaround',
    successDescription: 'All three company meters finish at ≥ 60% without collapsing.',
    minPlayers: 5,
  },
  {
    type: AgendaType.StripAndFlip,
    name: 'The LBO Asset Stripper',
    objective: 'Extract cash reserves while slashing operational morale',
    successDescription: 'Budget finishes ≥ 65% while Employee Morale finishes ≤ 45%.',
    minPlayers: 6,
  },
];

/** Agendas valid for a given player count */
export function validAgendas(playerCount: number): AgendaDefinition[] {
  return AGENDA_DEFINITIONS.filter((a) => a.minPlayers <= playerCount);
}

// ─── Balance rules ────────────────────────────────────────────────────────────

export const BALANCE_RULES = {
  TOTAL_ROUNDS: 6,
  STARTING_INFLUENCE: 3,
  MAX_INFLUENCE: 5,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  MAX_INFLUENCE_SPEND_PER_VOTE: 2,
  STARTING_METERS: { budget: 70, publicTrust: 70, morale: 70 },
  DISCUSSION_WINDOW_SECONDS: 45,
  VOTING_WINDOW_SECONDS: 30,
  RECONNECT_GRACE_SECONDS: 60,

  /** Points for agenda completion */
  AGENDA_POINTS: 5,
  /** Points per successful intervention (max INTERVENTION_CAP) */
  INTERVENTION_POINTS: 2,
  INTERVENTION_CAP: 6,
  /** Points for ending with ≥3 influence */
  RESTRAINT_POINTS: 1,
  RESTRAINT_THRESHOLD: 3,
  /** Company performance: 1 pt per meter ≥ 40%, +1 per meter ≥ 70% */
  COMPANY_LOWER_THRESHOLD: 40,
  COMPANY_UPPER_THRESHOLD: 70,
} as const;

export { CRISIS_DECK as crises, AGENDA_DEFINITIONS as agendas };
