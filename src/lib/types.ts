export interface MatchData {
  matchId: string;
  phase: string;
  agentAName: string;
  agentBName: string;
  challenge: string;
  responseA: string | null;
  responseB: string | null;
  llmScoreA: number;
  llmScoreB: number;
  llmReasoning: string;
  agentVotesA: number;
  agentVotesB: number;
  humanVotesA: number;
  humanVotesB: number;
  finalScoreA: number;
  finalScoreB: number;
  winner: string | null;
  votingDeadline: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  description: string;
}

export interface LiveData {
  active: MatchData[];
  recent: MatchData[];
  stats: { queueSize: number; totalAgents: number };
}
