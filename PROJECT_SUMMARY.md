# NTLR Map - 프로젝트 요약

## 프로젝트 개요

NTLR Map은 사용자가 모바일 뷰로 경로를 탐색하고, 관리자가 경로와 장소를 관리할 수 있는 웹 기반 경로 추천 애플리케이션입니다.

## 주요 기능

### 1. Admin 인증 시스템
- **비밀번호 기반 접근**: `/admin` 경로에서 비밀번호(`ntlr1111`) 입력 후 접근
- **Admin 회원가입**: 이름, 이메일, 프로필 이미지, 인스타그램 ID 등록
- **세션 관리**: sessionStorage를 사용한 간단한 인증 유지

### 2. 동선 관리
- **동선 생성**: 제목, 설명 입력 및 Kakao Map을 통한 장소 선택
- **장소 순서 조정**: 드래그 앤 드롭 방식으로 장소 순서 변경
- **장소별 설명 작성**: Tiptap WYSIWYG 에디터를 사용한 리치 텍스트 설명 작성
- **동선 관리**: 대시보드에서 동선 목록 확인, 수정, 삭제

### 3. 사용자 경로 보기
- **공개 동선 목록**: 메인 페이지에서 모든 공개 동선 확인
- **동선 상세 보기**: Kakao Map과 함께 경로 시각화
- **장소 정보**: 각 장소의 상세 정보와 설명 확인
- **큐레이터 정보**: 동선 생성자의 프로필 정보 표시

## 기술 스택

### Frontend
- **Next.js 15.5.6**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS 4**: 스타일링
- **Tiptap**: WYSIWYG 에디터
- **Zustand**: 상태 관리

### Backend & Database
- **Supabase**: PostgreSQL 기반 백엔드
  - 데이터베이스 (admins, routes, places, place_descriptions)
  - Storage (프로필 이미지)
  - Row Level Security (RLS) 정책

### Third-party APIs
- **Kakao Map API**: 지도 및 장소 검색 기능

### Development Tools
- **Biome**: 린팅 및 포맷팅
- **Turbopack**: 빠른 빌드

## 데이터베이스 스키마

### admins 테이블
- id (UUID, Primary Key)
- name (TEXT)
- email (TEXT, Unique)
- profile_image_url (TEXT, Nullable)
- instagram_id (TEXT, Nullable)
- created_at (TIMESTAMP)

### routes 테이블
- id (UUID, Primary Key)
- title (TEXT)
- description (TEXT, Nullable)
- creator_id (UUID, Foreign Key → admins)
- is_public (BOOLEAN)
- created_at (TIMESTAMP)

### places 테이블
- id (UUID, Primary Key)
- route_id (UUID, Foreign Key → routes)
- place_name (TEXT)
- address (TEXT)
- latitude (DOUBLE PRECISION)
- longitude (DOUBLE PRECISION)
- kakao_place_id (TEXT, Nullable)
- order_index (INTEGER)
- created_at (TIMESTAMP)

### place_descriptions 테이블
- id (UUID, Primary Key)
- place_id (UUID, Foreign Key → places)
- content (JSONB) - HTML 콘텐츠 저장
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 프로젝트 구조

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                    # Admin 로그인
│   │   ├── register/
│   │   │   └── page.tsx               # Admin 회원가입
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Admin 대시보드
│   │   └── routes/
│   │       ├── create/
│   │       │   └── page.tsx           # 동선 생성
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx       # 동선 수정 (장소 설명)
│   ├── routes/
│   │   └── [id]/
│   │       └── page.tsx               # 사용자 동선 보기
│   ├── page.tsx                        # 메인 페이지 (공개 동선 목록)
│   ├── layout.tsx                      # Root 레이아웃
│   └── globals.css                     # Global 스타일
├── components/
│   ├── admin/
│   │   └── AdminGuard.tsx             # Admin 인증 가드
│   ├── editor/
│   │   └── TiptapEditor.tsx           # WYSIWYG 에디터
│   └── kakao/
│       ├── KakaoMapScript.tsx         # Kakao Map 스크립트 로더
│       └── PlaceSearch.tsx            # 장소 검색 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Supabase 클라이언트
│   │   └── database.types.ts          # DB 타입 정의
│   └── kakao/
│       └── types.ts                   # Kakao Map 타입
└── store/
    └── auth-store.ts                   # 인증 상태 관리

루트 파일:
├── .env.local.example                  # 환경 변수 예제
├── SUPABASE_SCHEMA.sql                # 데이터베이스 스키마
├── SETUP.md                           # 설정 가이드
├── PROJECT_SUMMARY.md                 # 프로젝트 요약
└── CLAUDE.md                          # Claude Code 가이드
```

## 주요 화면

### 1. 메인 페이지 (`/`)
- 모든 공개 동선을 카드 형식으로 표시
- 각 카드에는 동선 제목, 설명, 장소 개수, 큐레이터 정보 표시

### 2. Admin 로그인 (`/admin`)
- 비밀번호 입력 폼
- 입력 후 대시보드 또는 회원가입 페이지로 이동

### 3. Admin 회원가입 (`/admin/register`)
- 프로필 이미지 업로드
- 이름, 이메일, 인스타그램 ID 입력

### 4. Admin 대시보드 (`/admin/dashboard`)
- 자신이 생성한 동선 목록
- 새 동선 만들기 버튼
- 각 동선별 미리보기, 수정, 삭제 기능

### 5. 동선 생성 (`/admin/routes/create`)
- 동선 제목 및 설명 입력
- Kakao Map에서 장소 검색 및 추가
- 장소 순서 조정 (위/아래 이동, 삭제)

### 6. 동선 수정 (`/admin/routes/[id]/edit`)
- 왼쪽: 장소 목록
- 오른쪽: 선택한 장소의 설명을 Tiptap 에디터로 작성/수정

### 7. 동선 보기 (`/routes/[id]`)
- 왼쪽: Kakao Map에 경로와 마커 표시
- 오른쪽: 장소 목록 및 선택한 장소의 상세 정보

## 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Kakao Map API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your-kakao-api-key

# Admin Password
ADMIN_PASSWORD=ntlr1111
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 실제 값으로 수정

# 개발 서버 실행
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

## 배포 전 체크리스트

1. ✅ Supabase 프로젝트 생성 및 스키마 적용
2. ✅ Kakao Developers에서 API 키 발급 및 플랫폼 등록
3. ✅ 환경 변수 설정
4. ✅ Supabase Storage `profile-images` 버킷 생성
5. ✅ RLS 정책 확인
6. ⬜ 프로덕션 도메인에서 Kakao Map API 플랫폼 등록
7. ⬜ Vercel/AWS 등에 배포

## 향후 개선 사항

1. **인증 강화**: JWT 기반 인증으로 전환
2. **소셜 로그인**: Kakao, Naver, Google 로그인 추가
3. **좋아요/북마크**: 사용자가 좋아하는 동선 저장
4. **댓글 시스템**: 동선에 대한 사용자 피드백
5. **검색 기능**: 동선 및 장소 검색
6. **필터링**: 지역별, 카테고리별 동선 필터
7. **공유 기능**: 카카오톡, 링크 복사 등
8. **통계**: 조회수, 인기 동선 등
9. **반응형 개선**: 태블릿 뷰 최적화
10. **PWA**: Progressive Web App으로 전환

## 라이선스

개인 프로젝트

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.
