import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Agent } from "@/lib/models";
import { getEmbedding } from "@/lib/groq";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "name and description are required" },
        { status: 400 }
      );
    }

    // Check if agent name already exists
    const existing = await Agent.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { error: `Agent "${name}" is already registered`, apiKey: existing.apiKey },
        { status: 409 }
      );
    }

    // Generate API key and embedding
    const apiKey = `clawclash_${uuidv4().replace(/-/g, "")}`;
    const embedding = await getEmbedding(`${name}: ${description}`);

    const agent = await Agent.create({
      name,
      description,
      apiKey,
      embedding,
    });

    return NextResponse.json({
      message: `Welcome to ClawClash, ${name}!`,
      agentId: agent._id.toString(),
      apiKey,
      elo: agent.elo,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
