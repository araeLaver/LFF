### Phase 1: Project Setup (Completed)
- [x] Set up pnpm monorepo workspace
- [x] Initialize NestJS backend project
- [x] Initialize Next.js frontend project
- [x] Update `MVP_FEATURE_SPEC.md` with new features

### Phase 2: Backend Development (In Progress)
- [ ] **Database Schema Design:**
    - [ ] Define User, Creator, Quest, Submission, and NFT-gated Content models in Prisma schema.
- [ ] **Authentication:**
    - [ ] Implement basic email/password signup and login.
    - [ ] Set up custodial wallet creation on user signup.
- [ ] **Fan Quest System:**
    - [ ] Create CRUD APIs for Quests (Creator-only).
    - [ ] Create API for users to submit Quest completion proof.
    - [ ] Create API for creators/admins to approve submissions.
- [ ] **Token-gated Content:**
    - [ ] Create CRUD APIs for Content (Creator-only).
    - [ ] Create API to verify NFT ownership for content access.

### Phase 3: Frontend Development
- [ ] **UI Components:**
    - [ ] Design and build basic layout components (Header, Footer, etc.).
- [ ] **Authentication:**
    - [ ] Implement signup and login pages.
- [ ] **Fan Quest System:**
    - [ ] Build UI for users to view and participate in Quests.
    - [ ] Build UI for creators to manage their Quests.
- [ ] **Token-gated Content:**
    - [ ] Build UI to display locked and unlocked content.
- [ ] **My Page:**
    - [ ] Display user profile and collected NFTs/rewards.
