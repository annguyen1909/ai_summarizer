import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  subscription: 'Free' | 'Pro';
  subscription_expiry: string | null;
  daily_usage_count: number;
  monthly_usage_count: number;
  last_usage_date: string | null;
  last_monthly_reset: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  request_count: number;
  date: string;
  created_at: string;
}

// Rate limiting configuration
const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '5');
const PRO_MONTHLY_LIMIT = parseInt(process.env.PRO_MONTHLY_LIMIT || '300');
const FREE_MAX_INPUT_LENGTH = parseInt(process.env.FREE_MAX_INPUT_LENGTH || '2000');

// Helper functions
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function createOrUpdateUser(userData: Partial<User>): Promise<User | null> {
  const defaultData = {
    subscription: 'Free' as const,
    daily_usage_count: 0,
    monthly_usage_count: 0,
    last_usage_date: null,
    last_monthly_reset: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...userData
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(defaultData, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('Error creating/updating user:', error);
    return null;
  }

  return data;
}

export async function updateUserSubscription(
  email: string, 
  subscription: 'Free' | 'Pro', 
  expiryDate?: Date
): Promise<boolean> {
  const updateData: Partial<User> = {
    email,
    subscription,
    subscription_expiry: expiryDate ? expiryDate.toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin
    .from('users')
    .upsert(updateData, { onConflict: 'email' });

  if (error) {
    console.error('Error updating subscription:', error);
    return false;
  }

  return true;
}

export async function logUsage(email: string): Promise<boolean> {
  try {
    // Call the database function to log usage
    const { error } = await supabaseAdmin.rpc('log_usage', {
      user_email: email
    });

    if (error) {
      console.error('Error logging usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logUsage:', error);
    return false;
  }
}

export async function canUserMakeRequest(email: string, inputLength?: number): Promise<{ 
  canMake: boolean; 
  usage: number; 
  limit: number; 
  reason?: string;
  remainingToday?: number;
  remainingThisMonth?: number;
}> {
  const user = await getUserByEmail(email);
  if (!user) return { canMake: false, usage: 0, limit: FREE_DAILY_LIMIT, reason: 'User not found' };

  // Check input length for free users
  if (user.subscription === 'Free' && inputLength && inputLength > FREE_MAX_INPUT_LENGTH) {
    return {
      canMake: false,
      usage: user.daily_usage_count,
      limit: FREE_DAILY_LIMIT,
      reason: `Văn bản quá dài. Người dùng miễn phí chỉ được phép tóm tắt tối đa ${FREE_MAX_INPUT_LENGTH} ký tự.`
    };
  }

  // Pro users - check monthly limits and subscription validity
  if (user.subscription === 'Pro') {
    // Check if subscription is still valid
    if (user.subscription_expiry && new Date(user.subscription_expiry) > new Date()) {
      // Reset monthly count if needed
      const today = new Date();
      const lastReset = user.last_monthly_reset ? new Date(user.last_monthly_reset) : null;
      const isNewMonth = !lastReset || lastReset.getMonth() !== today.getMonth() || lastReset.getFullYear() !== today.getFullYear();
      
      let currentMonthlyUsage = user.monthly_usage_count;
      if (isNewMonth) {
        // Reset monthly usage
        await supabaseAdmin
          .from('users')
          .update({
            monthly_usage_count: 0,
            last_monthly_reset: today.toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('email', email);
        currentMonthlyUsage = 0;
      }

      const remainingThisMonth = Math.max(0, PRO_MONTHLY_LIMIT - currentMonthlyUsage);
      
      return {
        canMake: currentMonthlyUsage < PRO_MONTHLY_LIMIT,
        usage: currentMonthlyUsage,
        limit: PRO_MONTHLY_LIMIT,
        remainingThisMonth,
        reason: currentMonthlyUsage >= PRO_MONTHLY_LIMIT ? 'Bạn đã sử dụng hết lượt tóm tắt trong tháng này.' : undefined
      };
    } else {
      // Pro subscription expired, treat as Free user
      await createOrUpdateUser({
        email,
        subscription: 'Free',
        subscription_expiry: null,
        updated_at: new Date().toISOString()
      });
    }
  }

  // Free users - check daily limits
  const today = new Date().toISOString().split('T')[0];
  const isNewDay = user.last_usage_date !== today;
  const currentUsage = isNewDay ? 0 : user.daily_usage_count;
  const remainingToday = Math.max(0, FREE_DAILY_LIMIT - currentUsage);

  return {
    canMake: currentUsage < FREE_DAILY_LIMIT,
    usage: currentUsage,
    limit: FREE_DAILY_LIMIT,
    remainingToday,
    reason: currentUsage >= FREE_DAILY_LIMIT ? 'Bạn đã hết lượt tóm tắt miễn phí hôm nay. Vui lòng nâng cấp gói Pro để sử dụng không giới hạn.' : undefined
  };
}

export async function resetMonthlyUsage(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.rpc('reset_monthly_usage');
    
    if (error) {
      console.error('Error resetting monthly usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetMonthlyUsage:', error);
    return false;
  }
}

export async function getUserUsageStats(email: string): Promise<{
  dailyUsage: number;
  monthlyUsage: number;
  subscription: string;
  remainingToday?: number;
  remainingThisMonth?: number;
} | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const stats = {
    dailyUsage: user.daily_usage_count,
    monthlyUsage: user.monthly_usage_count,
    subscription: user.subscription
  };

  if (user.subscription === 'Free') {
    return {
      ...stats,
      remainingToday: Math.max(0, FREE_DAILY_LIMIT - user.daily_usage_count)
    };
  } else {
    return {
      ...stats,
      remainingThisMonth: Math.max(0, PRO_MONTHLY_LIMIT - user.monthly_usage_count)
    };
  }
}
