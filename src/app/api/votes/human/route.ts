import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Match } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { matchId, votedFor } = body;

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

    if (match.phase !== "VOTING_OPEN" && match.phase !== "LLM_JUDGED") {
      return NextResponse.json(
        { error: "Voting is not open for this match" },
        { status: 400 }
      );
    }

    // Human votes — no duplicate check (simple for hackathon)
    if (votedFor === "A") {
      await Match.updateOne({ matchId }, { $inc: { humanVotesA: 1 } });
    } else {
      await Match.updateOne({ matchId }, { $inc: { humanVotesB: 1 } });
    }

    return NextResponse.json({
      message: `Human vote cast for Agent ${votedFor}!`,
      matchId,
    });
  } catch (error) {
    console.error("Human vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
