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

    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Text is required',
        message: 'Vui lòng nhập văn bản cần trích xuất ý chính.' 
      }, { status: 400 });
    }

    // Call OpenAI API for keypoints extraction
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting key points from Vietnamese text. 
          Extract the most important key points from the given text and present them as a bulleted list in Vietnamese.
          Each point should be:
          - Concise and clear (maximum 20 words per point)
          - Start with a bullet point (•)
          - Capture the main ideas and important details
          - Written in simple Vietnamese
          
          Aim for 3-7 key points depending on the text length and complexity.
          Only return the bullet points, no introduction or explanation.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_completion_tokens: 1000,
    });

    const keypoints = completion.choices[0]?.message?.content?.trim();

    if (!keypoints) {
      return NextResponse.json({ 
        error: 'Keypoints extraction failed',
        message: 'Không thể trích xuất ý chính. Vui lòng thử lại.' 
      }, { status: 500 });
    }

    // Consume usage
    await consumeUsage(userId);

    return NextResponse.json({
      success: true,
      keypoints,
      remainingUses: usageInfo.remainingUses - 1,
      isGuest: false
    });

  } catch (error) {
    console.error('Keypoints extraction error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' 
    }, { status: 500 });
  }
}
