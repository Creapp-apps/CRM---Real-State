'use client';

/*
 * Grilla de fotos reordenable por drag-and-drop (dnd-kit).
 * Funciona en grillas 2D que envuelven (rectSortingStrategy), touch y teclado.
 *
 * Uso:
 *   <SortablePhotos items={photos} getId={(p) => p.uid} onReorder={setPhotos} style={gridStyle}
 *     renderItem={(item, index, drag) => (
 *       <div ref={drag.setNodeRef} {...drag.attributes} {...drag.listeners}
 *            style={{ ...drag.dragStyle, ...tuEstiloDeTile }}>
 *         ...contenido del tile...
 *       </div>
 *     )}
 *   />
 *
 * onReorder recibe el array completo ya reordenado (vía arrayMove).
 * El índice 0 del nuevo array es la portada.
 */

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePhotoItem({ id, item, index, renderItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : undefined,
    touchAction: 'none',
    cursor: 'grab',
  };
  return renderItem(item, index, { setNodeRef, attributes, listeners, dragStyle, isDragging });
}

export default function SortablePhotos({ items, getId, onReorder, renderItem, style }) {
  const sensors = useSensors(
    // distance 6: un click sobre botones internos (quitar/reintentar) no dispara drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((it, i) => String(getId(it, i)));

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div style={style}>
          {items.map((it, i) => (
            <SortablePhotoItem
              key={ids[i]}
              id={ids[i]}
              item={it}
              index={i}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
