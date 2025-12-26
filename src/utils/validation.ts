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

  // 1. 파일 업로드 여부
  if (files.length === 0) {
    errors.push('PDF 파일을 최소 1개 이상 업로드해주세요.');
  }

  // 2. 추출 옵션 선택 여부
  const hasAnyOption = Object.values(options).some((v) => v);
  if (!hasAnyOption) {
    errors.push('인트로, 급분바, 문족 중 최소 1개 이상의 옵션을 선택해주세요.');
  }

  // 3. 파일명 설정 여부
  if (!fileName.trim()) {
    errors.push('최종 파일명을 입력해주세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

