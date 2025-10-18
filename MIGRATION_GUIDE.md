# 데이터베이스 마이그레이션 가이드

기존 Supabase 데이터베이스에 새로운 기능을 추가하기 위한 마이그레이션 가이드입니다.

## 변경 사항

### 1. admins 테이블
- `password_hash` 컬럼 추가 (로그인 기능을 위한 비밀번호 저장)

### 2. routes 테이블
- `today_type` 컬럼 추가 (동선 타입: 다른하루/낯선하루 구분)

## 마이그레이션 실행 방법

### 옵션 1: 간단한 방법 (기존 데이터가 없거나 중요하지 않은 경우)

1. Supabase Dashboard → SQL Editor로 이동
2. 다음 SQL을 실행:

```sql
-- admins 테이블에 password_hash 컬럼 추가
ALTER TABLE admins
ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
```

3. 기존 admin 계정들은 다시 회원가입하거나 수동으로 비밀번호를 설정해야 합니다.

### 옵션 2: 기존 데이터 유지 (권장)

1. Supabase Dashboard → SQL Editor로 이동
2. `SUPABASE_MIGRATION.sql` 파일의 내용을 복사하여 실행

```sql
-- Step 1: password_hash 컬럼 추가 (NULL 허용)
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

3. 기존 admin 사용자들을 위한 임시 비밀번호 설정

**방법 A: 웹사이트에서 회원가입 다시 하기**
- 기존 admin 계정 삭제 후 `/admin`에서 회원가입
- 이메일이 중복되므로 먼저 기존 계정 삭제 필요:
  ```sql
  DELETE FROM admins WHERE email = 'your-email@example.com';
  ```

**방법 B: SQL로 비밀번호 직접 설정**
1. 비밀번호 해시 생성 (Node.js 환경에서):
   ```javascript
   const bcrypt = require('bcryptjs');
   const password = 'your-password';
   const hash = bcrypt.hashSync(password, 10);
   console.log(hash);
   // 출력: $2a$10$...
   ```

2. Supabase SQL Editor에서 실행:
   ```sql
   UPDATE admins
   SET password_hash = '$2a$10$...' -- 위에서 생성한 해시값
   WHERE email = 'your-email@example.com';
   ```

3. 모든 기존 admin에 비밀번호 설정 후, NOT NULL 제약 조건 추가:
   ```sql
   ALTER TABLE admins
   ALTER COLUMN password_hash SET NOT NULL;
   ```

## 비밀번호 해시 생성 방법

### 방법 1: Node.js 스크립트 사용

프로젝트 루트에서 다음 명령 실행:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

### 방법 2: 온라인 도구 사용

1. https://bcrypt-generator.com/ 방문
2. 원하는 비밀번호 입력
3. Rounds를 10으로 설정
4. 생성된 해시 복사

### 방법 3: 브라우저 콘솔 사용

1. 웹사이트에서 F12를 눌러 개발자 도구 열기
2. Console 탭에서 다음 코드 실행:

```javascript
// bcryptjs 라이브러리 로드
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/bcryptjs@2.4.3/dist/bcrypt.min.js';
document.head.appendChild(script);

// 라이브러리 로드 후 (몇 초 기다린 후)
dcodeIO.bcrypt.hashSync('your-password', 10);
```

## 마이그레이션 확인

마이그레이션이 성공적으로 완료되었는지 확인:

```sql
-- password_hash 컬럼이 추가되었는지 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admins';

-- 기존 admin 계정 확인
SELECT id, name, email, password_hash IS NOT NULL as has_password
FROM admins;
```

## 트러블슈팅

### 오류: "column password_hash already exists"
- 이미 컬럼이 추가되어 있습니다. 다음 단계로 진행하세요.

### 오류: "null value in column password_hash violates not-null constraint"
- 모든 admin 계정에 비밀번호를 설정하지 않은 상태입니다.
- 위의 "방법 A" 또는 "방법 B"를 사용하여 비밀번호를 설정하세요.

### 기존 계정으로 로그인할 수 없음
- 비밀번호가 설정되지 않았거나 잘못된 비밀번호가 설정되었습니다.
- SQL로 비밀번호 재설정:
  ```sql
  UPDATE admins
  SET password_hash = '$2a$10$...' -- 새로운 해시값
  WHERE email = 'your-email@example.com';
  ```

## 롤백 (마이그레이션 취소)

마이그레이션을 되돌리려면:

```sql
-- password_hash 컬럼 제거
ALTER TABLE admins
DROP COLUMN IF EXISTS password_hash;
```

**주의**: 롤백하면 모든 비밀번호 정보가 삭제됩니다!

---

## todayType 필드 추가 (routes 테이블)

### 마이그레이션 실행

Supabase Dashboard → SQL Editor에서 `TODAYTYPE_MIGRATION.sql` 파일의 내용을 실행하세요:

```sql
ALTER TABLE routes
ADD COLUMN today_type TEXT NOT NULL DEFAULT '다른하루'
CHECK (today_type IN ('다른하루', '낯선하루'));
```

### 설명

- **컬럼명**: `today_type`
- **타입**: `TEXT`
- **필수**: `NOT NULL`
- **기본값**: `'다른하루'`
- **제약조건**: `'다른하루'` 또는 `'낯선하루'`만 허용

### 기존 데이터 처리

기본값이 `'다른하루'`로 설정되므로 기존의 모든 동선은 자동으로 '다른하루'로 설정됩니다.

필요시 특정 동선의 타입을 변경할 수 있습니다:

```sql
UPDATE routes
SET today_type = '낯선하루'
WHERE id = 'your-route-id';
```

### 확인

```sql
SELECT id, title, today_type
FROM routes;
```

### 롤백

```sql
ALTER TABLE routes
DROP COLUMN IF EXISTS today_type;
```

---

## 다음 단계

마이그레이션 완료 후:

### password_hash 추가 후:
1. `/admin` 페이지에서 로그인 테스트
2. 새로운 admin 계정 생성 테스트
3. 기존 admin 계정으로 로그인 테스트

### today_type 추가 후:
1. `/admin/routes/create`에서 새 동선 생성 시 '다른하루'/'낯선하루' 선택 가능 확인
2. `/admin/routes/[id]/edit`에서 기존 동선의 타입 수정 가능 확인
3. 홈페이지에서 타입별 필터링 동작 확인
4. 동선 카드와 상세 페이지에 배지 표시 확인
