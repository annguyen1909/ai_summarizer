import { NextRequest, NextResponse } from 'next/server';

// Import the same storage
const summaries = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 });
    }

    // Find the shared summary
    let sharedSummary = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [id, summary] of summaries) {
      if (summary.share_id === shareId && summary.is_shared) {
        sharedSummary = summary;
        break;
      }
    }

    if (!sharedSummary) {
      return NextResponse.json({ error: 'Shared summary not found' }, { status: 404 });
    }

    // Check if the share link has expired
    if (sharedSummary.share_expires_at) {
      const expiresAt = new Date(sharedSummary.share_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
      }
    }

    // Return only public fields
    const publicSummary = {
      id: sharedSummary.id,
      summary: sharedSummary.summary,
      summary_mode: sharedSummary.summary_mode,
      created_at: sharedSummary.created_at,
      source: sharedSummary.source
    };

    return NextResponse.json({ summary: publicSummary });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
