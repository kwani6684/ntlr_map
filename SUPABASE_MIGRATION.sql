-- Supabase Migration Script
-- This script adds the password_hash column to existing admins table
-- Run this in your Supabase SQL Editor

-- Step 1: Add password_hash column to admins table
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 2: Set password_hash as NOT NULL after adding default values
-- First, update existing rows with a temporary password hash
-- You'll need to update these manually or have users reset their passwords
UPDATE admins
SET password_hash = '$2a$10$YourTemporaryHashHere'
WHERE password_hash IS NULL;

-- Then make the column NOT NULL
ALTER TABLE admins
ALTER COLUMN password_hash SET NOT NULL;

-- Note: After running this migration, existing admin users will need to:
-- 1. Use the registration form to create a new account with a password, OR
-- 2. You can manually set their password hash using bcrypt

-- To manually set a password for an existing admin:
-- 1. Generate a bcrypt hash for the desired password (you can use online tools or bcrypt.hash in your app)
-- 2. Run: UPDATE admins SET password_hash = 'your_bcrypt_hash' WHERE email = 'admin@example.com';
