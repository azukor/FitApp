"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWorkoutMode } from "@/components/providers/workout-mode-provider";
import { WorkoutHeader } from "@/components/workout/workout-header";
import { ActiveExerciseCard } from "@/components/workout/active-exercise-card";
import { CollapsedExerciseRow } from "@/components/workout/collapsed-exercise-row";
import { RestTimerSheet } from "@/components/workout/rest-timer-sheet";
import { FinishWorkoutModal } from "@/components/workout/finish-workout-modal";
import { hapticError } from "@/lib/haptics";

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
  const { enterWorkoutMode, exitWorkoutMode } = useWorkoutMode();

  const [session, setSession] = useState<any>(null);
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([]);
  const [setEntries, setSetEntries] = useState<Map<string, SetEntry[]>>(new Map());
  const [lastPerfs, setLastPerfs] = useState<Map<string, LastPerf>>(new Map());
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState<Map<string, string>>(new Map());
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Enter workout mode on mount, exit on unmount
  useEffect(() => {
    enterWorkoutMode();
    return () => exitWorkoutMode();
  }, [enterWorkoutMode, exitWorkoutMode]);

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

    // Check if all sets for this block are done → auto-advance
    const blockSets = setEntries.get(blockId) || [];
    const updatedSets = [...blockSets];
    updatedSets[setIndex] = { ...updatedSets[setIndex], logged: true };
    const allDone = updatedSets.every((s) => s.logged);

    if (allDone) {
      // Find next incomplete block
      const currentIdx = blocks.findIndex((b) => b.id === blockId);
      for (let i = currentIdx + 1; i < blocks.length; i++) {
        const nextBlockSets = setEntries.get(blocks[i].id) || [];
        if (nextBlockSets.some((s) => !s.logged)) {
          setExpandedBlock(blocks[i].id);
          return;
        }
      }
      // All done, show finish modal
      setShowFinishModal(true);
    }
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

  const handleFinish = async () => {
    setSaving(true);

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
    } else {
      hapticError();
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
    <div className="space-y-3 pb-32">
      <WorkoutHeader
        name={session.template?.name || "Workout"}
        logged={totalLogged}
        total={totalSets}
        onEnd={() => router.push("/")}
      />

      {/* Rest Timer */}
      {showRestTimer && (
        <RestTimerSheet onDismiss={() => setShowRestTimer(false)} />
      )}

      {/* Exercise Blocks */}
      {blocks.map((block) => {
        const sets = setEntries.get(block.id) || [];
        const isExpanded = expandedBlock === block.id;
        const lastPerf = lastPerfs.get(block.exercise.id);
        const blockComplete = sets.length > 0 && sets.every((s) => s.logged);

        if (isExpanded) {
          return (
            <ActiveExerciseCard
              key={block.id}
              blockId={block.id}
              exerciseName={block.exercise.name}
              formCues={block.exercise.formCues}
              mode={block.mode}
              targetSets={block.sets}
              repMin={block.repMin}
              repMax={block.repMax}
              seconds={block.seconds}
              workSeconds={block.workSeconds}
              restSeconds={block.restSeconds}
              rounds={block.rounds}
              targetRpe={block.targetRpe}
              sets={sets}
              lastPerf={lastPerf}
              exerciseNote={exerciseNotes.get(block.exercise.id) || ""}
              onExerciseNoteChange={(note) =>
                setExerciseNotes((prev) => new Map(prev).set(block.exercise.id, note))
              }
              onUpdateSet={(setIndex, updates) => updateSet(block.id, setIndex, updates)}
              onLogSet={(setIndex) => logSet(block.id, setIndex)}
              onCopyLastSet={(setIndex) => copyLastSet(block.id, setIndex)}
              onCollapse={() => setExpandedBlock(null)}
            />
          );
        }

        return (
          <CollapsedExerciseRow
            key={block.id}
            name={block.exercise.name}
            sets={sets}
            completed={blockComplete}
            onClick={() => setExpandedBlock(block.id)}
          />
        );
      })}

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg)]/95 backdrop-blur border-t safe-bottom">
        <div className="mx-auto max-w-2xl flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowRestTimer(true)}>
            Start Rest
          </Button>
          <Button
            className="flex-1 h-14"
            onClick={() => setShowFinishModal(true)}
            disabled={totalLogged === 0}
          >
            Finish ({totalLogged} sets)
          </Button>
        </div>
      </div>

      {/* Finish Modal */}
      <FinishWorkoutModal
        open={showFinishModal}
        onOpenChange={setShowFinishModal}
        totalLogged={totalLogged}
        sessionNotes={sessionNotes}
        onNotesChange={setSessionNotes}
        onFinish={handleFinish}
        saving={saving}
      />
    </div>
  );
}
