# MJNote 풀스택판

회계·세무·법률 종합 검색 도구. 기존 단일 HTML 파일판을 서버(Node.js/Express) 기반으로 재구축했습니다.

## 이번 재구축으로 해결된 것

기존 단일 파일판에서 계속 발생하던 문제들이 구조적으로 해결됩니다.

| 문제 | 원인 | 이번 버전 |
|---|---|---|
| 다운로드해서 열면 AI 분석 안 됨 | 브라우저가 `file://`에서 API 호출을 CORS로 차단 | 서버가 대신 호출 — 항상 작동 |
| Claude 게시 링크는 로그인해야 AI 작동 | Claude.ai를 거쳐야만 API 호출 허용 | Claude.ai 자체가 필요 없음 |
| law.go.kr 정밀 링크 별도 프록시 필요 | 클라이언트가 직접 호출 불가 | 서버에 통합, 별도 설정 불필요 |
| 프록시 주소가 파일마다 초기화됨 | 클라이언트 저장소(localStorage 등) 사용 | 서버 환경변수로 고정 |

**AI 엔진**: 이 버전은 Anthropic Claude 대신 **Google Gemini API**를 사용합니다 (Google Antigravity IDE로 개발).

## 제거된 기능

- PDF 저장, Word 저장, 인쇄 버튼 — 요청에 따라 전체 삭제

## 추가된 기능 — 회계·세무·노동 리스크 검증

헤더의 **"⚠️ 리스크 검증"** 탭에서, 재무제표·결산부속명세서·계정별원장·거래처원장·법인세 세무조정계산서·계약서·근로계약서·외주계약서·사내규정 등을 첨부하면 AI가 회계·세무·노동법 관점에서 확인이 필요한 지점을 심각도별(🔴높음/🟡주의/🟢참고)로 짚어줍니다.

- **지원 형식**: PDF, 이미지, 엑셀(.xlsx/.xls — SheetJS), 워드(.docx — mammoth.js), 파워포인트(.pptx — JSZip으로 슬라이드 텍스트 추출), txt/csv
- **아직 미지원**: 구버전 .doc/.ppt, 한글(.hwp) — PDF로 변환해서 첨부하면 정상 분석됩니다
- **주의**: 확정적인 법률·세무·노무 자문이 아닌 참고용 1차 스크리닝 도구입니다. 최종 판단은 반드시 전문가가 직접 확인해야 합니다.

## 준비물

1. **Node.js 18 이상** ([nodejs.org](https://nodejs.org)에서 설치)
2. **Google Gemini API 키** (선택) — AI 분석 기능에 필요. 없어도 DB 키워드 검색은 정상 작동합니다.
   - [aistudio.google.com](https://aistudio.google.com) (Google AI Studio) 접속 → Google 계정 로그인 → **Get API key** 클릭 → 키 생성
   - 무료 사용량 한도 내에서는 비용 없이 사용 가능 (한도 초과 시 과금)
3. **law.go.kr Open API 인증키(OC)** (선택) — 조문 정밀 링크에 필요. 없어도 법령 검색결과 링크로 정상 작동합니다.
   - open.law.go.kr 가입 후 마이페이지 → API인증키관리에서 확인 (이미 발급받으셨다면 `7788`)

## 로컬에서 실행하기

**Windows 사용자는 `startup.bat`을 더블클릭**하면 아래 과정을 자동으로 처리합니다 (Node.js 설치 확인 → .env 설정 안내 → 패키지 설치 → 서버 실행 → 브라우저 자동 열기).

수동으로 하시려면:
```bash
npm install
cp .env.example .env
# .env 파일을 열어 GEMINI_API_KEY와 LAW_OC 값을 실제 값으로 채워넣기
npm start
```

브라우저에서 `http://localhost:3000` 접속.

## 무료로 배포하기 (Render 기준 — 계속 무료, 카드 불필요)

Railway는 30일 체험 후 사실상 유료 전환이 필요하지만, **Render는 기간 제한 없이 계속 무료**로 쓸 수 있습니다 (단, 15분간 미접속 시 잠들었다가 다음 접속 때 30~60초 정도 깨어나는 지연이 있습니다 — 개인용 참고 도구로는 크게 문제되지 않는 수준입니다).

**Windows 사용자는 `deploy-render.bat`을 더블클릭**하면 GitHub 업로드까지 자동으로 처리됩니다. 처음 한 번만 GitHub 저장소 주소를 붙여넣고, Render 웹사이트에서 그 저장소를 연결해주시면 끝입니다 (`render.yaml`이 이미 포함되어 있어 설정을 자동으로 읽어갑니다).

수동으로 하시려면:
1. GitHub에 이 프로젝트를 올리기 (`git init` → `git add .` → `git commit` → GitHub에 새 저장소 만들고 push)
2. [render.com](https://render.com) 가입 (카드 불필요)
3. **New + → Blueprint** → 방금 올린 GitHub 저장소 선택 (`render.yaml` 자동 인식)
4. `GEMINI_API_KEY`, `LAW_OC` 값 입력 → **Apply**
5. 배포된 주소(`https://xxxx.onrender.com`)로 접속

이후 코드를 수정하면 `deploy-render.bat`을 다시 실행하기만 하면 GitHub에 올라가고, Render가 자동으로 재배포합니다.

## 유료로 배포하기 (Railway 기준 — 30일 무료 체험 후 월 $5~)

빠른 속도(잠들지 않음)와 간편한 CLI 배포가 필요하시면 Railway가 더 편합니다.

수동으로 하시려면(또는 Mac/Linux):

1. [railway.app](https://railway.app) 가입 (GitHub 계정으로 가능)
2. **New Project → Deploy from GitHub repo** (또는 **Empty Project** 후 파일 업로드)
   - GitHub이 없으시면: 이 폴더를 압축해서 Railway CLI로 직접 배포하는 방법도 있습니다 — 필요하시면 안내해드립니다
3. 배포된 프로젝트 → **Variables** 탭에서 환경변수 등록:
   - `GEMINI_API_KEY` = 발급받은 키
   - `LAW_OC` = `7788`
4. **Settings → Networking → Generate Domain** 클릭 → `https://xxxx.up.railway.app` 형태 주소 발급
5. 그 주소로 접속하면 끝 — 모바일에서도, 어디서든 로그인 없이 AI 분석까지 정상 작동합니다

## 프로젝트 구조

```
mjnote-fullstack/
  startup.bat            (Windows) 더블클릭으로 로컬 서버 실행
  deploy-render.bat       (Windows) 더블클릭으로 Render 무료 배포(GitHub 업로드)
  deploy.bat             (Windows) 더블클릭으로 Railway 배포(유료)
  render.yaml             Render 배포 자동 설정 파일
  server.js              서버 진입점
  package.json
  .env.example           환경변수 템플릿 (실제 .env는 git에 올리지 말 것)
  src/routes/
    ai.js                 POST /api/ai-analyze — Gemini API 서버측 호출
    law.js                GET  /api/law-resolve — law.go.kr 조문 정밀 링크 서버측 조회
  public/
    index.html            프론트엔드 전체 (기존 UI/데이터/검색로직 그대로, PDF·인쇄 제거)
```

## 다음 단계 (별도 논의 예정)

회계/세무·인사급여·법인조정·개인조정·연말정산 계산기 모듈은 이 서버 위에 순서대로 이어서 추가할 예정입니다. 이 기반(서버+API 구조)이 이미 갖춰져 있어, 각 모듈은 `src/routes/`에 새 라우트를, 필요하면 데이터베이스(SQLite 등)를 추가하는 방식으로 확장합니다.
