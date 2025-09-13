import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, direction = 'vi-en' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Text length limit for guests
    if (text.length > 3000) {
      return NextResponse.json({ 
        error: 'Text too long. Maximum 3000 characters for guest users.' 
      }, { status: 400 });
    }

    const directions = {
      'vi-en': 'Dịch văn bản sau từ tiếng Việt sang tiếng Anh:',
      'en-vi': 'Dịch văn bản sau từ tiếng Anh sang tiếng Việt:',
      'vi-zh': 'Dịch văn bản sau từ tiếng Việt sang tiếng Trung:',
      'zh-vi': 'Dịch văn bản sau từ tiếng Trung sang tiếng Việt:',
      'vi-ja': 'Dịch văn bản sau từ tiếng Việt sang tiếng Nhật:',
      'ja-vi': 'Dịch văn bản sau từ tiếng Nhật sang tiếng Việt:',
      'vi-ko': 'Dịch văn bản sau từ tiếng Việt sang tiếng Hàn:',
      'ko-vi': 'Dịch văn bản sau từ tiếng Hàn sang tiếng Việt:'
    };

    const prompt = directions[direction as keyof typeof directions] || directions['vi-en'];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Bạn là một AI trợ lý chuyên dịch thuật chính xác và tự nhiên giữa các ngôn ngữ. Hãy dịch chính xác và giữ nguyên ý nghĩa."
        },
        {
          role: "user",
          content: `${prompt}\n\n${text}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const translatedText = completion.choices[0]?.message?.content;

    if (!translatedText) {
      return NextResponse.json({ error: 'Failed to translate' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      translatedText: translatedText.trim(),
      direction 
    });

  } catch (error) {
    console.error('Guest translation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
