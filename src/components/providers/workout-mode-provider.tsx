"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface WorkoutModeContextValue {
  isWorkoutMode: boolean;
  enterWorkoutMode: () => void;
  exitWorkoutMode: () => void;
}

const WorkoutModeContext = createContext<WorkoutModeContextValue>({
  isWorkoutMode: false,
  enterWorkoutMode: () => {},
  exitWorkoutMode: () => {},
});

export function WorkoutModeProvider({ children }: { children: React.ReactNode }) {
  const [isWorkoutMode, setIsWorkoutMode] = useState(false);

  useEffect(() => {
    if (isWorkoutMode) {
      document.body.setAttribute("data-mode", "workout");
    } else {
      document.body.removeAttribute("data-mode");
    }
  }, [isWorkoutMode]);

  const enterWorkoutMode = useCallback(() => setIsWorkoutMode(true), []);
  const exitWorkoutMode = useCallback(() => setIsWorkoutMode(false), []);

  return (
    <WorkoutModeContext.Provider value={{ isWorkoutMode, enterWorkoutMode, exitWorkoutMode }}>
      {children}
    </WorkoutModeContext.Provider>
  );
}

export function useWorkoutMode() {
  return useContext(WorkoutModeContext);
}
