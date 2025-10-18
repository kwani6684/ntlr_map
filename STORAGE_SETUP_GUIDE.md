# Supabase Storage 설정 가이드

이미지 업로드 기능을 사용하기 위한 Supabase Storage 버킷 설정 가이드입니다.

## 설정이 필요한 이유

Tiptap 에디터의 이미지 업로드 기능을 사용하려면 Supabase Storage에 `images` 버킷이 필요합니다.

## 설정 방법

### 방법 1: SQL Editor 사용 (권장)

1. Supabase Dashboard → SQL Editor로 이동
2. `STORAGE_SETUP.sql` 파일의 내용을 복사하여 실행

전체 SQL:

```sql
-- Step 1: Create the 'images' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up Storage Policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' )
WITH CHECK ( bucket_id = 'images' );

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' );
```

### 방법 2: Dashboard UI 사용

1. Supabase Dashboard → Storage로 이동
2. "New Bucket" 버튼 클릭
3. 버킷 설정:
   - **Name**: `images`
   - **Public bucket**: ✅ 체크 (공개 접근 허용)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
4. "Create bucket" 클릭

## 설정 확인

버킷이 제대로 생성되었는지 확인하려면 SQL Editor에서 실행:

```sql
-- 버킷 확인
SELECT * FROM storage.buckets WHERE id = 'images';

-- 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 설정 내용 설명

### 버킷 속성

- **id/name**: `images` - 버킷 식별자
- **public**: `true` - 공개 URL로 이미지 접근 가능
- **file_size_limit**: `5242880` (5MB) - 업로드 가능한 최대 파일 크기
- **allowed_mime_types**: 업로드 가능한 이미지 형식 제한

### Storage Policies (보안 정책)

1. **Public Access**: 누구나 이미지를 읽고 볼 수 있음
2. **Allow public uploads**: 누구나 이미지 업로드 가능 (admin 전용 앱이므로 허용)
3. **Allow public updates**: 누구나 이미지 수정 가능
4. **Allow public deletes**: 누구나 이미지 삭제 가능

**참고**: 이 앱은 admin 전용이므로 공개 업로드를 허용합니다. Admin 페이지는 비밀번호로 보호되므로 실질적으로는 admin만 접근 가능합니다.

## 트러블슈팅

### 오류: "new row violates row-level security policy"

이미지 업로드 시 RLS 정책 위반 오류가 발생합니다.

**원인**: 기존 정책이 Supabase Auth 인증을 요구하지만, 이 앱은 커스텀 인증을 사용합니다.

**해결 방법**:

1. 기존 정책 삭제:
   ```sql
   DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
   DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
   DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
   DROP POLICY IF EXISTS "Public Access" ON storage.objects;
   ```

2. 새 정책 생성 (`STORAGE_SETUP.sql` 파일 사용):
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'images' );

   CREATE POLICY "Allow public uploads"
   ON storage.objects FOR INSERT
   WITH CHECK ( bucket_id = 'images' );

   CREATE POLICY "Allow public updates"
   ON storage.objects FOR UPDATE
   USING ( bucket_id = 'images' )
   WITH CHECK ( bucket_id = 'images' );

   CREATE POLICY "Allow public deletes"
   ON storage.objects FOR DELETE
   USING ( bucket_id = 'images' );
   ```

### 오류: "relation storage.buckets does not exist"

Supabase Storage가 활성화되지 않았습니다:
1. Supabase Dashboard → Settings → API로 이동
2. Storage API가 활성화되어 있는지 확인
3. 프로젝트가 최신 버전인지 확인

### 오류: "duplicate key value violates unique constraint"

이미 `images` 버킷이 존재합니다:
- 정상적인 상황입니다. SQL의 `ON CONFLICT DO NOTHING` 구문이 이를 처리합니다.
- 또는 Dashboard에서 Storage → images 버킷을 확인하세요.

### 이미지 업로드는 되지만 표시되지 않음

버킷이 Public으로 설정되지 않았을 수 있습니다:
1. Dashboard → Storage → images 버킷 클릭
2. Configuration → Public bucket 확인
3. 또는 SQL로 수정:
   ```sql
   UPDATE storage.buckets
   SET public = true
   WHERE id = 'images';
   ```

### Policy 오류

기존 정책과 충돌하는 경우:
```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- 그 다음 STORAGE_SETUP.sql의 정책들을 다시 실행
```

## 이미지 저장 위치

업로드된 이미지는 다음 경로에 저장됩니다:
- **버킷**: `images`
- **폴더**: `place-images/`
- **파일명**: 랜덤 생성 (예: `abc123.jpg`)
- **전체 경로**: `images/place-images/abc123.jpg`

## 다음 단계

설정 완료 후:
1. 에디터에서 이미지 업로드 테스트
2. Supabase Dashboard → Storage → images에서 업로드된 파일 확인
3. 이미지가 정상적으로 표시되는지 확인
