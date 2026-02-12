"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  mode: "countdown" | "interval" | "rest";
  seconds?: number; // for countdown/rest
  workSeconds?: number; // for interval
  restSeconds?: number; // for interval
  rounds?: number; // for interval
  onComplete?: (data: { totalSeconds: number; roundsCompleted: number }) => void;
  className?: string;
}

export function TimerWidget({
  mode,
  seconds = 60,
  workSeconds = 30,
  restSeconds = 30,
  rounds = 6,
  onComplete,
  className,
}: TimerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(mode === "interval" ? workSeconds : seconds);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setTimeLeft(mode === "interval" ? workSeconds : seconds);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setTotalElapsed(0);
  }, [clearTimer, mode, workSeconds, seconds]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (mode === "interval") {
            if (isWorkPhase) {
              setIsWorkPhase(false);
              return restSeconds;
            } else {
              if (currentRound >= rounds) {
                setIsRunning(false);
                onComplete?.({ totalSeconds: totalElapsed, roundsCompleted: currentRound });
                return 0;
              }
              setCurrentRound((r) => r + 1);
              setIsWorkPhase(true);
              return workSeconds;
            }
          } else {
            setIsRunning(false);
            onComplete?.({ totalSeconds: seconds, roundsCompleted: 1 });
            return 0;
          }
        }
        return prev - 1;
      });
      setTotalElapsed((t) => t + 1);
    }, 1000);

    return clearTimer;
  }, [isRunning, mode, isWorkPhase, currentRound, rounds, workSeconds, restSeconds, seconds, onComplete, clearTimer, totalElapsed]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const phaseLabel =
    mode === "interval"
      ? isWorkPhase
        ? "WORK"
        : "REST"
      : mode === "rest"
      ? "REST"
      : "HOLD";

  return (
    <div className={cn("flex flex-col items-center gap-3 p-4 rounded-xl bg-secondary/50", className)}>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {phaseLabel}
        {mode === "interval" && (
          <span className="ml-2">
            Round {currentRound}/{rounds}
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-4xl font-mono font-bold tabular-nums",
          mode === "interval" && !isWorkPhase && "text-success",
          mode === "rest" && "text-muted-foreground"
        )}
      >
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsRunning(!isRunning)}
          className="h-12 w-12 rounded-full"
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          className="h-10 w-10 rounded-full"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
