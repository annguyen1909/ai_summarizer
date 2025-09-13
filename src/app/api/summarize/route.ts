import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { getUserUsageInfo, consumeUsage } from '@/lib/usage';
import { CacheService } from '@/lib/cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify hCaptcha token
async function verifyHCaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET_KEY!,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('hCaptcha verification error:', error);
    return false;
  }
}

// Helper function to fetch content from URL
async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Simple HTML content extraction (you might want to use a proper HTML parser)
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent;
  } catch (error) {
    console.error('Error fetching URL content:', error);
    throw new Error('Không thể tải nội dung từ URL này. Vui lòng kiểm tra lại đường dẫn.');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication from Clerk (optional for guest mode)
    const { userId } = await auth();
    
    const { text, url, hcaptchaToken, guestMode, summaryMode } = await request.json();

    if (!text && !url) {
      return NextResponse.json(
        { error: 'Cần cung cấp văn bản hoặc URL để tóm tắt' },
        { status: 400 }
      );
    }

    let userEmail: string;
    let isGuest = false;

    // Handle guest mode
    if (!userId || guestMode) {
      isGuest = true;
      userEmail = 'guest_' + Date.now(); // Temporary guest identifier
      
      // For guest users, always require hCaptcha
      if (!hcaptchaToken) {
        return NextResponse.json(
          { error: 'Vui lòng xác thực hCaptcha để tiếp tục' },
          { status: 400 }
        );
      }

      const isValidCaptcha = await verifyHCaptcha(hcaptchaToken);
      if (!isValidCaptcha) {
        return NextResponse.json(
          { error: 'Xác thực hCaptcha không hợp lệ. Vui lòng thử lại.' },
          { status: 400 }
        );
      }
    } else {
      // Use Clerk userId for authenticated users
      userEmail = userId;
      
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
            usage: {
              remaining: usageInfo.remainingUses,
              subscription: usageInfo.subscription,
              resetDate: usageInfo.resetDate
            }
          },
          { status: 429 }
        );
      }
    }

    // Get content to summarize
    let contentToSummarize = text;
    if (url) {
      try {
        contentToSummarize = await fetchContentFromUrl(url);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Không thể tải nội dung từ URL.' },
          { status: 400 }
        );
      }
    }

    // Validate content length
    if (contentToSummarize.length < 50) {
      return NextResponse.json(
        { error: 'Nội dung quá ngắn để tóm tắt (tối thiểu 50 ký tự)' },
        { status: 400 }
      );
    }

    // For authenticated users, usage already checked above
    // For guests, redirect to guest endpoint
    if (isGuest) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để sử dụng tính năng này.' },
        { status: 401 }
      );
    } else {
      // Authenticated users - usage already checked above
      // Continue with summarization
    }

    // Truncate content if too long
    if (contentToSummarize.length > 10000) {
      contentToSummarize = contentToSummarize.substring(0, 10000) + '...';
    }

    // Check cache first - include summaryMode in cache key
    const cacheKey = `${contentToSummarize}_mode_${summaryMode || 'short'}`;
    let summary = await CacheService.get(cacheKey);
    let fromCache = true;

    if (!summary) {
      fromCache = false;
      
      // Define different summary modes
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
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Tóm tắt nội dung sau:\n\n${contentToSummarize}`
          }
        ],
        max_completion_tokens: 500,
      });

      summary = completion.choices[0]?.message?.content;

      if (!summary) {
        return NextResponse.json(
          { error: 'Không thể tạo tóm tắt. Vui lòng thử lại sau.' },
          { status: 500 }
        );
      }

      // Cache the result with mode-specific key
      await CacheService.set(cacheKey, summary);
    }

    // Consume usage for authenticated users
    let remainingUses = 0;
    if (!isGuest) {
      const usageResult = await consumeUsage(userId!);
      
      if (!usageResult.success) {
        console.error('Failed to consume usage for user:', userId);
      }
      
      remainingUses = usageResult.remainingUses;
    }

    return NextResponse.json({
      summary: summary.trim(),
      fromCache,
      remainingUses: isGuest ? 2 : remainingUses, // Simple for guests
      isGuest
    });

  } catch (error) {
    console.error('Summarization error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Lỗi cấu hình API. Vui lòng liên hệ hỗ trợ.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tóm tắt văn bản. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
