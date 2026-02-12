"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TimerWidget } from "@/components/timer-widget";
import {
  Check,
  Copy,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetEntry {
  exerciseId: string;
  blockId?: string;
  setIndex: number;
  weight: number;
  reps: number;
  seconds: number;
  failure: boolean;
  rpe?: number;
  logged: boolean;
}

interface ExerciseBlock {
  id: string;
  exercise: { id: string; name: string; formCues?: string };
  mode: string;
  sets: number;
  repMin?: number;
  repMax?: number;
  seconds?: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  targetRpe?: number;
}

interface LastPerf {
  sessionDate: string;
  sets: { setIndex: number; weight: number | null; reps: number | null; seconds: number | null; failure: boolean; rpe: number | null }[];
  note?: string;
}

export default function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [setEntries, setSetEntries] = useState<Map<string, SetEntry[]>>(new Map());
  const [lastPerfs, setLastPerfs] = useState<Map<string, LastPerf>>(new Map());
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState<Map<string, string>>(new Map());
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState<Map<string, boolean>>(new Map());

  // Load session data
  useEffect(() => {
    fetch(`/api/workouts/${sessionId}`)
      .then((r) => r.json())
      .then((s) => {
        setSession(s);
        const templateBlocks = s.template?.blocks || [];
        setBlocks(templateBlocks);
        if (templateBlocks.length > 0) {
          setExpandedBlock(templateBlocks[0].id);
        }

        // Initialize set entries for each block
        const entries = new Map<string, SetEntry[]>();
        templateBlocks.forEach((block: ExerciseBlock) => {
          const numSets = block.mode === "INTERVAL" ? 1 : block.sets;
          const sets: SetEntry[] = Array.from({ length: numSets }, (_, i) => ({
            exerciseId: block.exercise.id,
            blockId: block.id,
            setIndex: i,
            weight: 0,
            reps: block.repMax || block.repMin || 0,
            seconds: block.seconds || 0,
            failure: false,
            logged: false,
          }));
          entries.set(block.id, sets);
        });
        setSetEntries(entries);

        // Load last performance for each exercise
        const exerciseIds = new Set(templateBlocks.map((b: ExerciseBlock) => b.exercise.id));
        exerciseIds.forEach((exId) => {
          fetch(`/api/workouts/history/${exId}`)
            .then((r) => r.json())
            .then((perf) => {
              if (perf) {
                setLastPerfs((prev) => new Map(prev).set(exId as string, perf));
              }
            })
            .catch(() => {});
        });
      });
  }, [sessionId]);

  const updateSet = (blockId: string, setIndex: number, updates: Partial<SetEntry>) => {
    setSetEntries((prev) => {
      const next = new Map(prev);
      const sets = [...(next.get(blockId) || [])];
      sets[setIndex] = { ...sets[setIndex], ...updates };
      next.set(blockId, sets);
      return next;
    });
  };

  const logSet = (blockId: string, setIndex: number) => {
    updateSet(blockId, setIndex, { logged: true });
    setShowRestTimer(true);
  };

  const copyLastSet = (blockId: string, setIndex: number) => {
    const sets = setEntries.get(blockId);
    if (!sets || setIndex === 0) return;
    const prev = sets[setIndex - 1];
    updateSet(blockId, setIndex, {
      weight: prev.weight,
      reps: prev.reps,
      seconds: prev.seconds,
    });
  };

  const adjustWeight = (blockId: string, setIndex: number, delta: number) => {
    const sets = setEntries.get(blockId);
    if (!sets) return;
    const current = sets[setIndex].weight;
    updateSet(blockId, setIndex, { weight: Math.max(0, current + delta) });
  };

  const handleFinish = async () => {
    setSaving(true);

    // Collect all logged sets
    const allSets: any[] = [];
    setEntries.forEach((sets) => {
      sets.forEach((s) => {
        if (s.logged) {
          allSets.push({
            exerciseId: s.exerciseId,
            blockId: s.blockId,
            setIndex: s.setIndex,
            weight: s.weight || undefined,
            reps: s.reps || undefined,
            seconds: s.seconds || undefined,
            failure: s.failure,
            rpe: s.rpe,
          });
        }
      });
    });

    // Collect exercise notes
    const notes: { exerciseId: string; note: string }[] = [];
    exerciseNotes.forEach((note, exerciseId) => {
      if (note.trim()) {
        notes.push({ exerciseId, note: note.trim() });
      }
    });

    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "finish",
        sessionId,
        notes: sessionNotes || undefined,
        setLogs: allSets,
        exerciseNotes: notes.length > 0 ? notes : undefined,
      }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/");
    }
  };

  const totalLogged = Array.from(setEntries.values()).flat().filter((s) => s.logged).length;
  const totalSets = Array.from(setEntries.values()).flat().length;

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading workout...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{session.template?.name || "Workout"}</h1>
          <p className="text-sm text-muted-foreground">
            {totalLogged}/{totalSets} sets logged
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="text-muted-foreground">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${totalSets > 0 ? (totalLogged / totalSets) * 100 : 0}%` }}
        />
      </div>

      {/* Rest Timer */}
      {showRestTimer && (
        <TimerWidget
          mode="rest"
          seconds={90}
          onComplete={() => setShowRestTimer(false)}
        />
      )}

      {/* Exercise Blocks */}
      {blocks.map((block) => {
        const sets = setEntries.get(block.id) || [];
        const isExpanded = expandedBlock === block.id;
        const lastPerf = lastPerfs.get(block.exercise.id);
        const blockLogged = sets.filter((s) => s.logged).length;
        const moreVisible = showMore.get(block.id) || false;

        return (
          <Card key={block.id} className={cn(isExpanded && "ring-1 ring-primary/20")}>
            <CardHeader
              className="p-4 cursor-pointer"
              onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{block.exercise.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {blockLogged}/{sets.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {/* Target info */}
              <p className="text-xs text-muted-foreground mt-1">
                {block.mode === "REPS" && `${block.sets} sets × ${block.repMin}${block.repMax && block.repMax !== block.repMin ? `-${block.repMax}` : ""} reps`}
                {block.mode === "TIMED" && `${block.sets} sets × ${block.seconds}s hold`}
                {block.mode === "INTERVAL" && `${block.workSeconds}s work / ${block.restSeconds}s rest × ${block.rounds} rounds`}
                {block.targetRpe ? ` @ RPE ${block.targetRpe}` : ""}
              </p>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-4 pt-0 space-y-3">
                {/* Form cues */}
                {block.exercise.formCues && (
                  <p className="text-xs text-muted-foreground italic bg-secondary/50 rounded-lg p-2">
                    {block.exercise.formCues}
                  </p>
                )}

                {/* Last time summary */}
                {lastPerf && (
                  <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-2">
                    <span className="font-medium">Last time:</span>{" "}
                    {lastPerf.sets.map((s, i) => (
                      <span key={i}>
                        {s.weight}×{s.reps}{s.failure ? "F" : ""}
                        {i < lastPerf.sets.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    {lastPerf.note && <p className="mt-1 italic">{lastPerf.note}</p>}
                  </div>
                )}

                {/* Timer for timed/interval modes */}
                {(block.mode === "TIMED" || block.mode === "INTERVAL") && (
                  <TimerWidget
                    mode={block.mode === "TIMED" ? "countdown" : "interval"}
                    seconds={block.seconds}
                    workSeconds={block.workSeconds}
                    restSeconds={block.restSeconds}
                    rounds={block.rounds}
                    onComplete={(data) => {
                      if (block.mode === "INTERVAL") {
                        updateSet(block.id, 0, {
                          seconds: data.totalSeconds,
                          reps: data.roundsCompleted,
                          logged: true,
                        });
                      }
                    }}
                  />
                )}

                {/* Set logging for REPS / TIMED modes */}
                {(block.mode === "REPS" || block.mode === "TIMED") && (
                  <div className="space-y-2">
                    {sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg transition-colors",
                          set.logged ? "bg-success/10" : "bg-secondary/30"
                        )}
                      >
                        <span className="text-xs font-medium text-muted-foreground w-6 text-center">
                          {setIdx + 1}
                        </span>

                        {block.mode === "REPS" && (
                          <>
                            {/* Weight with +/- controls */}
                            <div className="flex items-center gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => adjustWeight(block.id, setIdx, -2.5)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={set.weight || ""}
                                onChange={(e) => updateSet(block.id, setIdx, { weight: parseFloat(e.target.value) || 0 })}
                                className="w-16 text-center h-8 text-sm"
                                placeholder="lbs"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => adjustWeight(block.id, setIdx, 2.5)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <span className="text-xs text-muted-foreground">×</span>

                            {/* Reps */}
                            <Input
                              type="number"
                              value={set.reps || ""}
                              onChange={(e) => updateSet(block.id, setIdx, { reps: parseInt(e.target.value) || 0 })}
                              className="w-14 text-center h-8 text-sm"
                              placeholder="reps"
                            />
                          </>
                        )}

                        {block.mode === "TIMED" && (
                          <Input
                            type="number"
                            value={set.seconds || ""}
                            onChange={(e) => updateSet(block.id, setIdx, { seconds: parseFloat(e.target.value) || 0 })}
                            className="w-20 text-center h-8 text-sm"
                            placeholder="sec"
                          />
                        )}

                        {/* Failure toggle */}
                        <button
                          onClick={() => updateSet(block.id, setIdx, { failure: !set.failure })}
                          className={cn(
                            "text-xs px-2 py-1 rounded border transition-colors",
                            set.failure ? "bg-destructive/15 text-destructive border-destructive/30" : "border-input text-muted-foreground hover:text-foreground"
                          )}
                        >
                          F
                        </button>

                        {/* More (RPE) */}
                        {moreVisible && (
                          <Input
                            type="number"
                            value={set.rpe ?? ""}
                            onChange={(e) => updateSet(block.id, setIdx, { rpe: parseFloat(e.target.value) || undefined })}
                            className="w-14 text-center h-8 text-sm"
                            placeholder="RPE"
                            min={1}
                            max={10}
                            step={0.5}
                          />
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 ml-auto">
                          {setIdx > 0 && !set.logged && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLastSet(block.id, setIdx)} title="Copy last set">
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant={set.logged ? "ghost" : "default"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => logSet(block.id, setIdx)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Toggle RPE visibility */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setShowMore((prev) => new Map(prev).set(block.id, !moreVisible))}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                    {moreVisible ? "Hide RPE" : "Show RPE"}
                  </Button>
                </div>

                {/* Exercise note */}
                <Textarea
                  placeholder="Note for this exercise..."
                  value={exerciseNotes.get(block.exercise.id) || ""}
                  onChange={(e) =>
                    setExerciseNotes((prev) => new Map(prev).set(block.exercise.id, e.target.value))
                  }
                  rows={1}
                  className="text-sm"
                />
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Session Notes */}
      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium mb-2 block">Session Notes</label>
          <Textarea
            placeholder="How did the workout feel?"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Sticky Finish Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-bottom">
        <div className="mx-auto max-w-2xl flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button className="flex-1 h-12" onClick={handleFinish} disabled={saving || totalLogged === 0}>
            {saving ? "Saving..." : `Finish (${totalLogged} sets)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
