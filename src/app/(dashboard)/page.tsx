"use client";

import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Play,
  Calendar,
  BookOpen,
  Bike,
  BarChart3,
  Clock,
  Dumbbell,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function DashboardPage() {
  const router = useRouter();
  const { data: nextUp } = useFetch<any>("/api/calendar/next");
  const { data: sessions } = useFetch<any[]>("/api/workouts");
  const { data: templates } = useFetch<any[]>("/api/templates");

  const handleStartWorkout = async () => {
    if (nextUp) {
      // Start from scheduled workout
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          templateId: nextUp.templateId,
          scheduledWorkoutId: nextUp.id,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        router.push(`/workout/${session.id}`);
      }
    } else if (templates && templates.length > 0) {
      router.push("/templates?action=start");
    } else {
      router.push("/templates");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="FitApp" description="Your workout companion" />

      {/* Primary Action */}
      <Card className="border-2">
        <CardContent className="p-5">
          <Button
            size="lg"
            className="w-full h-14 text-lg gap-2"
            onClick={handleStartWorkout}
          >
            <Play className="h-5 w-5" />
            {nextUp ? "Start Scheduled Workout" : "Start Workout"}
          </Button>
          {nextUp && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {nextUp.template?.name} &mdash;{" "}
                {format(new Date(nextUp.date), "EEE, MMM d")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/calendar">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Calendar</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/templates">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Templates</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/rides">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Bike className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Rides</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/insights">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">Insights</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Next Up */}
      {nextUp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{nextUp.template?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(nextUp.date), "EEEE, MMMM d")}
                </p>
              </div>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!sessions || sessions.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No sessions yet"
              description="Start your first workout to see your history here."
              className="py-6"
            />
          ) : (
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {session.template?.name || "Ad-hoc Workout"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.completedAt
                        ? format(new Date(session.completedAt), "MMM d, h:mm a")
                        : "In progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {session.setLogs?.length || 0} sets
                    </p>
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
