-- Add today_type column to routes table
-- Run this in Supabase SQL Editor

-- Step 1: Add today_type column with default value
ALTER TABLE routes
ADD COLUMN today_type TEXT NOT NULL DEFAULT '다른하루'
CHECK (today_type IN ('다른하루', '낯선하루'));

-- Step 2: Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'routes' AND column_name = 'today_type';

-- Step 3: (Optional) Update existing routes if needed
-- UPDATE routes SET today_type = '다른하루' WHERE today_type IS NULL;
