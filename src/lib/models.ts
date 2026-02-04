import mongoose, { Schema, Document, Model } from "mongoose";

// ── Agent ──────────────────────────────────────────────

export interface IAgent extends Document {
  name: string;
  description: string;
  apiKey: string;
  embedding: number[];
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  inQueue: boolean;
  inMatch: string | null; // match ID
  createdAt: Date;
}

const AgentSchema = new Schema<IAgent>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  apiKey: { type: String, required: true, unique: true, index: true },
  embedding: { type: [Number], default: [] },
  elo: { type: Number, default: 1200 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  inQueue: { type: Boolean, default: false },
  inMatch: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// ── Match ──────────────────────────────────────────────

export type MatchPhase =
  | "MATCHED"
  | "RESPONDING"
  | "LLM_JUDGED"
  | "VOTING_OPEN"
  | "FINAL";

export interface IMatch extends Document {
  matchId: string;
  phase: MatchPhase;
  agentA: string; // agent _id
  agentB: string;
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
  winner: string | null; // "A", "B", or "DRAW"
  votingDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    matchId: { type: String, required: true, unique: true, index: true },
    phase: { type: String, default: "MATCHED" },
    agentA: { type: String, required: true },
    agentB: { type: String, required: true },
    agentAName: { type: String, required: true },
    agentBName: { type: String, required: true },
    challenge: { type: String, default: "" },
    responseA: { type: String, default: null },
    responseB: { type: String, default: null },
    llmScoreA: { type: Number, default: 0 },
    llmScoreB: { type: Number, default: 0 },
    llmReasoning: { type: String, default: "" },
    agentVotesA: { type: Number, default: 0 },
    agentVotesB: { type: Number, default: 0 },
    humanVotesA: { type: Number, default: 0 },
    humanVotesB: { type: Number, default: 0 },
    finalScoreA: { type: Number, default: 0 },
    finalScoreB: { type: Number, default: 0 },
    winner: { type: String, default: null },
    votingDeadline: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Vote ───────────────────────────────────────────────

export interface IVote extends Document {
  matchId: string;
  voterId: string | null; // null for human votes
  voterType: "agent" | "human";
  votedFor: "A" | "B";
  reason: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>({
  matchId: { type: String, required: true, index: true },
  voterId: { type: String, default: null },
  voterType: { type: String, required: true },
  votedFor: { type: String, required: true },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// Unique: one agent can only vote once per match
VoteSchema.index({ matchId: 1, voterId: 1 }, { unique: true, sparse: true });

// ── Export Models ──────────────────────────────────────

export const Agent: Model<IAgent> =
  mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);

export const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

export const Vote: Model<IVote> =
  mongoose.models.Vote || mongoose.model<IVote>("Vote", VoteSchema);
