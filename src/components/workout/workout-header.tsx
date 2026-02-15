"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutHeaderProps {
  name: string;
  logged: number;
  total: number;
  onEnd: () => void;
}

export function WorkoutHeader({ name, logged, total, onEnd }: WorkoutHeaderProps) {
  const pct = total > 0 ? (logged / total) * 100 : 0;

  return (
    <div className="sticky top-0 z-30 bg-[var(--bg)] pb-3 pt-1">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {logged}/{total} sets logged
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onEnd} className="shrink-0 text-muted-foreground">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* 2px accent progress bar */}
      <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-250 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
