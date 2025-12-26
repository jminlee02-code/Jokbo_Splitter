# 배포 가이드 (Deployment Guide)

이 문서는 "인급문 생성기" 프로젝트를 배포하는 방법을 단계별로 설명합니다.

## 📋 배포 전 확인사항

1. 프로젝트가 정상적으로 작동하는지 확인
   ```bash
   npm run dev
   ```
   - 브라우저에서 `http://localhost:5173` 접속
   - PDF 업로드, 분석, 편집 기능이 모두 정상 작동하는지 확인

2. 빌드가 성공하는지 확인
   ```bash
   npm run build
   ```
   - 에러가 없으면 성공!
   - `dist` 폴더가 생성됩니다

---

## 🚀 방법 1: Vercel 배포 (가장 쉬움, 추천!)

Vercel은 Next.js를 만든 회사에서 제공하는 무료 호스팅 서비스입니다. GitHub과 연동하면 자동으로 배포됩니다.

### 단계 1: GitHub에 코드 업로드

1. **GitHub 계정 만들기** (없는 경우)
   - https://github.com 접속
   - "Sign up" 클릭하여 계정 생성

2. **새 저장소(Repository) 만들기**
   - GitHub 로그인 후 우측 상단 "+" 버튼 → "New repository" 클릭
   - Repository name: `pdf-extractor-merger` (원하는 이름)
   - Public 선택 (무료 플랜)
   - "Create repository" 클릭

3. **로컬 프로젝트를 GitHub에 업로드**
   
   터미널에서 프로젝트 폴더로 이동 후:
   ```bash
   # Git 초기화 (처음 한 번만)
   git init
   
   # .gitignore 파일 확인 (없으면 생성)
   # node_modules, dist 등은 업로드하지 않도록 설정
   
   # 모든 파일 추가
   git add .
   
   # 첫 커밋
   git commit -m "Initial commit"
   
   # GitHub 저장소 연결 (YOUR_USERNAME을 본인 GitHub 사용자명으로 변경)
   git remote add origin https://github.com/YOUR_USERNAME/pdf-extractor-merger.git
   
   # 코드 업로드
   git branch -M main
   git push -u origin main
   ```

### 단계 2: Vercel에 배포

1. **Vercel 계정 만들기**
   - https://vercel.com 접속
   - "Sign Up" 클릭
   - "Continue with GitHub" 클릭하여 GitHub 계정으로 로그인

2. **프로젝트 가져오기**
   - Vercel 대시보드에서 "Add New..." → "Project" 클릭
   - GitHub 저장소 목록에서 `pdf-extractor-merger` 선택
   - "Import" 클릭

3. **빌드 설정 확인**
   - Framework Preset: **Vite** 선택
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (자동 입력됨)
   - Output Directory: `dist` (자동 입력됨)
   - Install Command: `npm install` (자동 입력됨)

4. **환경 변수 설정** (필요한 경우)
   - 이 프로젝트는 환경 변수가 필요 없으므로 건너뛰기

5. **배포 시작**
   - "Deploy" 버튼 클릭
   - 1-2분 정도 기다리기
   - 배포 완료 후 URL 확인 (예: `https://pdf-extractor-merger.vercel.app`)

### 단계 3: 배포 확인

1. Vercel에서 제공한 URL로 접속
2. PDF 업로드 및 분석 기능 테스트
3. 문제가 없으면 완료! 🎉

### 이후 업데이트 방법

코드를 수정하고 GitHub에 푸시하면 자동으로 재배포됩니다:
```bash
git add .
git commit -m "Update feature"
git push
```

---

## 🌐 방법 2: Netlify 배포

Netlify도 무료 호스팅 서비스를 제공합니다.

### 단계 1: GitHub에 코드 업로드
- 방법 1의 "단계 1"과 동일

### 단계 2: Netlify에 배포

1. **Netlify 계정 만들기**
   - https://www.netlify.com 접속
   - "Sign up" 클릭
   - "Continue with GitHub" 클릭

2. **프로젝트 추가**
   - "Add new site" → "Import an existing project" 클릭
   - "Deploy with GitHub" 클릭
   - GitHub 저장소 선택

3. **빌드 설정**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - "Deploy site" 클릭

4. **배포 완료**
   - 배포 완료 후 URL 확인 (예: `https://pdf-extractor-merger.netlify.app`)

---

## 📦 방법 3: GitHub Pages 배포

GitHub에서 직접 호스팅하는 방법입니다.

### 단계 1: vite.config.ts 수정

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: '/pdf-extractor-merger/', // 저장소 이름으로 변경
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... 나머지 설정
})
```

### 단계 2: GitHub Actions 설정

1. 프로젝트 루트에 `.github/workflows/deploy.yml` 파일 생성:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

2. GitHub 저장소 설정:
   - Settings → Pages
   - Source: "GitHub Actions" 선택

3. 코드 푸시:
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push
   ```

---

## 🔧 방법 4: 수동 배포 (서버가 있는 경우)

### 단계 1: 빌드

```bash
npm run build
```

### 단계 2: dist 폴더 업로드

1. `dist` 폴더의 모든 파일을 서버에 업로드
2. 웹 서버(Nginx, Apache 등) 설정
3. 도메인 연결

---

## ❓ 문제 해결

### 빌드 에러가 발생하는 경우

1. **TypeScript 에러**
   ```bash
   npm run build
   ```
   - 에러 메시지 확인
   - 타입 오류 수정

2. **의존성 문제**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **빌드 성공했는데 배포 후 작동 안 함**
   - 브라우저 콘솔(F12)에서 에러 확인
   - PDF Worker 경로 문제일 수 있음
   - `src/lib/react-pdf-config.ts`와 `src/lib/pdfjs-worker.ts` 확인

### PDF Worker 에러

배포 후 PDF가 로드되지 않으면:
1. 브라우저 콘솔 확인
2. Worker 경로가 CDN을 사용하는지 확인
3. 네트워크 탭에서 Worker 파일 로드 여부 확인

---

## 📝 체크리스트

배포 전 확인:
- [ ] `npm run dev`로 로컬에서 정상 작동 확인
- [ ] `npm run build`로 빌드 성공 확인
- [ ] GitHub에 코드 업로드 완료
- [ ] Vercel/Netlify에 배포 완료
- [ ] 배포된 사이트에서 PDF 업로드 테스트
- [ ] PDF 분석 기능 테스트
- [ ] 편집기 페이지 이동 테스트
- [ ] PDF 병합 및 다운로드 테스트

---

## 🎉 완료!

배포가 완료되면 친구들에게 URL을 공유할 수 있습니다!

**추천 배포 방법: Vercel** (가장 쉬우고 빠름)

