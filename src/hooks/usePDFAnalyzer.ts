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

// 급분바 계열 헤더 키워드. '앞분바'(문서 앞쪽에 오는 급분바)라는 단어로 등장하기도 하고,
// 급분바의 압축/변형 표기(끕쁀뺘, 끕뿐빠, 끕쁀빠, 끕뿐뺘 등)로 등장하기도 한다.
// 어떤 키워드로 등장하든 전부 같은 '급분바'로 취급한다.
const BUNBA_FAMILY_KEYWORDS = [
  '급분바',
  '앞분바',
  '끕쁀뺘',
  '끕뿐빠',
  '끕쁀빠',
  '끕뿐뺘',
  '앞쁀뺘',
  '앞뿐빠',
  '앞뿐뺘',
  '앞쁀빠',
];
const MUNJOK_KEYWORD = '문족';

// 문서 내 한 섹션을 나타내는 상태
type Section = 'frontBunba' | 'pilJok' | 'geupBunba' | 'munJok';

/**
 * 정제된 텍스트가 특정 구분 키워드의 "헤더 라벨"인지 판단.
 * 키워드와 완전히 같거나, 키워드로 시작하면서 부가 문자가 아주 짧게만 붙은 경우만 인정한다.
 * 이렇게 하면 "미리보는 문족"처럼 키워드가 뒤에 붙은 긴 문구(디코이)를 헤더로 오인하지 않는다.
 */
function matchesSectionLabel(cleanText: string, keyword: string): boolean {
  if (!cleanText) return false;
  if (cleanText === keyword) return true;
  return cleanText.startsWith(keyword) && cleanText.length <= keyword.length + 3;
}

function matchBunbaFamily(cleanText: string): string | null {
  for (const keyword of BUNBA_FAMILY_KEYWORDS) {
    if (matchesSectionLabel(cleanText, keyword)) return keyword;
  }
  return null;
}

/**
 * PDF 파일들을 분석하고 선택된 페이지를 결정하는 커스텀 훅
 */
