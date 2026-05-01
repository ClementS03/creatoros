"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CourseSection, CourseLesson } from "@/types/index";
import { SectionList } from "@/components/course-editor/SectionList";
import { LessonForm } from "@/components/course-editor/LessonForm";

type MobileTab = "structure" | "edit";

export default function CourseEditorPage() {
  const params = useParams();
  const productId = params.id as string;

  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("structure");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/courses/${productId}/structure`).then(r => r.json()),
    ]).then(([product, structure]) => {
      setProductName((product as { name: string }).name);
      setSections((structure as Array<CourseSection & { course_lessons?: CourseLesson[] }>).map(s => ({
        ...s,
        lessons: s.course_lessons ?? [],
      })));
      setLoading(false);
    });
  }, [productId]);

  const save = useCallback(async (newSections: CourseSection[]) => {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/courses/${productId}/structure`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSections),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [productId]);

  function triggerSave(newSections: CourseSection[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newSections), 1000);
  }

  function handleUpdate(newSections: CourseSection[]) {
    setSections(newSections);
    triggerSave(newSections);
  }

  function handleSelectLesson(lessonId: string, sectionId: string) {
    setSelectedLessonId(lessonId);
    setSelectedSectionId(sectionId);
    setMobileTab("edit");
  }

  function handleLessonChange(updated: CourseLesson) {
    const newSections = sections.map(s =>
      s.id !== selectedSectionId ? s : {
        ...s,
        lessons: (s.lessons ?? []).map(l => l.id === updated.id ? updated : l),
      }
    );
    handleUpdate(newSections);
  }

  const selectedLesson = sections
    .find(s => s.id === selectedSectionId)
    ?.lessons?.find(l => l.id === selectedLessonId) ?? null;

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 h-14 border-b shrink-0 bg-background gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href={`/dashboard/products/${productId}`}><ArrowLeft size={14} /></Link>
          </Button>
          <span className="text-sm font-medium truncate hidden sm:block">{productName}</span>
          {totalLessons > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {sections.length} sections · {totalLessons} lessons
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={11} className="animate-spin" />Saving…</span>}
          {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} />Saved</span>}
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/courses/${productId}/students`}>Students</Link>
          </Button>
        </div>
      </div>

      <div className="flex lg:hidden border-b shrink-0">
        {(["structure", "edit"] as MobileTab[]).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mobileTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >{tab === "structure" ? "Structure" : "Edit lesson"}</button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`w-full lg:w-72 shrink-0 border-r overflow-y-auto ${mobileTab === "edit" ? "hidden lg:block" : "block"}`}>
          <SectionList
            sections={sections}
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            onUpdate={handleUpdate}
          />
        </div>

        <div className={`flex-1 overflow-y-auto ${mobileTab === "structure" ? "hidden lg:block" : "block"}`}>
          {selectedLesson ? (
            <LessonForm lesson={selectedLesson} onChange={handleLessonChange} />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-8 text-center">
              Select a lesson from the left to edit it, or add a section to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
