'use client';

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Guest } from '@/lib/types';

type GuestLineupEditorProps = {
    guests: Guest[];
    initialSelectedIds?: string[];
    name?: string;
};

export function GuestLineupEditor({
    guests,
    initialSelectedIds = [],
    name = 'guest_ids',
}: GuestLineupEditorProps) {
    const selectable = useMemo(
        () => guests.filter((guest) => guest.status !== 'archived'),
        [guests],
    );
    const guestById = useMemo(
        () => new Map(selectable.map((guest) => [guest.id, guest])),
        [selectable],
    );
    const [selectedIds, setSelectedIds] = useState(() =>
        initialSelectedIds.filter((id) => guestById.has(id)),
    );
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function toggleGuest(guestId: string) {
        setSelectedIds((current) =>
            current.includes(guestId)
                ? current.filter((id) => id !== guestId)
                : [...current, guestId],
        );
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        setSelectedIds((current) => {
            const oldIndex = current.indexOf(String(active.id));
            const newIndex = current.indexOf(String(over.id));

            if (oldIndex < 0 || newIndex < 0) {
                return current;
            }

            return arrayMove(current, oldIndex, newIndex);
        });
    }

    return (
        <div className="grid gap-3">
            <p className="text-xs font-semibold uppercase text-muted">Guest order</p>

            {selectedIds.map((guestId) => (
                <input key={guestId} type="hidden" name={name} value={guestId} />
            ))}

            <div className="grid gap-2 md:grid-cols-2">
                {selectable.map((guest) => {
                    const checked = selectedIds.includes(guest.id);

                    return (
                        <label
                            key={guest.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleGuest(guest.id)}
                            />
                            <span className="truncate font-medium">{guest.name}</span>
                        </label>
                    );
                })}
            </div>

            {selectedIds.length ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                        <div className="grid gap-2">
                            {selectedIds.map((guestId, index) => {
                                const guest = guestById.get(guestId);

                                if (!guest) {
                                    return null;
                                }

                                return (
                                    <SortableGuestRow
                                        key={guestId}
                                        guestId={guestId}
                                        name={guest.name}
                                        index={index}
                                    />
                                );
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <p className="text-sm text-muted">
                    Select guests above, then drag to set on-air order.
                </p>
            )}
        </div>
    );
}

function SortableGuestRow({
    guestId,
    name,
    index,
}: {
    guestId: string;
    name: string;
    index: number;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: guestId,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center gap-2 rounded-md border border-line bg-panel-soft px-3 py-2 text-sm"
        >
            <button
                type="button"
                className="grid size-8 place-items-center rounded-md border border-line bg-surface"
                aria-label={`Drag ${name}`}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={14} aria-hidden="true" />
            </button>
            <span className="font-semibold tabular-nums text-muted">{index + 1}.</span>
            <span className="truncate font-medium">{name}</span>
        </div>
    );
}
