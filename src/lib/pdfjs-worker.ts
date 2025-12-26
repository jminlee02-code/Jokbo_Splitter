/**
 * PDF.js Worker 설정
 * Vite 환경에서 PDF.js Worker를 올바르게 로드하기 위한 설정
 */

import * as pdfjsLib from 'pdfjs-dist';
// Worker 파일을 빌드에 포함 (Vite가 자동으로 처리)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// 배포 환경에서도 작동하도록 Worker 경로 설정
if (typeof window !== 'undefined') {
  // 빌드된 Worker 파일 사용 (로컬 및 배포 환경 모두에서 작동)
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  
  console.log('PDF.js Worker 설정 완료:', {
    version: pdfjsLib.version,
    workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
  });
}

export default pdfjsLib;

