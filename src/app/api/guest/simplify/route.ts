import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, level = 'medium' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Text length limit for guests
    if (text.length > 3000) {
      return NextResponse.json({ 
        error: 'Text too long. Maximum 3000 characters for guest users.' 
      }, { status: 400 });
    }

    const levelMap = {
      basic: 'Viết lại văn bản sau bằng tiếng Việt đơn giản, dễ hiểu cho học sinh tiểu học (sử dụng từ ngữ đơn giản, câu ngắn):',
      medium: 'Viết lại văn bản sau bằng tiếng Việt dễ hiểu cho đại chúng (sử dụng từ ngữ thông dụng, giải thích thuật ngữ phức tạp):',
      advanced: 'Viết lại văn bản sau bằng tiếng Việt rõ ràng và dễ hiểu hơn cho sinh viên (giữ thuật ngữ chuyên ngành nhưng giải thích rõ):'
    };

    const prompt = levelMap[level as keyof typeof levelMap] || levelMap.medium;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Bạn là một AI trợ lý chuyên đơn giản hóa văn bản tiếng Việt. Hãy viết lại văn bản sao cho dễ hiểu hơn mà vẫn giữ nguyên ý nghĩa."
        },
        {
          role: "user",
          content: `${prompt}\n\n${text}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const simplifiedText = completion.choices[0]?.message?.content;

    if (!simplifiedText) {
      return NextResponse.json({ error: 'Failed to simplify text' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      simplifiedText: simplifiedText.trim(),
      level 
    });

  } catch (error) {
    console.error('Guest simplification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
