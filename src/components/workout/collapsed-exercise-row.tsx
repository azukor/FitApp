"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetData {
  weight: number;
  reps: number;
  seconds: number;
  failure: boolean;
  logged: boolean;
}

interface CollapsedExerciseRowProps {
  name: string;
  sets: SetData[];
  completed: boolean;
  onClick: () => void;
  className?: string;
}

export function CollapsedExerciseRow({
  name,
  sets,
  completed,
  onClick,
  className,
}: CollapsedExerciseRowProps) {
  const loggedCount = sets.filter((s) => s.logged).length;

  if (completed) {
    // Completed: compact row, checkmark, 50% opacity, no card elevation
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-card)] transition-all duration-200",
          "opacity-50 hover:opacity-70",
          className
        )}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Check className="h-3 w-3 text-primary" />
        </div>
        <span className="text-sm font-medium truncate">{name}</span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {loggedCount}/{sets.length}
        </span>
      </button>
    );
  }

  // Upcoming: neutral surface, 90% opacity, clean row
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3.5 rounded-[var(--radius-card)] bg-card border transition-all duration-200",
        "opacity-90 hover:opacity-100",
        className
      )}
    >
      <span className="text-sm font-medium truncate">{name}</span>
      <span className="text-xs text-muted-foreground shrink-0">
        {loggedCount}/{sets.length}
      </span>
    </button>
  );
}
