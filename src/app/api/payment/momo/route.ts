import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, amount, planName } = await request.json();

    if (!userEmail || !amount || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // MoMo configuration
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;

    if (!partnerCode || !accessKey || !secretKey || !endpoint) {
      return NextResponse.json(
        { error: 'MoMo configuration missing' },
        { status: 500 }
      );
    }

    // Generate order ID
    const orderId = `VSUM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const requestId = orderId;
    const orderInfo = `Thanh toán gói ${planName} - Vietnam Summarizer`;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`;
    const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`;
    const requestType = "payWithATM";
    const extraData = JSON.stringify({
      userEmail,
      planName,
      amount,
      provider: 'momo'
    });

    // Create signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Prepare request body
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    // Send request to MoMo
    const momoResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const momoData = await momoResponse.json();

    if (momoData.resultCode === 0) {
      return NextResponse.json({
        success: true,
        payUrl: momoData.payUrl,
        orderId: orderId,
        message: 'Payment URL generated successfully'
      });
    } else {
      console.error('MoMo API Error:', momoData);
      return NextResponse.json(
        { error: 'Failed to create MoMo payment', details: momoData.message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('MoMo payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example MoMo Sandbox Configuration
/*
Environment Variables needed:
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

Test Data for MoMo Sandbox:
- Test Phone: 0963181714
- Test OTP: 123456
- Test Amount: Any amount between 1,000 - 50,000,000 VND
*/
