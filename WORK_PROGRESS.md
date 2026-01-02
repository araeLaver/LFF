# LFF 프로젝트 작업 진행 상황

## 최종 업데이트: 2026-01-02

---

## 완료된 작업

### 1. Smart Contract (SBT - Soulbound Token)
- **컨트랙트**: `LFFSBT.sol` - ERC-721 기반 Soulbound Token
- **배포 주소**: `0xb675FB5c63b33c3a431cb2eBBa0f6cDfd9A1de03` (Polygon Amoy Testnet)
- **기능**:
  - Event 참석 증명 SBT 발행
  - Quest 완료 증명 SBT 발행
  - 전송 불가 (Soulbound)

### 2. Backend BlockchainModule
- `BlockchainService`: SBT 민팅, 잔액 조회
- `MetadataService`: NFT 메타데이터 생성/조회
- `MetadataController`: 메타데이터 API 엔드포인트
- Event/Quest 완료 시 자동 SBT 발행 연동

### 3. E2E 테스트
- 로컬 Hardhat 노드에서 11개 테스트 통과
- 테스트 스크립트: `contracts/scripts/test-local.ts`

### 4. NFT 갤러리 (MyPage)
- `NFTCard.tsx`: NFT 카드 컴포넌트
- `NFTDetailModal.tsx`: NFT 상세 모달
- `NFTsTab` 개선: 통계 대시보드, 토큰 타입별 그룹화

### 5. 이미지 업로드 기능
#### Backend
- `UploadModule`: 이미지 업로드 서비스/컨트롤러
- `POST /api/upload/image/:category` (quests, events, profiles)
- 제한: 5MB, JPEG/PNG/GIF/WebP
- `ServeStaticModule`: `/uploads` 경로로 정적 파일 서빙
- DTO 업데이트: `imageUrl` 필드 추가 (Quest, Event)

#### Frontend
- `ImageUpload.tsx`: Drag & Drop 이미지 업로드 컴포넌트
- API 클라이언트: `uploadImage()` 메서드
- Creator 폼 통합: Quest/Event 생성 시 이미지 업로드

### 6. 이미지 표시 UI
#### 상세 페이지
- `/quests/[id]`: 히어로 이미지 (256px)
- `/events/[id]`: 히어로 이미지 (256px)

#### 목록 페이지
- `/quests`: 카드 썸네일 (160px) + 타입 배지 오버레이
- `/events`: 카드 썸네일 (160px) + 상태 배지 오버레이

#### 홈페이지
- Quest 카드: 썸네일 (128px) + 그라데이션 폴백
- Event 카드: 썸네일 (128px) + 날짜/상태 오버레이

---

## 대기 중인 작업

### 1. DB 마이그레이션
```bash
cd packages/backend
npx prisma migrate dev --name add_image_url
```
- PostgreSQL 실행 필요
- `imageUrl` 필드가 이미 schema.prisma에 추가됨

### 2. 추가 개선 가능 항목
- 프로필 이미지 업로드 기능
- 이미지 리사이징/최적화
- CDN 연동

---

## 프로젝트 구조

```
LFF/
├── packages/
│   ├── backend/          # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── blockchain/
│   │   │   ├── creator/
│   │   │   ├── event/
│   │   │   ├── gated-content/
│   │   │   ├── nft/
│   │   │   ├── prisma/
│   │   │   ├── quest/
│   │   │   ├── upload/      # 이미지 업로드
│   │   │   ├── user/
│   │   │   └── wallet/
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   ├── frontend/         # Next.js Frontend
│   │   └── src/
│   │       ├── app/
│   │       │   ├── page.tsx           # 홈페이지
│   │       │   ├── quests/
│   │       │   ├── events/
│   │       │   ├── creator/
│   │       │   └── mypage/
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   │   ├── ImageUpload.tsx
│   │       │   │   └── ...
│   │       │   └── nft/
│   │       │       ├── NFTCard.tsx
│   │       │       └── NFTDetailModal.tsx
│   │       └── lib/
│   │           └── api.ts
│   │
│   └── contracts/        # Hardhat Smart Contracts
│       ├── contracts/
│       │   └── LFFSBT.sol
│       └── scripts/
│           └── test-local.ts
```

---

## 환경 설정

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/lff_db
JWT_SECRET=your-jwt-secret
BACKEND_URL=http://localhost:3001
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your-wallet-private-key
SBT_CONTRACT_ADDRESS=0xb675FB5c63b33c3a431cb2eBBa0f6cDfd9A1de03
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 실행 방법

```bash
# Backend
cd packages/backend
npm install
npx prisma generate
npm run start:dev

# Frontend
cd packages/frontend
npm install
npm run dev

# Contracts (로컬 테스트)
cd packages/contracts
npm install
npx hardhat node  # 터미널 1
npx ts-node scripts/test-local.ts  # 터미널 2
```

---

## 다음 세션에서 할 작업

1. PostgreSQL 시작 후 DB 마이그레이션 실행
2. 전체 앱 테스트 (로그인 → Quest 생성 → 이미지 업로드 → 확인)
3. 필요시 프로필 이미지 업로드 기능 추가
