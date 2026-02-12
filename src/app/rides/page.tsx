"use client";

import { useState, useRef } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Upload,
  Bike,
  Trash2,
  Clock,
  Heart,
  Zap,
  Activity,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  const mi = km * 0.621371;
  return `${mi.toFixed(1)} mi`;
}

export default function RidesPage() {
  const { data: rides, refetch } = useFetch<any[]>("/api/rides");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const handleUpload = async (file: File, force = false) => {
    setUploading(true);
    setUploadError(null);
    setDuplicateWarning(null);

    const formData = new FormData();
    formData.append("file", file);
    if (force) formData.append("force", "true");

    try {
      const res = await fetch("/api/rides", { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 409) {
        setDuplicateWarning(data);
        pendingFileRef.current = file;
      } else if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        refetch();
      }
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleForceImport = () => {
    if (pendingFileRef.current) {
      handleUpload(pendingFileRef.current, true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ride?")) return;
    await fetch(`/api/rides/${id}`, { method: "DELETE" });
    refetch();
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Rides" description="Import and review cycling rides" />

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-4">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-input hover:border-primary/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-sm">
              {uploading ? "Uploading..." : "Drop .fit file here or tap to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports Garmin, Wahoo, and other .fit files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fit"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {uploadError && (
            <p className="text-sm text-destructive mt-2">{uploadError}</p>
          )}

          {duplicateWarning && (
            <div className="mt-3 p-3 bg-warning/10 rounded-lg">
              <p className="text-sm font-medium text-warning">
                Duplicate ride detected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                A ride with the same start time and duration already exists.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDuplicateWarning(null)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleForceImport}>
                  Import Anyway
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strava Connect Placeholder */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2">
              <LinkIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Strava Connect</p>
              <p className="text-xs text-muted-foreground">
                Auto-import rides from Strava
              </p>
            </div>
          </div>
          <Badge variant="secondary">Coming Soon</Badge>
        </CardContent>
      </Card>

      {/* Rides List */}
      {!rides || rides.length === 0 ? (
        <EmptyState
          icon={Bike}
          title="No rides yet"
          description="Import a .fit file to see your cycling data."
        />
      ) : (
        <div className="space-y-3">
          {rides.map((ride: any) => (
            <Card key={ride.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      {ride.title || "Cycling Ride"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ride.startTime), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ride.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {formatDuration(ride.duration)}
                      </p>
                    </div>
                  </div>

                  {ride.distance && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Distance
                        </p>
                        <p className="text-sm font-medium">
                          {formatDistance(ride.distance)}
                        </p>
                      </div>
                    </div>
                  )}

                  {ride.avgHr && (
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Avg HR</p>
                        <p className="text-sm font-medium">{ride.avgHr} bpm</p>
                      </div>
                    </div>
                  )}

                  {ride.avgPower && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg Power
                        </p>
                        <p className="text-sm font-medium">
                          {ride.avgPower}W
                          {ride.maxPower ? ` / ${ride.maxPower}W max` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
