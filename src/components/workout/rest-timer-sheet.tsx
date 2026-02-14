"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { hapticHeavy } from "@/lib/haptics";

interface RestTimerSheetProps {
  initialSeconds?: number;
  onDismiss: () => void;
}

export function RestTimerSheet({ initialSeconds = 90, onDismiss }: RestTimerSheetProps) {
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

  const addTime = (s: number) => setTimeLeft((prev) => prev + s);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-[var(--radius-card)] border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          REST
        </span>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-5xl font-bold font-mono tabular-nums text-center">
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
        <Button className="w-full h-14" onClick={onDismiss}>
          Continue
        </Button>
      )}
    </div>
  );
}
