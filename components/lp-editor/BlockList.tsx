"use client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Lock } from "lucide-react";
import type { Block, BlockType } from "@/types/blocks";
import { LOCKED_BLOCKS } from "@/types/blocks";
import { BLOCK_META } from "@/lib/lp-utils";

type Props = {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

function SortableBlock({ block, selected, onSelect, onDelete }: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const locked = (LOCKED_BLOCKS as BlockType[]).includes(block.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const meta = BLOCK_META[block.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        selected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50 border border-transparent"
      }`}
    >
      {locked ? (
        <Lock size={12} className="text-muted-foreground/40 shrink-0" />
      ) : (
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 touch-none"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      )}

      <span className="text-base shrink-0">{meta.emoji}</span>
      <span className="flex-1 text-sm font-medium truncate">{meta.label}</span>

      {locked ? (
        <span className="text-xs text-muted-foreground/50">locked</span>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export function BlockList({ blocks, selectedId, onSelect, onDelete, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = blocks.findIndex(b => b.id === active.id);
    const toIndex = blocks.findIndex(b => b.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1 p-2">
          {blocks.map(block => (
            <SortableBlock
              key={block.id}
              block={block}
              selected={selectedId === block.id}
              onSelect={() => onSelect(block.id)}
              onDelete={() => onDelete(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
