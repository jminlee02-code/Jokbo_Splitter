import { UploadedFile } from '@/types';
import { motion } from 'framer-motion';
import { X, GripVertical, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFileListProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}

function SortableFileItem({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-4"
      whileHover={{ scale: 1.01, shadow: 'md' }}
      layout
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{file.name}</p>
        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

export default function SortableFileList({
  files,
  onFilesChange,
  onRemove,
}: SortableFileListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);

      onFilesChange(arrayMove(files, oldIndex, newIndex));
    }
  };

  const handleSortByName = () => {
    const sortedFiles = [...files].sort((a, b) => {
      return a.name.localeCompare(b.name, 'ko', { numeric: true, sensitivity: 'base' });
    });
    onFilesChange(sortedFiles);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 정렬 버튼 */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSortByName}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>파일명 순서대로 정렬</span>
        </motion.button>
      </div>

      {/* 파일 리스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {files.map((file) => (
              <SortableFileItem key={file.id} file={file} onRemove={onRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

