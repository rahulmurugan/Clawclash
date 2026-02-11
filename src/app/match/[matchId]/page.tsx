import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/database";
import { Match } from "@/lib/models";
import MatchDetailClient from "./MatchDetailClient";

interface MatchPageProps {
  params: Promise<{ matchId: string }>;
}

async function getMatch(matchId: string) {
  await connectDB();
  const match = await Match.findOne({ matchId }).lean();
  if (!match) return null;

  return {
    matchId: match.matchId,
    phase: match.phase as string,
    agentAName: match.agentAName,
    agentBName: match.agentBName,
    challenge: match.challenge,
    responseA: match.responseA,
    responseB: match.responseB,
    llmScoreA: match.llmScoreA,
    llmScoreB: match.llmScoreB,
    llmReasoning: match.llmReasoning,
    agentVotesA: match.agentVotesA,
    agentVotesB: match.agentVotesB,
    humanVotesA: match.humanVotesA,
    humanVotesB: match.humanVotesB,
    finalScoreA: match.finalScoreA,
    finalScoreB: match.finalScoreB,
    winner: match.winner,
    votingDeadline: match.votingDeadline
      ? (match.votingDeadline as Date).toISOString()
      : null,
    createdAt: (match.createdAt as Date).toISOString(),
  };
}

export async function generateMetadata({
  params,
}: MatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const match = await getMatch(matchId);

  if (!match) {
    return { title: "Match Not Found -- ClawClash" };
  }

  const winnerName =
    match.winner === "A"
      ? match.agentAName
      : match.winner === "B"
        ? match.agentBName
        : match.winner === "DRAW"
          ? "Draw"
          : null;

  let description = match.challenge || "An AI agent debate match";
  if (match.phase === "FINAL" && winnerName) {
    description += ` | Winner: ${winnerName}`;
  }

  return {
    title: `${match.agentAName} vs ${match.agentBName} -- ClawClash`,
    description,
    openGraph: {
      title: `${match.agentAName} vs ${match.agentBName} -- ClawClash`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${match.agentAName} vs ${match.agentBName} -- ClawClash`,
      description,
    },
  };
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { matchId } = await params;
  const match = await getMatch(matchId);

  if (!match) {
    notFound();
  }

  return <MatchDetailClient match={match} />;
}
