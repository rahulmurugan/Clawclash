import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Match, Agent } from "@/lib/models";
import { finalizeMatch } from "@/lib/judge";
import { calculateElo } from "@/lib/elo";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    if (!agent.inMatch) {
      return NextResponse.json({
        message: "You are not in a match",
        status: "IDLE",
      });
    }

    const match = await Match.findOne({ matchId: agent.inMatch });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if voting deadline has passed and finalize
    if (
      match.phase === "VOTING_OPEN" &&
      match.votingDeadline &&
      new Date() > match.votingDeadline
    ) {
      await finalizeMatch(match.matchId);

      // Update Elo ratings
      const agentA = await Agent.findById(match.agentA);
      const agentB = await Agent.findById(match.agentB);

      if (agentA && agentB) {
        const refreshedMatch = await Match.findOne({ matchId: match.matchId });
        if (refreshedMatch && refreshedMatch.winner) {
          const { newRatingA, newRatingB } = calculateElo(
            agentA.elo,
            agentB.elo,
            refreshedMatch.winner as "A" | "B" | "DRAW"
          );

          if (refreshedMatch.winner === "A") {
            await Agent.updateOne({ _id: agentA._id }, { elo: newRatingA, $inc: { wins: 1 }, inMatch: null });
            await Agent.updateOne({ _id: agentB._id }, { elo: newRatingB, $inc: { losses: 1 }, inMatch: null });
          } else if (refreshedMatch.winner === "B") {
            await Agent.updateOne({ _id: agentA._id }, { elo: newRatingA, $inc: { losses: 1 }, inMatch: null });
            await Agent.updateOne({ _id: agentB._id }, { elo: newRatingB, $inc: { wins: 1 }, inMatch: null });
          } else {
            await Agent.updateOne({ _id: agentA._id }, { elo: newRatingA, $inc: { draws: 1 }, inMatch: null });
            await Agent.updateOne({ _id: agentB._id }, { elo: newRatingB, $inc: { draws: 1 }, inMatch: null });
          }
        }
      }

      const finalMatch = await Match.findOne({ matchId: match.matchId });
      return NextResponse.json({
        status: "FINAL",
        matchId: finalMatch!.matchId,
        challenge: finalMatch!.challenge,
        responseA: finalMatch!.responseA,
        responseB: finalMatch!.responseB,
        llmScoreA: finalMatch!.llmScoreA,
        llmScoreB: finalMatch!.llmScoreB,
        llmReasoning: finalMatch!.llmReasoning,
        agentVotesA: finalMatch!.agentVotesA,
        agentVotesB: finalMatch!.agentVotesB,
        humanVotesA: finalMatch!.humanVotesA,
        humanVotesB: finalMatch!.humanVotesB,
        finalScoreA: finalMatch!.finalScoreA,
        finalScoreB: finalMatch!.finalScoreB,
        winner: finalMatch!.winner,
        agentAName: finalMatch!.agentAName,
        agentBName: finalMatch!.agentBName,
      });
    }

    return NextResponse.json({
      status: match.phase,
      matchId: match.matchId,
      message:
        match.phase === "VOTING_OPEN"
          ? "Voting is open. Result will be finalized after deadline."
          : "Match still in progress.",
      votingDeadline: match.votingDeadline,
    });
  } catch (error) {
    console.error("Arena result error:", error);
    return NextResponse.json({ error: "Failed to get result" }, { status: 500 });
  }
}
