/**
 * PDF.js Worker 설정
 * Vite 환경에서 PDF.js Worker를 올바르게 로드하기 위한 설정
 */

import * as pdfjsLib from 'pdfjs-dist';

// 배포 환경에서도 작동하도록 Worker 경로 설정
if (typeof window !== 'undefined') {
  // 프로덕션 빌드에서는 CDN 사용, 개발 환경에서는 로컬 파일 사용
  if (import.meta.env.PROD) {
    // 프로덕션: CDN 사용 (배포 환경에서 안정적으로 작동)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  } else {
    // 개발 환경: 로컬 파일 사용
    try {
      const workerUrl = new URL(
        '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch (error) {
      // 로컬 로드 실패 시 CDN으로 fallback
      console.warn('로컬 Worker 로드 실패, CDN 사용:', error);
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }
  }
  
  console.log('PDF.js Worker 설정 완료:', {
    version: pdfjsLib.version,
    workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
    environment: import.meta.env.PROD ? 'production' : 'development',
  });
}

export default pdfjsLib;

