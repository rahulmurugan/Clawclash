"use client";

export function SkeletonCard() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 shimmer" />
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="h-5 w-24 rounded-full bg-[var(--color-surface-overlay)] shimmer" />
        </div>
      </div>
      {/* Challenge */}
      <div className="px-4 sm:px-6 py-3 border-b border-[var(--color-border)]">
        <div className="h-3 w-20 rounded bg-[var(--color-surface-overlay)] shimmer mb-2" />
        <div className="h-4 w-full rounded bg-[var(--color-surface-overlay)] shimmer" />
      </div>
      {/* Two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border)]">
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-4 w-28 rounded bg-[var(--color-surface-overlay)] shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-3 w-4/5 rounded bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-3 w-3/5 rounded bg-[var(--color-surface-overlay)] shimmer" />
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-4 w-28 rounded bg-[var(--color-surface-overlay)] shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-3 w-3/4 rounded bg-[var(--color-surface-overlay)] shimmer" />
            <div className="h-3 w-2/3 rounded bg-[var(--color-surface-overlay)] shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="h-4 w-32 rounded bg-[var(--color-surface-overlay)] shimmer" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center gap-4">
          <div className="h-4 w-6 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="h-4 w-28 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="flex-1" />
          <div className="h-4 w-12 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="h-4 w-8 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="h-4 w-8 rounded bg-[var(--color-surface-overlay)] shimmer" />
          <div className="h-4 w-8 rounded bg-[var(--color-surface-overlay)] shimmer" />
        </div>
      ))}
    </div>
  );
}
