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

    // Check usage limits using new system
    const usageInfo = await getUserUsageInfo(userId);
    if (!usageInfo) {
      return NextResponse.json(
        { error: 'Không thể kiểm tra hạn mức sử dụng. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    if (!usageInfo.canUse) {
      return NextResponse.json(
        { 
          error: 'Bạn đã hết lượt sử dụng miễn phí hôm nay. Hãy nâng cấp tài khoản hoặc quay lại vào ngày mai.',
          remainingUses: usageInfo.remainingUses,
          subscription: usageInfo.subscription
        },
        { status: 429 }
      );
    }

    const { text, direction = 'en-vi' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Text is required',
        message: 'Vui lòng nhập văn bản cần dịch.' 
      }, { status: 400 });
    }

    // Determine direction and prompt
    let systemPrompt = '';
    if (direction === 'en-vi') {
      systemPrompt = `You are a professional English to Vietnamese translator. 
      Translate the following English text to Vietnamese naturally and accurately. 
      Maintain the original meaning and tone. For technical terms, use commonly understood Vietnamese equivalents or keep the English term in parentheses if needed.
      Only return the translated text, no explanations.`;
    } else {
      systemPrompt = `You are a professional Vietnamese to English translator. 
      Translate the following Vietnamese text to English naturally and accurately. 
      Maintain the original meaning and tone. Use clear, professional English.
      Only return the translated text, no explanations.`;
    }

    // Call OpenAI API for translation
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: text
        }
      ],
      max_completion_tokens: 2000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return NextResponse.json({ 
        error: 'Translation failed',
        message: 'Không thể dịch văn bản. Vui lòng thử lại.' 
      }, { status: 500 });
    }

    // Consume usage
    const usageResult = await consumeUsage(userId);
    let remainingUses = 0;
    if (!usageResult.success) {
      console.error('Failed to consume usage for user:', userId);
    } else {
      remainingUses = usageResult.remainingUses;
    }

    return NextResponse.json({
      success: true,
      translatedText,
      direction,
      originalText: text,
      remainingUses
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' 
    }, { status: 500 });
  }
}
