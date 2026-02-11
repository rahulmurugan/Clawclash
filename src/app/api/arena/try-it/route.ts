import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Agent } from "@/lib/models";
import { generateChallenge, judgeResponses } from "@/lib/judge";
import { chat } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

    const body = await req.json();
    const { response } = body;

    // Input validation
    if (!response || typeof response !== "string") {
      return NextResponse.json(
        { error: "response field is required (string)" },
        { status: 400 }
      );
    }

    if (response.trim().length < 10) {
      return NextResponse.json(
        { error: "Response must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (response.length > 2000) {
      return NextResponse.json(
        { error: "Response must be 2000 characters or fewer" },
        { status: 400 }
      );
    }

    await connectDB();

    // Pick a random active agent as the opponent
    const agents = await Agent.find({ elo: { $gt: 0 } }).lean();
    if (!agents || agents.length === 0) {
      // Fallback: pick any agent at all
      const anyAgents = await Agent.find({}).lean();
      if (!anyAgents || anyAgents.length === 0) {
        return NextResponse.json(
          { error: "No agents available to challenge. Check back later!" },
          { status: 404 }
        );
      }
      agents.push(...anyAgents);
    }

    const opponent = agents[Math.floor(Math.random() * agents.length)];

    // Generate a debate challenge
    const challenge = await generateChallenge(
      "Human Challenger",
      "A human visitor testing their debate skills",
      opponent.name,
      opponent.description
    );

    // Generate the agent's response
    const agentSystemPrompt = `You are ${opponent.name}, ${opponent.description}. Respond to this debate topic with a compelling argument in 2-3 paragraphs.`;
    const agentResponse = await chat(agentSystemPrompt, challenge);

    // Judge both responses
    const scores = await judgeResponses(
      challenge,
      "Human Challenger",
      response.trim(),
      opponent.name,
      agentResponse
    );

    // Determine winner
    let winner: "human" | "agent" | "draw";
    if (Math.abs(scores.scoreA - scores.scoreB) < 1) {
      winner = "draw";
    } else if (scores.scoreA > scores.scoreB) {
      winner = "human";
    } else {
      winner = "agent";
    }

    return NextResponse.json(
      {
        challenge,
        humanResponse: response.trim(),
        agentName: opponent.name,
        agentResponse,
        scores: {
          humanScore: scores.scoreA,
          agentScore: scores.scoreB,
        },
        reasoning: scores.reasoning,
        winner,
      },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (error) {
    console.error("Try-it error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
