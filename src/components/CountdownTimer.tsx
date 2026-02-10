"use client";

import { useState, useEffect } from "react";

export default function CountdownTimer({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("00:00");
        setUrgent(false);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      setUrgent(diff < 60000);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono text-xs ${urgent ? "countdown-urgent" : "text-[var(--color-text-muted)]"}`}>
      {remaining}
    </span>
  );
}
