import { useState } from 'react';
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
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DropIndicatorLine({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <div className="h-1 mb-3 rounded-full bg-[#0064FF]" />;
}

/**
 * 연번 입력칸. 사용자가 숫자를 직접 입력해 해당 파일을 원하는 순서로 보낼 수 있게 한다.
 * 입력 중에는 로컬 state(value)만 바뀌고, blur/Enter 시점에 한 번에 커밋한다.
 * 다른 항목의 연번 수정으로 이 항목의 order(prop)가 바뀌면 key={order}로 강제 리마운트되어
 * 항상 최신 값을 보여준다.
 */
function OrderNumberInput({
  order,
  max,
  onCommit,
}: {
  order: number;
  max: number;
  onCommit: (newOrder: number) => void;
}) {
  const [value, setValue] = useState(String(order));

  const commit = () => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed === order) {
      setValue(String(order));
      return;
    }
    onCommit(Math.min(Math.max(1, parsed), max));
  };

  return (
    <input
      type="number"
      min={1}
      max={max}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-12 h-10 shrink-0 text-center font-bold text-gray-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#0064FF] focus:bg-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

interface SortableFileListProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onRemove: (id: string) => void;
}

function SortableFileItem({
  file,
  order,
  totalCount,
  onRemove,
  onChangeOrder,
}: {
  file: UploadedFile;
  order: number;
  totalCount: number;
  onRemove: (id: string) => void;
  onChangeOrder: (newOrder: number) => void;
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
    >
      <OrderNumberInput key={order} order={order} max={totalCount} onCommit={onChangeOrder} />
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over ? String(event.over.id) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);

      onFilesChange(arrayMove(files, oldIndex, newIndex));
    }

    setActiveId(null);
    setOverId(null);
  };

  // 연번 입력으로 파일을 원하는 순서로 이동시킨다 (1-based newOrder).
  const handleReorderByNumber = (fileId: string, newOrder: number) => {
    const oldIndex = files.findIndex((f) => f.id === fileId);
    if (oldIndex === -1) return;

    const newIndex = Math.min(Math.max(0, newOrder - 1), files.length - 1);
    if (newIndex === oldIndex) return;

    onFilesChange(arrayMove(files, oldIndex, newIndex));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // 드래그 중인 항목이 떨어질 위치(파란 줄)를 계산
  // lineIndex === i 이면 i번째 항목 "앞"에 줄을 표시
  const activeIndex = activeId ? files.findIndex((f) => f.id === activeId) : -1;
  const overIndex = overId ? files.findIndex((f) => f.id === overId) : -1;
  let lineIndex: number | null = null;
  if (activeId && overId && activeId !== overId && activeIndex !== -1 && overIndex !== -1) {
    lineIndex = activeIndex < overIndex ? overIndex + 1 : overIndex;
  }

  const handleSortByName = () => {
    const sortedFiles = [...files].sort((a, b) => {
      return a.name.localeCompare(b.name, 'ko', { numeric: true, sensitivity: 'base' });
    });
    onFilesChange(sortedFiles);
  };

  /**
   * 파일명에서 교수님 성함을 추출한다.
   * 예) 날짜_0교시_수업명_ㅁㅁㅁ교수님_작성자_수정(0).pdf
   *
   * 기존에는 무조건 4번째 세그먼트(parts[3])를 교수님으로 가정했는데, 작성자/수정 세그먼트가
   * 없는 파일명(예: 날짜_0교시_수업명_교수님.pdf)에서는 위치가 달라져 확장자까지 포함한
   * 엉뚱한 문자열을 가져오는 문제가 있었다. 대신:
   *  1) "교수" 키워드가 포함된 세그먼트를 우선 찾는다 (가장 확실한 신호).
   *  2) 없으면 날짜/교시 세그먼트를 제외하고, 가장 긴 세그먼트(=수업명)의 바로 다음 세그먼트를
   *     교수님 성함으로 추정한다 (수업명 다음에 교수님이 오는 구조는 항상 유지되는 편).
   */
  const getProfessorFromFileName = (fileName: string): string => {
    const withoutExt = fileName.replace(/\.[a-zA-Z0-9]{1,5}$/, '');
    const parts = withoutExt
      .split('_')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const profSegment = parts.find((p) => p.includes('교수'));
    if (profSegment) {
      return profSegment.replace(/교수님?$/, '').trim();
    }

    const isDateLike = (s: string) => /^\d{6,8}$/.test(s);
    const isPeriodLike = (s: string) => /\d+\s*교시/.test(s);
    const meaningfulParts = parts.filter((p) => !isDateLike(p) && !isPeriodLike(p));

    if (meaningfulParts.length === 0) return '';

    let longestIndex = 0;
    for (let i = 1; i < meaningfulParts.length; i++) {
      if (meaningfulParts[i].length > meaningfulParts[longestIndex].length) {
        longestIndex = i;
      }
    }

    const next = meaningfulParts[longestIndex + 1];
    return (next ?? meaningfulParts[meaningfulParts.length - 1]).trim();
  };

  /** 파일명에서 날짜(YYYYMMDD)와 교시 번호를 추출한다. 같은 교수님의 여러 강의를 정렬할 때
   *  순서가 꼬이지 않도록, 파일명 문자열 비교 대신 날짜/교시를 숫자로 직접 비교한다. */
  const getDateAndPeriod = (fileName: string): { date: number; period: number } => {
    const dateMatch = fileName.match(/\d{6,8}/);
    const date = dateMatch ? parseInt(dateMatch[0], 10) : 0;

    const periodMatch = fileName.match(/(\d{1,2})\s*교시/);
    const period = periodMatch ? parseInt(periodMatch[1], 10) : Number.MAX_SAFE_INTEGER;

    return { date, period };
  };

  const handleSortByProfessor = () => {
    const sortedFiles = [...files].sort((a, b) => {
      const profA = getProfessorFromFileName(a.name);
      const profB = getProfessorFromFileName(b.name);
      const primary = profA.localeCompare(profB, 'ko', { sensitivity: 'base' });
      if (primary !== 0) return primary;

      // 같은 교수님일 경우, 날짜 -> 교시 순으로 정렬해 같은 교수님 강의들이 올바른 순서로 묶이게 한다.
      const dpA = getDateAndPeriod(a.name);
      const dpB = getDateAndPeriod(b.name);
      if (dpA.date !== dpB.date) return dpA.date - dpB.date;
      if (dpA.period !== dpB.period) return dpA.period - dpB.period;

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
      <div className="flex justify-end gap-2">
        <motion.button
          onClick={handleSortByName}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>파일명 순</span>
        </motion.button>
        <motion.button
          onClick={handleSortByProfessor}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span>교수님 성함 순</span>
        </motion.button>
      </div>

      {/* 파일 리스트 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={files.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={file.id}>
                <DropIndicatorLine visible={lineIndex === index} />
                <SortableFileItem
                  file={file}
                  order={index + 1}
                  totalCount={files.length}
                  onRemove={onRemove}
                  onChangeOrder={(newOrder) => handleReorderByNumber(file.id, newOrder)}
                />
              </div>
            ))}
            <DropIndicatorLine visible={lineIndex === files.length} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

