-- Add last_login_date column to users table for daily login reward tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;

-- Set existing users' last_login_date to their usage_reset_date if it exists
UPDATE users 
SET last_login_date = usage_reset_date::date 
WHERE last_login_date IS NULL AND usage_reset_date IS NOT NULL;

-- Set default for users without usage_reset_date
UPDATE users 
SET last_login_date = CURRENT_DATE 
WHERE last_login_date IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN users.last_login_date IS 'Tracks the last date user logged in to give daily login rewards';