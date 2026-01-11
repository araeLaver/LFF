### Phase 1: Project Setup (Completed)
- [x] Set up pnpm monorepo workspace
- [x] Initialize NestJS backend project
- [x] Initialize Next.js frontend project
- [x] Update `MVP_FEATURE_SPEC.md` with new features

### Phase 2: Backend Development (Completed)
- [x] **Database Schema Design:**
    - [x] Define User, Creator, Quest, Submission, and NFT-gated Content models in Prisma schema.
- [x] **Authentication:**
    - [x] Implement basic email/password signup and login.
    - [x] Set up custodial wallet creation on user signup.
- [x] **Fan Quest System:**
    - [x] Create CRUD APIs for Quests (Creator-only).
    - [x] Create API for users to submit Quest completion proof.
    - [x] Create API for creators/admins to approve submissions.
- [x] **Token-gated Content:**
    - [x] Create CRUD APIs for Content (Creator-only).
    - [x] Create API to verify NFT ownership for content access.

### Phase 3: Frontend Development (Completed)
- [x] **UI Components:**
    - [x] Design and build basic layout components (Header, Footer, etc.).
- [x] **Authentication:**
    - [x] Implement signup and login pages.
- [x] **Fan Quest System:**
    - [x] Build UI for users to view and participate in Quests.
    - [x] Build UI for creators to manage their Quests.
- [x] **Token-gated Content:**
    - [x] Build UI to display locked and unlocked content.
- [x] **My Page:**
    - [x] Display user profile and collected NFTs/rewards.

### Phase 4: Blockchain Integration (Completed)
- [x] **Smart Contract:**
    - [x] LFFSBT.sol - Soulbound Token (ERC-721 기반, 양도 불가)
    - [x] Hardhat 프로젝트 설정 및 배포 스크립트
- [x] **Backend Integration:**
    - [x] BlockchainModule (ethers.js 연동)
    - [x] MetadataService (NFT 메타데이터 생성)
    - [x] 이벤트 QR 리딤 시 SBT 자동 민팅
    - [x] 퀘스트 승인 시 SBT 자동 민팅

### Phase 5: Additional Features (Completed)
- [x] **Contract Deployment:**
    - [x] Polygon Amoy 테스트넷 배포 (`0xb675FB5c63b33c3a431cb2eBBa0f6cDfd9A1de03`)
    - [x] 환경변수 설정 (SBT_CONTRACT_ADDRESS)
- [x] **Feature Expansion:**
    - [x] 이미지 업로드 (Sharp 기반 WebP 최적화, 로컬 저장)
    - [x] 소셜 로그인 (Google OAuth, Kakao OAuth)
- [x] **Event System:**
    - [x] 이벤트 CRUD API
    - [x] QR 코드 생성 및 리딤
    - [x] 이벤트 참석 시 SBT 자동 민팅
- [x] **Admin Dashboard:**
    - [x] 관리자 페이지 (사용자/퀘스트/이벤트/콘텐츠 관리)
- [x] **Notifications:**
    - [x] 알림 시스템 및 웹 푸시

### Phase 6: Next Steps (In Progress)
- [ ] **Feature Expansion:**
    - [x] 이메일 인증 (Nodemailer)
        - EmailVerification 모델 추가
        - 회원가입 시 인증 이메일 발송
        - 이메일 인증 페이지 (/auth/verify-email)
        - 인증 재발송 페이지 (/auth/resend-verification)
        - 미인증 사용자 헤더 배너
    - [x] 비밀번호 재설정
        - AuthService에 비밀번호 재설정 로직 추가
        - 비밀번호 찾기 API (/auth/forgot-password)
        - 토큰 검증 API (/auth/validate-reset-token)
        - 비밀번호 재설정 API (/auth/reset-password)
        - 비밀번호 찾기 페이지 (/auth/forgot-password)
        - 비밀번호 재설정 페이지 (/auth/reset-password)
        - 로그인 페이지에 "Forgot password?" 링크 추가
    - [ ] 클라우드 스토리지 연동 (S3/Cloudinary)
- [x] **Testing:**
    - [x] Unit 테스트 (Jest - Frontend/Backend)
    - [x] E2E 테스트 (Playwright)
        - 인증 플로우 (로그인/회원가입)
        - 홈페이지 네비게이션
        - 퀘스트 목록/필터
        - 이벤트 목록/필터
- [ ] **Deployment:**
    - [x] CI/CD 파이프라인
        - GitHub Actions 워크플로우 (.github/workflows/ci.yml)
        - Backend: lint, test, build
        - Frontend: lint, test, build
        - E2E 테스트 (Playwright + PostgreSQL)
        - Health check 엔드포인트 추가 (/health)
        - CI 환경 Playwright 설정 최적화
    - [ ] 프로덕션 환경 설정
- [ ] **Performance & Security:**
    - [x] Rate limiting
        - @nestjs/throttler 패키지 적용
        - 글로벌 Rate Limit (10/초, 100/분, 1000/시간)
        - 인증 API 엄격 제한 (로그인 5회/분, 회원가입 3회/분)
        - 비밀번호 재설정 제한 (3회/분)
        - OAuth/Health 엔드포인트 제외
    - [ ] 로깅 및 모니터링
    - [ ] 보안 감사
