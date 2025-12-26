import { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SortableFileList from './components/SortableFileList';
import OptionSelector from './components/OptionSelector';
import { UploadedFile, ExtractionOptions, AnalyzedFile } from './types';
import { ArrowRight } from 'lucide-react';
import { usePDFAnalyzer } from './hooks/usePDFAnalyzer';
import { validateForm } from './utils/validation';
import { saveEditorData } from './lib/indexeddb';

function App() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileName, setFileName] = useState('');
  const [extractionOptions, setExtractionOptions] = useState<ExtractionOptions>({
    intro: false,
    급분바: false,
    문족: false,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [analyzedResults, setAnalyzedResults] = useState<AnalyzedFile[] | null>(null);

  const { analyzePDFs, isAnalyzing } = usePDFAnalyzer();

  const handleFilesChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
    // 파일이 변경되면 검증 오류 초기화
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleFileNameChange = (value: string) => {
    setFileName(value);
    // 파일명이 변경되면 검증 오류 초기화
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleOptionsChange = (options: ExtractionOptions) => {
    setExtractionOptions(options);
    // 옵션이 변경되면 검증 오류 초기화
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleNextStep = async () => {
    // 유효성 검사
    const validation = validateForm(files, fileName, extractionOptions);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // 각 에러를 Toast로 표시
      validation.errors.forEach((error) => {
        toast.error(error, {
          style: {
            background: '#fff',
            color: '#333',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          icon: '❌',
        });
      });
      return;
    }

    // 유효성 검사 통과 시 오류 초기화
    setValidationErrors([]);

    try {
      // PDF 분석 시작
      toast.loading('PDF 파일을 분석하는 중입니다...', {
        id: 'analyzing',
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      });

      const results = await analyzePDFs(files, extractionOptions);

      // 분석 완료
      toast.dismiss('analyzing');
      toast.success('PDF 분석이 완료되었습니다!', {
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '12px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        icon: '✅',
        duration: 3000,
      });

      // 결과 저장 및 콘솔 출력
      setAnalyzedResults(results);
      console.log('=== PDF 분석 결과 ===');
      console.log('파일명:', fileName);
      console.log('선택된 옵션:', extractionOptions);
      console.log('분석 결과:', results);
      
      const totalSize = results.reduce((sum, r) => sum + r.originalFile.size, 0);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
      
      console.log(`\n총 파일 수: ${results.length}개`);
      console.log(`총 용량: ${totalSizeMB}MB`);
      
      results.forEach((result, index) => {
        console.log(
          `\n파일 ${index + 1}: ${result.originalFile.name}`,
          `\n  총 페이지: ${result.totalPages}`,
          `\n  선택된 페이지: [${result.selectedPageIndices.join(', ')}]`,
          `\n  선택된 페이지 수: ${result.selectedPageIndices.length}`
        );
      });

      // IndexedDB에 데이터 저장 (대용량 파일 지원)
      const editorData = {
        files: results.map((r) => ({
          ...r,
          currentSelectedIndices: [...r.selectedPageIndices], // 초기값은 분석 결과
        })),
        fileName,
      };

      // IndexedDB 저장 시도 (실패해도 React Router state로 fallback)
      try {
        // IndexedDB에 저장 (수백 MB ~ 수 GB까지 가능)
        await saveEditorData(editorData);
        console.log(`IndexedDB 저장 완료: ${results.length}개 파일, ${totalSizeMB}MB`);
      } catch (error) {
        console.error('IndexedDB 저장 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        
        // IndexedDB가 실패해도 React Router state로 전달 (경고만 표시)
        console.log('IndexedDB 저장 실패, React Router state로 fallback');
        toast.warning(`IndexedDB 저장 실패. 메모리 모드로 전환합니다. (${errorMessage})`, {
          duration: 3000,
        });
      }
      
      // IndexedDB 성공 여부와 관계없이 React Router state로도 전달 (이중 안전장치)
      console.log('편집기로 이동 중... (React Router state 사용)');
      navigate('/editor', {
        state: {
          editorData,
        },
        replace: false, // 히스토리에 추가
      });
    } catch (error) {
      toast.dismiss('analyzing');
      const errorMessage =
        error instanceof Error ? error.message : 'PDF 분석 중 오류가 발생했습니다.';
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
      console.error('PDF 분석 오류:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
        }}
      />
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* 최종 파일명 입력 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <label
                htmlFor="file-name"
                className="block text-lg font-bold text-gray-900 mb-3"
              >
                최종 파일명
              </label>
              <input
                id="file-name"
                type="text"
                value={fileName}
                onChange={(e) => handleFileNameChange(e.target.value)}
                placeholder="예: 최종_인급문_2024"
                className={`w-full px-4 py-3 rounded-2xl border-2 focus:outline-none transition-colors text-gray-900 ${
                  validationErrors.some((e) => e.includes('파일명'))
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#0064FF]'
                }`}
              />
              {validationErrors.some((e) => e.includes('파일명')) && (
                <p className="text-red-500 text-sm mt-2">
                  {validationErrors.find((e) => e.includes('파일명'))}
                </p>
              )}
            </div>
          </motion.div>

          {/* 파일 업로드 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FileUpload onFilesChange={handleFilesChange} existingFiles={files} />
          </motion.div>

          {/* 파일 리스트 */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                업로드된 파일 ({files.length}개)
              </h3>
              <SortableFileList
                files={files}
                onFilesChange={handleFilesChange}
                onRemove={handleRemoveFile}
              />
            </motion.div>
          )}

          {/* 옵션 선택 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <OptionSelector
              options={extractionOptions}
              onOptionsChange={handleOptionsChange}
            />
          </motion.div>

          {/* 다음 단계 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-4"
          >
            <motion.button
              onClick={handleNextStep}
              disabled={isAnalyzing}
              className="w-full bg-[#0064FF] text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!isAnalyzing ? { scale: 1.02 } : {}}
              whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <span>다음 단계로 (추출하기)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;

