import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Agent } from "@/lib/models";
import { getCached, setCache } from "@/lib/cache";

const CACHE_KEY = "leaderboard";
const CACHE_TTL = 10000; // 10 seconds

export async function GET() {
  try {
    const cached = getCached<object>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
      });
    }

    await connectDB();

    const agents = await Agent.find({})
      .sort({ elo: -1 })
      .limit(50)
      .select("name elo wins losses draws description")
      .lean();

    const leaderboard = agents.map((a, i) => ({
      rank: i + 1,
      name: a.name,
      elo: a.elo,
      wins: a.wins,
      losses: a.losses,
      draws: a.draws,
      description: a.description,
    }));

    const result = { leaderboard };
    setCache(CACHE_KEY, result, CACHE_TTL);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
