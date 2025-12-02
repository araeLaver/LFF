# Technical Proposal: AI 업무 비서

## 1. 아키텍처 원칙

*   **빠른 프로토타이핑:** MVP의 핵심 가설을 빠르게 검증하기 위해, 검증된 오픈소스와 관리형 서비스(Managed Service)를 적극 활용한다.
*   **보안 최우선:** 사용자의 이메일 등 민감한 개인정보를 다루므로, 모든 개발 과정에서 데이터 암호화 및 접근 제어를 최우선으로 고려한다.
*   **확장성:** MVP 이후 기능 확장을 고려하여, 각 컴포넌트(이메일 처리, AI 모델, API 등)가 독립적으로 확장될 수 있는 마이크로서비스 지향 아키텍처를 설계한다.

## 2. 주요 기술 스택

### 2.1. 프론트엔드 (Frontend)
*   **선택:** **Next.js (React)**
*   **이유:**
    *   빠른 UI 개발이 가능하고, 안정적인 생태계를 갖추고 있다.
    *   Vercel을 통해 손쉬운 배포 및 관리가 가능하다.
    *   서버 사이드 렌더링(SSR)을 통해 초기 로딩 성능을 확보할 수 있다.

### 2.2. 백엔드 (Backend)
*   **선택:** **Python + FastAPI**
*   **이유:**
    *   Hugging Face, LangChain 등 최신 AI/LLM 라이브러리 및 프레임워크와 최고의 호환성을 보인다.
    *   Python의 풍부한 데이터 처리 라이브러리(Pandas 등)를 활용하기 용이하다.
    *   FastAPI는 비동기 처리를 지원하여 I/O 작업이 많은 백엔드 서비스에 적합하며, Node.js 수준의 높은 성능을 제공한다.

### 2.3. 데이터베이스 (Database)
*   **선택:** **PostgreSQL + Prisma ORM**
*   **이유:**
    *   **PostgreSQL:** 오랜 기간 안정성이 검증된 RDBMS이며, 복잡한 데이터 관계를 정의하기에 적합하다.
    *   **Prisma:** 타입스크립트/자바스크립트 환경에서 데이터베이스 작업을 타입-세이프하게 처리할 수 있게 해주며, 프론트엔드-백엔드 간의 데이터 모델 일관성을 유지하는 데 도움이 된다. (백엔드가 Python이므로, SQLAlchemy 등 다른 ORM도 고려 가능)

### 2.4. AI / LLM
*   **선택:** **Google Gemini 또는 OpenAI GPT-4 API 활용**
*   **이유:**
    *   자체 언어 모델을 개발하는 것은 막대한 비용과 시간이 소요되므로, 초기에는 검증된 외부 API를 활용하여 핵심 비즈니스 로직 개발에 집중한다.
    *   이메일 요약, 분류, 답장 초안 생성 등 자연어 처리(NLP) 작업에 매우 높은 성능을 보인다.
    *   **프롬프트 엔지니어링**과 **RAG(Retrieval-Augmented Generation)** 기술을 통해, API를 우리 서비스에 맞게 최적화하여 사용한다.

### 2.5. 핵심 연동 API (Integrations)
*   **Google API:** Gmail API, Google Calendar API를 사용하여 사용자의 데이터를 안전하게 가져오고 동기화한다.
*   **Microsoft Graph API:** Outlook Mail API, Calendar API를 사용하여 MS 계정 사용자를 지원한다.
*   **인증:** OAuth 2.0 프로토콜을 사용하여 서드파티 서비스(구글, MS)에 대한 접근 권한을 안전하게 획득한다.

## 3. 배포 (Deployment)
*   **프론트엔드:** Vercel 또는 Netlify
*   **백엔드/데이터베이스:** Google Cloud Run, AWS Fargate, AWS RDS 등 관리형 클라우드 서비스를 사용하여 인프라 관리 부담을 최소화한다.
