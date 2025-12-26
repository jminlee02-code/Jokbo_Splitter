# GitHub 업로드 가이드 (초보자용)

이 가이드는 GitHub에 코드를 처음 업로드하는 방법을 단계별로 설명합니다.

## 📋 사전 준비

### 1. Git 설치 확인

터미널(또는 명령 프롬프트)을 열고 다음 명령어 입력:
```bash
git --version
```

**결과:**
- `git version 2.x.x` 같은 버전이 나오면 → ✅ Git이 설치되어 있음
- `command not found` 같은 에러가 나오면 → Git 설치 필요

**Git 설치 방법:**
- Mac: https://git-scm.com/download/mac
- Windows: https://git-scm.com/download/win
- 설치 후 터미널을 다시 시작

### 2. GitHub 계정 만들기

1. https://github.com 접속
2. "Sign up" 클릭
3. 이메일, 비밀번호 입력
4. 이메일 인증 완료

---

## 🚀 GitHub에 코드 업로드하기

### 단계 1: GitHub에 새 저장소 만들기

1. **GitHub 로그인**
   - https://github.com 접속
   - 로그인

2. **새 저장소 만들기**
   - 우측 상단 "+" 버튼 클릭
   - "New repository" 클릭
   
3. **저장소 정보 입력**
   - Repository name: `pdf-extractor-merger` (또는 원하는 이름)
   - Description: `PDF 자동 추출 및 병합 서비스` (선택사항)
   - Public 선택 (무료로 사용 가능)
   - **"Initialize this repository with a README" 체크 해제** (중요!)
   - "Add .gitignore" 선택 안 함
   - "Choose a license" 선택 안 함
   
4. **"Create repository" 클릭**

5. **저장소 URL 복사**
   - 생성된 페이지에서 URL 확인
   - 예: `https://github.com/YOUR_USERNAME/pdf-extractor-merger.git`
   - 이 URL을 나중에 사용합니다!

---

### 단계 2: 로컬 프로젝트 준비

터미널에서 프로젝트 폴더로 이동:
```bash
cd "/Users/leejeongmin/Desktop/Cursor/02_인급문 생성기"
```

#### 2-1. Git 초기화 (처음 한 번만)

```bash
git init
```

**결과:** `Initialized empty Git repository in ...` 메시지가 나오면 성공!

#### 2-2. .gitignore 확인

`.gitignore` 파일이 있는지 확인:
```bash
ls -la .gitignore
```

파일이 있으면 다음 단계로, 없으면 생성:
```bash
# .gitignore 파일 생성 (이미 있으면 건너뛰기)
cat > .gitignore << 'EOF'
# dependencies
node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build
/dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOF
```

#### 2-3. 모든 파일 추가

```bash
git add .
```

**설명:** 
- `.`은 현재 폴더의 모든 파일을 의미
- `node_modules`, `dist` 등은 .gitignore에 의해 제외됨

#### 2-4. 첫 커밋 (Commit)

```bash
git commit -m "Initial commit: PDF 자동 추출 및 병합 서비스"
```

**설명:**
- `-m "메시지"`는 커밋 메시지를 의미
- 커밋은 변경사항을 저장하는 것

**에러가 나는 경우:**
```
*** Please tell me who you are.
```

이 에러가 나면 Git 사용자 정보를 설정해야 합니다:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

그 다음 다시 커밋:
```bash
git commit -m "Initial commit: PDF 자동 추출 및 병합 서비스"
```

---

### 단계 3: GitHub에 업로드

#### 3-1. GitHub 저장소 연결

**YOUR_USERNAME을 본인의 GitHub 사용자명으로 변경하세요!**

```bash
git remote add origin https://github.com/YOUR_USERNAME/pdf-extractor-merger.git
```

**예시:**
- GitHub 사용자명이 `john`이면:
  ```bash
  git remote add origin https://github.com/john/pdf-extractor-merger.git
  ```

**에러가 나는 경우:**
- `remote origin already exists` → 이미 연결되어 있음, 다음 단계로
- `fatal: not a git repository` → `git init`을 먼저 실행

#### 3-2. 브랜치 이름 설정

```bash
git branch -M main
```

#### 3-3. 코드 업로드 (Push)

```bash
git push -u origin main
```

**설명:**
- `push`는 로컬 코드를 GitHub에 업로드하는 명령어
- `-u origin main`은 기본 업로드 위치를 설정

**인증 요청:**
- GitHub 사용자명 입력 요청
- 비밀번호 입력 요청 (또는 Personal Access Token)

**Personal Access Token이 필요한 경우:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. Note: `Git Upload` 입력
4. Expiration: 원하는 기간 선택
5. Scopes: `repo` 체크
6. "Generate token" 클릭
7. 생성된 토큰 복사 (한 번만 보여줌!)
8. 비밀번호 입력할 때 이 토큰 사용

---

### 단계 4: 확인

1. **GitHub 웹사이트에서 확인**
   - https://github.com/YOUR_USERNAME/pdf-extractor-merger 접속
   - 파일들이 업로드되어 있는지 확인

2. **업로드 성공 확인**
   - 파일 목록이 보이면 성공! ✅
   - README.md, src 폴더 등이 보여야 함

---

## 🔄 이후 업데이트 방법

코드를 수정한 후 다시 업로드하려면:

```bash
# 1. 변경된 파일 확인
git status

# 2. 변경된 파일 추가
git add .

# 3. 커밋 (변경사항 저장)
git commit -m "변경 내용 설명"

# 4. GitHub에 업로드
git push
```

---

## ❓ 자주 발생하는 문제

### 문제 1: "Permission denied" 에러

**원인:** GitHub 인증 실패

**해결:**
1. Personal Access Token 사용
2. 또는 SSH 키 설정 (고급)

### 문제 2: "fatal: not a git repository"

**원인:** Git이 초기화되지 않음

**해결:**
```bash
git init
```

### 문제 3: "remote origin already exists"

**원인:** 이미 GitHub 저장소가 연결되어 있음

**해결:**
```bash
# 기존 연결 제거
git remote remove origin

# 새로 연결
git remote add origin https://github.com/YOUR_USERNAME/pdf-extractor-merger.git
```

### 문제 4: "Everything up-to-date"

**원인:** 변경사항이 없음

**해결:**
- 파일을 수정하거나
- `git add .`와 `git commit`을 먼저 실행

---

## 📝 체크리스트

업로드 전 확인:
- [ ] Git 설치 확인 (`git --version`)
- [ ] GitHub 계정 생성
- [ ] GitHub에 새 저장소 생성
- [ ] `git init` 실행
- [ ] `git add .` 실행
- [ ] `git commit` 실행
- [ ] `git remote add origin` 실행 (URL 확인!)
- [ ] `git push -u origin main` 실행
- [ ] GitHub에서 파일 확인

---

## 🎉 완료!

GitHub에 코드가 업로드되면 Vercel이나 Netlify에서 배포할 수 있습니다!

**다음 단계:** [DEPLOYMENT.md](./DEPLOYMENT.md) 파일을 참고하여 배포하세요.

