"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface BlockForm {
  exerciseId: string;
  mode: "REPS" | "TIMED" | "INTERVAL";
  sets: number;
  repMin?: number;
  repMax?: number;
  seconds?: number;
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  targetRpe?: number;
  notes?: string;
}

interface TemplateFormProps {
  templateId?: string;
}

export function TemplateForm({ templateId }: TemplateFormProps) {
  const router = useRouter();
  const { data: exercises } = useFetch<any[]>("/api/exercises");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [blocks, setBlocks] = useState<BlockForm[]>([]);
  const [saving, setSaving] = useState(false);

  // Load existing template if editing
  useEffect(() => {
    if (templateId) {
      fetch(`/api/templates/${templateId}`)
        .then((r) => r.json())
        .then((t) => {
          setName(t.name);
          setDescription(t.description || "");
          setBlocks(
            t.blocks.map((b: any) => ({
              exerciseId: b.exerciseId,
              mode: b.mode,
              sets: b.sets,
              repMin: b.repMin ?? undefined,
              repMax: b.repMax ?? undefined,
              seconds: b.seconds ?? undefined,
              workSeconds: b.workSeconds ?? undefined,
              restSeconds: b.restSeconds ?? undefined,
              rounds: b.rounds ?? undefined,
              targetRpe: b.targetRpe ?? undefined,
              notes: b.notes ?? undefined,
            }))
          );
        });
    }
  }, [templateId]);

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        exerciseId: exercises?.[0]?.id || "",
        mode: "REPS",
        sets: 3,
        repMin: 8,
        repMax: 12,
      },
    ]);
  };

  const updateBlock = (index: number, updates: Partial<BlockForm>) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      name,
      description: description || undefined,
      blocks: blocks.map((b, i) => ({ ...b, order: i })),
    };

    const url = templateId ? `/api/templates/${templateId}` : "/api/templates";
    const method = templateId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/templates");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={templateId ? "Edit Template" : "New Template"} />

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Template Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Upper Body A" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Exercise Blocks</h2>
          <Button size="sm" variant="outline" onClick={addBlock} className="gap-1" disabled={!exercises?.length}>
            <Plus className="h-4 w-4" />
            Add Block
          </Button>
        </div>

        {blocks.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No exercise blocks yet. Add one above.
            </CardContent>
          </Card>
        )}

        {blocks.map((block, index) => (
          <Card key={index}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                <Select
                  value={block.exerciseId}
                  onChange={(e) => updateBlock(index, { exerciseId: e.target.value })}
                  className="flex-1"
                >
                  <option value="">Select exercise...</option>
                  {exercises?.map((ex: any) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeBlock(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={block.mode}
                  onChange={(e) => updateBlock(index, { mode: e.target.value as BlockForm["mode"] })}
                  className="w-28"
                >
                  <option value="REPS">Reps</option>
                  <option value="TIMED">Timed</option>
                  <option value="INTERVAL">Interval</option>
                </Select>

                <div className="flex items-center gap-1">
                  <label className="text-xs text-muted-foreground">Sets</label>
                  <Input
                    type="number"
                    value={block.sets}
                    onChange={(e) => updateBlock(index, { sets: parseInt(e.target.value) || 1 })}
                    className="w-16 text-center"
                    min={1}
                  />
                </div>
              </div>

              {block.mode === "REPS" && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      value={block.repMin ?? ""}
                      onChange={(e) => updateBlock(index, { repMin: parseInt(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={0}
                    />
                  </div>
                  <span className="text-muted-foreground">-</span>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      value={block.repMax ?? ""}
                      onChange={(e) => updateBlock(index, { repMax: parseInt(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <label className="text-xs text-muted-foreground">RPE</label>
                    <Input
                      type="number"
                      value={block.targetRpe ?? ""}
                      onChange={(e) => updateBlock(index, { targetRpe: parseFloat(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={1}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>
              )}

              {block.mode === "TIMED" && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Seconds</label>
                  <Input
                    type="number"
                    value={block.seconds ?? ""}
                    onChange={(e) => updateBlock(index, { seconds: parseInt(e.target.value) || undefined })}
                    className="w-20 text-center"
                    min={1}
                  />
                </div>
              )}

              {block.mode === "INTERVAL" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Work</label>
                    <Input
                      type="number"
                      value={block.workSeconds ?? ""}
                      onChange={(e) => updateBlock(index, { workSeconds: parseInt(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Rest</label>
                    <Input
                      type="number"
                      value={block.restSeconds ?? ""}
                      onChange={(e) => updateBlock(index, { restSeconds: parseInt(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={0}
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Rounds</label>
                    <Input
                      type="number"
                      value={block.rounds ?? ""}
                      onChange={(e) => updateBlock(index, { rounds: parseInt(e.target.value) || undefined })}
                      className="w-16 text-center"
                      min={1}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sticky bottom save bar */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
        <div className="mx-auto max-w-2xl">
          <Button
            onClick={handleSave}
            disabled={!name || blocks.length === 0 || saving}
            className="w-full h-12"
          >
            {saving ? "Saving..." : templateId ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </div>
    </div>
  );
}
