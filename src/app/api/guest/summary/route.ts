import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, summaryMode = 'brief' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Text length limit for guests
    if (text.length > 5000) {
      return NextResponse.json({ 
        error: 'Text too long. Maximum 5000 characters for guest users.' 
      }, { status: 400 });
    }

    const promptMap = {
      brief: 'Tóm tắt ngắn gọn văn bản sau đây bằng tiếng Việt, chỉ giữ lại những ý chính nhất:',
      detailed: 'Tóm tắt chi tiết văn bản sau đây bằng tiếng Việt, bao gồm các ý chính và các điểm quan trọng:',
      bullet: 'Tóm tắt văn bản sau đây bằng tiếng Việt dưới dạng danh sách gạch đầu dòng, mỗi điểm là một ý chính:'
    };

    const prompt = promptMap[summaryMode as keyof typeof promptMap] || promptMap.brief;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: "Bạn là một AI trợ lý chuyên tóm tắt văn bản bằng tiếng Việt. Hãy tóm tắt chính xác và súc tích."
        },
        {
          role: "user",
          content: `${prompt}\n\n${text}`
        }
      ],
      max_completion_tokens: 1000,
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      summary: summary.trim(),
      mode: summaryMode 
    });

  } catch (error) {
    console.error('Guest summary error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
