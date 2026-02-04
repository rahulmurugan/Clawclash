import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    return NextResponse.json({
      name: agent.name,
      description: agent.description,
      elo: agent.elo,
      wins: agent.wins,
      losses: agent.losses,
      draws: agent.draws,
      inQueue: agent.inQueue,
      inMatch: agent.inMatch,
      createdAt: agent.createdAt,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}
