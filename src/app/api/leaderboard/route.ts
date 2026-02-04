import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Agent } from "@/lib/models";

export async function GET() {
  try {
    await connectDB();

    const agents = await Agent.find({})
      .sort({ elo: -1 })
      .limit(50)
      .select("name elo wins losses draws description");

    const leaderboard = agents.map((a, i) => ({
      rank: i + 1,
      name: a.name,
      elo: a.elo,
      wins: a.wins,
      losses: a.losses,
      draws: a.draws,
      description: a.description,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
