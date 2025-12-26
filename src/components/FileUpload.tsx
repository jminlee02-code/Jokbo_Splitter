import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { UploadedFile } from '@/types';

interface FileUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  existingFiles: UploadedFile[];
}

export default function FileUpload({ onFilesChange, existingFiles }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === 'application/pdf'
      );

      if (droppedFiles.length === 0) {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }

      const newFiles: UploadedFile[] = droppedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      }));

      onFilesChange([...existingFiles, ...newFiles]);
    },
    [onFilesChange, existingFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []).filter(
        (file) => file.type === 'application/pdf'
      );

      if (selectedFiles.length === 0) {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }

      const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      }));

      onFilesChange([...existingFiles, ...newFiles]);
      e.target.value = ''; // Reset input
    },
    [onFilesChange, existingFiles]
  );

  return (
    <div className="w-full">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-16 text-center transition-all
          ${isDragging ? 'border-[#0064FF] bg-blue-50' : 'border-gray-300 bg-white'}
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-4"
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-[#0064FF]/10 flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <Upload className="w-8 h-8 text-[#0064FF]" />
          </motion.div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              PDF 파일을 여기에 드래그하거나 클릭해서 업로드하세요
            </p>
            <p className="text-sm text-gray-500 mt-2">
              여러 개의 PDF 파일을 동시에 업로드할 수 있습니다
            </p>
          </div>
        </label>
      </motion.div>
    </div>
  );
}

