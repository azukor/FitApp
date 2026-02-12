"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Plus, BookOpen, Play, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isStartMode = searchParams.get("action") === "start";
  const { data: templates, refetch } = useFetch<any[]>("/api/templates");

  const handleStartFromTemplate = async (templateId: string) => {
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", templateId }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/workout/${session.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    refetch();
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "REPS":
        return "Reps";
      case "TIMED":
        return "Timed";
      case "INTERVAL":
        return "Interval";
      default:
        return mode;
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={isStartMode ? "Pick a Template" : "Templates"}
        description={
          isStartMode
            ? "Choose a template to start your workout"
            : "Your workout programs"
        }
      >
        {!isStartMode && (
          <Link href="/templates/new">
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        )}
      </PageHeader>

      {!templates || templates.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No templates"
          description="Create a workout template to get started."
        >
          <Link href="/templates/new">
            <Button variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {templates.map((template: any) => (
            <Card key={template.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {template.description}
                      </p>
                    )}
                  </div>
                  {isStartMode ? (
                    <Button
                      size="sm"
                      className="gap-1 shrink-0"
                      onClick={() =>
                        handleStartFromTemplate(template.id)
                      }
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                  ) : (
                    <div className="flex gap-1 shrink-0">
                      <Link href={`/templates/${template.id}`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  {template.blocks?.map((block: any, i: number) => (
                    <div
                      key={block.id || i}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground w-5 text-right text-xs">
                        {i + 1}.
                      </span>
                      <span className="font-medium">
                        {block.exercise?.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs ml-auto"
                      >
                        {block.mode === "REPS" &&
                          `${block.sets}×${block.repMin}${block.repMax && block.repMax !== block.repMin ? `-${block.repMax}` : ""}`}
                        {block.mode === "TIMED" &&
                          `${block.sets}×${block.seconds}s`}
                        {block.mode === "INTERVAL" &&
                          `${block.workSeconds}/${block.restSeconds}s ×${block.rounds}`}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getModeLabel(block.mode)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">
            Loading templates...
          </div>
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
