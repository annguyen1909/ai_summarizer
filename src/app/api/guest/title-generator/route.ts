import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, count = 3 } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Text length limit for guests
    if (text.length > 3000) {
      return NextResponse.json({ 
        error: 'Text too long. Maximum 3000 characters for guest users.' 
      }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Bạn là một AI trợ lý chuyên tạo tiêu đề hấp dẫn và phù hợp cho văn bản tiếng Việt. Hãy tạo các tiêu đề ngắn gọn, súc tích và thu hút."
        },
        {
          role: "user",
          content: `Tạo ${count} tiêu đề hấp dẫn và phù hợp cho văn bản sau (mỗi tiêu đề trên một dòng, không đánh số):\n\n${text}`
        }
      ],
      max_completion_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json({ error: 'Failed to generate titles' }, { status: 500 });
    }

    // Parse titles from response
    const titles = response
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .slice(0, count);

    return NextResponse.json({ 
      success: true, 
      titles 
    });

  } catch (error) {
    console.error('Guest title generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
