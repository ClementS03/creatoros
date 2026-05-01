"use client";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { CourseSection, CourseLesson } from "@/types/index";

function generateId() { return Math.random().toString(36).slice(2, 10); }

type Props = {
  sections: CourseSection[];
  selectedLessonId: string | null;
  onSelectLesson: (lessonId: string, sectionId: string) => void;
  onUpdate: (sections: CourseSection[]) => void;
};

export function SectionList({ sections, selectedLessonId, onSelectLesson, onUpdate }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function addSection() {
    const newSection: CourseSection = {
      id: generateId(),
      product_id: "",
      title: "New section",
      sort_order: sections.length,
      lessons: [],
    };
    onUpdate([...sections, newSection]);
  }

  function deleteSection(sectionId: string) {
    onUpdate(sections.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, sort_order: i })));
  }

  function updateSectionTitle(sectionId: string, title: string) {
    onUpdate(sections.map(s => s.id === sectionId ? { ...s, title } : s));
  }

  function addLesson(sectionId: string) {
    const section = sections.find(s => s.id === sectionId);
    const newLesson: CourseLesson = {
      id: generateId(),
      section_id: sectionId,
      product_id: "",
      title: "New lesson",
      video_url: null,
      description: null,
      drip_days: 0,
      sort_order: section?.lessons?.length ?? 0,
    };
    onUpdate(sections.map(s => s.id === sectionId ? { ...s, lessons: [...(s.lessons ?? []), newLesson] } : s));
    onSelectLesson(newLesson.id, sectionId);
  }

  function deleteLesson(sectionId: string, lessonId: string) {
    onUpdate(sections.map(s => s.id !== sectionId ? s : {
      ...s,
      lessons: (s.lessons ?? []).filter(l => l.id !== lessonId).map((l, i) => ({ ...l, sort_order: i })),
    }));
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sections.findIndex(s => s.id === active.id);
    const to = sections.findIndex(s => s.id === over.id);
    const reordered = [...sections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onUpdate(reordered.map((s, i) => ({ ...s, sort_order: i })));
  }

  function toggleCollapse(sectionId: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
      return next;
    });
  }

  return (
    <div className="space-y-1 p-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(section => (
            <SortableSection
              key={section.id}
              section={section}
              collapsed={collapsed.has(section.id)}
              selectedLessonId={selectedLessonId}
              onToggleCollapse={() => toggleCollapse(section.id)}
              onTitleChange={title => updateSectionTitle(section.id, title)}
              onDelete={() => deleteSection(section.id)}
              onSelectLesson={lessonId => onSelectLesson(lessonId, section.id)}
              onAddLesson={() => addLesson(section.id)}
              onDeleteLesson={lessonId => deleteLesson(section.id, lessonId)}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button size="sm" variant="outline" className="w-full mt-2" onClick={addSection}>
        <Plus size={13} className="mr-1.5" />Add section
      </Button>
    </div>
  );
}

function SortableSection({ section, collapsed, selectedLessonId, onToggleCollapse, onTitleChange, onDelete, onSelectLesson, onAddLesson, onDeleteLesson }: {
  section: CourseSection;
  collapsed: boolean;
  selectedLessonId: string | null;
  onToggleCollapse: () => void;
  onTitleChange: (t: string) => void;
  onDelete: () => void;
  onSelectLesson: (id: string) => void;
  onAddLesson: () => void;
  onDeleteLesson: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="space-y-0.5">
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted/50 rounded-md group">
        <button {...attributes} {...listeners} className="text-muted-foreground cursor-grab shrink-0 touch-none">
          <GripVertical size={13} />
        </button>
        <button onClick={onToggleCollapse} className="text-muted-foreground shrink-0">
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <Input
          value={section.title}
          onChange={e => onTitleChange(e.target.value)}
          className="h-6 text-xs font-semibold border-none bg-transparent px-0 focus-visible:ring-0"
        />
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0">
          <X size={12} />
        </button>
      </div>

      {!collapsed && (
        <div className="ml-4 space-y-0.5">
          {(section.lessons ?? []).map(lesson => (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer group text-xs ${
                selectedLessonId === lesson.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/40 border border-transparent"
              }`}
            >
              <span className="flex-1 truncate">{lesson.title}</span>
              {lesson.drip_days > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">⏳ {lesson.drip_days}d</span>
              )}
              <button
                onClick={e => { e.stopPropagation(); onDeleteLesson(lesson.id); }}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={onAddLesson}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={11} />Add lesson
          </button>
        </div>
      )}
    </div>
  );
}
