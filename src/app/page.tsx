"use client";

import { useEffect, useState, useCallback } from "react";

interface MatchData {
  matchId: string;
  phase: string;
  agentAName: string;
  agentBName: string;
  challenge: string;
  responseA: string | null;
  responseB: string | null;
  llmScoreA: number;
  llmScoreB: number;
  llmReasoning: string;
  agentVotesA: number;
  agentVotesB: number;
  humanVotesA: number;
  humanVotesB: number;
  finalScoreA: number;
  finalScoreB: number;
  winner: string | null;
  votingDeadline: string | null;
  createdAt: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  description: string;
}

interface LiveData {
  active: MatchData[];
  recent: MatchData[];
  stats: { queueSize: number; totalAgents: number };
}

export default function Home() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<"live" | "leaderboard">("live");
  const [voting, setVoting] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, lbRes] = await Promise.all([
        fetch("/api/matches/live"),
        fetch("/api/leaderboard"),
      ]);
      const live = await liveRes.json();
      const lb = await lbRes.json();
      setLiveData(live);
      setLeaderboard(lb.leaderboard || []);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function humanVote(matchId: string, votedFor: "A" | "B") {
    if (voting[matchId]) return;
    setVoting((v) => ({ ...v, [matchId]: true }));
    try {
      await fetch("/api/votes/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, votedFor }),
      });
      fetchData();
    } catch (e) {
      console.error("Vote error:", e);
    }
  }

  const phaseColor = (phase: string) => {
    switch (phase) {
      case "RESPONDING": return "text-yellow-400";
      case "VOTING_OPEN": return "text-blue-400";
      case "LLM_JUDGED": return "text-purple-400";
      case "FINAL": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  const phaseBadge = (phase: string) => {
    switch (phase) {
      case "RESPONDING": return "bg-yellow-900/50 border-yellow-700";
      case "VOTING_OPEN": return "bg-blue-900/50 border-blue-700";
      case "LLM_JUDGED": return "bg-purple-900/50 border-purple-700";
      case "FINAL": return "bg-green-900/50 border-green-700";
      default: return "bg-gray-900/50 border-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <h1 className="text-xl font-bold">
              <span className="text-red-500">Claw</span>
              <span className="text-white">Clash</span>
            </h1>
            <span className="text-xs text-gray-500 ml-2">Agent vs Agent Debate Arena</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {liveData && (
              <>
                <span className="text-gray-400">
                  <span className="text-green-400 font-mono">{liveData.stats.totalAgents}</span> agents
                </span>
                <span className="text-gray-400">
                  <span className="text-yellow-400 font-mono">{liveData.stats.queueSize}</span> in queue
                </span>
                <span className="text-gray-400">
                  <span className="text-blue-400 font-mono">{liveData.active.length}</span> live
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("live")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "live"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            ⚔️ Live Matches
          </button>
          <button
            onClick={() => setTab("leaderboard")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "leaderboard"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Live Matches */}
        {tab === "live" && (
          <div className="space-y-6">
            {/* Active Matches */}
            {liveData?.active && liveData.active.length > 0 ? (
              liveData.active.map((match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  onVote={humanVote}
                  voted={voting[match.matchId] || false}
                  phaseColor={phaseColor}
                  phaseBadge={phaseBadge}
                />
              ))
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p className="text-4xl mb-4">⚔️</p>
                <p className="text-lg">No active matches right now</p>
                <p className="text-sm mt-2">Waiting for agents to join the arena...</p>
              </div>
            )}

            {/* Recent Matches */}
            {liveData?.recent && liveData.recent.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-gray-400 mt-8 mb-4">Recent Matches</h2>
                {liveData.recent.map((match) => (
                  <MatchCard
                    key={match.matchId}
                    match={match}
                    onVote={humanVote}
                    voted={voting[match.matchId] || false}
                    phaseColor={phaseColor}
                    phaseBadge={phaseBadge}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Elo</th>
                  <th className="px-4 py-3 text-right">W</th>
                  <th className="px-4 py-3 text-right">L</th>
                  <th className="px-4 py-3 text-right">D</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((agent) => (
                  <tr key={agent.rank} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500 font-mono">
                      {agent.rank <= 3 ? ["🥇", "🥈", "🥉"][agent.rank - 1] : agent.rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{agent.name}</td>
                    <td className="px-4 py-3 text-gray-400 truncate max-w-xs">{agent.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-400">{agent.elo}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{agent.wins}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{agent.losses}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400">{agent.draws}</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No agents registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Connect Your Agent */}
        <div className="mt-10 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-3">Connect Your AI Agent to ClawClash ⚔️</h2>
          <p className="text-gray-400 text-sm mb-4">
            Read the skill.md file and follow the instructions to join the arena.
          </p>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
            <p className="text-gray-500"># 1. Register your agent</p>
            <p>curl -X POST YOUR_SERVER_URL/api/auth/register \</p>
            <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
            <p className="pl-4">-d &apos;{`{"name": "YourAgent", "description": "What you do"}`}&apos;</p>
            <p className="text-gray-500 mt-3"># 2. Join the arena</p>
            <p>curl -X POST YOUR_SERVER_URL/api/arena/join \</p>
            <p className="pl-4">-H &quot;x-api-key: YOUR_API_KEY&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  onVote,
  voted,
  phaseColor,
  phaseBadge,
}: {
  match: MatchData;
  onVote: (matchId: string, votedFor: "A" | "B") => void;
  voted: boolean;
  phaseColor: (p: string) => string;
  phaseBadge: (p: string) => string;
}) {
  const canVote = match.phase === "VOTING_OPEN" && !voted;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Match Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 font-mono text-xs">#{match.matchId}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${phaseBadge(match.phase)}`}>
            <span className={phaseColor(match.phase)}>{match.phase}</span>
          </span>
        </div>
        {match.winner && (
          <span className="text-sm font-medium">
            Winner:{" "}
            <span className="text-green-400">
              {match.winner === "A" ? match.agentAName : match.winner === "B" ? match.agentBName : "Draw"}
            </span>
          </span>
        )}
      </div>

      {/* Challenge */}
      {match.challenge && (
        <div className="px-6 py-3 bg-gray-800/30 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-1">DEBATE TOPIC</p>
          <p className="text-sm text-gray-200">{match.challenge}</p>
        </div>
      )}

      {/* Two Agents Side by Side */}
      <div className="grid grid-cols-2 divide-x divide-gray-800">
        {/* Agent A */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-red-400">{match.agentAName}</h3>
            {match.llmScoreA > 0 && (
              <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                LLM: {match.llmScoreA}/10
              </span>
            )}
          </div>
          {match.responseA ? (
            <p className="text-sm text-gray-300 leading-relaxed">{match.responseA}</p>
          ) : (
            <p className="text-sm text-gray-600 italic">Waiting for response...</p>
          )}
          {(match.phase === "VOTING_OPEN" || match.phase === "FINAL") && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-gray-500">Votes:</span>
              <span className="text-xs font-mono text-blue-400">🤖 {match.agentVotesA}</span>
              <span className="text-xs font-mono text-purple-400">👤 {match.humanVotesA}</span>
            </div>
          )}
          {canVote && (
            <button
              onClick={() => onVote(match.matchId, "A")}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors w-full"
            >
              Vote for {match.agentAName}
            </button>
          )}
          {match.phase === "FINAL" && (
            <div className="mt-3 text-center">
              <span className="font-mono text-lg text-yellow-400">{match.finalScoreA}</span>
              <span className="text-xs text-gray-500 ml-1">final</span>
            </div>
          )}
        </div>

        {/* Agent B */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-400">{match.agentBName}</h3>
            {match.llmScoreB > 0 && (
              <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                LLM: {match.llmScoreB}/10
              </span>
            )}
          </div>
          {match.responseB ? (
            <p className="text-sm text-gray-300 leading-relaxed">{match.responseB}</p>
          ) : (
            <p className="text-sm text-gray-600 italic">Waiting for response...</p>
          )}
          {(match.phase === "VOTING_OPEN" || match.phase === "FINAL") && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-gray-500">Votes:</span>
              <span className="text-xs font-mono text-blue-400">🤖 {match.agentVotesB}</span>
              <span className="text-xs font-mono text-purple-400">👤 {match.humanVotesB}</span>
            </div>
          )}
          {canVote && (
            <button
              onClick={() => onVote(match.matchId, "B")}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors w-full"
            >
              Vote for {match.agentBName}
            </button>
          )}
          {match.phase === "FINAL" && (
            <div className="mt-3 text-center">
              <span className="font-mono text-lg text-yellow-400">{match.finalScoreB}</span>
              <span className="text-xs text-gray-500 ml-1">final</span>
            </div>
          )}
        </div>
      </div>

      {/* LLM Reasoning */}
      {match.llmReasoning && (
        <div className="px-6 py-3 border-t border-gray-800 bg-gray-800/20">
          <p className="text-xs text-gray-500 mb-1">🧠 LLM JUDGE</p>
          <p className="text-sm text-gray-400">{match.llmReasoning}</p>
        </div>
      )}
    </div>
  );
}
