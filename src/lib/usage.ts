import { createClient } from "@supabase/supabase-js";

// Check if environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

interface UsageInfo {
  canUse: boolean;
  remainingUses: number;
  usedToday: number;
  dailyLimit: number;
  subscription: string;
  resetDate: string;
}

export async function getUserUsageInfo(clerkId: string): Promise<UsageInfo | null> {
  try {
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      console.error('Error fetching user:', error);
      return null;
    }

    // Check if daily reset is needed
    const today = new Date().toISOString().split('T')[0];
    const userResetDate = user.usage_reset_date;

    if (userResetDate !== today) {
      // Reset daily usage
      const dailyLimit = getDailyLimit(user.subscription);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          daily_usage_count: dailyLimit,
          usage_reset_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkId);

      if (updateError) {
        console.error('Error resetting daily usage:', updateError);
        return null;
      }

      return {
        canUse: dailyLimit > 0,
        remainingUses: dailyLimit,
        usedToday: 0,
        dailyLimit: dailyLimit,
        subscription: user.subscription,
        resetDate: today,
      };
    }

    // Return current usage info
    const dailyLimit = getDailyLimit(user.subscription);
    const usedToday = dailyLimit - user.daily_usage_count;
    
    return {
      canUse: user.daily_usage_count > 0,
      remainingUses: user.daily_usage_count,
      usedToday: usedToday,
      dailyLimit: dailyLimit,
      subscription: user.subscription,
      resetDate: userResetDate,
    };
  } catch (error) {
    console.error('Error in getUserUsageInfo:', error);
    return null;
  }
}

export async function consumeUsage(clerkId: string): Promise<{ success: boolean; remainingUses: number }> {
  try {
    // First check and reset if needed
    const usageInfo = await getUserUsageInfo(clerkId);
    
    if (!usageInfo || !usageInfo.canUse) {
      return { success: false, remainingUses: usageInfo?.remainingUses || 0 };
    }

    // First, get the current monthly usage count
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('monthly_usage_count')
      .eq('clerk_id', clerkId)
      .single();

    if (fetchError) {
      console.error('Error fetching current usage:', fetchError);
      return { success: false, remainingUses: usageInfo.remainingUses };
    }

    // Consume one usage and increment monthly usage
    const { data, error } = await supabase
      .from('users')
      .update({
        daily_usage_count: usageInfo.remainingUses - 1,
        monthly_usage_count: (currentUser.monthly_usage_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkId)
      .select('daily_usage_count')
      .single();

    if (error) {
      console.error('Error consuming usage:', error);
      return { success: false, remainingUses: usageInfo.remainingUses };
    }

    return {
      success: true,
      remainingUses: data.daily_usage_count,
    };
  } catch (error) {
    console.error('Error in consumeUsage:', error);
    return { success: false, remainingUses: 0 };
  }
}

function getDailyLimit(subscription: string): number {
  switch (subscription) {
    case 'Free':
      return parseInt(process.env.FREE_DAILY_LIMIT || '5');
    case 'Trial':
      return parseInt(process.env.TRIAL_DAILY_LIMIT || '15');
    case 'Pro':
      return parseInt(process.env.PRO_DAILY_LIMIT || '100');
    default:
      return 5;
  }
}

export { getDailyLimit };
