import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { userProfiles } from '@/lib/storage';

// Type definitions for payment callbacks
interface MoMoCallbackData {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

interface ZaloPayCallbackData {
  data: string;
  mac: string;
}

type PaymentCallbackData = MoMoCallbackData | ZaloPayCallbackData | Record<string, unknown>;

// Simplified payment callback handler for development
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const contentType = request.headers.get('content-type') || '';

    let paymentData: PaymentCallbackData = {};
    let provider = '';

    // Handle MoMo callback (JSON format)
    if (contentType.includes('application/json')) {
      try {
        paymentData = JSON.parse(body);
        provider = 'momo';
      } catch (error) {
        console.error('Failed to parse JSON body:', error);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
    }
    // Handle ZaloPay callback (URL-encoded format)
    else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(body);
      paymentData = Object.fromEntries(params.entries());
      provider = 'zalopay';
    }
    // Handle query parameters (for redirect callbacks)
    else {
      const url = new URL(request.url);
      paymentData = Object.fromEntries(url.searchParams.entries());
      
      // Determine provider from the callback data
      if (paymentData.partnerCode) {
        provider = 'momo';
      } else if (paymentData.data) {
        provider = 'zalopay';
      }
    }

    console.log('Payment callback received:', { provider, paymentData });

    // Verify and process MoMo payment
    if (provider === 'momo') {
      return await processMoMoCallback(paymentData as MoMoCallbackData);
    }
    // Verify and process ZaloPay payment
    else if (provider === 'zalopay') {
      return await processZaloPayCallback(paymentData as ZaloPayCallbackData);
    }
    else {
      console.error('Unknown payment provider');
      return NextResponse.json({ error: 'Unknown payment provider' }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processMoMoCallback(data: MoMoCallbackData) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = data;

    // Verify signature
    const secretKey = process.env.MOMO_SECRET_KEY;
    if (!secretKey) {
      throw new Error('MoMo secret key not configured');
    }

    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('MoMo signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process successful payment
    if (resultCode === 0) {
      const extraDataParsed = JSON.parse(extraData || '{}');
      const { userEmail, planName } = extraDataParsed;

      if (userEmail && planName === 'Pro') {
        // Add 30 days to current date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const success = await updateUserSubscription(userEmail, 'Pro', expiryDate);
        
        if (success) {
          console.log('Successfully updated user subscription:', userEmail);
          return NextResponse.json({ RspCode: "00", Message: "Success" });
        } else {
          console.error('Failed to update user subscription');
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ RspCode: "01", Message: "Payment failed" });

  } catch (error) {
    console.error('MoMo callback processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function processZaloPayCallback(data: ZaloPayCallbackData) {
  try {
    const { data: callbackData, mac } = data;

    if (!callbackData || !mac) {
      console.error('Missing ZaloPay callback data');
      return NextResponse.json({ return_code: -1, return_message: "Missing data" });
    }

    // Verify MAC
    const key2 = process.env.ZALOPAY_KEY2;
    if (!key2) {
      throw new Error('ZaloPay key2 not configured');
    }

    const expectedMac = crypto
      .createHmac('sha256', key2)
      .update(callbackData)
      .digest('hex');

    if (mac !== expectedMac) {
      console.error('ZaloPay MAC verification failed');
      return NextResponse.json({ return_code: -1, return_message: "Invalid MAC" });
    }

    // Parse callback data
    const parsedData = JSON.parse(callbackData);
    const { embed_data } = parsedData;

    if (embed_data) {
      const embedDataParsed = JSON.parse(embed_data);
      const { userEmail, planName } = embedDataParsed;

      if (userEmail && planName === 'Pro') {
        // Add 30 days to current date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const success = await updateUserSubscription(userEmail, 'Pro', expiryDate);
        
        if (success) {
          console.log('Successfully updated user subscription:', userEmail);
          return NextResponse.json({ return_code: 1, return_message: "Success" });
        } else {
          console.error('Failed to update user subscription');
          return NextResponse.json({ return_code: 0, return_message: "Database update failed" });
        }
      }
    }

    return NextResponse.json({ return_code: 0, return_message: "Payment processing failed" });

  } catch (error) {
    console.error('ZaloPay callback processing error:', error);
    return NextResponse.json({ return_code: -1, return_message: "Processing error" });
  }
}

// Handle GET requests for redirect callbacks
export async function GET(request: NextRequest) {
  return POST(request);
}

// Helper function to update user subscription
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateUserSubscription(email: string, plan: string, expiryDate: Date): Promise<boolean> {
  try {
    // Find user by email in our in-memory storage
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [userId, profile] of userProfiles.entries()) {
      if (profile.email === email) {
        // Update user profile with new subscription
        profile.plan = plan.toLowerCase() as 'free' | 'premium' | 'pro';
        profile.totalQuota = plan === 'Pro' ? 1000 : 50; // Pro gets 1000, others get 50
        profile.currentQuota = profile.totalQuota;
        profile.subscriptionStatus = 'active';
        profile.updatedAt = new Date().toISOString();
        
        console.log(`Updated subscription for user ${email}: plan=${plan}, quota=${profile.totalQuota}`);
        return true;
      }
    }
    
    console.error(`User not found with email: ${email}`);
    return false;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
}
