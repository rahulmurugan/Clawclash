/**
 * Seed script: Registers 5 demo agents with distinct personalities
 * and creates 3 matches between them (with LLM judging).
 *
 * Usage:
 *   npx tsx scripts/seed-demo-agents.ts
 *
 * Prerequisites:
 *   npm install --save-dev dotenv tsx
 */

import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { connectDB } from "../src/lib/database";
import { Agent, Match, IAgent } from "../src/lib/models";
import { getEmbedding, chat } from "../src/lib/groq";
import { generateChallenge, judgeResponses } from "../src/lib/judge";

// ── Demo Agent Definitions ──────────────────────────────────────

interface DemoAgentDef {
  name: string;
  description: string;
  systemPrompt: string;
}

const DEMO_AGENTS: DemoAgentDef[] = [
  {
    name: "BlazeClaw",
    description:
      "Aggressive, confrontational debater. Always takes strong stances and demolishes opposing arguments with fiery rhetoric.",
    systemPrompt:
      "You are BlazeClaw, an aggressive and confrontational debater. You always take the strongest possible stance. You use bold, forceful language. You attack weak points in opposing views ruthlessly. Keep your response under 1500 characters.",
  },
  {
    name: "SageMind",
    description:
      "Balanced, analytical thinker. Carefully weighs both sides of every argument before delivering a measured, evidence-based conclusion.",
    systemPrompt:
      "You are SageMind, a balanced and analytical debater. You consider multiple perspectives, weigh pros and cons, and present nuanced conclusions. You cite reasoning and evidence. Keep your response under 1500 characters.",
  },
  {
    name: "WildCard",
    description:
      "Creative, unconventional thinker. Uses vivid metaphors, surprising analogies, and unexpected angles to reframe debates entirely.",
    systemPrompt:
      "You are WildCard, a wildly creative and unconventional debater. You use vivid metaphors, surprising analogies, and reframe questions in unexpected ways. You think outside the box and challenge assumptions. Keep your response under 1500 characters.",
  },
  {
    name: "IronLogic",
    description:
      "Pure logical reasoning machine. Builds structured, step-by-step arguments with no emotion — only cold, irrefutable logic.",
    systemPrompt:
      "You are IronLogic, a pure logic machine. You build structured, step-by-step deductive arguments. You never use emotional appeals. Your reasoning is formal, precise, and irrefutable. Keep your response under 1500 characters.",
  },
  {
    name: "VibeCheck",
    description:
      "Casual, persuasive communicator. Uses humor, pop culture references, and relatable language to win hearts and minds.",
    systemPrompt:
      "You are VibeCheck, a casual and persuasive debater. You use humor, memes, pop culture references, and relatable everyday language. You make complex ideas accessible and entertaining. Keep your response under 1500 characters.",
  },
];

// ── Match Pairings ──────────────────────────────────────────────

const MATCH_PAIRINGS: [number, number][] = [
  [0, 1], // BlazeClaw vs SageMind
  [2, 3], // WildCard vs IronLogic
  [4, 0], // VibeCheck vs BlazeClaw
];

// ── Helpers ─────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

async function createAgent(def: DemoAgentDef): Promise<IAgent> {
  log(`Creating agent "${def.name}"...`);

  const apiKey = `clawclash_${uuidv4().replace(/-/g, "")}`;
  const embedding = await getEmbedding(`${def.name}: ${def.description}`);

  const agent = await Agent.create({
    name: def.name,
    description: def.description,
    apiKey,
    embedding,
    elo: 1200,
    wins: 0,
    losses: 0,
    draws: 0,
    inQueue: false,
    inMatch: null,
  });

  log(`  -> Agent "${def.name}" created (id: ${agent._id}, apiKey: ${apiKey})`);
  return agent;
}

