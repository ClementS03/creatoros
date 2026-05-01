"use client";
import { useEffect, useRef, useState } from "react";
import { parseVideoEmbedUrl } from "@/lib/course-utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import type { CourseLesson } from "@/types/index";

type Props = {
  lesson: CourseLesson;
  productId: string;
  completed: boolean;
  onComplete: (lessonId: string) => void;
  onNext: (() => void) | null;
};

export function CourseVideoPlayer({ lesson, productId, completed, onComplete, onNext }: Props) {
  const embedUrl = lesson.video_url ? parseVideoEmbedUrl(lesson.video_url) : null;
  const [markedComplete, setMarkedComplete] = useState(completed);

  useEffect(() => {
    setMarkedComplete(completed);
  }, [lesson.id, completed]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) as Record<string, unknown> : event.data as Record<string, unknown>;
        // YouTube ended (state 0)
        if (data?.event === "onStateChange" && data?.info === 0) {
          void handleMarkComplete();
        }
        // Vimeo finish
        if (data?.event === "finish") {
          void handleMarkComplete();
        }
      } catch {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, markedComplete]);

  async function handleMarkComplete() {
    if (markedComplete) return;
    setMarkedComplete(true);
    await fetch(`/api/courses/${productId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: true }),
    });
    onComplete(lesson.id);
  }

  async function handleToggleComplete() {
    const newValue = !markedComplete;
    setMarkedComplete(newValue);
    await fetch(`/api/courses/${productId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, completed: newValue }),
    });
    if (newValue) onComplete(lesson.id);
  }

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="w-full rounded-xl bg-muted aspect-video flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No video set for this lesson</p>
        </div>
      )}

      <div className="space-y-3">
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant={markedComplete ? "default" : "outline"}
            size="sm"
            onClick={handleToggleComplete}
            className="gap-1.5"
          >
            {markedComplete
              ? <><CheckCircle2 size={14} />Completed</>
              : <><Circle size={14} />Mark as complete</>}
          </Button>
          {onNext && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next lesson →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
