-- Migration: Enhanced Vietnamese AI Summarizer Schema
-- Date: 2025-09-11
-- Description: Complete database schema for AI Tóm tắt features

-- 1. Users table (extends Clerk authentication)
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

-- 2. Summaries table (core functionality)
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

-- 3. Referrals table (referral system)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    reward_type TEXT DEFAULT 'trial_extension' CHECK (reward_type IN ('trial_extension', 'usage_bonus', 'discount')),
    reward_value INTEGER DEFAULT 0,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- 4. Usage logs table (tracking and analytics)
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('summarize', 'upload', 'share', 'export')),
    summary_mode TEXT,
    source_type TEXT,
    input_length INTEGER,
    output_length INTEGER,
    processing_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payment transactions table (MoMo/ZaloPay integration)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE NOT NULL,
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('momo', 'zalopay')),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('trial', 'pro')),
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'VND',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    provider_transaction_id TEXT,
    provider_response JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_share_id ON summaries(share_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- 7. Create functions for automatic referral code generation
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
DECLARE
    code TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        done := NOT EXISTS(SELECT 1 FROM users WHERE referral_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger function to auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for automatic referral code generation
DROP TRIGGER IF EXISTS trigger_set_referral_code ON users;
CREATE TRIGGER trigger_set_referral_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_code();

-- 10. Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_summaries_updated_at ON summaries;
CREATE TRIGGER trigger_update_summaries_updated_at
    BEFORE UPDATE ON summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER trigger_update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can only access their own summaries
CREATE POLICY summaries_own_data ON summaries
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Public access to shared summaries
CREATE POLICY summaries_shared_read ON summaries
    FOR SELECT
    USING (is_shared = TRUE AND share_expires_at > NOW());

-- Users can access referrals they're involved in
CREATE POLICY referrals_involved_data ON referrals
    FOR ALL
    USING (
        referrer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
        OR referred_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
    );

-- Users can only access their own usage logs
CREATE POLICY usage_logs_own_data ON usage_logs
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Users can only access their own payment transactions
CREATE POLICY payment_transactions_own_data ON payment_transactions
    FOR ALL
    USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- Insert some sample data for testing
INSERT INTO users (clerk_id, email, subscription, referral_code) VALUES 
('sample_clerk_id', 'test@example.com', 'Free', 'SAMPLE01')
ON CONFLICT (clerk_id) DO NOTHING;

-- Migration completed
SELECT 'Enhanced Vietnamese AI Summarizer Schema Migration Completed' as status;
