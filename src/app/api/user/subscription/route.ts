import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile from Supabase
    const { data: profile, error } = await supabase
      .from('users')
      .select('subscription, subscription_expiry')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Default to free plan if no profile exists
    const subscription = {
      plan: profile?.subscription || 'Free',
      subscriptionExpiry: profile?.subscription_expiry || null
    };

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
