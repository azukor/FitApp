"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  SkipForward,
  ArrowRight,
  Trash2,
  Play,
} from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const router = useRouter();
  // Initialize weekStart as null to avoid hydration mismatch between
  // server build time and client runtime (different timezones/dates)
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [scheduleTemplateId, setScheduleTemplateId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [moveDate, setMoveDate] = useState("");

  // Set the initial date on the client only to avoid hydration mismatch
  useEffect(() => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  const fetchWeek = useCallback(async () => {
    if (!weekStart) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?startDate=${weekStart.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setWorkouts(Array.isArray(data) ? data : []);
      }
    } catch {
      // Network error — leave workouts as-is
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((d) => setTemplates(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Wait for client-side date initialization
  if (!weekStart) {
    return (
      <div className="space-y-4">
        <PageHeader title="Calendar" description="Plan your training week" />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleSchedule = async () => {
    if (!scheduleTemplateId || !scheduleDate) return;
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: scheduleTemplateId, date: scheduleDate }),
    });
    setScheduleOpen(false);
    setScheduleTemplateId("");
    setScheduleDate("");
    fetchWeek();
  };

  const handleMove = async () => {
    if (!selectedWorkout || !moveDate) return;
    await fetch(`/api/calendar/${selectedWorkout.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: moveDate }),
    });
    setMoveOpen(false);
    setSelectedWorkout(null);
    setMoveDate("");
    fetchWeek();
  };

  const handleSkip = async (id: string) => {
    await fetch(`/api/calendar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "skip" }),
    });
    fetchWeek();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this scheduled workout?")) return;
    await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    fetchWeek();
  };

  const handleStart = async (workout: any) => {
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start",
        templateId: workout.templateId,
        scheduledWorkoutId: workout.id,
      }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/workout/${session.id}`);
    }
  };

  const openMove = (workout: any) => {
    setSelectedWorkout(workout);
    setMoveDate(format(new Date(workout.date), "yyyy-MM-dd"));
    setMoveOpen(true);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success" as const;
      case "SKIPPED":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" description="Plan your training week">
        <Button size="sm" variant="outline" className="gap-1" onClick={() => {
          setScheduleDate(format(new Date(), "yyyy-MM-dd"));
          setScheduleOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          Schedule
        </Button>
      </PageHeader>

      {/* Week Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-sm">
          {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week Grid */}
      <div className="space-y-2">
        {days.map((day) => {
          const dayWorkouts = workouts.filter((w) =>
            isSameDay(new Date(w.date), day)
          );
          const today = isToday(day);

          return (
            <Card key={day.toISOString()} className={cn(today && "border-primary/30 bg-primary/[0.02]")}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    today ? "text-primary" : "text-muted-foreground"
                  )}>
                    {format(day, "EEE")}
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    today && "text-primary"
                  )}>
                    {format(day, "MMM d")}
                  </span>
                  {today && <Badge variant="default" className="text-[10px] px-1.5 py-0">Today</Badge>}
                </div>

                {dayWorkouts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Rest day</p>
                ) : (
                  <div className="space-y-2">
                    {dayWorkouts.map((w: any) => (
                      <div key={w.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant={statusColor(w.status)} className="text-xs shrink-0">
                            {w.status.toLowerCase()}
                          </Badge>
                          <span className="text-sm font-medium truncate">{w.template?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {w.status === "PLANNED" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStart(w)} title="Start">
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMove(w)} title="Move">
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSkip(w.id)} title="Skip">
                                <SkipForward className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(w.id)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogHeader>
          <DialogTitle>Schedule Workout</DialogTitle>
          <DialogClose onClose={() => setScheduleOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template</label>
              <Select value={scheduleTemplateId} onChange={(e) => setScheduleTemplateId(e.target.value)}>
                <option value="">Select template...</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            <Button onClick={handleSchedule} disabled={!scheduleTemplateId || !scheduleDate} className="w-full">
              Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogHeader>
          <DialogTitle>Move Workout</DialogTitle>
          <DialogClose onClose={() => setMoveOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Move <strong>{selectedWorkout?.template?.name}</strong> to a new date:
            </p>
            <Input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} />
            <Button onClick={handleMove} disabled={!moveDate} className="w-full">
              Move
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
