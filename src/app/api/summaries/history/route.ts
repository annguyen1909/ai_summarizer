import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Simple in-memory storage for development (replace with Supabase in production)
const summaries = new Map();
const userSummaries = new Map(); // Maps userId to array of summary IDs

// Helper function to generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's summaries
    const userSummaryIds = userSummaries.get(userId) || [];
    const userSummariesData = userSummaryIds
      .map((id: string) => summaries.get(id))
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50); // Limit to 50 most recent

    return NextResponse.json({ summaries: userSummariesData });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalText, summary, summaryMode, source, sourceUrl, sourceFilename } = await request.json();

    if (!originalText || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new summary
    const summaryId = generateId();
    const newSummary = {
      id: summaryId,
      user_id: userId,
      original_text: originalText,
      summary,
      summary_mode: summaryMode || 'short',
      source: source || 'text',
      source_url: sourceUrl || null,
      source_filename: sourceFilename || null,
      word_count: originalText.split(' ').length,
      is_shared: false,
      share_id: null,
      share_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store summary
    summaries.set(summaryId, newSummary);

    // Add to user's summary list
    const userSummaryIds = userSummaries.get(userId) || [];
    userSummaryIds.push(summaryId);
    userSummaries.set(userId, userSummaryIds);

    return NextResponse.json({ summary: newSummary });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
