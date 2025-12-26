import { useState, useCallback } from 'react';
import pdfjsLib from '@/lib/pdfjs-worker';
import { UploadedFile, ExtractionOptions, AnalyzedFile } from '@/types';

interface UsePDFAnalyzerReturn {
  analyzePDFs: (
    files: UploadedFile[],
    options: ExtractionOptions
  ) => Promise<AnalyzedFile[]>;
  isAnalyzing: boolean;
  error: string | null;
}

/**
 * PDF 파일들을 분석하고 선택된 페이지를 결정하는 커스텀 훅
 */
export function usePDFAnalyzer(): UsePDFAnalyzerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 텍스트 정규화: 한글만 남기기
   * 로마자, 숫자, 공백, 특수문자를 모두 제거하고 오직 한글만 남김
   */
  const normalizeText = (text: string): string => {
    return text.replace(/[^가-힣]/g, ''); // 한글을 제외한 모든 문자(공백 포함) 제거
  };

  /**
   * 단일 PDF 파일을 분석합니다
   */
  const analyzeSinglePDF = async (
    file: UploadedFile,
    options: ExtractionOptions
  ): Promise<AnalyzedFile> => {
    try {
      console.log(`PDF 분석 시작: ${file.name}`);
      const arrayBuffer = await file.file.arrayBuffer();
      console.log(`PDF 파일 로드 완료: ${file.name}, 크기: ${arrayBuffer.byteLength} bytes`);
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // 로그 레벨 낮춤
      });
      
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      console.log(`PDF 페이지 수: ${totalPages}`);

      // 키워드 정의
      const GEUPBUNBA_KEYWORDS = ['급분바', '끕뿐빠', '끕쁀뺘']; // 급분바 변형어 목록
      const MUNJOK_KEYWORD = '문족';

      // 상태 머신 변수
      let isGeupbunba = false;
      let isMunjok = false;
      const resultIndices = new Set<number>();

      // 키워드 발견 추적 (디버깅용)
      let geupbunbaFound = false;
      let munjokFound = false;

      console.log(`=== PDF 분석 시작: ${file.name} ===`);
      console.log(`총 페이지 수: ${totalPages}`);
      if (options.intro) console.log('✓ 인트로 옵션 활성화');
      if (options.급분바) console.log(`✓ 급분바 옵션 활성화: 키워드 [${GEUPBUNBA_KEYWORDS.join(', ')}]`);
      if (options.문족) console.log(`✓ 문족 옵션 활성화: 키워드 [${MUNJOK_KEYWORD}]`);

      // 모든 페이지를 순회하며 상태 머신으로 분석
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageIndex = pageNum - 1; // 0-based index
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items; // 텍스트 조각들

        // 페이지 내에서 키워드 발견 여부 추적
        let foundMunjokInPage = false;
        let foundGeupbunbaInPage = false;

        // 페이지 내의 모든 텍스트 아이템을 검사
        items.forEach((item, itemIndex) => {
          // str 속성이 없는 경우 건너뛰기
          if (!('str' in item) || typeof item.str !== 'string') return;

          // 1. [중요] Mac OS 호환성을 위한 NFC 정규화 (자모 합치기)
          const rawStr = item.str.normalize('NFC');
          const cleanStr = rawStr.replace(/\s/g, ''); // 공백 제거 버전

          // 2. [핵심] 목차(Table of Contents) 강력 필터링
          // 라인의 끝이 숫자로 끝나면(예: "문족 41", "급분바 ... 5") 목차일 확률이 99%이므로 무시.
          // 정규식: 끝에 숫자가 있고, 그 앞에 점(.)이나 공백이 있는 경우 등
          if (/[\.\…\s]+\d+$/.test(rawStr) || /^\d+$/.test(cleanStr)) {
            console.log(`[Page ${pageIndex}] 목차/페이지번호 감지되어 무시: "${rawStr}"`);
            return;
          }

          // 점선(...)이 2개 이상 있는 경우도 목차로 판단
          if (rawStr.includes('..') || rawStr.includes('…')) {
            console.log(`[Page ${pageIndex}] 목차 점선 감지되어 무시: "${rawStr}"`);
            return;
          }

          // 3. 한글만 남기기 (로마자/특수문자 제거)
          const text = cleanStr.replace(/[^가-힣]/g, '');

          // [New] 4. 헤더 유효성 검사 (위치 및 길이 제한)
          // 상단 20개 아이템 이후거나, 텍스트가 너무 길면(50자 이상) -> 헤더 아님 -> 상태 변경 로직 건너뜀
          const isHeaderCandidate = itemIndex < 20 && text.length < 50 && text.length > 0;

          if (!isHeaderCandidate) {
            // 헤더 후보가 아니면 키워드 검사 건너뛰기 (본문 내용 무시)
            return;
          }

          // 5. 키워드 감지 (헤더 후보일 때만)
          const hasMunjok = text.includes(MUNJOK_KEYWORD);
          const hasGeupbunba = GEUPBUNBA_KEYWORDS.some(k => text.includes(k));

          // [Logic Fix] 상태 전환 우선순위 재조정
          // 급분바 발견 시 강제로 문족을 끄고 전환 (목차 오인식으로 잘못 켜진 경우 대비)
          if (hasGeupbunba) {
            foundGeupbunbaInPage = true;
            geupbunbaFound = true;
            console.log(`[Page ${pageIndex}] Header Found (급분바): "${rawStr}" (Item #${itemIndex})`);
          }
          // 문족 시작 감지
          else if (hasMunjok) {
            foundMunjokInPage = true;
            munjokFound = true;
            console.log(`[Page ${pageIndex}] Header Found (문족): "${rawStr}" (Item #${itemIndex})`);
          }
        });

        // --- [중요] 상태 변경은 페이지 단위로 처리 ---
        // [Logic Fix] 급분바 우선 처리: 급분바 발견 시 문족 상태를 강제로 끄고 전환
        if (foundGeupbunbaInPage) {
          if (isMunjok) {
            console.log(`[Page ${pageIndex}] ⚠️ 급분바 섹션 헤더 발견! 문족 상태 강제 해제 (State Switched to Geupbunba)`);
          } else if (!isGeupbunba) {
            console.log(`[Page ${pageIndex}] ✓ 급분바 섹션 헤더 발견! (State Switched to Geupbunba)`);
          }
          isGeupbunba = true;  // 급분바 시작
          isMunjok = false;    // [중요] 문족 모드 강제 해제 (잘못 켜진 경우 대비)
        }
        // 문족이 발견된 페이지에서 상태 변경
        else if (foundMunjokInPage) {
          if (isGeupbunba) {
            console.log(`[Page ${pageIndex}] ⚠️ 문족 섹션 헤더 발견! 급분바 종료 (State Switched to Munjok)`);
          } else {
            console.log(`[Page ${pageIndex}] ✓ 문족 섹션 헤더 발견! (State Switched to Munjok)`);
          }
          isGeupbunba = false; // 급분바 종료
          isMunjok = true;     // 문족 시작
        }

        // --- 페이지 선택 (Capture Logic) ---
        
        // 1. 인트로: 무조건 0페이지 (index 0) 딱 한 장만. (옵션 켜져있을 시)
        if (options.intro && pageIndex === 0) {
          resultIndices.add(pageIndex);
        }

        // 2. 급분바: 플래그가 True이고 + 옵션이 켜져있으면 선택
        if (options.급분바 && isGeupbunba) {
          resultIndices.add(pageIndex);
        }

        // 3. 문족: 플래그가 True이고 + 옵션이 켜져있으면 선택
        if (options.문족 && isMunjok) {
          resultIndices.add(pageIndex);
        }

        // 디버깅 로그: 페이지별 상태 출력
        if (foundMunjokInPage || foundGeupbunbaInPage || isGeupbunba || isMunjok || pageIndex === 0) {
          console.log(`Page ${pageIndex} | Found: G=${foundGeupbunbaInPage}, M=${foundMunjokInPage} | Flags: G=${isGeupbunba}, M=${isMunjok} | Selected: ${resultIndices.has(pageIndex)}`);
        }
      }

      // 키워드를 찾지 못한 경우 경고
      if (options.급분바 && !geupbunbaFound) {
        console.warn(`⚠️ 급분바 키워드를 찾지 못했습니다: [${GEUPBUNBA_KEYWORDS.join(', ')}]`);
      }
      if (options.문족 && !munjokFound) {
        console.warn(`⚠️ 문족 키워드를 찾지 못했습니다: [${MUNJOK_KEYWORD}]`);
      }

      // Set을 배열로 변환하고 정렬
      const sortedIndices = Array.from(resultIndices).sort((a, b) => a - b);
      
      const result = {
        originalFile: file,
        selectedPageIndices: sortedIndices,
        totalPages,
      };
      
      console.log(`=== PDF 분석 완료: ${file.name} ===`, {
        총페이지: totalPages,
        선택된페이지: result.selectedPageIndices,
        선택된페이지수: result.selectedPageIndices.length,
        인트로: options.intro ? '활성화' : '비활성화',
        급분바: options.급분바 ? (geupbunbaFound ? '발견됨' : '미발견') : '비활성화',
        문족: options.문족 ? (munjokFound ? '발견됨' : '미발견') : '비활성화',
      });
      
      // 키워드를 찾지 못한 경우 경고
      if (result.selectedPageIndices.length === 0 && (options.급분바 || options.문족)) {
        console.warn(`⚠️ 경고: 선택된 페이지가 없습니다. 키워드를 찾지 못했을 수 있습니다.`);
      }
      
      return result;
    } catch (err) {
      console.error(`PDF 분석 실패: ${file.name}`, err);
      
      // 더 자세한 에러 메시지
      let errorMessage = `PDF 분석 실패: ${file.name}`;
      
      if (err instanceof Error) {
        errorMessage += ` - ${err.message}`;
        
        // 특정 에러 타입에 대한 메시지
        if (err.message.includes('worker')) {
          errorMessage += ' (Worker 로드 실패)';
        } else if (err.message.includes('Invalid PDF')) {
          errorMessage += ' (유효하지 않은 PDF 파일)';
        } else if (err.message.includes('password')) {
          errorMessage += ' (비밀번호가 필요한 PDF)';
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  /**
   * 여러 PDF 파일을 순서대로 분석합니다
   */
  const analyzePDFs = useCallback(
    async (
      files: UploadedFile[],
      options: ExtractionOptions
    ): Promise<AnalyzedFile[]> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const results: AnalyzedFile[] = [];

        // 각 파일을 순서대로 분석
        for (const file of files) {
          const analyzed = await analyzeSinglePDF(file, options);
          results.push(analyzed);
        }

        setIsAnalyzing(false);
        return results;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'PDF 분석 중 오류가 발생했습니다.';
        setError(errorMessage);
        setIsAnalyzing(false);
        throw err;
      }
    },
    []
  );

  return {
    analyzePDFs,
    isAnalyzing,
    error,
  };
}

