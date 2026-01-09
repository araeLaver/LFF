# LFF 프로젝트 작업 진행 상황

## 최종 업데이트: 2026-01-08

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

### 7. 프로필 이미지 업로드
#### Frontend
- MyPage 프로필 탭에 아바타 업로드 UI 추가
- 원형 이미지 미리보기 + 업로드/삭제 버튼
- 프로필 저장 시 `avatarUrl` 함께 저장
- 헤더 영역에 아바타 이미지 표시

#### Backend
- `profiles` 카테고리로 업로드 지원 (기존)
- `UpdateProfileDto`에 `avatarUrl` 필드 포함 (기존)

### 8. 이미지 최적화
#### Backend (`UploadService`)
- `sharp` 라이브러리 통합
- 자동 WebP 변환 (GIF 제외)
- 최대 크기 제한: 일반 1920px, 프로필 512px
- 품질 압축: 80-85%
- 원본 대비 파일 크기 감소 로그 출력
- 최적화 실패 시 원본 파일 폴백

### 9. 소셜 로그인 (Google/Kakao OAuth)
#### Backend
- **Prisma 스키마 업데이트**: `User` 모델에 `provider`, `providerId` 필드 추가
- **GoogleStrategy**: `passport-google-oauth20` 기반 Google OAuth 2.0 인증
- **KakaoStrategy**: `passport-kakao` 기반 Kakao OAuth 인증
- **AuthService.oauthLogin()**: OAuth 사용자 처리 (신규 생성/기존 계정 연동)
- **AuthController**: `/api/auth/google`, `/api/auth/kakao` 엔드포인트
- **타입 선언**: `passport-kakao.d.ts` 커스텀 타입 정의
- **환경변수**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID` 등

#### Frontend
- **로그인 페이지**: Google/Kakao 소셜 로그인 버튼 추가 (SVG 아이콘)
- **OAuth 콜백 페이지**: `/auth/callback` - 토큰 처리 및 리다이렉트
- **AuthContext**: `setTokenAndFetchUser()` 메서드 추가

#### 설정 필요
- Google Cloud Console에서 OAuth 2.0 클라이언트 생성
- Kakao Developers에서 앱 생성 및 Redirect URI 등록
- `.env` 파일에 클라이언트 ID/Secret 설정

---

## 대기 중인 작업

### 1. 소셜 로그인 설정
- Google Cloud Console에서 OAuth 2.0 클라이언트 생성 필요
- Kakao Developers에서 앱 생성 및 Redirect URI 설정 필요
- `.env` 파일에 클라이언트 ID/Secret 입력

### 2. 추가 개선 가능 항목
- CDN 연동 (Cloudflare, AWS CloudFront 등)
- 프로덕션 배포 설정
- Gated Content 고급 기능 (다중 NFT 조건, 구독 등)

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
FRONTEND_URL=http://localhost:3000
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=your-wallet-private-key
SBT_CONTRACT_ADDRESS=0xb675FB5c63b33c3a431cb2eBBa0f6cDfd9A1de03

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Kakao OAuth
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
KAKAO_CALLBACK_URL=http://localhost:3001/api/auth/kakao/callback
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

1. **소셜 로그인 테스트**:
   - Google Cloud Console에서 OAuth 2.0 클라이언트 생성
   - Kakao Developers에서 앱 생성
   - `.env` 파일에 클라이언트 ID/Secret 설정
   - 로그인 플로우 테스트

2. **서버 시작**:
   ```bash
   cd packages/backend && npm run start:dev
   cd packages/frontend && npm run dev
   ```

3. **추가 기능 개발**:
   - Gated Content 기능 완성
   - Creator Dashboard 개선
   - 실시간 알림 (WebSocket)

4. **프로덕션 배포 준비**:
   - Docker 이미지 빌드
   - 클라우드 배포 (Vercel, Railway 등)
