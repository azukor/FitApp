"use client";

import { useState, useEffect } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { BarChart3, Dumbbell, Bike, TrendingUp } from "lucide-react";
import { format } from "date-fns";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function InsightsPage() {
  const { data: exercises } = useFetch<any[]>("/api/exercises");
  const { data: consistency } = useFetch<any[]>(
    "/api/insights?type=consistency"
  );
  const { data: rides } = useFetch<any[]>("/api/insights?type=rides");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [exerciseTrends, setExerciseTrends] = useState<any[]>([]);

  useEffect(() => {
    if (selectedExercise) {
      fetch(`/api/insights?type=exercise&exerciseId=${selectedExercise}`)
        .then((r) => r.json())
        .then(setExerciseTrends)
        .catch(() => setExerciseTrends([]));
    }
  }, [selectedExercise]);

  const maxVolume =
    exerciseTrends.length > 0
      ? Math.max(...exerciseTrends.map((t) => t.totalVolume))
      : 0;
  const maxConsistency =
    consistency && consistency.length > 0
      ? Math.max(...consistency.map((c) => c.count), 1)
      : 1;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Insights"
        description="Track your progress and trends"
      />

      {/* Weekly Consistency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Weekly Consistency
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!consistency || consistency.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete workouts to see your consistency trend.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-32">
                {consistency.map((week, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/20 rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(
                          4,
                          (week.count / maxConsistency) * 100
                        )}%`,
                      }}
                    >
                      <div
                        className="w-full bg-primary rounded-t-sm transition-all"
                        style={{
                          height: `${
                            week.count > 0
                              ? Math.max(20, (week.count / maxConsistency) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {consistency.map((week, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                  >
                    {week.week}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {consistency.map((week, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-xs font-medium"
                  >
                    {week.count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strength Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Strength Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="mb-4"
          >
            <option value="">Select an exercise...</option>
            {exercises?.map((ex: any) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </Select>

          {!selectedExercise ? (
            <p className="text-sm text-muted-foreground">
              Choose an exercise to view trends.
            </p>
          ) : exerciseTrends.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No data yet"
              description="Complete sessions with this exercise to see trends."
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-32">
                {exerciseTrends.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-primary rounded-t-sm transition-all"
                      style={{
                        height: `${
                          maxVolume > 0
                            ? Math.max(4, (t.totalVolume / maxVolume) * 100)
                            : 4
                        }%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                {exerciseTrends.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center text-[10px] text-muted-foreground truncate"
                  >
                    {t.date}
                  </div>
                ))}
              </div>

              {/* Data table */}
              <div className="space-y-1 mt-4">
                {exerciseTrends.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <span className="text-muted-foreground">{t.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {t.bestWeight}lbs × {t.bestReps}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Vol: {t.totalVolume.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cycling Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bike className="h-4 w-4" />
            Recent Rides
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rides || rides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Import rides to see your cycling summary.
            </p>
          ) : (
            <div className="space-y-2">
              {rides.slice(0, 10).map((ride: any) => (
                <div
                  key={ride.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {ride.title || "Ride"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ride.startTime), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDuration(ride.duration)}
                    </p>
                    {ride.avgPower && (
                      <p className="text-xs text-muted-foreground">
                        {ride.avgPower}W avg
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
