# 인급문 생성기 - PDF 자동 추출 및 병합 서비스

토스뱅크 스타일의 깔끔하고 모던한 PDF 처리 웹사이트입니다.

## 기술 스택

- **Framework**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: framer-motion
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Icons**: lucide-react

## 프로젝트 구조

```
/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # 헤더 컴포넌트
│   │   ├── FileUpload.tsx       # 파일 업로드 (드래그 앤 드롭)
│   │   ├── SortableFileList.tsx # 파일 리스트 (순서 변경 가능)
│   │   └── OptionSelector.tsx   # 추출 옵션 선택
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   ├── App.tsx                  # 메인 앱 컴포넌트
│   ├── main.tsx                 # 진입점
│   └── index.css                # 전역 스타일
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 주요 기능

### 1. 파일 업로드
- 드래그 앤 드롭으로 PDF 파일 업로드
- 클릭하여 파일 선택
- 여러 파일 동시 업로드 가능

### 2. 파일 관리
- 업로드된 파일 리스트 표시
- 드래그 앤 드롭으로 파일 순서 변경
- 개별 파일 삭제 기능

### 3. 옵션 선택
- 추출 옵션 선택 (인트로, 급분바, 문족)
- 최종 파일명 입력

### 4. 다음 단계
- 유효성 검사 후 다음 단계로 진행

## 디자인 가이드

- **배경색**: #F2F4F6 (옅은 회색)
- **카드 배경**: #FFFFFF (흰색)
- **포인트 컬러**: #0064FF (블루)
- **폰트**: Noto Sans KR (한글 폰트)
- **둥근 모서리**: rounded-2xl 이상
- **애니메이션**: framer-motion으로 부드러운 인터랙션

## 배포 방법

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

**빠른 배포 (Vercel 추천):**
1. GitHub에 코드 업로드
2. Vercel에 프로젝트 연결
3. 자동 배포 완료!

## 개발 상태

현재 완료된 기능:
- ✅ 프로젝트 기본 세팅
- ✅ 파일 업로드 UI
- ✅ 파일 리스트 및 순서 변경
- ✅ 옵션 선택 UI
- ✅ PDF 분석 로직 (키워드 기반 섹션 추출)
- ✅ 편집기 화면 (페이지 선택/해제)
- ✅ PDF 병합 및 다운로드
- ✅ IndexedDB를 통한 대용량 파일 처리
- ✅ 배포 환경 최적화
