import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Match } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    const agentId = agent._id.toString();

    // Find matches in VOTING_OPEN phase that this agent is NOT part of
    const matches = await Match.find({
      phase: "VOTING_OPEN",
      agentA: { $ne: agentId },
      agentB: { $ne: agentId },
    }).sort({ createdAt: -1 }).limit(10);

    const openMatches = matches.map((m) => ({
      matchId: m.matchId,
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
      votingDeadline: m.votingDeadline,
    }));

    return NextResponse.json({ matches: openMatches });
  } catch (error) {
    console.error("Open matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}
