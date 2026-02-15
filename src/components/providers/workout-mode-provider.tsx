"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type WorkoutType = "strength" | "cardio" | "mobility";

const ACCENT_MAP: Record<WorkoutType, string> = {
  strength: "#2F6BFF",
  cardio: "#32D74B",
  mobility: "#9B7BFF",
};

interface WorkoutModeContextValue {
  isWorkoutMode: boolean;
  workoutType: WorkoutType;
  enterWorkoutMode: (type?: WorkoutType) => void;
  exitWorkoutMode: () => void;
}

const WorkoutModeContext = createContext<WorkoutModeContextValue>({
  isWorkoutMode: false,
  workoutType: "strength",
  enterWorkoutMode: () => {},
  exitWorkoutMode: () => {},
});

export function WorkoutModeProvider({ children }: { children: React.ReactNode }) {
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>("strength");

  useEffect(() => {
    if (isWorkoutMode) {
      document.body.setAttribute("data-mode", "workout");
      document.body.style.setProperty("--workout-accent", ACCENT_MAP[workoutType]);
    } else {
      document.body.removeAttribute("data-mode");
      document.body.style.removeProperty("--workout-accent");
    }
  }, [isWorkoutMode, workoutType]);

  const enterWorkoutMode = useCallback((type: WorkoutType = "strength") => {
    setWorkoutType(type);
    setIsWorkoutMode(true);
  }, []);

  const exitWorkoutMode = useCallback(() => setIsWorkoutMode(false), []);

  return (
    <WorkoutModeContext.Provider value={{ isWorkoutMode, workoutType, enterWorkoutMode, exitWorkoutMode }}>
      {children}
    </WorkoutModeContext.Provider>
  );
}

export function useWorkoutMode() {
  return useContext(WorkoutModeContext);
}
