"use client";
import { CheckCircle2, Lock, PlayCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CourseSection, CourseLesson } from "@/types/index";
import { isLessonAvailable } from "@/lib/course-utils";

type Props = {
  sections: CourseSection[];
  completedIds: Set<string>;
  unlockedIds: Set<string>;
  orderCreatedAt: string;
  selectedLessonId: string | null;
  onSelectLesson: (lesson: CourseLesson) => void;
};

export function CourseSidebar({
  sections, completedIds, unlockedIds, orderCreatedAt, selectedLessonId, onSelectLesson,
}: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);

  function toggleSection(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="h-full flex flex-col border-r overflow-hidden">
      <div className="p-4 border-b shrink-0">
        <p className="text-xs font-semibold mb-1.5">{completedIds.size}/{totalLessons} lessons</p>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: totalLessons > 0 ? `${(completedIds.size / totalLessons) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.map(section => {
          const isCollapsed = collapsed.has(section.id);
          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b text-left hover:bg-muted/50 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={13} className="shrink-0" /> : <ChevronDown size={13} className="shrink-0" />}
                <span className="text-xs font-semibold flex-1 truncate">{section.title}</span>
              </button>
              {!isCollapsed && (
                <div>
                  {(section.lessons ?? []).map(lesson => {
                    const available = isLessonAvailable(lesson, orderCreatedAt, unlockedIds);
                    const completed = completedIds.has(lesson.id);
                    const selected = selectedLessonId === lesson.id;
                    const unlockDate = !available ? (() => {
                      const d = new Date(orderCreatedAt);
                      d.setDate(d.getDate() + lesson.drip_days);
                      return d.toLocaleDateString();
                    })() : null;

                    return (
                      <button
                        key={lesson.id}
                        disabled={!available}
                        onClick={() => available && onSelectLesson(lesson)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left border-b transition-colors ${
                          selected ? "bg-primary/10" :
                          available ? "hover:bg-muted/40 cursor-pointer" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <span className="shrink-0">
                          {completed ? <CheckCircle2 size={14} className="text-primary" /> :
                           !available ? <Lock size={14} className="text-muted-foreground" /> :
                           <PlayCircle size={14} className="text-muted-foreground" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{lesson.title}</p>
                          {unlockDate && (
                            <p className="text-xs text-muted-foreground">Available {unlockDate}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
