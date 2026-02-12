"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Plus, Dumbbell, Pencil, Trash2, Search } from "lucide-react";

const TAG_OPTIONS = ["push", "pull", "legs", "core", "cardio", "arms", "shoulders", "back", "chest"];

interface Exercise {
  id: string;
  name: string;
  tags: string[];
  equipment: string | null;
  formCues: string | null;
  userNote: string | null;
}

export default function ExercisesPage() {
  const { data: exercises, refetch } = useFetch<Exercise[]>("/api/exercises");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [equipment, setEquipment] = useState("");
  const [formCues, setFormCues] = useState("");
  const [userNote, setUserNote] = useState("");
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setName("");
    setTags([]);
    setEquipment("");
    setFormCues("");
    setUserNote("");
    setDialogOpen(true);
  };

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setName(ex.name);
    setTags(ex.tags);
    setEquipment(ex.equipment || "");
    setFormCues(ex.formCues || "");
    setUserNote(ex.userNote || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = { name, tags, equipment: equipment || undefined, formCues: formCues || undefined, userNote: userNote || undefined };

    if (editing) {
      await fetch(`/api/exercises/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    setSaving(false);
    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exercise?")) return;
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    refetch();
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = exercises?.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Exercises" description="Manage your exercise library">
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {!filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises"
          description="Add exercises to build your library."
        >
          <Button onClick={openNew} variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ex.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {ex.equipment && (
                      <Badge variant="outline" className="text-xs">
                        {ex.equipment}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(ex)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Exercise" : "New Exercise"}</DialogTitle>
          <DialogClose onClose={() => setDialogOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Bench Press" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      tags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-input hover:bg-accent"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Equipment</label>
              <Input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g., Barbell, Dumbbell" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Form Cues</label>
              <Textarea value={formCues} onChange={(e) => setFormCues(e.target.value)} placeholder="Key form reminders..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder="Personal notes..." rows={2} />
            </div>
            <Button onClick={handleSave} disabled={!name || saving} className="w-full">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
