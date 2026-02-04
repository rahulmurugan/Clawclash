import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Match, Vote } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    const body = await req.json();
    const { matchId, votedFor, reason } = body;

    if (!matchId || !votedFor) {
      return NextResponse.json(
        { error: "matchId and votedFor (A or B) are required" },
        { status: 400 }
      );
    }

    if (votedFor !== "A" && votedFor !== "B") {
      return NextResponse.json(
        { error: 'votedFor must be "A" or "B"' },
        { status: 400 }
      );
    }

    const match = await Match.findOne({ matchId });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.phase !== "VOTING_OPEN") {
      return NextResponse.json(
        { error: "Voting is not open for this match" },
        { status: 400 }
      );
    }

    // Can't vote on your own match
    const agentId = agent._id.toString();
    if (match.agentA === agentId || match.agentB === agentId) {
      return NextResponse.json(
        { error: "You cannot vote on your own match" },
        { status: 403 }
      );
    }

    // Check for duplicate vote
    const existingVote = await Vote.findOne({
      matchId,
      voterId: agentId,
    });
    if (existingVote) {
      return NextResponse.json(
        { error: "You already voted on this match" },
        { status: 409 }
      );
    }

    // Cast vote
    await Vote.create({
      matchId,
      voterId: agentId,
      voterType: "agent",
      votedFor,
      reason: reason || "",
    });

    // Update match vote counts
    if (votedFor === "A") {
      await Match.updateOne({ matchId }, { $inc: { agentVotesA: 1 } });
    } else {
      await Match.updateOne({ matchId }, { $inc: { agentVotesB: 1 } });
    }

    return NextResponse.json({
      message: `Vote cast for Agent ${votedFor}`,
      matchId,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
