'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  parseDragDropContent,
  type DragDropBlock,
  type DragDropContent,
} from '@/lib/missions/parse-drag-drop-content';
import type { MissionPlayerData } from '@/lib/missions/fetch-mission-player';
import { cn } from '@/lib/utils';

const SOURCE_ZONE_ID = 'blok-tersedia';
const DROP_ZONE_ID = 'urutan-perintah';

type DragDropMissionProps = {
  kontenJson: MissionPlayerData['kontenJson'];
  className?: string;
};

function triggerHaptic(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(12);
  }
}

function getZoneId(overId: string, dropOrder: string[]): string | null {
  if (overId === SOURCE_ZONE_ID) return SOURCE_ZONE_ID;
  if (overId === DROP_ZONE_ID) return DROP_ZONE_ID;
  if (dropOrder.includes(overId)) return DROP_ZONE_ID;
  return null;
}

type BlockShellProps = {
  block: DragDropBlock;
  submitted: boolean;
  stepFeedback?: boolean | null;
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLButtonElement | null) => void;
  style: Record<string, string | undefined>;
  isDragging: boolean;
  dragHandleProps: Record<string, unknown>;
  onRemove?: () => void;
};

function BlockShell({
  block,
  submitted,
  stepFeedback = null,
  setNodeRef,
  setActivatorNodeRef,
  style,
  isDragging,
  dragHandleProps,
  onRemove,
}: BlockShellProps) {
  const showFeedback = submitted && stepFeedback !== null;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex min-h-11 items-stretch gap-2 rounded-lg border bg-slate-800/90 transition-shadow',
        isDragging && 'opacity-40 shadow-xl ring-2 ring-sigma-cyan/40',
        submitted && 'pointer-events-none',
        showFeedback === true && 'border-emerald-500/60 bg-emerald-950/40',
        showFeedback === false && 'border-red-500/60 bg-red-950/40',
        !showFeedback && 'border-slate-600'
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={cn(
          'flex min-h-11 min-w-11 shrink-0 touch-none items-center justify-center rounded-l-lg',
          'text-slate-400 hover:bg-slate-700/80 hover:text-sigma-cyan',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigma-cyan'
        )}
        aria-label={`Seret blok ${block.label}`}
        disabled={submitted}
        {...dragHandleProps}
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex min-h-11 flex-1 items-center gap-2 py-2 pr-2">
        <span className="text-lg leading-none" aria-hidden>
          {block.icon}
        </span>
        <span className="flex-1 text-sm font-medium text-slate-100">
          {block.label}
        </span>
        {showFeedback ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center text-base"
            aria-label={stepFeedback ? 'Benar' : 'Salah'}
          >
            {stepFeedback ? '✅' : '❌'}
          </span>
        ) : null}
      </div>

      {onRemove && !submitted ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-r-lg text-slate-400 hover:bg-slate-700/80 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label={`Hapus ${block.label} dari urutan`}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </li>
  );
}

function SourceBlockRow({
  block,
  submitted,
}: {
  block: DragDropBlock;
  submitted: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: block.id,
    data: { blockId: block.id, containerId: SOURCE_ZONE_ID },
    disabled: submitted,
  });

  return (
    <BlockShell
      block={block}
      submitted={submitted}
      setNodeRef={setNodeRef}
      setActivatorNodeRef={setActivatorNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      isDragging={isDragging}
      dragHandleProps={{ ...listeners, ...attributes }}
    />
  );
}

function DropBlockRow({
  block,
  submitted,
  stepFeedback,
  onRemove,
}: {
  block: DragDropBlock;
  submitted: boolean;
  stepFeedback?: boolean | null;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { blockId: block.id, containerId: DROP_ZONE_ID },
    disabled: submitted,
  });

  return (
    <BlockShell
      block={block}
      submitted={submitted}
      stepFeedback={stepFeedback}
      setNodeRef={setNodeRef}
      setActivatorNodeRef={setActivatorNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandleProps={{ ...listeners, ...attributes }}
      onRemove={onRemove}
    />
  );
}

