import { PDFDocument } from 'pdf-lib';
import { EditorFile } from '@/types';

/**
 * 여러 PDF 파일을 병합하여 하나의 PDF로 만듭니다
 */
export async function mergePDFs(files: EditorFile[]): Promise<PDFDocument> {
  const mergedPdf = await PDFDocument.create();

  // 파일 순서대로 처리
  for (const file of files) {
    try {
      // 원본 PDF 파일을 ArrayBuffer로 변환
      const arrayBuffer = await file.originalFile.file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);

      // 선택된 페이지만 복사
      const selectedPages = file.currentSelectedIndices;
      
      if (selectedPages.length === 0) {
        console.warn(`파일 ${file.originalFile.name}에 선택된 페이지가 없습니다. 건너뜁니다.`);
        continue;
      }

      // 선택된 페이지를 복사하여 병합된 PDF에 추가
      const copiedPages = await mergedPdf.copyPages(
        sourcePdf,
        selectedPages
      );

      // 복사된 페이지들을 병합된 PDF에 추가
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });

      console.log(
        `파일 "${file.originalFile.name}": ${selectedPages.length}페이지 추가됨`
      );
    } catch (error) {
      console.error(`파일 "${file.originalFile.name}" 처리 실패:`, error);
      throw new Error(
        `파일 "${file.originalFile.name}" 처리 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    }
  }

  return mergedPdf;
}

