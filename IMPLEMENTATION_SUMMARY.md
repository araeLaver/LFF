# LFF 프로젝트 구현 요약

## 개요
LFF (LinkedIn for Fandom) - 팬 이코노미 플랫폼
- 크리에이터가 퀘스트와 이벤트를 생성
- 팬들이 활동을 완료하고 NFT 보상 획득
- 토큰게이팅을 통한 독점 콘텐츠 접근

---

## 기술 스택

### Backend
- **Framework**: NestJS 11
- **Language**: TypeScript
- **ORM**: Prisma 7
- **Database**: PostgreSQL 14
- **Authentication**: Passport.js + JWT
- **Blockchain**: ethers.js (Polygon PoS)

### Frontend
- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4

---

## Backend 구현 (packages/backend)

### 모듈 구조
```
src/
├── prisma/           # Prisma 서비스
├── auth/             # 인증 (JWT, Passport)
├── user/             # 사용자 관리
├── wallet/           # 커스터디얼 지갑
├── creator/          # 크리에이터 관리
├── quest/            # 퀘스트 CRUD + 제출
├── event/            # 이벤트 + QR 코드
├── gated-content/    # 토큰게이팅 콘텐츠
└── nft/              # NFT 조회
```

### 생성된 파일

#### Core
- `src/main.ts` - 앱 부트스트랩 (CORS, ValidationPipe, Global Prefix)
- `src/app.module.ts` - 루트 모듈
- `.env` - 환경변수 설정

#### Prisma Module
- `src/prisma/prisma.module.ts`
- `src/prisma/prisma.service.ts`

#### Auth Module
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/dto/signup.dto.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/strategies/local.strategy.ts`
- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/guards/local-auth.guard.ts`
- `src/auth/decorators/current-user.decorator.ts`

#### Wallet Module
- `src/wallet/wallet.module.ts`
- `src/wallet/wallet.service.ts` - AES-256-CBC 암호화 지갑

#### User Module
- `src/user/user.module.ts`
- `src/user/user.controller.ts`
- `src/user/user.service.ts`
- `src/user/dto/update-profile.dto.ts`

#### Creator Module
- `src/creator/creator.module.ts`
- `src/creator/creator.controller.ts`
- `src/creator/creator.service.ts`

#### Quest Module
- `src/quest/quest.module.ts`
- `src/quest/quest.controller.ts`
- `src/quest/quest.service.ts`
- `src/quest/dto/create-quest.dto.ts`
- `src/quest/dto/update-quest.dto.ts`
- `src/quest/dto/submit-quest.dto.ts`
- `src/quest/dto/review-submission.dto.ts`

#### Event Module
- `src/event/event.module.ts`
- `src/event/event.controller.ts`
- `src/event/event.service.ts`
- `src/event/dto/create-event.dto.ts`
- `src/event/dto/update-event.dto.ts`
- `src/event/dto/redeem-qr.dto.ts`

#### Gated Content Module
- `src/gated-content/gated-content.module.ts`
- `src/gated-content/gated-content.controller.ts`
- `src/gated-content/gated-content.service.ts`
- `src/gated-content/dto/create-gated-content.dto.ts`
- `src/gated-content/dto/update-gated-content.dto.ts`

#### NFT Module
- `src/nft/nft.module.ts`
- `src/nft/nft.controller.ts`
- `src/nft/nft.service.ts`

### API 엔드포인트

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 현재 사용자 정보 |
| GET | /api/users/:id | 사용자 조회 |
| PATCH | /api/users/profile | 프로필 수정 |
| POST | /api/creators/register | 크리에이터 등록 |
| GET | /api/creators | 크리에이터 목록 |
| GET | /api/creators/:id | 크리에이터 상세 |
| GET | /api/quests | 퀘스트 목록 |
| GET | /api/quests/active | 활성 퀘스트 |
| GET | /api/quests/my-quests | 내 퀘스트 (크리에이터) |
| GET | /api/quests/:id | 퀘스트 상세 |
| POST | /api/quests | 퀘스트 생성 |
| POST | /api/quests/:id/submit | 퀘스트 제출 |
| GET | /api/quests/submissions/my | 내 제출 내역 |
| PATCH | /api/quests/submissions/:id/review | 제출 심사 |
| GET | /api/events | 이벤트 목록 |
| GET | /api/events/upcoming | 예정 이벤트 |
| GET | /api/events/my-events | 내 이벤트 (크리에이터) |
| GET | /api/events/:id | 이벤트 상세 |
| POST | /api/events | 이벤트 생성 |
| POST | /api/events/:id/qr-codes | QR 코드 생성 |
| POST | /api/events/redeem | QR 코드 리딤 |
| GET | /api/events/my-attendances | 내 참석 내역 |
| GET | /api/gated-content | 콘텐츠 목록 |
| GET | /api/gated-content/:id | 콘텐츠 상세 |
| POST | /api/gated-content/:id/access | 콘텐츠 접근 (NFT 검증) |
| GET | /api/nfts | NFT 목록 |
| GET | /api/nfts/my-nfts | 내 NFT |
| GET | /api/nfts/:id | NFT 상세 |

