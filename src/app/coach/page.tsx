"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Sparkles,
  Dumbbell,
  BookOpen,
  ImagePlus,
  X,
} from "lucide-react";
import type { CoachMessage } from "@/types";

const STARTER_SUGGESTIONS = [
  "Design a 3-day full body program for hypertrophy",
  "I need a push/pull/legs split — I have a barbell and dumbbells",
  "Create a beginner-friendly upper/lower split",
];

const MAX_IMAGE_DIMENSION = 1024;

/** Resize an image file to fit within MAX_IMAGE_DIMENSION and return a base64 data URL. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setPendingImage(dataUrl);
    } catch {
      setError("Failed to process image");
    }
    // Reset so the same file can be re-selected
    e.target.value = "";
  }, []);

  async function sendMessage(text: string, image?: string | null) {
    if ((!text.trim() && !image) || isLoading) return;

    const userMessage: CoachMessage = {
      role: "user",
      content: text.trim() || (image ? "What do you see in this image?" : ""),
      image: image || undefined,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setPendingImage(null);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.image ? { image: m.image } : {}),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const assistantMessage: CoachMessage = {
        role: "assistant",
        content: data.message.content,
        createdItems: data.message.createdItems,
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input, pendingImage);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="AI Coach" description="Design workouts with AI" />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4">
        {isEmpty && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">What do you want to train?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Describe your goals and I&apos;ll design a workout program. When you&apos;re happy
              with the plan, I&apos;ll add it to your templates automatically.
            </p>
            <div className="space-y-2 w-full max-w-sm">
              {STARTER_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="w-full text-left text-sm p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {/* Show attached image */}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Attached"
                  className="rounded-lg mb-2 max-h-48 object-contain"
                />
              )}

              {msg.content}

              {/* Show created items */}
              {msg.createdItems && msg.createdItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                  {msg.createdItems.map((item, j) => (
                    <div key={j} className="flex items-center gap-2">
                      {item.type === "exercise" ? (
                        <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="text-xs">{item.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="p-3 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image preview */}
      {pendingImage && (
        <div className="border-t px-1 pt-2">
          <div className="relative inline-block">
            <img
              src={pendingImage}
              alt="To attach"
              className="h-20 rounded-lg object-cover"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t pt-3 pb-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex gap-2 items-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="shrink-0 h-[44px] w-[44px]"
            title="Attach image or take photo"
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your training goals..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input, pendingImage)}
            disabled={(!input.trim() && !pendingImage) || isLoading}
            className="shrink-0 h-[44px] w-[44px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
