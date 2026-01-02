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

### Phase 5: Next Steps (Pending)
- [ ] **Contract Deployment:**
    - [ ] Polygon Amoy 테스트넷 배포
    - [ ] 환경변수 설정 (SBT_CONTRACT_ADDRESS)
- [ ] **Feature Expansion:**
    - [ ] 이미지 업로드 (S3/Cloudinary)
    - [ ] 이메일 인증
    - [ ] 소셜 로그인
- [ ] **Testing:**
    - [ ] Unit 테스트
    - [ ] E2E 테스트
- [ ] **Deployment:**
    - [ ] CI/CD 파이프라인
    - [ ] 프로덕션 환경 설정
