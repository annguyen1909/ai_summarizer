# Supabase Database Schema - Enhanced Version

## Users Table

```sql
-- Create the users table with enhanced features
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription VARCHAR(10) DEFAULT 'Free' CHECK (subscription IN ('Free', 'Trial', 'Pro')),
    subscription_expiry TIMESTAMP WITH TIME ZONE,
    daily_usage_count INTEGER DEFAULT 0,
    monthly_usage_count INTEGER DEFAULT 0,
    last_usage_date DATE,
    last_monthly_reset DATE,
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(20),
    referral_bonus_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the summaries table for history
CREATE TABLE summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_type VARCHAR(10) CHECK (input_type IN ('text', 'link', 'file')),
    input_text TEXT,
    input_url VARCHAR(500),
    file_name VARCHAR(255),
    output_summary TEXT NOT NULL,
    summary_mode VARCHAR(10) CHECK (summary_mode IN ('short', 'bullet', 'outline')),
    word_count INTEGER,
    share_token VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the usage_logs table
CREATE TABLE usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_summaries_created_at ON summaries(created_at);
CREATE INDEX idx_summaries_share_token ON summaries(share_token);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Users can read own summaries" ON summaries
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ));

CREATE POLICY "Users can create own summaries" ON summaries
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ));

-- Create a function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger AS $$
BEGIN
    NEW.referral_code = 'VN' || substr(md5(random()::text), 1, 6);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for referral code generation
CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- Function to handle referral bonus
CREATE OR REPLACE FUNCTION handle_referral_bonus(referrer_code VARCHAR, new_user_email VARCHAR)
RETURNS void AS $$
DECLARE
    referrer_id UUID;
BEGIN
    -- Find referrer by code
    SELECT id INTO referrer_id FROM users WHERE referral_code = referrer_code;
    
    IF referrer_id IS NOT NULL THEN
        -- Add bonus to referrer
        UPDATE users 
        SET referral_bonus_count = referral_bonus_count + 10,
            updated_at = NOW()
        WHERE id = referrer_id;
        
        -- Mark new user as referred
        UPDATE users 
        SET referred_by = referrer_code,
            updated_at = NOW()
        WHERE email = new_user_email;
    END IF;
END;
$$ language 'plpgsql';
                ELSE 1
            END,
            monthly_usage_count = monthly_usage_count + 1,
            last_usage_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = user_uuid;
    END IF;
END;
$$ language 'plpgsql';
```

## Instructions for Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the above SQL commands
4. Run the commands to create the table and set up the schema
5. Make sure to set up proper RLS policies for your use case
6. Update your environment variables with the correct Supabase credentials

## Environment Variables Required

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)
