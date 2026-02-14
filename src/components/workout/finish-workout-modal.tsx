"use client";

import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FinishWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalLogged: number;
  sessionNotes: string;
  onNotesChange: (notes: string) => void;
  onFinish: () => void;
  saving: boolean;
}

export function FinishWorkoutModal({
  open,
  onOpenChange,
  totalLogged,
  sessionNotes,
  onNotesChange,
  onFinish,
  saving,
}: FinishWorkoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Finish Workout</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You logged <strong className="text-foreground">{totalLogged} sets</strong>. Save this session?
          </p>
          <div>
            <label className="text-sm font-medium mb-2 block">Session Notes</label>
            <Textarea
              placeholder="How did the workout feel?"
              value={sessionNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Back
            </Button>
            <Button className="flex-1 h-14" onClick={onFinish} disabled={saving}>
              {saving ? "Saving..." : "Finish Workout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
