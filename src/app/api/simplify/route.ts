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

    const { text, level = 'medium' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Text is required',
        message: 'Vui lòng nhập văn bản cần đơn giản hóa.' 
      }, { status: 400 });
    }

    // Determine simplification level
    let systemPrompt = '';
    switch (level) {
      case 'basic':
        systemPrompt = `You are an expert at simplifying Vietnamese text for elementary school students (grade 1-5). 
        Rewrite the given text using:
        - Very simple vocabulary (under 1000 most common Vietnamese words)
        - Short sentences (maximum 10 words)
        - Basic sentence structures
        - Everyday examples
        - Remove complex concepts or explain them very simply
        
        Keep the main message but make it understandable for children.`;
        break;
      case 'advanced':
        systemPrompt = `You are an expert at simplifying Vietnamese text for high school and college students. 
        Rewrite the given text using:
        - Clear, formal Vietnamese vocabulary
        - Well-structured sentences (maximum 20 words)
        - Logical flow and transitions
        - Keep important technical terms but explain them
        - Academic but accessible tone
        
        Maintain the original meaning while making it clearer and more organized.`;
        break;
      default: // medium
        systemPrompt = `You are an expert at simplifying Vietnamese text for middle school students and general readers. 
        Rewrite the given text using:
        - Common Vietnamese vocabulary (avoid complex terms)
        - Clear, medium-length sentences (maximum 15 words)
        - Simple sentence structures
        - Explain difficult concepts in simple terms
        - Conversational but clear tone
        
        Keep all important information but make it easy to understand.`;
    }

    // Call OpenAI API for text simplification
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt + "\n\nOnly return the simplified text, no introduction or explanation."
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const simplifiedText = completion.choices[0]?.message?.content?.trim();

    if (!simplifiedText) {
      return NextResponse.json({ 
        error: 'Text simplification failed',
        message: 'Không thể đơn giản hóa văn bản. Vui lòng thử lại.' 
      }, { status: 500 });
    }

    // Consume usage
    await consumeUsage(userId);

    return NextResponse.json({
      success: true,
      simplifiedText,
      level,
      remainingUses: usageInfo.remainingUses - 1,
      isGuest: false
    });

  } catch (error) {
    console.error('Text simplification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' 
    }, { status: 500 });
  }
}
