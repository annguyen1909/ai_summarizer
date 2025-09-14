import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Simple in-memory storage for development (replace with Supabase in production)
const users = new Map();

// Helper function to generate referral code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user profile
    let user = users.get(userId);
    if (!user) {
      user = {
        id: userId,
        subscription: 'Free',
        daily_usage_count: 0,
        monthly_usage_count: 0,
        subscription_expiry: null,
        trial_start: null,
        trial_end: null,
        referral_code: generateReferralCode(),
        referrals_count: 0,
        created_at: new Date().toISOString()
      };
      users.set(userId, user);
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    let user = users.get(userId);
    if (!user) {
      user = {
        id: userId,
        subscription: 'Free',
        daily_usage_count: 0,
        monthly_usage_count: 0,
        subscription_expiry: null,
        trial_start: null,
        trial_end: null,
        referral_code: generateReferralCode(),
        referrals_count: 0,
        created_at: new Date().toISOString()
      };
    }

    // Update allowed fields
    const allowedUpdates = ['subscription', 'daily_usage_count', 'monthly_usage_count', 'subscription_expiry', 'trial_start', 'trial_end'];
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    }

    user.updated_at = new Date().toISOString();
    users.set(userId, user);

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
