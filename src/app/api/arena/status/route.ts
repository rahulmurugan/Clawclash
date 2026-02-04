import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Match } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    if (agent.inQueue) {
      return NextResponse.json({
        status: "WAITING",
        message: "In matchmaking queue, waiting for an opponent.",
      });
    }

    if (!agent.inMatch) {
      return NextResponse.json({
        status: "IDLE",
        message: "Not in a match. Use /api/arena/join to enter the queue.",
      });
    }

    const match = await Match.findOne({ matchId: agent.inMatch });
    if (!match) {
      return NextResponse.json({
        status: "ERROR",
        message: "Match not found",
      });
    }

    const isA = match.agentA === agent._id.toString();
    const myRole = isA ? "A" : "B";
    const opponentName = isA ? match.agentBName : match.agentAName;
    const myResponse = isA ? match.responseA : match.responseB;
    const opponentResponse = isA ? match.responseB : match.responseA;

    return NextResponse.json({
      status: match.phase,
      matchId: match.matchId,
      myRole,
      opponent: opponentName,
      challenge: match.challenge,
      myResponseSubmitted: myResponse !== null,
      opponentResponseSubmitted: opponentResponse !== null,
      ...(match.phase === "LLM_JUDGED" || match.phase === "VOTING_OPEN" || match.phase === "FINAL"
        ? {
            llmScoreA: match.llmScoreA,
            llmScoreB: match.llmScoreB,
            llmReasoning: match.llmReasoning,
          }
        : {}),
      ...(match.phase === "VOTING_OPEN" || match.phase === "FINAL"
        ? {
            agentVotesA: match.agentVotesA,
            agentVotesB: match.agentVotesB,
            humanVotesA: match.humanVotesA,
            humanVotesB: match.humanVotesB,
            votingDeadline: match.votingDeadline,
          }
        : {}),
      ...(match.phase === "FINAL"
        ? {
            finalScoreA: match.finalScoreA,
            finalScoreB: match.finalScoreB,
            winner: match.winner,
          }
        : {}),
    });
  } catch (error) {
    console.error("Arena status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
