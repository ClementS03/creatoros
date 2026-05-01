"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseVideoEmbedUrl } from "@/lib/course-utils";
import type { CourseLesson } from "@/types/index";

type Props = {
  lesson: CourseLesson;
  onChange: (updated: CourseLesson) => void;
};

export function LessonForm({ lesson, onChange }: Props) {
  function set<K extends keyof CourseLesson>(key: K, value: CourseLesson[K]) {
    onChange({ ...lesson, [key]: value });
  }

  const embedUrl = lesson.video_url ? parseVideoEmbedUrl(lesson.video_url) : null;

  return (
    <div className="space-y-4 p-4">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Edit lesson</p>

      <div className="space-y-1">
        <Label className="text-xs">Title *</Label>
        <Input value={lesson.title} onChange={e => set("title", e.target.value)} placeholder="Lesson title" />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Video URL</Label>
        <Input
          value={lesson.video_url ?? ""}
          onChange={e => set("video_url", e.target.value || null)}
          placeholder="https://youtube.com/watch?v=..."
        />
        {lesson.video_url && (
          <p className={`text-xs mt-1 ${embedUrl ? "text-green-600" : "text-destructive"}`}>
            {embedUrl ? "✓ Valid URL" : "⚠ Unsupported URL (YouTube or Vimeo only)"}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <textarea
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
          value={lesson.description ?? ""}
          onChange={e => set("description", e.target.value || null)}
          placeholder="What will students learn in this lesson?"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Available after purchase (days)</Label>
        <Input
          type="number"
          min="0"
          value={lesson.drip_days}
          onChange={e => set("drip_days", parseInt(e.target.value, 10) || 0)}
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">0 = available immediately</p>
      </div>
    </div>
  );
}
