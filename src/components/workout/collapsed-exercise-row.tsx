"use client";

import { Badge } from "@/components/ui/badge";
import { SetChip } from "./set-chip";
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[var(--radius-card)] border bg-card p-4 transition-colors",
        completed && "opacity-60",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn("font-semibold text-sm", completed && "line-through")}>
          {name}
        </span>
        <Badge variant={completed ? "success" : "secondary"} className="text-xs">
          {loggedCount}/{sets.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sets.map((set, i) => (
          <SetChip
            key={i}
            index={i}
            weight={set.weight}
            reps={set.reps}
            seconds={set.seconds}
            failure={set.failure}
            logged={set.logged}
          />
        ))}
      </div>
    </button>
  );
}
