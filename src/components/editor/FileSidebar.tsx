import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { EditorFile } from '@/types';

interface FileSidebarProps {
  files: EditorFile[];
  currentFileIndex: number;
  onFileSelect: (index: number) => void;
}

export default function FileSidebar({
  files,
  currentFileIndex,
  onFileSelect,
}: FileSidebarProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">파일 목록</h2>
      <div className="space-y-2">
        {files.map((file, index) => {
          const isActive = index === currentFileIndex;
          const selectedCount = file.currentSelectedIndices.length;

          return (
            <motion.button
              key={file.originalFile.id}
              onClick={() => onFileSelect(index)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                isActive
                  ? 'bg-[#0064FF] text-white shadow-lg'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <FileText
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold truncate ${
                      isActive ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {file.originalFile.name}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      isActive ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {selectedCount} / {file.totalPages} 페이지 선택됨
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

