"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "./number-stepper";
import { SetChip } from "./set-chip";
import { TimerWidget } from "@/components/timer-widget";
import { ChevronDown, Copy, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticMedium } from "@/lib/haptics";

interface SetEntry {
  weight: number;
  reps: number;
  seconds: number;
  failure: boolean;
  rpe?: number;
  logged: boolean;
}

interface LastPerf {
  sessionDate: string;
  sets: { setIndex: number; weight: number | null; reps: number | null; seconds: number | null; failure: boolean; rpe: number | null }[];
  note?: string;
}

interface ActiveExerciseCardProps {
  blockId: string;
  exerciseName: string;
  formCues?: string;
  mode: string;
  targetSets: number;
  repMin?: number;
  repMax?: number;
  seconds?: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  targetRpe?: number;
  sets: SetEntry[];
  lastPerf?: LastPerf;
  exerciseNote: string;
  onExerciseNoteChange: (note: string) => void;
  onUpdateSet: (setIndex: number, updates: Partial<SetEntry>) => void;
  onLogSet: (setIndex: number) => void;
  onCopyLastSet: (setIndex: number) => void;
  onCollapse: () => void;
}

export function ActiveExerciseCard({
  blockId,
  exerciseName,
  formCues,
  mode,
  targetSets,
  repMin,
  repMax,
  seconds,
  workSeconds,
  restSeconds,
  rounds,
  targetRpe,
  sets,
  lastPerf,
  exerciseNote,
  onExerciseNoteChange,
  onUpdateSet,
  onLogSet,
  onCopyLastSet,
  onCollapse,
}: ActiveExerciseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(() => {
    const first = sets.findIndex((s) => !s.logged);
    return first >= 0 ? first : 0;
  });

  const loggedCount = sets.filter((s) => s.logged).length;
  const activeSet = sets[activeSetIndex];

  const targetLabel =
    mode === "REPS"
      ? `${targetSets} sets × ${repMin}${repMax && repMax !== repMin ? `-${repMax}` : ""} reps`
      : mode === "TIMED"
      ? `${targetSets} sets × ${seconds}s hold`
      : `${workSeconds}s work / ${restSeconds}s rest × ${rounds} rounds`;

  const handleLogSet = () => {
    hapticMedium();
    onLogSet(activeSetIndex);
    // Auto-advance to next unlogged set
    const nextUnlogged = sets.findIndex((s, i) => !s.logged && i !== activeSetIndex);
    if (nextUnlogged >= 0) {
      setActiveSetIndex(nextUnlogged);
    }
  };

  const logButtonLabel =
    mode === "REPS" ? "Log Set" : mode === "TIMED" ? "Finish Hold" : "Complete Interval";

  return (
    <Card className="ring-1 ring-primary/30 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-xl font-bold truncate">{exerciseName}</CardTitle>
            <Badge variant="accent" className="text-xs shrink-0">
              {loggedCount}/{sets.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onCollapse} className="shrink-0">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {targetLabel}
          {targetRpe ? ` @ RPE ${targetRpe}` : ""}
        </p>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-4">
        {/* Set chips row */}
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
              active={i === activeSetIndex && !set.logged}
              onClick={() => setActiveSetIndex(i)}
            />
          ))}
        </div>

        {/* Timer for timed/interval modes */}
        {(mode === "TIMED" || mode === "INTERVAL") && (
          <TimerWidget
            mode={mode === "TIMED" ? "countdown" : "interval"}
            seconds={seconds}
            workSeconds={workSeconds}
            restSeconds={restSeconds}
            rounds={rounds}
            onComplete={(data) => {
              if (mode === "INTERVAL") {
                onUpdateSet(0, {
                  seconds: data.totalSeconds,
                  reps: data.roundsCompleted,
                  logged: true,
                });
              }
            }}
          />
        )}

        {/* Input Zone */}
        {activeSet && !activeSet.logged && mode === "REPS" && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-6">
              <NumberStepper
                value={activeSet.weight}
                onChange={(v) => onUpdateSet(activeSetIndex, { weight: v })}
                step={5}
                longPressStep={1}
                label="lbs"
              />
              <span className="text-2xl font-bold text-muted-foreground">&times;</span>
              <NumberStepper
                value={activeSet.reps}
                onChange={(v) => onUpdateSet(activeSetIndex, { reps: v })}
                step={1}
                label="reps"
              />
            </div>

            {/* Failure toggle */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateSet(activeSetIndex, { failure: !activeSet.failure })}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors font-medium",
                  activeSet.failure
                    ? "bg-warning/15 text-warning border-warning/30"
                    : "border-input text-muted-foreground hover:text-foreground"
                )}
              >
                {activeSet.failure ? "Failure" : "Mark Failure"}
              </button>
              {activeSetIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => onCopyLastSet(activeSetIndex)}
                >
                  <Copy className="h-3 w-3" />
                  Copy Last
                </Button>
              )}
            </div>
          </div>
        )}

        {activeSet && !activeSet.logged && mode === "TIMED" && (
          <div className="flex items-center justify-center">
            <NumberStepper
              value={activeSet.seconds}
              onChange={(v) => onUpdateSet(activeSetIndex, { seconds: v })}
              step={5}
              label="seconds"
            />
          </div>
        )}

        {/* Log Set Button */}
        {activeSet && !activeSet.logged && (
          <Button
            className="w-full h-16 text-base font-semibold"
            onClick={handleLogSet}
          >
            {logButtonLabel}
          </Button>
        )}

        {/* Collapsed details */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-3 w-3" />
          {showDetails ? "Hide Details" : "Show Details"}
        </button>

        {showDetails && (
          <div className="space-y-3">
            {/* Last time summary */}
            {lastPerf && (
              <div className="text-xs text-muted-foreground bg-secondary/50 rounded-[var(--radius-button)] p-3">
                <span className="font-medium">Last time:</span>{" "}
                {lastPerf.sets.map((s, i) => (
                  <span key={i}>
                    {s.weight}&times;{s.reps}{s.failure ? "F" : ""}
                    {i < lastPerf.sets.length - 1 ? ", " : ""}
                  </span>
                ))}
                {lastPerf.note && <p className="mt-1 italic">{lastPerf.note}</p>}
              </div>
            )}

            {/* Form cues */}
            {formCues && (
              <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-[var(--radius-button)] p-3">
                {formCues}
              </p>
            )}

            {/* RPE input for active set */}
            {activeSet && !activeSet.logged && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">RPE:</span>
                <Input
                  type="number"
                  value={activeSet.rpe ?? ""}
                  onChange={(e) =>
                    onUpdateSet(activeSetIndex, { rpe: parseFloat(e.target.value) || undefined })
                  }
                  className="w-20 text-center h-10 text-sm"
                  placeholder="RPE"
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>
            )}

            {/* Exercise note */}
            <Textarea
              placeholder="Note for this exercise..."
              value={exerciseNote}
              onChange={(e) => onExerciseNoteChange(e.target.value)}
              rows={1}
              className="text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
