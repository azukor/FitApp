"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Database,
  Dumbbell,
  Bike,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="App configuration" />

      {/* User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Default User</p>
              <p className="text-xs text-muted-foreground">
                Single-user mode (v1)
              </p>
            </div>
            <Badge variant="secondary">v1</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Authentication will be added in a future version.
          </p>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/exercises" className="block">
            <div className="flex items-center justify-between py-2 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Exercise Library</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/templates" className="block">
            <div className="flex items-center justify-between py-2 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Workout Templates</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
          <Link href="/rides" className="block">
            <div className="flex items-center justify-between py-2 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Cycling Rides</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* AI Coaching Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Coaching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Smart Coaching</p>
              <p className="text-xs text-muted-foreground">
                AI-powered workout suggestions, progressive overload tracking,
                and recovery insights
              </p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium">FitApp v1.0</p>
            <p>Workout & Cycling Tracker</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
