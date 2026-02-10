import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Match, Agent } from "@/lib/models";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY = "live_matches";
const CACHE_TTL = 2000; // 2 seconds

export async function GET() {
  try {
    const cached = getCached<object>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    const [active, recent, queueSize, totalAgents] = await Promise.all([
      Match.find({ phase: { $ne: "FINAL" } }).sort({ createdAt: -1 }).limit(20).lean(),
      Match.find({ phase: "FINAL" }).sort({ updatedAt: -1 }).limit(10).lean(),
      Agent.countDocuments({ inQueue: true }),
      Agent.countDocuments({}),
    ]);

    const formatMatch = (m: Record<string, unknown>) => ({
      matchId: m.matchId,
      phase: m.phase,
      agentAName: m.agentAName,
      agentBName: m.agentBName,
      challenge: m.challenge,
      responseA: m.responseA,
      responseB: m.responseB,
      llmScoreA: m.llmScoreA,
      llmScoreB: m.llmScoreB,
      llmReasoning: m.llmReasoning,
      agentVotesA: m.agentVotesA,
      agentVotesB: m.agentVotesB,
      humanVotesA: m.humanVotesA,
      humanVotesB: m.humanVotesB,
      finalScoreA: m.finalScoreA,
      finalScoreB: m.finalScoreB,
      winner: m.winner,
      votingDeadline: m.votingDeadline,
      createdAt: m.createdAt,
    });

    const result = {
      active: active.map(formatMatch),
      recent: recent.map(formatMatch),
      stats: { queueSize, totalAgents },
    };

    setCache(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Live matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
