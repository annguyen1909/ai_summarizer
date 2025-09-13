import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getUserUsageInfo, consumeUsage } from '@/lib/usage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user usage and quota
    const usageInfo = await getUserUsageInfo(userId);
    if (!usageInfo || !usageInfo.canUse) {
      return NextResponse.json({ 
        error: 'Quota exceeded',
        message: 'Bạn đã hết lượt sử dụng. Vui lòng nâng cấp gói.' 
      }, { status: 403 });
    }

    const { text, count = 3 } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Text is required',
        message: 'Vui lòng nhập văn bản cần tạo tiêu đề.' 
      }, { status: 400 });
    }

    // Call OpenAI API for title generation
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating compelling titles for Vietnamese content. 
          Generate ${count} different titles for the given text that are:
          - Engaging and attention-grabbing
          - Accurately represent the content
          - Written in natural Vietnamese
          - Between 5-12 words each
          - Different styles (news-style, academic, casual, etc.)
          
          Format the output as a numbered list:
          1. [First title]
          2. [Second title]
          3. [Third title]
          
          Only return the numbered list, no introduction or explanation.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const titles = completion.choices[0]?.message?.content?.trim();

    if (!titles) {
      return NextResponse.json({ 
        error: 'Title generation failed',
        message: 'Không thể tạo tiêu đề. Vui lòng thử lại.' 
      }, { status: 500 });
    }

    // Consume usage
    await consumeUsage(userId);

    return NextResponse.json({
      success: true,
      titles,
      remainingUses: usageInfo.remainingUses - 1,
      isGuest: false
    });

  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' 
    }, { status: 500 });
  }
}
