"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const total = Math.floor(ms / 1000);
  return {
    done: ms === 0,
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

/** Live countdown to an ISO deadline. Goes red + pulses under 1 hour. */
export function Countdown({
  to,
  className,
  onComplete,
}: {
  to: string;
  className?: string;
  onComplete?: () => void;
}) {
  const target = new Date(to).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => {
      const next = diff(target);
      setT(next);
      if (next.done) {
        clearInterval(id);
        onComplete?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onComplete]);

  const urgent = t.h === 0 && !t.done;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <span
      className={cn(
        "font-display tabular-nums font-bold tracking-tight",
        urgent ? "text-live animate-pulse-live" : "text-ink",
        className,
      )}
    >
      {t.done ? "LOCKED" : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}
    </span>
  );
}
