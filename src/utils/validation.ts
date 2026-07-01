import { UploadedFile, ExtractionOptions } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 폼 유효성 검사
 */
export function validateForm(
  files: UploadedFile[],
  fileName: string,
  options: ExtractionOptions
): ValidationResult {
  const errors: string[] = [];

  // UI 위→아래 순서(파일명 → 업로드 → 섹션)로 체크 — 첫 번째 오류만 안내하므로 순서가 우선순위가 된다.

  // 1. 파일명 설정 여부
  if (!fileName.trim()) {
    errors.push('최종 파일명을 입력해주세요.');
  }

  // 2. 파일 업로드 여부
  if (files.length === 0) {
    errors.push('PDF 파일을 최소 1개 이상 업로드해주세요.');
  }

  // 3. 추출 옵션 선택 여부
  const hasAnyOption = Object.values(options).some((v) => v);
  if (!hasAnyOption) {
    errors.push('인트로, 필족, 급분바, 문족 중 최소 1개 이상의 옵션을 선택해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

