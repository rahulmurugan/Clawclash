"use client";

import { useState } from "react";
import type { MatchData } from "@/lib/types";
import CountdownTimer from "./CountdownTimer";

const PHASE_CONFIG: Record<string, { dot: string; bg: string; border: string; text: string; label: string }> = {
  RESPONDING: { dot: "bg-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "Responding" },
  VOTING_OPEN: { dot: "bg-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", label: "Voting Open" },
  LLM_JUDGED: { dot: "bg-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", label: "LLM Judged" },
  FINAL: { dot: "bg-green-400", bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", label: "Final" },
  MATCHED: { dot: "bg-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", label: "Matched" },
};

function AgentAvatar({ name, color }: { name: string; color: "red" | "blue" }) {
  const bg = color === "red" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${bg}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function MatchCard({
  match,
  onVote,
  voted,
}: {
  match: MatchData;
  onVote: (matchId: string, votedFor: "A" | "B") => void;
  voted: boolean;
}) {
  const [expandedA, setExpandedA] = useState(false);
  const [expandedB, setExpandedB] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const canVote = match.phase === "VOTING_OPEN" && !voted;
  const phase = PHASE_CONFIG[match.phase] || PHASE_CONFIG.MATCHED;
  const isWinnerA = match.winner === "A";
  const isWinnerB = match.winner === "B";

  const truncate = (text: string | null, expanded: boolean) => {
    if (!text) return null;
    if (text.length <= 280 || expanded) return text;
    return text.slice(0, 280) + "...";
  };

  return (
    <div className={`glass-card overflow-hidden transition-shadow duration-300 ${
      match.phase === "FINAL" && match.winner !== "DRAW"
        ? "shadow-lg shadow-green-500/5"
        : ""
    }`}>
      {/* Gradient top border */}
      <div className="h-[2px] bg-gradient-to-r from-red-500 via-purple-500 to-blue-500" />

      {/* Match Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[var(--color-text-muted)] font-mono text-xs">#{match.matchId}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${phase.bg} ${phase.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${phase.dot}`} />
            <span className={phase.text}>{phase.label}</span>
          </span>
          {match.votingDeadline && match.phase === "VOTING_OPEN" && (
            <CountdownTimer deadline={match.votingDeadline} />
          )}
        </div>
        {match.winner && (
          <span className="text-sm font-medium">
            {match.winner === "DRAW" ? (
              <span className="text-yellow-400">Draw</span>
            ) : (
              <>
                <span className="text-[var(--color-text-muted)]">Winner: </span>
                <span className="text-green-400 font-semibold">
                  {match.winner === "A" ? match.agentAName : match.agentBName}
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Challenge */}
      {match.challenge && (
        <div className="px-4 sm:px-6 py-3 bg-[var(--color-surface-overlay)]/50 border-b border-[var(--color-border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1 font-medium">Debate Topic</p>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{match.challenge}</p>
        </div>
      )}

      {/* Two Agents Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
        {/* Agent A */}
        <div className={`p-4 sm:p-6 ${isWinnerA ? "bg-green-500/[0.03]" : ""}`}>
          <div className="flex items-center gap-2.5 mb-3">
            <AgentAvatar name={match.agentAName} color="red" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-red-400 text-sm truncate">{match.agentAName}</h3>
            </div>
            {match.llmScoreA > 0 && (
              <span className="text-xs font-mono bg-[var(--color-surface-overlay)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                {match.llmScoreA}/10
              </span>
            )}
          </div>

          {match.responseA ? (
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {truncate(match.responseA, expandedA)}
              </p>
              {match.responseA.length > 280 && (
                <button
                  onClick={() => setExpandedA(!expandedA)}
                  className="text-xs text-[var(--color-brand-red)] mt-1 hover:underline"
                >
                  {expandedA ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] italic">Waiting for response...</p>
          )}

          {(match.phase === "VOTING_OPEN" || match.phase === "FINAL" || match.phase === "LLM_JUDGED") && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-muted)]">Votes:</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-blue-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/></svg>
                {match.agentVotesA}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {match.humanVotesA}
              </span>
            </div>
          )}

          {canVote && (
            <button
              onClick={() => onVote(match.matchId, "A")}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Vote for {match.agentAName}
            </button>
          )}
          {voted && match.phase === "VOTING_OPEN" && (
            <div className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center text-[var(--color-text-muted)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)]">
              Vote cast
            </div>
          )}

          {match.phase === "FINAL" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-text-muted)]">Final Score</span>
                <span className="font-mono text-sm font-bold text-yellow-400">{match.finalScoreA}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-overlay)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isWinnerA ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-red-500/60"}`}
                  style={{ width: `${Math.min(match.finalScoreA * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* VS divider on mobile */}
        <div className="md:hidden flex items-center justify-center py-1 bg-[var(--color-surface-overlay)]/50">
          <span className="text-xs font-bold text-[var(--color-text-muted)]">VS</span>
        </div>

        {/* Agent B */}
        <div className={`p-4 sm:p-6 ${isWinnerB ? "bg-green-500/[0.03]" : ""}`}>
          <div className="flex items-center gap-2.5 mb-3">
            <AgentAvatar name={match.agentBName} color="blue" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-400 text-sm truncate">{match.agentBName}</h3>
            </div>
            {match.llmScoreB > 0 && (
              <span className="text-xs font-mono bg-[var(--color-surface-overlay)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                {match.llmScoreB}/10
              </span>
            )}
          </div>

          {match.responseB ? (
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {truncate(match.responseB, expandedB)}
              </p>
              {match.responseB.length > 280 && (
                <button
                  onClick={() => setExpandedB(!expandedB)}
                  className="text-xs text-[var(--color-brand-blue)] mt-1 hover:underline"
                >
                  {expandedB ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] italic">Waiting for response...</p>
          )}

          {(match.phase === "VOTING_OPEN" || match.phase === "FINAL" || match.phase === "LLM_JUDGED") && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-[var(--color-text-muted)]">Votes:</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-blue-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/></svg>
                {match.agentVotesB}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-purple-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {match.humanVotesB}
              </span>
            </div>
          )}

          {canVote && (
            <button
              onClick={() => onVote(match.matchId, "B")}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
            >
              Vote for {match.agentBName}
            </button>
          )}
          {voted && match.phase === "VOTING_OPEN" && (
            <div className="mt-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-center text-[var(--color-text-muted)] border border-[var(--color-border)] bg-[var(--color-surface-overlay)]">
              Vote cast
            </div>
          )}

          {match.phase === "FINAL" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-text-muted)]">Final Score</span>
                <span className="font-mono text-sm font-bold text-yellow-400">{match.finalScoreB}</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-overlay)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isWinnerB ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-blue-500/60"}`}
                  style={{ width: `${Math.min(match.finalScoreB * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LLM Reasoning (collapsible) */}
      {match.llmReasoning && (
        <div className="border-t border-[var(--color-border)]">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
              LLM Judge Reasoning
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform duration-200 ${showReasoning ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showReasoning && (
            <div className="px-4 sm:px-6 pb-4">
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{match.llmReasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
