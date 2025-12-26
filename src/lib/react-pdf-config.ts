/**
 * react-pdf Worker 설정
 * Vite 환경에서 react-pdf를 올바르게 사용하기 위한 설정
 * 배포 환경을 고려한 Worker 경로 설정
 */

import { pdfjs } from 'react-pdf';
// react-pdf가 사용하는 pdfjs-dist의 Worker 파일을 빌드에 포함
import reactPdfWorker from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';

// 배포 환경에서도 작동하도록 Worker 경로 설정
if (typeof window !== 'undefined') {
  // 빌드된 Worker 파일 사용 (로컬 및 배포 환경 모두에서 작동)
  pdfjs.GlobalWorkerOptions.workerSrc = reactPdfWorker;
  
  console.log('react-pdf Worker 설정 완료:', {
    workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
    pdfjsVersion: pdfjs.version,
  });
}

export default pdfjs;