function BlockPreview({ block }: { block: DragDropBlock }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-lg border border-sigma-cyan/50 bg-slate-800 px-3 py-2 shadow-xl opacity-95">
      <GripVertical className="h-5 w-5 text-sigma-cyan" aria-hidden />
      <span className="text-lg" aria-hidden>
        {block.icon}
      </span>
      <span className="text-sm font-medium text-white">{block.label}</span>
    </div>
  );
}

type DropZoneProps = {
  blocks: DragDropBlock[];
  dropOrder: string[];
  submitted: boolean;
  stepFeedback: boolean[] | null;
  onRemove: (blockId: string) => void;
};

function DropZone({
  blocks,
  dropOrder,
  submitted,
  stepFeedback,
  onRemove,
}: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: DROP_ZONE_ID,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] rounded-xl border-2 border-dashed p-3 transition-colors',
        isOver
          ? 'border-sigma-cyan/70 bg-sigma-cyan/5'
          : 'border-slate-600 bg-slate-950/30'
      )}
      aria-label="Urutan perintahmu"
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-sigma-gold">
        Urutan Perintahmu
      </h3>
      {blocks.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Seret blok ke sini untuk menyusun urutan
        </p>
      ) : (
        <SortableContext
          items={dropOrder}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {blocks.map((block, index) => (
              <DropBlockRow
                key={block.id}
                block={block}
                submitted={submitted}
                stepFeedback={stepFeedback?.[index] ?? null}
                onRemove={() => onRemove(block.id)}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  );
}

type SourceZoneProps = {
  blocks: DragDropBlock[];
  submitted: boolean;
};

function SourceZone({ blocks, submitted }: SourceZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: SOURCE_ZONE_ID,
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'rounded-xl border p-3 transition-colors',
        isOver
          ? 'border-sigma-cyan/50 bg-slate-800/80'
          : 'border-slate-700 bg-slate-900/50'
      )}
      aria-label="Blok tersedia"
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Blok Tersedia
      </h3>
      {blocks.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">
          Semua blok sudah di urutanmu
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blocks.map((block) => (
            <SourceBlockRow
              key={block.id}
              block={block}
              submitted={submitted}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function DragDropMissionInner({
  content,
  className,
}: {
  content: DragDropContent;
  className?: string;
}) {
  const blockMap = useMemo(
    () => new Map(content.blok_tersedia.map((b) => [b.id, b])),
    [content.blok_tersedia]
  );

  const [dropOrder, setDropOrder] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<boolean[] | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const sourceBlocks = useMemo(
    () =>
      content.blok_tersedia.filter((block) => !dropOrder.includes(block.id)),
    [content.blok_tersedia, dropOrder]
  );

  const dropBlocks = useMemo(
    () =>
      dropOrder
        .map((id) => blockMap.get(id))
        .filter((b): b is DragDropBlock => b != null),
    [dropOrder, blockMap]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    triggerHaptic();
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeBlockId = String(active.id);
      const overId = String(over.id);
      const activeInDrop = dropOrder.includes(activeBlockId);
      const overZone = getZoneId(overId, dropOrder);

      if (!activeInDrop && overZone === DROP_ZONE_ID) {
        setDropOrder((items) => {
          if (items.includes(activeBlockId)) return items;
          if (overId === DROP_ZONE_ID) return [...items, activeBlockId];
          const overIndex = items.indexOf(overId);
          if (overIndex === -1) return [...items, activeBlockId];
          const next = [...items];
          next.splice(overIndex, 0, activeBlockId);
          return next;
        });
        return;
      }

      if (activeInDrop && overZone === SOURCE_ZONE_ID) {
        setDropOrder((items) => items.filter((id) => id !== activeBlockId));
        return;
      }

      if (activeInDrop && overZone === DROP_ZONE_ID) {
        setDropOrder((items) => {
          const oldIndex = items.indexOf(activeBlockId);
          if (oldIndex === -1) return items;

          let newIndex: number;
          if (overId === DROP_ZONE_ID) {
            newIndex = items.length - 1;
          } else {
            newIndex = items.indexOf(overId);
          }

          if (newIndex === -1 || oldIndex === newIndex) return items;
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [dropOrder]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeBlockId = String(active.id);
      const overId = String(over.id);
      const activeInDrop = dropOrder.includes(activeBlockId);
      const overZone = getZoneId(overId, dropOrder);

      if (!activeInDrop && overZone === DROP_ZONE_ID) {
        setDropOrder((items) => {
          if (items.includes(activeBlockId)) return items;
          if (overId === DROP_ZONE_ID) return [...items, activeBlockId];
          const overIndex = items.indexOf(overId);
          if (overIndex === -1) return [...items, activeBlockId];
          const next = [...items];
          next.splice(overIndex, 0, activeBlockId);
          return next;
        });
        return;
      }

      if (activeInDrop && overZone === SOURCE_ZONE_ID) {
        setDropOrder((items) => items.filter((id) => id !== activeBlockId));
        return;
      }

      if (activeInDrop && overZone === DROP_ZONE_ID) {
        setDropOrder((items) => {
          const oldIndex = items.indexOf(activeBlockId);
          if (oldIndex === -1) return items;

          let newIndex: number;
          if (overId === DROP_ZONE_ID) {
            newIndex = items.length - 1;
          } else {
            newIndex = items.indexOf(overId);
          }

          if (newIndex === -1 || oldIndex === newIndex) return items;
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [dropOrder]
  );

  const handleRemove = useCallback((blockId: string) => {
    triggerHaptic();
    setDropOrder((items) => items.filter((id) => id !== blockId));
  }, []);

  const handleValidate = useCallback(() => {
    const feedback = dropOrder.map(
      (id, index) => id === content.urutan_benar[index]
    );
    const allCorrect =
      dropOrder.length === content.urutan_benar.length &&
      feedback.every(Boolean);

    setStepFeedback(feedback);
    setSubmitted(true);
    setResultMessage(
      allCorrect ? content.penjelasan_benar : content.penjelasan_salah
    );
    triggerHaptic();
  }, [content, dropOrder]);

  const handleRetry = useCallback(() => {
    setDropOrder([]);
    setSubmitted(false);
    setStepFeedback(null);
    setResultMessage(null);
    setActiveId(null);
  }, []);

  const activeBlock = activeId ? blockMap.get(activeId) : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5',
        className
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sigma-cyan">
          Seret & Susun
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {content.instruksi}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SourceZone blocks={sourceBlocks} submitted={submitted} />
          <DropZone
            blocks={dropBlocks}
            dropOrder={dropOrder}
            submitted={submitted}
            stepFeedback={stepFeedback}
            onRemove={handleRemove}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeBlock ? <BlockPreview block={activeBlock} /> : null}
        </DragOverlay>
      </DndContext>

      {resultMessage ? (
        <p
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            stepFeedback?.every(Boolean)
              ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
              : 'border-amber-500/40 bg-amber-950/30 text-amber-100'
          )}
          role="status"
        >
          {resultMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {submitted ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-600 sm:w-auto"
            onClick={handleRetry}
          >
            Coba Lagi
          </Button>
        ) : (
          <Button
            type="button"
            className="w-full bg-sigma-cyan text-sigma-navy hover:bg-sigma-cyan/90 sm:w-auto"
            onClick={handleValidate}
            disabled={dropOrder.length === 0}
          >
            Periksa Urutan
          </Button>
        )}
      </div>
    </div>
  );
}

export function DragDropMission({
  kontenJson,
  className,
}: DragDropMissionProps) {
  const content = parseDragDropContent(kontenJson);

  if (!content) {
    return (
      <div
        className={cn(
          'rounded-xl border border-red-500/40 bg-red-950/20 p-4 text-sm text-red-200',
          className
        )}
      >
        Konten misi drag-and-drop tidak valid. Hubungi guru atau admin ya.
      </div>
    );
  }

  return <DragDropMissionInner content={content} className={className} />;
}