---

## Frontend 구현 (packages/frontend)

### 디렉토리 구조
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── quests/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── events/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── content/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── mypage/
│   │   └── page.tsx
│   └── creator/
│       ├── page.tsx
│       ├── quests/page.tsx
│       └── events/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Loading.tsx
│       └── index.ts
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   ├── api.ts
│   └── auth.ts
└── types/
    └── index.ts
```

### 생성된 파일

#### Types & Utilities
- `src/types/index.ts` - TypeScript 타입 정의
- `src/lib/auth.ts` - JWT 토큰 관리
- `src/lib/api.ts` - API 클라이언트

#### Context
- `src/contexts/AuthContext.tsx` - 인증 상태 관리

#### UI Components
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Loading.tsx`
- `src/components/ui/index.ts`

#### Layout Components
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/index.ts`

#### Pages
- `src/app/layout.tsx` - 루트 레이아웃
- `src/app/page.tsx` - 홈페이지
- `src/app/auth/login/page.tsx` - 로그인
- `src/app/auth/signup/page.tsx` - 회원가입
- `src/app/quests/page.tsx` - 퀘스트 목록
- `src/app/quests/[id]/page.tsx` - 퀘스트 상세
- `src/app/events/page.tsx` - 이벤트 목록
- `src/app/events/[id]/page.tsx` - 이벤트 상세
- `src/app/content/page.tsx` - 토큰게이팅 콘텐츠 목록
- `src/app/content/[id]/page.tsx` - 콘텐츠 상세
- `src/app/mypage/page.tsx` - 마이페이지
- `src/app/creator/page.tsx` - 크리에이터 대시보드
- `src/app/creator/quests/page.tsx` - 퀘스트 관리
- `src/app/creator/events/page.tsx` - 이벤트 관리

### 페이지별 기능

| 페이지 | 기능 |
|--------|------|
| 홈 | 활성 퀘스트/이벤트 미리보기, 히어로 섹션 |
| 로그인 | 이메일/비밀번호 로그인 |
| 회원가입 | 이메일/비밀번호/닉네임 회원가입 |
| 퀘스트 목록 | 타입별 필터링, 카드 그리드 |
| 퀘스트 상세 | 상세 정보, 퀘스트 완료 제출 |
| 이벤트 목록 | 상태별 필터링, 카드 그리드 |
| 이벤트 상세 | 상세 정보, QR 코드 리딤 |
| 콘텐츠 목록 | 토큰게이팅 콘텐츠 카드 |
| 콘텐츠 상세 | NFT 검증 후 콘텐츠 접근 |
| 마이페이지 | NFT 갤러리, 제출내역, 참석내역, 프로필 수정 |
| 크리에이터 대시보드 | 통계, 퀘스트/이벤트 관리 링크 |
| 퀘스트 관리 | 퀘스트 생성/조회 |
| 이벤트 관리 | 이벤트 생성/조회, QR 코드 생성 |

---

## 실행 방법

### 1. PostgreSQL 실행
```bash
docker-compose up -d
```

### 2. Backend 실행
```bash
cd packages/backend
pnpm install
npx prisma generate
npx prisma db push
pnpm run start:dev
```

### 3. Frontend 실행
```bash
cd packages/frontend
pnpm install
pnpm dev
```

### 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

---

## 환경 변수

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/lff_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
WALLET_ENCRYPTION_KEY="12345678901234567890123456789012"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 다음 단계 (TODO)

1. **블록체인 통합**
   - Polygon PoS 연동
   - NFT 민팅 컨트랙트 배포
   - 실제 NFT 민팅 구현

2. **기능 확장**
   - 이미지 업로드 (S3/Cloudinary)
   - 이메일 인증
   - 소셜 로그인

3. **테스트**
   - Unit 테스트
   - E2E 테스트

4. **배포**
   - CI/CD 파이프라인
   - 프로덕션 환경 설정
