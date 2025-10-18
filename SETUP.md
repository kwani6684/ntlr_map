# NTLR Map 설정 가이드

이 문서는 NTLR Map 애플리케이션을 설정하고 실행하는 방법을 설명합니다.

## 🚀 시작하기

### 1. 필수 조건

- Node.js 18+ 설치
- Supabase 계정
- Kakao Developers 계정

### 2. Supabase 설정

#### 2.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트를 생성합니다.
2. 프로젝트 대시보드에서 다음 정보를 확인합니다:
   - Project URL
   - Anon/Public Key

#### 2.2 데이터베이스 스키마 생성

1. Supabase 대시보드에서 SQL Editor를 엽니다.
2. `SUPABASE_SCHEMA.sql` 파일의 내용을 복사하여 실행합니다.
3. 모든 테이블과 정책이 생성되었는지 확인합니다.

#### 2.3 Storage 설정

1. Supabase 대시보드에서 Storage 섹션으로 이동합니다.
2. `profile-images` 버킷이 생성되었는지 확인합니다.
3. 버킷이 public으로 설정되어 있는지 확인합니다.

### 3. Kakao Map API 설정

#### 3.1 Kakao Developers 앱 생성

1. [Kakao Developers](https://developers.kakao.com)에 로그인합니다.
2. "내 애플리케이션" 메뉴에서 "애플리케이션 추가하기"를 클릭합니다.
3. 앱 이름을 입력하고 생성합니다.

#### 3.2 JavaScript 키 발급

1. 생성한 앱의 "앱 키" 메뉴로 이동합니다.
2. "JavaScript 키"를 복사합니다.

#### 3.3 플랫폼 설정

1. "플랫폼" 메뉴로 이동합니다.
2. "Web 플랫폼 등록"을 클릭합니다.
3. 사이트 도메인을 등록합니다:
   - 개발: `http://localhost:3000`
   - 프로덕션: 실제 도메인

### 4. 환경 변수 설정

1. 프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
cp .env.local.example .env.local
```

2. `.env.local` 파일을 편집하여 실제 값을 입력합니다:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Kakao Map API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your-kakao-javascript-key

# Admin Password (for initial access)
ADMIN_PASSWORD=ntlr1111
```

### 5. 의존성 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 애플리케이션을 확인합니다.

## 📱 사용 방법

### Admin 계정 생성

1. `http://localhost:3000/admin`으로 이동합니다.
2. 비밀번호 `ntlr1111`을 입력합니다.
3. 회원가입 페이지에서 Admin 계정을 생성합니다:
   - 이름
   - 이메일
   - 프로필 이미지 (선택)
   - 인스타그램 ID (선택)

### 동선 만들기

1. Admin 대시보드에서 "새 동선 만들기" 버튼을 클릭합니다.
2. 동선 제목과 설명을 입력합니다.
3. Kakao Map에서 장소를 검색하고 추가합니다.
4. 장소 순서를 조정합니다.
5. "동선 생성하기" 버튼을 클릭합니다.

### 장소 설명 작성

1. 생성된 동선의 "수정" 버튼을 클릭합니다.
2. 왼쪽 패널에서 장소를 선택합니다.
3. Tiptap 에디터를 사용하여 설명을 작성합니다.
4. "설명 저장" 버튼을 클릭합니다.

### 동선 보기

1. 메인 페이지에서 동선 카드를 클릭합니다.
2. Kakao Map에서 경로를 확인합니다.
3. 각 장소를 클릭하여 상세 정보를 확인합니다.

## 🏗️ 프로젝트 구조

```
src/
├── app/                      # Next.js App Router 페이지
│   ├── admin/               # Admin 페이지
│   │   ├── page.tsx        # Admin 로그인
│   │   ├── register/       # Admin 회원가입
│   │   ├── dashboard/      # Admin 대시보드
│   │   └── routes/         # 동선 관리
│   │       ├── create/     # 동선 생성
│   │       └── [id]/edit/  # 동선 수정
│   ├── routes/             # 사용자 동선 보기
│   │   └── [id]/          # 동선 상세
│   └── page.tsx            # 메인 페이지
├── components/             # React 컴포넌트
│   ├── admin/             # Admin 관련 컴포넌트
│   ├── editor/            # Tiptap 에디터
│   └── kakao/             # Kakao Map 컴포넌트
├── lib/                   # 라이브러리 및 유틸리티
│   ├── supabase/         # Supabase 클라이언트
│   └── kakao/            # Kakao Map 타입
└── store/                # Zustand 상태 관리
```

## 🛠️ 기술 스택

- **Framework**: Next.js 15.5.6
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Map**: Kakao Map API
- **Editor**: Tiptap
- **State Management**: Zustand
- **Linting/Formatting**: Biome

## 🐛 문제 해결

### Kakao Map이 표시되지 않음

- `.env.local`의 Kakao API 키가 올바른지 확인합니다.
- Kakao Developers에서 플랫폼 설정이 올바른지 확인합니다.
- 브라우저 콘솔에서 에러 메시지를 확인합니다.

### Supabase 연결 오류

- `.env.local`의 Supabase URL과 Anon Key가 올바른지 확인합니다.
- Supabase 프로젝트가 활성 상태인지 확인합니다.
- RLS 정책이 올바르게 설정되었는지 확인합니다.

### 이미지 업로드 실패

- Supabase Storage에서 `profile-images` 버킷이 생성되었는지 확인합니다.
- 버킷이 public으로 설정되어 있는지 확인합니다.
- Storage 정책이 올바르게 설정되었는지 확인합니다.

## 📝 라이선스

이 프로젝트는 개인 프로젝트입니다.
