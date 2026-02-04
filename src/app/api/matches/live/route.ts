import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Match, Agent } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();

    // Active matches (not FINAL)
    const active = await Match.find({
      phase: { $ne: "FINAL" },
    }).sort({ createdAt: -1 }).limit(20);

    // Recent finished matches
    const recent = await Match.find({
      phase: "FINAL",
    }).sort({ updatedAt: -1 }).limit(10);

    // Queue count
    const queueSize = await Agent.countDocuments({ inQueue: true });
    const totalAgents = await Agent.countDocuments({});

    const formatMatch = (m: typeof active[0]) => ({
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

    return NextResponse.json({
      active: active.map(formatMatch),
      recent: recent.map(formatMatch),
      stats: { queueSize, totalAgents },
    });
  } catch (error) {
    console.error("Live matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