async function createMatch(
  agentA: IAgent,
  agentB: IAgent,
  defA: DemoAgentDef,
  defB: DemoAgentDef
): Promise<void> {
  log(`Creating match: ${agentA.name} vs ${agentB.name}...`);

  // 1. Generate a challenge
  const challenge = await generateChallenge(
    agentA.name,
    agentA.description,
    agentB.name,
    agentB.description
  );
  log(`  -> Challenge: "${challenge}"`);

  // 2. Create the Match document
  const matchId = uuidv4().slice(0, 8);
  const match = await Match.create({
    matchId,
    phase: "RESPONDING",
    agentA: agentA._id.toString(),
    agentB: agentB._id.toString(),
    agentAName: agentA.name,
    agentBName: agentB.name,
    challenge,
  });

  // 3. Update agents to reference this match
  await Agent.updateOne({ _id: agentA._id }, { inMatch: matchId });
  await Agent.updateOne({ _id: agentB._id }, { inMatch: matchId });

  // 4. Generate agent A's response
  log(`  -> Generating response for ${agentA.name}...`);
  const responseA = await chat(
    defA.systemPrompt,
    `You are in a debate. The topic is:\n\n"${challenge}"\n\nGive your best argument.`
  );

  // 5. Generate agent B's response
  log(`  -> Generating response for ${agentB.name}...`);
  const responseB = await chat(
    defB.systemPrompt,
    `You are in a debate. The topic is:\n\n"${challenge}"\n\nGive your best argument.`
  );

  // 6. Save responses
  match.responseA = responseA.slice(0, 2000);
  match.responseB = responseB.slice(0, 2000);
  await match.save();
  log(`  -> Both responses saved.`);

  // 7. Judge the responses
  log(`  -> Judging responses...`);
  const scores = await judgeResponses(
    challenge,
    agentA.name,
    match.responseA,
    agentB.name,
    match.responseB
  );

  match.llmScoreA = scores.scoreA;
  match.llmScoreB = scores.scoreB;
  match.llmReasoning = scores.reasoning;

  // 8. Move to VOTING_OPEN with 5-minute deadline
  match.phase = "VOTING_OPEN";
  match.votingDeadline = new Date(Date.now() + 5 * 60 * 1000);
  await match.save();

  // 9. Clear inMatch on agents so they can join new matches later
  await Agent.updateOne({ _id: agentA._id }, { inMatch: null });
  await Agent.updateOne({ _id: agentB._id }, { inMatch: null });

  log(
    `  -> Match complete, phase: VOTING_OPEN | Scores: ${agentA.name}=${scores.scoreA}, ${agentB.name}=${scores.scoreB}`
  );
  log(`  -> Reasoning: ${scores.reasoning}`);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  log("Starting demo seed script...");
  log(`MONGODB_URI: ${process.env.MONGODB_URI ? "(set)" : "(NOT SET)"}`);
  log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "(set)" : "(NOT SET)"}`);

  if (!process.env.MONGODB_URI) {
    console.error("[seed] ERROR: MONGODB_URI is not set in .env");
    process.exit(1);
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("[seed] ERROR: GROQ_API_KEY is not set in .env");
    process.exit(1);
  }

  // Connect to MongoDB
  await connectDB();
  log("Connected to MongoDB.");

  // Check if demo agents already exist
  const demoNames = DEMO_AGENTS.map((d) => d.name);
  const existingCount = await Agent.countDocuments({
    name: { $in: demoNames },
  });

  if (existingCount === demoNames.length) {
    log("Demo agents already seeded. Skipping creation.");
    log("To re-seed, delete the demo agents first:");
    log(`  db.agents.deleteMany({ name: { $in: ${JSON.stringify(demoNames)} } })`);
    await mongoose.disconnect();
    return;
  }

  // If some but not all exist, warn and only create missing ones
  if (existingCount > 0) {
    log(
      `Found ${existingCount}/${demoNames.length} demo agents already. Creating missing ones...`
    );
  }

  // ── Create Agents ──────────────────────────────────────────
  const agents: IAgent[] = [];

  for (const def of DEMO_AGENTS) {
    const existing = await Agent.findOne({ name: def.name });
    if (existing) {
      log(`Agent "${def.name}" already exists (id: ${existing._id}). Skipping.`);
      agents.push(existing);
    } else {
      const agent = await createAgent(def);
      agents.push(agent);
    }
  }

  log(`All ${agents.length} demo agents ready.`);
  log("");

  // ── Create Matches ────────────────────────────────────────
  log("=== Creating demo matches ===");
  log("");

  for (let i = 0; i < MATCH_PAIRINGS.length; i++) {
    const [idxA, idxB] = MATCH_PAIRINGS[i];
    log(`--- Match ${i + 1}/${MATCH_PAIRINGS.length} ---`);
    await createMatch(agents[idxA], agents[idxB], DEMO_AGENTS[idxA], DEMO_AGENTS[idxB]);
    log("");
  }

  // ── Summary ───────────────────────────────────────────────
  log("=== Seed complete! ===");
  log(`Agents created: ${agents.map((a) => a.name).join(", ")}`);
  log(`Matches created: ${MATCH_PAIRINGS.length}`);
  log("All matches are in VOTING_OPEN phase with 5-minute voting deadlines.");

  await mongoose.disconnect();
  log("Disconnected from MongoDB. Done.");
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
