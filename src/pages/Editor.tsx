import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Download, Loader2, ArrowLeft } from 'lucide-react';
import { EditorFile, AnalyzedFile } from '@/types';
import FileSidebar from '@/components/editor/FileSidebar';
import PageGrid from '@/components/editor/PageGrid';
import { mergePDFs } from '@/lib/pdf-merger';
import { loadEditorData } from '@/lib/indexeddb';
import '@/lib/react-pdf-config'; // Worker 설정 로드

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Shift 범위 선택의 기준(앵커)이 되는 마지막 클릭 페이지. 파일을 바꾸면 초기화됨.
  const lastClickedPageIndexRef = useRef<number | null>(null);

  useEffect(() => {
    lastClickedPageIndexRef.current = null;
  }, [currentFileIndex]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        console.log('편집기 데이터 로드 시작...');
        console.log('location.state:', location.state);
        
        // 1. React Router state에서 데이터 로드 (우선 - 작은 파일용)
        const stateData = location.state?.editorData;
        
        if (stateData) {
          console.log('React Router state 데이터 발견:', {
            files: stateData.files?.length || 0,
            fileName: stateData.fileName,
          });
          
          if (stateData.files && stateData.files.length > 0) {
            console.log('React Router state에서 데이터 로드:', stateData.files.length, '개 파일');
            
            const editorFiles: EditorFile[] = stateData.files.map((result: AnalyzedFile, index: number) => {
              console.log(`파일 ${index + 1} 처리 중:`, result.originalFile?.name);
              
              if (!result.originalFile) {
                throw new Error(`파일 데이터가 올바르지 않습니다: 파일 ${index + 1}`);
              }
              
              if (!result.originalFile.file) {
                throw new Error(`File 객체가 없습니다: ${result.originalFile.name}`);
              }
              
              return {
                ...result,
                currentSelectedIndices: result.selectedPageIndices || [],
              };
            });
            
            setFiles(editorFiles);
            setFileName(stateData.fileName || '병합된_파일');
            setIsLoading(false);
            console.log('✅ React Router state 데이터 로드 완료:', editorFiles.length, '개 파일');
            return;
          } else {
            console.warn('React Router state에 files가 없거나 비어있습니다.');
          }
        } else {
          console.log('React Router state에 editorData가 없습니다.');
        }

        // 2. IndexedDB에서 데이터 로드 (대용량 파일용)
        console.log('IndexedDB에서 데이터 로드 시도...');
        const loadedData = await loadEditorData();
        
        if (loadedData && loadedData.files && loadedData.files.length > 0) {
          console.log('IndexedDB 데이터 발견:', loadedData.files.length, '개 파일');
          
          // File 객체가 제대로 복원되었는지 확인
          const editorFiles: EditorFile[] = loadedData.files.map((fileData: any) => {
            if (!fileData.originalFile || !fileData.originalFile.file) {
              throw new Error(`파일 데이터가 올바르지 않습니다: ${fileData.originalFile?.name || '알 수 없음'}`);
            }
            
            return {
              originalFile: {
                id: fileData.originalFile.id,
                file: fileData.originalFile.file,
                name: fileData.originalFile.name,
                size: fileData.originalFile.size,
              },
              selectedPageIndices: fileData.selectedPageIndices || [],
              currentSelectedIndices: fileData.currentSelectedIndices || fileData.selectedPageIndices || [],
              totalPages: fileData.totalPages,
            };
          });
          
          setFiles(editorFiles);
          setFileName(loadedData.fileName || '병합된_파일');
          
          const totalSize = editorFiles.reduce((sum, f) => sum + f.originalFile.size, 0);
          const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
          console.log(`IndexedDB에서 데이터 로드 완료: ${editorFiles.length}개 파일, ${totalSizeMB}MB`);
          setIsLoading(false);
          return;
        } else {
          console.warn('IndexedDB에 데이터가 없거나 비어있습니다.');
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setLoadError(errorMessage);
        toast.error(`데이터를 불러오는데 실패했습니다: ${errorMessage}`, {
          duration: 5000,
          icon: '❌', // 실제 오류이므로 X 표시 유지
        });
        setIsLoading(false);
        
        // 에러 발생 시 3초 후 메인 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/');
        }, 3000);
        return;
      }

      // 3. 데이터가 없으면 메인 페이지로 리다이렉트
      console.warn('편집할 데이터가 없습니다.');
      setLoadError('편집할 데이터가 없습니다.');
      toast.error('편집할 데이터가 없습니다. 메인 페이지로 이동합니다.', {
        duration: 3000,
        icon: '💡', // 사용자 안내이므로 전구 이모지 사용
      });
      setIsLoading(false);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    };

    loadData();
  }, [location.state, navigate]);

  const handlePageToggle = (pageIndex: number, shiftKey: boolean = false) => {
    if (files.length === 0) return;

    const updatedFiles = [...files];
    const currentFile = updatedFiles[currentFileIndex];
    const selectedSet = new Set(currentFile.currentSelectedIndices);

    const anchor = lastClickedPageIndexRef.current;

    if (shiftKey && anchor !== null) {
      // Shift 범위 선택: 마지막으로 클릭한 페이지부터 이번에 클릭한 페이지까지 전부 선택
      const start = Math.min(anchor, pageIndex);
      const end = Math.max(anchor, pageIndex);
      for (let i = start; i <= end; i++) {
        selectedSet.add(i);
      }
    } else {
      // 일반 클릭: 토글
      if (selectedSet.has(pageIndex)) {
        selectedSet.delete(pageIndex);
      } else {
        selectedSet.add(pageIndex);
      }
      lastClickedPageIndexRef.current = pageIndex;
    }

    currentFile.currentSelectedIndices = Array.from(selectedSet).sort((a, b) => a - b);
    updatedFiles[currentFileIndex] = currentFile;
    setFiles(updatedFiles);
  };

  const handleMergeAndDownload = async () => {
    if (files.length === 0) {
      toast.error('병합할 파일이 없습니다.', {
        icon: '💡', // 사용자 안내이므로 전구 이모지 사용
      });
      return;
    }

    setIsMerging(true);
    toast.loading('PDF 파일을 병합하는 중입니다...', {
      id: 'merging',
      style: {
        background: '#fff',
        color: '#333',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    });

    try {
      const mergedPdf = await mergePDFs(files);
      
      // 다운로드
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || '병합된_파일'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss('merging');
      toast.success('PDF 병합 및 다운로드가 완료되었습니다! 🎉', {
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        icon: '✅',
        duration: 4000,
      });
    } catch (error) {
      toast.dismiss('merging');
      const errorMessage =
        error instanceof Error ? error.message : 'PDF 병합 중 오류가 발생했습니다.';
      toast.error(errorMessage, {
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        icon: '❌',
        duration: 4000,
      });
      console.error('PDF 병합 오류:', error);
    } finally {
      setIsMerging(false);
    }
  };

  const handleBack = async () => {
    if (confirm('편집기를 나가시겠습니까? 변경사항이 저장되지 않을 수 있습니다.')) {
      // IndexedDB 데이터 정리 (선택사항)
      // await clearEditorData();
      navigate('/');
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#0064FF] mb-4" />
        <p className="text-gray-600 font-medium">편집기 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 발생
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">데이터 로드 실패</h2>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#0064FF] text-white font-bold py-3 px-6 rounded-2xl hover:bg-blue-600 transition-colors"
          >
            메인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 파일이 없음
  if (files.length === 0) {
    return (
      <div className="min-h-screen bg-[#F2F4F6] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">편집할 파일이 없습니다</h2>
          <p className="text-gray-600 mb-6">메인 페이지에서 PDF를 업로드하고 분석해주세요.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#0064FF] text-white font-bold py-3 px-6 rounded-2xl hover:bg-blue-600 transition-colors"
          >
            메인 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentFile = files[currentFileIndex];

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <Toaster position="top-center" />
      
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">PDF 편집기</h1>
          </div>
          <motion.button
            onClick={handleMergeAndDownload}
            disabled={isMerging}
            className="bg-[#0064FF] text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!isMerging ? { scale: 1.05 } : {}}
            whileTap={!isMerging ? { scale: 0.95 } : {}}
          >
            {isMerging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>병합 중...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>PDF 병합하여 다운로드</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 좌측 사이드바 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <FileSidebar
            files={files}
            currentFileIndex={currentFileIndex}
            onFileSelect={setCurrentFileIndex}
          />
        </div>

        {/* 우측 메인 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          <PageGrid
            file={currentFile}
            onPageToggle={handlePageToggle}
          />
        </div>
      </div>
    </div>
  );
}

