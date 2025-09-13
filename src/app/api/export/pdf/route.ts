import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { summary, originalText, summaryMode } = await request.json();

    if (!summary) {
      return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
    }

    // For now, return the data needed for client-side PDF generation
    // Later we can implement server-side PDF generation with jsPDF
    const pdfData = {
      title: 'AI Tóm tắt văn bản',
      date: new Date().toLocaleDateString('vi-VN'),
      summaryMode: summaryMode || 'short',
      summary,
      originalText: originalText || '',
      footer: 'Được tạo bởi AI Tóm tắt - ai-tomtat.com'
    };

    return NextResponse.json({ 
      success: true,
      pdfData
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
