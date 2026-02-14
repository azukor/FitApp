"use client";

import { cn } from "@/lib/utils";

interface SetChipProps {
  index: number;
  weight?: number;
  reps?: number;
  seconds?: number;
  failure?: boolean;
  logged: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SetChip({
  index,
  weight,
  reps,
  seconds,
  failure,
  logged,
  active,
  onClick,
  className,
}: SetChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        logged && !failure && "bg-success/15 text-success",
        logged && failure && "bg-warning/15 text-warning",
        !logged && active && "bg-primary/15 text-primary ring-1 ring-primary/30",
        !logged && !active && "bg-secondary text-muted-foreground",
        className
      )}
    >
      <span className="font-semibold">{index + 1}</span>
      {logged && weight != null && reps != null && (
        <span>
          {weight}&times;{reps}
          {failure ? "F" : ""}
        </span>
      )}
      {logged && seconds != null && reps == null && <span>{seconds}s</span>}
    </button>
  );
}
