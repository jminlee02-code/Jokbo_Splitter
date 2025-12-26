import { useState, useCallback, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { motion } from 'framer-motion';
import { Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { EditorFile } from '@/types';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface PageGridProps {
  file: EditorFile;
  onPageToggle: (pageIndex: number) => void;
}

export default function PageGrid({ file, onPageToggle }: PageGridProps) {
  const [numPages, setNumPages] = useState<number>(file.totalPages);
  const [loading, setLoading] = useState(true);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const pageWidth = 180; // 기본 크기 (200에서 180으로 줄임)

  // Document options를 useMemo로 메모이제이션 (경고 방지)
  const documentOptions = useMemo(
    () => ({
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/standard_fonts/',
    }),
    []
  );

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF 로드 오류:', error);
    console.error('에러 상세:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    setLoading(false);
  }, []);

  const isPageSelected = (pageIndex: number) => {
    return file.currentSelectedIndices.includes(pageIndex);
  };

  // 표시할 페이지 목록 계산
  const pagesToShow = useMemo(() => {
    if (showOnlySelected) {
      // 선택된 페이지만 표시
      return file.currentSelectedIndices.sort((a, b) => a - b);
    } else {
      // 모든 페이지 표시
      return Array.from({ length: numPages }, (_, i) => i);
    }
  }, [showOnlySelected, file.currentSelectedIndices, numPages]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{file.originalFile.name}</h2>
        <p className="text-gray-500 mt-1">
          총 {numPages}페이지 중 {file.currentSelectedIndices.length}페이지 선택됨
          {showOnlySelected && ` (${pagesToShow.length}개 표시 중)`}
        </p>
      </div>

      {/* 필터 버튼 */}
      <div className="flex justify-end">
        <motion.button
          onClick={() => setShowOnlySelected(!showOnlySelected)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
            showOnlySelected
              ? 'bg-[#0064FF] text-white hover:bg-blue-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showOnlySelected ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>모든 페이지 보기</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>추출된 페이지만 보기</span>
            </>
          )}
        </motion.button>
      </div>

      {/* PDF 문서 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0064FF]" />
        </div>
      )}

      <Document
        file={file.originalFile.file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0064FF]" />
            <span className="ml-3 text-gray-600">PDF 로드 중...</span>
          </div>
        }
        error={
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold mb-2">PDF 파일을 로드할 수 없습니다.</p>
            <p className="text-sm text-gray-500">파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.</p>
          </div>
        }
        options={documentOptions}
      >
        {/* 페이지 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pagesToShow.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-lg font-medium">선택된 페이지가 없습니다.</p>
              <p className="text-sm mt-2">페이지를 클릭하여 선택해주세요.</p>
            </div>
          ) : (
            pagesToShow.map((pageIndex) => {
              const pageNumber = pageIndex + 1;
              const isSelected = isPageSelected(pageIndex);

            return (
              <motion.div
                key={`page_${pageNumber}`}
                onClick={() => onPageToggle(pageIndex)}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-[#0064FF] shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: pageWidth }}
              >
                {/* 체크 아이콘 */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 z-10 bg-[#0064FF] text-white rounded-full p-1.5 shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                )}

                {/* 페이지 번호 */}
                <div className="absolute bottom-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {pageNumber}
                </div>

                {/* PDF 페이지 */}
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="!w-full !h-auto"
                />
              </motion.div>
            );
            })
          )}
        </div>
      </Document>
    </div>
  );
}

