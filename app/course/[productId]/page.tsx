"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CourseSidebar } from "@/components/course-player/CourseSidebar";
import { CourseVideoPlayer } from "@/components/course-player/CourseVideoPlayer";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CourseSection, CourseLesson } from "@/types/index";
import { isLessonAvailable } from "@/lib/course-utils";

type MobileTab = "lessons" | "player";

type ProgressData = {
  progress: { lesson_id: string; completed: boolean }[];
  unlockedLessonIds: string[];
  orderCreatedAt: string;
};

export default function CoursePlayerPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [sections, setSections] = useState<CourseSection[]>([]);
  const [productName, setProductName] = useState("");
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("player");

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/courses/${productId}/structure`).then(r => r.json()),
      fetch(`/api/courses/${productId}/progress`).then(r => r.json()),
    ]).then(([product, structure, progress]) => {
      const prod = product as { name: string; type: string; error?: string };
      if (prod.error) { setError("Course not found."); setLoading(false); return; }

      const prog = progress as ProgressData & { error?: string };
      if (prog.error) { setError("You don't have access to this course."); setLoading(false); return; }

      setProductName(prod.name);

      const mappedSections = (structure as Array<CourseSection & { course_lessons?: CourseLesson[] }>).map(s => ({
        ...s,
        lessons: s.course_lessons ?? [],
      }));
      setSections(mappedSections);
      setProgressData(prog);
      setCompletedIds(new Set(prog.progress.filter(p => p.completed).map(p => p.lesson_id)));

      // Auto-select first available lesson
      const unlockedSet = new Set(prog.unlockedLessonIds);
      let firstLesson: CourseLesson | null = null;
      outer: for (const section of mappedSections) {
        for (const lesson of (section.lessons ?? [])) {
          if (isLessonAvailable(lesson, prog.orderCreatedAt, unlockedSet)) {
            firstLesson = lesson;
            break outer;
          }
        }
      }
      if (firstLesson) setSelectedLesson(firstLesson);

      setLoading(false);
    }).catch(() => { setError("Failed to load course."); setLoading(false); });
  }, [productId]);

  function handleLessonComplete(lessonId: string) {
    setCompletedIds(prev => new Set([...prev, lessonId]));
  }

  function getNextLesson(current: CourseLesson): CourseLesson | null {
    const allLessons = sections.flatMap(s => s.lessons ?? []);
    const idx = allLessons.findIndex(l => l.id === current.id);
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{error}</p>
          <Link href="/portal" className="text-sm text-primary underline">Back to my purchases</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 h-12 border-b shrink-0 bg-background gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/portal" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <span className="text-sm font-medium truncate">{productName}</span>
        </div>
      </div>

      <div className="flex lg:hidden border-b shrink-0">
        {(["lessons", "player"] as MobileTab[]).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              mobileTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >{tab}</button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-full lg:w-72 shrink-0 overflow-hidden ${mobileTab === "player" ? "hidden lg:block" : "block"}`}>
          {progressData && (
            <CourseSidebar
              sections={sections}
              completedIds={completedIds}
              unlockedIds={new Set(progressData.unlockedLessonIds)}
              orderCreatedAt={progressData.orderCreatedAt}
              selectedLessonId={selectedLesson?.id ?? null}
              onSelectLesson={lesson => { setSelectedLesson(lesson); setMobileTab("player"); }}
            />
          )}
        </div>

        <div className={`flex-1 overflow-y-auto p-6 ${mobileTab === "lessons" ? "hidden lg:block" : "block"}`}>
          {selectedLesson && progressData ? (
            <CourseVideoPlayer
              lesson={selectedLesson}
              productId={productId}
              completed={completedIds.has(selectedLesson.id)}
              onComplete={handleLessonComplete}
              onNext={(() => {
                const next = getNextLesson(selectedLesson);
                return next ? () => setSelectedLesson(next) : null;
              })()}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Select a lesson to start
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