export function usePDFAnalyzer(): UsePDFAnalyzerReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 단일 PDF 파일을 분석합니다
   *
   * 문서 구조(고정 순서): 인트로(1p) → (앞분바) → 필족(본문) → 급분바 → 문족
   * - 앞분바와 급분바는 사실상 같은 섹션이며 '급분바' 옵션 하나로 통합 추출한다.
   *   앞분바는 필족 도달 전에, 급분바는 필족 도달 후에 등장하는 차이만 있을 뿐이다.
   * - 앞분바는 헤더가 찍힌 그 페이지 한 장만 선택한다. 앞분바가 여러 페이지에 걸쳐 있는 경우
   *   다음 섹션(필족) 시작을 안정적으로 판별할 방법이 없어, 과다 추출(족보 전체 선택)보다
   *   과소 추출(필요하면 수동으로 페이지 추가)이 안전하다는 판단으로 단순화했다.
   * - 급분바(필족 이후)는 그 뒤에 순서상 문족만 올 수 있으므로, 급분바 헤더를 본 이후 페이지는
   *   문족 헤더가 나오기 전까지 계속 급분바로 간주한다(종결 전까지 점착 상태 유지).
   * - 문족은 한 번 시작되면 파일 끝까지 이어지는 마지막 섹션이다(종결 상태).
   *   단, "미리보는 문족"처럼 문족 키워드가 포함된 긴 문구는 실제 문족 시작으로 오인하지 않는다.
   */
  const analyzeSinglePDF = async (
    file: UploadedFile,
    options: ExtractionOptions
  ): Promise<AnalyzedFile> => {
    try {
      console.log(`PDF 분석 시작: ${file.name}`);
      const arrayBuffer = await file.file.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
      });

      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      console.log(`PDF 페이지 수: ${totalPages}`);

      const resultIndices = new Set<number>();

      let isMunjok = false; // 종결 상태: 한 번 켜지면 끝까지 유지
      let pilJokReached = false; // 필족(본문)에 한 번이라도 도달했는지 (앞분바/급분바 구분 기준)
      let isGeupBunbaActive = false; // 점착 상태: 필족 이후 급분바 헤더를 본 순간부터 문족 전까지 유지

      let frontBunbaFound = false;
      let geupBunbaFound = false;
      let munjokFound = false;

      console.log(`=== PDF 분석 시작: ${file.name} ===`);
      if (options.intro) console.log('✓ 인트로 옵션 활성화');
      if (options.필족) console.log('✓ 필족 옵션 활성화');
      if (options.급분바) console.log(`✓ 급분바 옵션 활성화: 키워드 [${BUNBA_FAMILY_KEYWORDS.join(', ')}]`);
      if (options.문족) console.log(`✓ 문족 옵션 활성화: 키워드 [${MUNJOK_KEYWORD}]`);

      // 1페이지(index 0)는 항상 인트로. 상태 머신에는 영향을 주지 않는다.
      if (options.intro && totalPages > 0) {
        resultIndices.add(0);
      }

      for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
        const pageIndex = pageNum - 1; // 0-based index
        const page = await pdf.getPage(pageNum);
        const [textContent, viewport] = await Promise.all([
          page.getTextContent(),
          Promise.resolve(page.getViewport({ scale: 1 })),
        ]);
        const pageHeight = viewport.height || 1;
        const items = textContent.items;

        // 1차 패스: 유효 텍스트 항목을 모으고, 본문 폰트 크기(중간값)를 계산한다.
        // 새 챕터(I, II, ...) 제목은 페이지 맨 위가 아니라 중간에서 시작할 수도 있어 위치만으로는
        // 부족하다. fontName에 "Bold" 같은 의미있는 이름이 들어있는 PDF도 있지만, 실제로는
        // "g_d5_f1"처럼 폰트가 난독화되어 굵기 정보를 전혀 알 수 없는 문서도 많다. 그래서
        // 헤더 판정은 "페이지 상단" 또는 "본문보다 큰 글꼴" 또는 "Bold 글꼴명" 중 하나라도
        // 만족하면 후보로 인정하는 OR 조건으로 판단한다(굵기 정보가 없으면 자동으로 무시됨).
        const candidates: Array<{
          rawStr: string;
          cleanStr: string;
          topFraction: number;
          height: number;
          fontName: string;
        }> = [];

        for (const item of items) {
          if (!('str' in item) || typeof item.str !== 'string') continue;

          // Mac OS 호환성을 위한 NFC 정규화 (자모 합치기)
          const rawStr = item.str.normalize('NFC');
          const cleanStr = rawStr.replace(/\s/g, '');
          if (!cleanStr) continue;

          // 목차(Table of Contents) 필터링: 끝이 숫자로 끝나거나, 점선이 포함된 경우
          if (/[.…\s]+\d+$/.test(rawStr) || /^\d+$/.test(cleanStr)) continue;
          if (rawStr.includes('..') || rawStr.includes('…')) continue;

          const yPos = item.transform[5];
          const topFraction = 1 - yPos / pageHeight;

          candidates.push({
            rawStr,
            cleanStr,
            topFraction,
            height: item.height || 0,
            fontName: item.fontName || '',
          });
        }

        const sortedHeights = candidates
          .map((c) => c.height)
          .filter((h) => h > 0)
          .sort((a, b) => a - b);
        const medianHeight =
          sortedHeights.length > 0 ? sortedHeights[Math.floor(sortedHeights.length / 2)] : 0;

        let bunbaKeywordOnPage: string | null = null;
        let munjokOnPage = false;

        // 2차 패스: 헤더 후보(상단 위치 OR 큰 글꼴 OR 굵은 글꼴명)만 키워드 검사 대상으로 삼는다.
        for (const c of candidates) {
          const isTopOfPage = c.topFraction <= 0.25;
          const isLargeFont = medianHeight > 0 && c.height >= medianHeight * 1.08;
          const isBoldFont = /bold/i.test(c.fontName);
          if (!isTopOfPage && !isLargeFont && !isBoldFont) continue;

          // 한글만 남기기 (로마자/특수문자 제거)
          const text = c.cleanStr.replace(/[^가-힣]/g, '');
          if (!text) continue;

          if (matchesSectionLabel(text, MUNJOK_KEYWORD)) {
            munjokOnPage = true;
          } else if (!bunbaKeywordOnPage) {
            bunbaKeywordOnPage = matchBunbaFamily(text);
          }
        }

        // --- 상태 갱신 (페이지 단위) ---
        let currentSection: Section;

        if (isMunjok || munjokOnPage) {
          if (!isMunjok) {
            console.log(`[Page ${pageIndex}] ✓ 문족 헤더 발견! (종결 상태로 전환)`);
            munjokFound = true;
          }
          isMunjok = true;
          isGeupBunbaActive = false;
          currentSection = 'munJok';
        } else if (isGeupBunbaActive) {
          // 필족 이후 한 번 급분바에 진입했다면, 문족이 시작되기 전까지는
          // 헤더가 반복되지 않아도 계속 급분바 섹션으로 취급한다 (순서상 이 뒤엔 문족만 올 수 있음).
          currentSection = 'geupBunba';
        } else if (bunbaKeywordOnPage) {
          if (!pilJokReached) {
            // 앞분바는 헤더가 찍힌 이 페이지 한 장만 선택한다 (다음 페이지부터는 헤더가 없으면
            // 바로 필족으로 간주됨 - 아래 else 분기).
            console.log(`[Page ${pageIndex}] ✓ 앞분바 헤더 발견: "${bunbaKeywordOnPage}"`);
            frontBunbaFound = true;
            currentSection = 'frontBunba';
          } else {
            console.log(`[Page ${pageIndex}] ✓ 급분바 헤더 발견: "${bunbaKeywordOnPage}"`);
            geupBunbaFound = true;
            isGeupBunbaActive = true;
            currentSection = 'geupBunba';
          }
        } else {
          // 헤더가 없는 페이지 -> 필족(본문)으로 간주
          currentSection = 'pilJok';
          pilJokReached = true;
        }

        // --- 페이지 선택 ---
        // 앞분바와 급분바는 같은 섹션이므로 '급분바' 옵션 하나로 둘 다 추출한다.
        if ((currentSection === 'frontBunba' || currentSection === 'geupBunba') && options.급분바) {
          resultIndices.add(pageIndex);
        }
        if (currentSection === 'pilJok' && options.필족) {
          resultIndices.add(pageIndex);
        }
        if (currentSection === 'munJok' && options.문족) {
          resultIndices.add(pageIndex);
        }
      }

      if (options.급분바 && !frontBunbaFound && !geupBunbaFound) {
        console.warn(`⚠️ 급분바 키워드를 찾지 못했습니다: [${BUNBA_FAMILY_KEYWORDS.join(', ')}]`);
      }
      if (options.문족 && !munjokFound) {
        console.warn(`⚠️ 문족 키워드를 찾지 못했습니다: [${MUNJOK_KEYWORD}]`);
      }

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
      });

      if (result.selectedPageIndices.length === 0 && (options.필족 || options.급분바 || options.문족)) {
        console.warn('⚠️ 경고: 선택된 페이지가 없습니다. 키워드를 찾지 못했을 수 있습니다.');
      }

      return result;
    } catch (err) {
      console.error(`PDF 분석 실패: ${file.name}`, err);

      let errorMessage = `PDF 분석 실패: ${file.name}`;

      if (err instanceof Error) {
        errorMessage += ` - ${err.message}`;

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
