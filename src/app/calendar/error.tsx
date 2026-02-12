"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function CalendarError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" description="Something went wrong" />
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Failed to load the calendar. Please try again.
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
