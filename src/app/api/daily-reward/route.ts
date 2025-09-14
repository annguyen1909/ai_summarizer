import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { addDailyLoginReward } from '@/lib/usage';

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add daily login reward
    const result = await addDailyLoginReward(userId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `🎉 Chúc mừng! Bạn nhận được ${result.bonusUsages} lượt sử dụng miễn phí hôm nay!`,
        bonusUsages: result.bonusUsages,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Bạn đã nhận phần thưởng đăng nhập hôm nay rồi.',
        bonusUsages: 0,
      });
    }
  } catch (error) {
    console.error('Daily reward error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Đã có lỗi xảy ra khi nhận phần thưởng.' 
    }, { status: 500 });
  }
}