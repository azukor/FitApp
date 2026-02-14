"use client";

import { useRef, useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  longPressStep?: number;
  label?: string;
  className?: string;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  step = 5,
  longPressStep,
  label,
  className,
}: NumberStepperProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const adjust = useCallback(
    (delta: number) => {
      hapticLight();
      onChange(Math.max(min, valueRef.current + delta));
    },
    [onChange, min]
  );

  const startHold = useCallback(
    (delta: number) => {
      isLongPress.current = false;
      const holdStep = longPressStep ?? delta;
      intervalRef.current = setTimeout(() => {
        isLongPress.current = true;
        const run = () => {
          hapticLight();
          const next = Math.max(min, valueRef.current + holdStep);
          onChange(next);
        };
        run();
        intervalRef.current = setInterval(run, 120) as unknown as NodeJS.Timeout;
      }, 400) as unknown as NodeJS.Timeout;
    },
    [longPressStep, min, onChange]
  );

  const stopHold = useCallback(
    (delta: number) => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current as unknown as number);
        clearInterval(intervalRef.current as unknown as number);
        intervalRef.current = null;
      }
      if (!isLongPress.current) {
        adjust(delta);
      }
    },
    [adjust]
  );

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-secondary text-foreground active:scale-95 transition-transform"
        onPointerDown={() => startHold(-step)}
        onPointerUp={() => stopHold(-step)}
        onPointerLeave={() => {
          if (intervalRef.current) {
            clearTimeout(intervalRef.current as unknown as number);
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
          }
        }}
      >
        <Minus className="h-5 w-5" />
      </button>
      <div className="flex flex-col items-center min-w-[5rem]">
        <span className="text-[32px] font-bold tabular-nums leading-none">{value}</span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
      </div>
      <button
        type="button"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-secondary text-foreground active:scale-95 transition-transform"
        onPointerDown={() => startHold(step)}
        onPointerUp={() => stopHold(step)}
        onPointerLeave={() => {
          if (intervalRef.current) {
            clearTimeout(intervalRef.current as unknown as number);
            clearInterval(intervalRef.current as unknown as number);
            intervalRef.current = null;
          }
        }}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
