export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export interface ExtractionOptions {
  intro: boolean;
  급분바: boolean;
  문족: boolean;
}

export interface AnalyzedFile {
  originalFile: UploadedFile;
  selectedPageIndices: number[];
  totalPages: number;
}

export interface EditorFile extends AnalyzedFile {
  currentSelectedIndices: number[]; // 사용자가 수정한 선택 페이지
}

