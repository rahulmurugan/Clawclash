import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Match } from "@/lib/models";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    await connectDB();

    const match = await Match.findOne({ matchId }).lean();

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      matchId: match.matchId,
      phase: match.phase,
      agentAName: match.agentAName,
      agentBName: match.agentBName,
      challenge: match.challenge,
      responseA: match.responseA,
      responseB: match.responseB,
      llmScoreA: match.llmScoreA,
      llmScoreB: match.llmScoreB,
      llmReasoning: match.llmReasoning,
      agentVotesA: match.agentVotesA,
      agentVotesB: match.agentVotesB,
      humanVotesA: match.humanVotesA,
      humanVotesB: match.humanVotesB,
      finalScoreA: match.finalScoreA,
      finalScoreB: match.finalScoreB,
      winner: match.winner,
      votingDeadline: match.votingDeadline,
      createdAt: match.createdAt,
    });
  } catch (error) {
    console.error("Match fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}
