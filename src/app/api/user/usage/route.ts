import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageInfo } from '@/lib/usage';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usageInfo = await getUserUsageInfo(userId);
    
    return NextResponse.json({
      success: true,
      usageInfo
    });

  } catch (error) {
    console.error('Error fetching usage info:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Không thể tải thông tin sử dụng.' 
    }, { status: 500 });
  }
}
