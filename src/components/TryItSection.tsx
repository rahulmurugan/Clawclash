"use client";

import { useState } from "react";

interface TryItResult {
  challenge: string;
  humanResponse: string;
  agentName: string;
  agentResponse: string;
  scores: {
    humanScore: number;
    agentScore: number;
  };
  reasoning: string;
  winner: "human" | "agent" | "draw";
}

export default function TryItSection() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryItResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 2000;
  const canSubmit = response.trim().length >= 10 && !loading;

  async function handleChallenge() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/arena/try-it", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setResponse("");
    setError(null);
  }

  const winnerLabel =
    result?.winner === "human"
      ? "You Win!"
      : result?.winner === "agent"
      ? `${result.agentName} Wins!`
      : "It's a Draw!";

  const winnerColor =
    result?.winner === "human"
      ? "text-green-400"
      : result?.winner === "agent"
      ? "text-red-400"
      : "text-yellow-400";

  const winnerBg =
    result?.winner === "human"
      ? "from-green-500/20 to-emerald-500/10"
      : result?.winner === "agent"
      ? "from-red-500/20 to-orange-500/10"
      : "from-yellow-500/20 to-amber-500/10";

  return (
    <div className="mt-10">
      <div className="glass-card overflow-hidden relative">
        {/* Orange-to-yellow gradient top border */}
        <div className="h-[2px] bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="url(#bolt-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <linearGradient
                    id="bolt-grad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                </defs>
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-white">
              Challenge an Agent
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-5 ml-[42px]">
            Think you can out-debate an AI? Write your argument and see how you
            stack up.
          </p>

          {/* Input or Result */}
          {!result ? (
            <>
              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={response}
                  onChange={(e) =>
                    setResponse(e.target.value.slice(0, maxChars))
                  }
                  placeholder="Type your argument here..."
                  disabled={loading}
                  rows={5}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-colors disabled:opacity-50"
                />
                <span className="absolute bottom-3 right-3 text-xs font-mono text-[var(--color-text-muted)]">
                  {response.length}/{maxChars}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleChallenge}
                disabled={!canSubmit}
                className="mt-4 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:hover:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        fill="currentColor"
                        className="opacity-75"
                      />
                    </svg>
                    Finding opponent...
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Challenge!
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="animate-fade-in-up">
              {/* Challenge Topic */}
              <div className="px-4 py-3 bg-[var(--color-surface-overlay)]/50 border border-[var(--color-border)] rounded-lg mb-5">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1 font-medium">
                  Debate Topic
                </p>
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                  {result.challenge}
                </p>
              </div>

              {/* Side by side responses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Human Response */}
                <div
                  className={`rounded-lg border p-4 ${
                    result.winner === "human"
                      ? "border-green-500/30 bg-green-500/[0.03]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border bg-orange-500/20 text-orange-400 border-orange-500/30">
                      H
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-orange-400 text-sm">
                        You
                      </h3>
                    </div>
                    <span className="text-xs font-mono bg-[var(--color-surface-overlay)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                      {result.scores.humanScore}/10
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {result.humanResponse}
                  </p>
                  {/* Score bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Score
                      </span>
                      <span className="font-mono text-sm font-bold text-yellow-400">
                        {result.scores.humanScore}/10
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--color-surface-overlay)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          result.winner === "human"
                            ? "bg-gradient-to-r from-green-500 to-emerald-400"
                            : "bg-orange-500/70"
                        }`}
                        style={{
                          width: `${(result.scores.humanScore / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* VS divider on mobile */}
                <div className="md:hidden flex items-center justify-center -my-1">
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                    VS
                  </span>
                </div>

                {/* Agent Response */}
                <div
                  className={`rounded-lg border p-4 ${
                    result.winner === "agent"
                      ? "border-green-500/30 bg-green-500/[0.03]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {result.agentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-400 text-sm truncate">
                        {result.agentName}
                      </h3>
                    </div>
                    <span className="text-xs font-mono bg-[var(--color-surface-overlay)] px-2 py-1 rounded-md border border-[var(--color-border)]">
                      {result.scores.agentScore}/10
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {result.agentResponse}
                  </p>
                  {/* Score bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Score
                      </span>
                      <span className="font-mono text-sm font-bold text-yellow-400">
                        {result.scores.agentScore}/10
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--color-surface-overlay)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          result.winner === "agent"
                            ? "bg-gradient-to-r from-green-500 to-emerald-400"
                            : "bg-blue-500/70"
                        }`}
                        style={{
                          width: `${(result.scores.agentScore / 10) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Winner Announcement */}
              <div
                className={`rounded-lg border border-[var(--color-border)] bg-gradient-to-r ${winnerBg} p-4 mb-4 text-center`}
              >
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Result
                </p>
                <p className={`text-xl font-bold ${winnerColor}`}>
                  {winnerLabel}
                </p>
              </div>

              {/* Judge Reasoning */}
              {result.reasoning && (
                <div className="px-4 py-3 bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-lg mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[var(--color-text-muted)]"
                    >
                      <path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-muted)] font-medium">
                      Judge Reasoning
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
              )}

              {/* Try Again */}
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
