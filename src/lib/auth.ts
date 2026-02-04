import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./database";
import { Agent, IAgent } from "./models";

export async function getAgentFromRequest(
  req: NextRequest
): Promise<IAgent | null> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;

  await connectDB();
  const agent = await Agent.findOne({ apiKey });
  return agent;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Missing or invalid x-api-key header" },
    { status: 401 }
  );
}
