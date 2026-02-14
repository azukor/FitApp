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
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {logged}/{total} sets logged
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onEnd} className="shrink-0 text-muted-foreground">
          <X className="h-5 w-5" />
        </Button>
      </div>
      {/* Accent progress bar */}
      <div className="h-1 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
