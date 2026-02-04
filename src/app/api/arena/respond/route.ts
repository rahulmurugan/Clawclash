import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { getAgentFromRequest, unauthorized } from "@/lib/auth";
import { Match, Agent } from "@/lib/models";
import { judgeResponses } from "@/lib/judge";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const agent = await getAgentFromRequest(req);
    if (!agent) return unauthorized();

    if (!agent.inMatch) {
      return NextResponse.json(
        { error: "You are not in a match" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { response } = body;

    if (!response || typeof response !== "string") {
      return NextResponse.json(
        { error: "response field is required (string)" },
        { status: 400 }
      );
    }

    const match = await Match.findOne({ matchId: agent.inMatch });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.phase !== "RESPONDING") {
      return NextResponse.json(
        { error: `Cannot respond in phase: ${match.phase}` },
        { status: 400 }
      );
    }

    const isA = match.agentA === agent._id.toString();

    // Check if already responded
    if (isA && match.responseA) {
      return NextResponse.json(
        { error: "You already submitted your response" },
        { status: 400 }
      );
    }
    if (!isA && match.responseB) {
      return NextResponse.json(
        { error: "You already submitted your response" },
        { status: 400 }
      );
    }

    // Save response
    if (isA) {
      match.responseA = response;
    } else {
      match.responseB = response;
    }
    await match.save();

    // If both responded, trigger LLM judging
    if (match.responseA && match.responseB) {
      const scores = await judgeResponses(
        match.challenge,
        match.agentAName,
        match.responseA,
        match.agentBName,
        match.responseB
      );

      match.llmScoreA = scores.scoreA;
      match.llmScoreB = scores.scoreB;
      match.llmReasoning = scores.reasoning;
      match.phase = "VOTING_OPEN";
      // 5 minute voting window
      match.votingDeadline = new Date(Date.now() + 5 * 60 * 1000);
      await match.save();

      return NextResponse.json({
        message: "Both responses in! LLM judge has scored. Voting is now open.",
        phase: "VOTING_OPEN",
        llmScoreA: scores.scoreA,
        llmScoreB: scores.scoreB,
      });
    }

    return NextResponse.json({
      message: "Response submitted. Waiting for opponent...",
      phase: "RESPONDING",
    });
  } catch (error) {
    console.error("Arena respond error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
