import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, summaryMode = 'short' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Text length limit for guests
    if (text.length > 5000) {
      return NextResponse.json({ 
        error: 'Text too long. Maximum 5000 characters for guest users.' 
      }, { status: 400 });
    }

    // Define different summary modes (same as main API)
    const modeMap = {
      short: `Bạn là một chuyên gia tóm tắt văn bản tiếng Việt. Hãy tóm tắt nội dung thành 2-3 câu ngắn gọn nhất có thể mà vẫn giữ được ý chính.

Quy tắc:
- Chỉ 2-3 câu tóm tắt
- Đi thẳng vào vấn đề chính
- Loại bỏ mọi chi tiết phụ
- Sử dụng từ ngữ súc tích`,
      
      bullet: `Bạn là một chuyên gia tóm tắt văn bản tiếng Việt. Hãy tóm tắt nội dung dưới dạng danh sách gạch đầu dòng.

Quy tắc:
- Sử dụng dấu "•" cho mỗi điểm chính
- Mỗi điểm từ 1-2 câu
- Tạo 4-6 điểm chính
- Sắp xếp theo thứ tự quan trọng
- Bắt đầu mỗi điểm với động từ hoặc danh từ chính`,
      
      outline: `Bạn là một chuyên gia tóm tắt văn bản tiếng Việt. Hãy tạo dàn ý chi tiết với cấu trúc phân cấp.

Quy tắc:
- Sử dụng định dạng: I., II., III. cho điểm chính
- Sử dụng A., B., C. cho điểm phụ
- Tạo cấu trúc logic và chi tiết
- Bao gồm cả điểm chính và điểm phụ
- Thể hiện mối quan hệ giữa các ý`
    };

    const systemPrompt = modeMap[summaryMode as keyof typeof modeMap] || modeMap.short;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Tóm tắt nội dung sau:\n\n${text}`
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
