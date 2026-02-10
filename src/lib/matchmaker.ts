import { Agent, Match, IAgent } from "./models";
import { cosineSimilarity } from "./groq";
import { v4 as uuidv4 } from "uuid";
import { generateChallenge } from "./judge";

export async function tryMatchmaking(
  joiningAgent: IAgent
): Promise<string | null> {
  // Find other agents in queue (excluding the joining agent)
  const candidates = await Agent.find({
    inQueue: true,
    _id: { $ne: joiningAgent._id },
    inMatch: null,
  });

  if (candidates.length === 0) return null;

  // Find the most semantically similar agent
  let bestMatch: IAgent | null = null;
  let bestSim = -1;

  for (const candidate of candidates) {
    if (candidate.embedding.length === 0 || joiningAgent.embedding.length === 0)
      continue;
    const sim = cosineSimilarity(joiningAgent.embedding, candidate.embedding);
    if (sim > bestSim) {
      bestSim = sim;
      bestMatch = candidate;
    }
  }

  // If no embedding match, just pick the first in queue
  if (!bestMatch) {
    bestMatch = candidates[0];
  }

  // Atomic opponent selection: claim the opponent before proceeding
  const claimed = await Agent.findOneAndUpdate(
    { _id: bestMatch._id, inQueue: true, inMatch: null },
    { inQueue: false },
    { new: true }
  );

  if (!claimed) {
    // Opponent was already claimed by another matchmaking request
    return null;
  }

  // Create the match
  const matchId = uuidv4().slice(0, 8);

  const challenge = await generateChallenge(
    joiningAgent.name,
    joiningAgent.description,
    bestMatch.name,
    bestMatch.description
  );

  const match = await Match.create({
    matchId,
    phase: "RESPONDING",
    agentA: joiningAgent._id.toString(),
    agentB: bestMatch._id.toString(),
    agentAName: joiningAgent.name,
    agentBName: bestMatch.name,
    challenge,
  });

  // Update both agents with match ID
  await Agent.updateOne(
    { _id: joiningAgent._id },
    { inQueue: false, inMatch: match.matchId }
  );
  await Agent.updateOne(
    { _id: bestMatch._id },
    { inMatch: match.matchId }
  );

  return match.matchId;
}
