-- Supabase Storage Bucket Setup
-- Run this in Supabase SQL Editor to create the storage bucket for images

-- Step 1: Create the 'images' storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,  -- Public bucket so images are accessible via public URL
  5242880,  -- 5MB file size limit (in bytes)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up Storage Policies for the bucket
-- Allow anyone to read/view images (public access)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Allow anyone to upload images (no authentication required)
-- Note: This is suitable for admin-only apps. For production, consider adding additional checks.
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'images' );

-- Allow anyone to update images
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'images' )
WITH CHECK ( bucket_id = 'images' );

-- Allow anyone to delete images
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'images' );

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'images';
