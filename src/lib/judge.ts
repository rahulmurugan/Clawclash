import { chat } from "./groq";
import { Match } from "./models";

export async function generateChallenge(
  nameA: string,
  descA: string,
  nameB: string,
  descB: string
): Promise<string> {
  const prompt = `You are a debate moderator for an AI agent arena.

Two agents are about to debate:
- Agent A: "${nameA}" — ${descA}
- Agent B: "${nameB}" — ${descB}

Generate a single debate topic/question that:
1. Is relevant to BOTH agents' areas of expertise
2. Has no objectively correct answer (opinion/strategy based)
3. Is specific enough to generate interesting arguments
4. Is 1-2 sentences max

Return ONLY the debate topic, nothing else.`;

  try {
    return await chat("You are a debate moderator.", prompt);
  } catch (error) {
    console.error("Challenge generation failed:", error);
    return "Which approach leads to better outcomes: prioritizing innovation speed or long-term reliability?";
  }
}

export async function judgeResponses(
  challenge: string,
  nameA: string,
  responseA: string,
  nameB: string,
  responseB: string
): Promise<{ scoreA: number; scoreB: number; reasoning: string }> {
  const prompt = `You are a fair and impartial judge in an AI agent debate arena.

DEBATE TOPIC: "${challenge}"

AGENT A ("${nameA}") RESPONSE:
${responseA}

AGENT B ("${nameB}") RESPONSE:
${responseB}

Score each agent from 0-10 on:
- Reasoning quality (how logical and well-structured)
- Creativity (unique insights or approaches)
- Relevance (how well they address the topic)

Respond in this EXACT JSON format only:
{"scoreA": <number 0-10>, "scoreB": <number 0-10>, "reasoning": "<1-2 sentence explanation>"}`;

  try {
    const result = await chat("You are an impartial debate judge. Respond ONLY in valid JSON.", prompt);
    const parsed = JSON.parse(result);
    return {
      scoreA: Math.min(10, Math.max(0, Number(parsed.scoreA) || 5)),
      scoreB: Math.min(10, Math.max(0, Number(parsed.scoreB) || 5)),
      reasoning: parsed.reasoning || "Judging complete.",
    };
  } catch (error) {
    console.error("Judge scoring failed:", error);
    return { scoreA: 5, scoreB: 5, reasoning: "Judging encountered an error; default scores applied." };
  }
}

export async function finalizeMatch(matchId: string): Promise<void> {
  const match = await Match.findOne({ matchId });
  if (!match || match.phase === "FINAL") return;

  // Normalize scores to 0-1 range
  const llmA = match.llmScoreA / 10;
  const llmB = match.llmScoreB / 10;

  const totalAgentVotes = match.agentVotesA + match.agentVotesB;
  const agentA = totalAgentVotes > 0 ? match.agentVotesA / totalAgentVotes : 0.5;
  const agentB = totalAgentVotes > 0 ? match.agentVotesB / totalAgentVotes : 0.5;

  const totalHumanVotes = match.humanVotesA + match.humanVotesB;
  const humanA = totalHumanVotes > 0 ? match.humanVotesA / totalHumanVotes : 0.5;
  const humanB = totalHumanVotes > 0 ? match.humanVotesB / totalHumanVotes : 0.5;

  // Combined: LLM 40% + Agent 30% + Human 30%
  const finalA = llmA * 0.4 + agentA * 0.3 + humanA * 0.3;
  const finalB = llmB * 0.4 + agentB * 0.3 + humanB * 0.3;

  let winner: "A" | "B" | "DRAW";
  if (Math.abs(finalA - finalB) < 0.02) {
    winner = "DRAW";
  } else {
    winner = finalA > finalB ? "A" : "B";
  }

  match.finalScoreA = Math.round(finalA * 100) / 100;
  match.finalScoreB = Math.round(finalB * 100) / 100;
  match.winner = winner;
  match.phase = "FINAL";
  await match.save();
}
