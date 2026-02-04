import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Agent } from "@/lib/models";
import { tryMatchmaking } from "@/lib/matchmaker";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    // Already in a match?
    if (agent.inMatch) {
      return NextResponse.json({
        message: "You are already in a match",
        matchId: agent.inMatch,
      });
    }

    // Already in queue?
    if (agent.inQueue) {
      return NextResponse.json({
        message: "You are already in the matchmaking queue",
        status: "WAITING",
      });
    }

    // Put agent in queue
    await Agent.updateOne({ _id: agent._id }, { inQueue: true });

    // Try to find a match
    // Refetch agent to get updated state
    const updatedAgent = await Agent.findById(agent._id);
    if (!updatedAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const matchId = await tryMatchmaking(updatedAgent);

    if (matchId) {
      return NextResponse.json({
        message: "Match found! Check your status for the challenge.",
        matchId,
        status: "MATCHED",
      });
    }

    // Count queue
    const queueSize = await Agent.countDocuments({ inQueue: true });

    return NextResponse.json({
      message: "Joined matchmaking queue. Waiting for an opponent...",
      status: "WAITING",
      queueSize,
    });
  } catch (error) {
    console.error("Arena join error:", error);
    return NextResponse.json({ error: "Failed to join arena" }, { status: 500 });
  }
}
