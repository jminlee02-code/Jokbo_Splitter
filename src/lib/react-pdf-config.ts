/**
 * react-pdf Worker 설정
 * Vite 환경에서 react-pdf를 올바르게 사용하기 위한 설정
 * 배포 환경을 고려한 Worker 경로 설정
 */

import { pdfjs } from 'react-pdf';

// 배포 환경에서도 작동하도록 Worker 경로 설정
if (typeof window !== 'undefined') {
  // 프로덕션 빌드에서는 CDN 사용, 개발 환경에서는 로컬 파일 사용
  if (import.meta.env.PROD) {
    // 프로덕션: react-pdf가 사용하는 pdfjs-dist 버전에 맞는 CDN 사용
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  } else {
    // 개발 환경: 로컬 파일 사용
    try {
      const workerUrl = new URL(
        '../../node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch (error) {
      // 로컬 로드 실패 시 CDN으로 fallback
      console.warn('로컬 Worker 로드 실패, CDN 사용:', error);
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    }
  }
  
  console.log('react-pdf Worker 설정 완료:', {
    workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
    pdfjsVersion: pdfjs.version,
    environment: import.meta.env.PROD ? 'production' : 'development',
  });
}

export default pdfjs;

