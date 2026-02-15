"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { hapticHeavy } from "@/lib/haptics";

interface RestTimerSheetProps {
  initialSeconds?: number;
  onDismiss: () => void;
  onComplete?: () => void;
}

export function RestTimerSheet({ initialSeconds = 90, onDismiss, onComplete }: RestTimerSheetProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          hapticHeavy();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [isRunning, clearTimer]);

  // Auto-advance when timer reaches zero
  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      const timeout = setTimeout(() => {
        onComplete?.();
        onDismiss();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [timeLeft, isRunning, onComplete, onDismiss]);

  const addTime = (s: number) => {
    setTimeLeft((prev) => prev + s);
    if (!isRunning && timeLeft === 0) {
      setIsRunning(true);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-[var(--radius-card)] bg-primary/10 border border-primary/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          REST
        </span>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-5xl font-bold font-mono tabular-nums text-center text-primary">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => addTime(15)}>
          +15s
        </Button>
        <Button variant="outline" size="sm" onClick={() => addTime(30)}>
          +30s
        </Button>
        <Button variant="outline" size="sm" onClick={() => addTime(60)}>
          +60s
        </Button>
      </div>
      {timeLeft === 0 && (
        <p className="text-xs text-center text-muted-foreground">Auto-advancing...</p>
      )}
    </div>
  );
}
