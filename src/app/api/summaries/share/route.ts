import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// Import the same storage from history API
// In production, this should be a proper database
const summaries = new Map();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summaryId } = await request.json();

    if (!summaryId) {
      return NextResponse.json({ error: 'Summary ID is required' }, { status: 400 });
    }

    // Find the summary
    const summary = summaries.get(summaryId);
    
    if (!summary || summary.user_id !== userId) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    // Generate a unique share ID
    const shareId = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

    // Update the summary with share information
    summary.share_id = shareId;
    summary.share_expires_at = expiresAt.toISOString();
    summary.is_shared = true;
    summary.updated_at = new Date().toISOString();

    summaries.set(summaryId, summary);

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/shared/${shareId}`;

    return NextResponse.json({ 
      shareUrl,
      shareId,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
