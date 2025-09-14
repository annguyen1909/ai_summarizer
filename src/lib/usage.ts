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
    const lastLoginDate = user.last_login_date;

    if (userResetDate !== today) {
      // Reset daily usage
      const dailyLimit = getDailyLimit(user.subscription);
      let totalUsagesForToday = dailyLimit;

      // Add daily login bonus if user logs in for first time today
      const isFirstLoginToday = lastLoginDate !== today;
      if (isFirstLoginToday) {
        const dailyBonus = parseInt(process.env.DAILY_LOGIN_BONUS || '5');
        totalUsagesForToday += dailyBonus; // Daily login reward
        console.log(`Daily login reward given to user ${clerkId}: +${dailyBonus} usages`);
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          daily_usage_count: totalUsagesForToday,
          usage_reset_date: today,
          last_login_date: today, // Track last login
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerkId);

      if (updateError) {
        console.error('Error resetting daily usage:', updateError);
        return null;
      }

      return {
        canUse: totalUsagesForToday > 0,
        remainingUses: totalUsagesForToday,
        usedToday: 0,
        dailyLimit: dailyLimit,
        subscription: user.subscription,
        resetDate: today,
      };
    } else {
      // Check if we need to give daily login bonus (same day but first login)
      const isFirstLoginToday = lastLoginDate !== today;
      if (isFirstLoginToday) {
        const bonusUsages = parseInt(process.env.DAILY_LOGIN_BONUS || '5');
        const newTotalUsages = user.daily_usage_count + bonusUsages;
        
        const { error: bonusError } = await supabase
          .from('users')
          .update({
            daily_usage_count: newTotalUsages,
            last_login_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', clerkId);

        if (bonusError) {
          console.error('Error adding daily login bonus:', bonusError);
        } else {
          console.log(`Daily login reward given to user ${clerkId}: +${bonusUsages} usages`);
        }

        // Return updated info
        const dailyLimit = getDailyLimit(user.subscription);
        const usedToday = dailyLimit - newTotalUsages;
        
        return {
          canUse: newTotalUsages > 0,
          remainingUses: newTotalUsages,
          usedToday: Math.max(0, usedToday),
          dailyLimit: dailyLimit,
          subscription: user.subscription,
          resetDate: userResetDate,
        };
      }
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

// Function to add daily login reward
export async function addDailyLoginReward(clerkId: string): Promise<{ success: boolean; bonusUsages: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: user, error } = await supabase
      .from('users')
      .select('last_login_date, daily_usage_count')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return { success: false, bonusUsages: 0 };
    }

    // Check if user already logged in today
    if (user.last_login_date === today) {
      return { success: false, bonusUsages: 0 }; // Already received today's reward
    }

    // Add 5 bonus usages
    const bonusUsages = parseInt(process.env.DAILY_LOGIN_BONUS || '5');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        daily_usage_count: user.daily_usage_count + bonusUsages,
        last_login_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkId);

    if (updateError) {
      console.error('Error adding daily login reward:', updateError);
      return { success: false, bonusUsages: 0 };
    }

    console.log(`Daily login reward added for user ${clerkId}: +${bonusUsages} usages`);
    return { success: true, bonusUsages };
  } catch (error) {
    console.error('Error in addDailyLoginReward:', error);
    return { success: false, bonusUsages: 0 };
  }
}

export { getDailyLimit };
