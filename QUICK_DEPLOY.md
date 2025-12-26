# 빠른 배포 가이드 (Vercel)

GitHub에 코드를 업로드했다면, 이제 Vercel로 배포하면 됩니다!

## 🚀 5분 안에 배포하기

### 1단계: Vercel 계정 만들기

1. **Vercel 접속**
   - https://vercel.com 접속

2. **GitHub로 로그인**
   - "Sign Up" 또는 "Log In" 클릭
   - "Continue with GitHub" 클릭
   - GitHub 계정으로 로그인
   - Vercel이 GitHub 접근 권한을 요청하면 "Authorize" 클릭

### 2단계: 프로젝트 가져오기

1. **새 프로젝트 추가**
   - Vercel 대시보드에서 "Add New..." 버튼 클릭
   - "Project" 클릭

2. **GitHub 저장소 선택**
   - "Import Git Repository" 섹션에서
   - `jminlee02-code/Jokbo_Splitter` 저장소 찾기
   - "Import" 클릭

### 3단계: 빌드 설정 (자동으로 설정됨)

Vercel이 자동으로 설정을 감지합니다:
- **Framework Preset**: Vite (자동 감지)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (자동)
- **Output Directory**: `dist` (자동)
- **Install Command**: `npm install` (자동)

**변경할 필요 없습니다!** 그대로 두고 "Deploy" 클릭

### 4단계: 배포 완료!

1. **배포 진행**
   - "Deploy" 버튼 클릭
   - 1-2분 정도 기다리기
   - 빌드 로그가 화면에 표시됨

2. **배포 완료 확인**
   - "Congratulations!" 메시지가 나오면 성공!
   - 배포된 URL 확인 (예: `https://jokbo-splitter.vercel.app`)

3. **사이트 확인**
   - 제공된 URL 클릭
   - 사이트가 정상적으로 열리는지 확인
   - PDF 업로드 기능 테스트

## ✅ 완료!

이제 친구들에게 URL을 공유할 수 있습니다!

**배포된 사이트 URL 예시:**
- `https://jokbo-splitter.vercel.app`
- 또는 `https://jokbo-splitter-jminlee02-code.vercel.app`

## 🔄 이후 업데이트 방법

코드를 수정하고 GitHub에 푸시하면 자동으로 재배포됩니다:

```bash
# 코드 수정 후
git add .
git commit -m "변경 내용"
git push
```

Vercel이 자동으로 감지하고 재배포합니다!

## ❓ 문제 해결

### 빌드가 실패하는 경우

1. **Vercel 대시보드에서 로그 확인**
   - 프로젝트 → Deployments → 실패한 배포 클릭
   - "Build Logs" 탭에서 에러 확인

2. **일반적인 문제**
   - TypeScript 에러: 로컬에서 `npm run build` 실행하여 확인
   - 의존성 문제: `package.json` 확인

### 사이트는 열리는데 PDF가 안 되는 경우

1. **브라우저 콘솔 확인** (F12)
   - Worker 경로 에러가 있는지 확인
   - 프로덕션 환경에서는 CDN을 사용하도록 설정되어 있음

2. **네트워크 탭 확인**
   - Worker 파일이 로드되는지 확인

## 📝 체크리스트

- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 배포
- [ ] 배포된 사이트 접속 확인
- [ ] PDF 업로드 테스트
- [ ] PDF 분석 기능 테스트
- [ ] 편집기 페이지 이동 테스트
- [ ] PDF 병합 및 다운로드 테스트

---

**다음 단계:** Vercel에 접속하여 배포를 시작하세요! 🚀

