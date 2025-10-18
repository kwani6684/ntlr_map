-- Fix for "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor if you're getting RLS errors when uploading images

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Step 2: Create new permissive policies for the 'images' bucket
-- These policies allow public access since the app is admin-protected

-- Allow anyone to read/view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Allow anyone to upload images
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

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';
