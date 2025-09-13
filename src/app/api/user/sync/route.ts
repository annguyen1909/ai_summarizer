import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle empty or malformed request body
    let body;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const { email, firstName, lastName, imageUrl } = body;

    // Validate required email field
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    } else {
      // Create new user with free daily usage
      const { data, error } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email,
          subscription: 'Free',
          daily_usage_count: 5, // Give new users 5 free uses per day
          monthly_usage_count: 0,
          usage_reset_date: new Date().toISOString().split('T')[0], // Today's date
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }
  } catch (error) {
    console.error('Error in sync user:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
