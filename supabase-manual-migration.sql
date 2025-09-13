-- Run this in Supabase SQL Editor to create the required tables

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    subscription TEXT DEFAULT 'Free' CHECK (subscription IN ('Free', 'Trial', 'Pro')),
    daily_usage_count INTEGER DEFAULT 0,
    monthly_usage_count INTEGER DEFAULT 0,
    usage_reset_date DATE DEFAULT CURRENT_DATE,
    subscription_expiry TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    referral_code TEXT UNIQUE,
    referrals_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    summary TEXT NOT NULL,
    summary_mode TEXT DEFAULT 'short' CHECK (summary_mode IN ('short', 'bullet', 'outline')),
    source TEXT DEFAULT 'text' CHECK (source IN ('text', 'url', 'file')),
    source_url TEXT,
    source_filename TEXT,
    word_count INTEGER,
    is_shared BOOLEAN DEFAULT FALSE,
    share_id TEXT UNIQUE,
    share_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);

-- 4. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for users table
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_id);

-- 6. Create RLS policies for summaries table
CREATE POLICY "Users can view own summaries" ON summaries
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can insert own summaries" ON summaries
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can update own summaries" ON summaries
    FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

CREATE POLICY "Users can delete own summaries" ON summaries
    FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
