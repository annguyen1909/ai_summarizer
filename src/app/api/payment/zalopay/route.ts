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

    // ZaloPay configuration
    const appId = process.env.ZALOPAY_APP_ID;
    const key1 = process.env.ZALOPAY_KEY1;
    const key2 = process.env.ZALOPAY_KEY2;
    const endpoint = process.env.ZALOPAY_ENDPOINT;

    if (!appId || !key1 || !key2 || !endpoint) {
      return NextResponse.json(
        { error: 'ZaloPay configuration missing' },
        { status: 500 }
      );
    }

    // Generate order data
    const transId = Math.floor(Math.random() * 1000000);
    const today = new Date();
    const dateString = today.getFullYear().toString().slice(-2) + 
                      (today.getMonth() + 1).toString().padStart(2, '0') + 
                      today.getDate().toString().padStart(2, '0');
    const appTransId = `${dateString}_${transId}`;
    const appTime = Date.now();
    const appUser = userEmail;
    const description = `Thanh toán gói ${planName} - Vietnam Summarizer`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`;
    
    const embedData = JSON.stringify({
      userEmail,
      planName,
      amount,
      provider: 'zalopay',
      redirecturl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
    });

    const item = JSON.stringify([{
      itemid: planName,
      itemname: `Gói ${planName} - Vietnam Summarizer`,
      itemprice: amount,
      itemquantity: 1
    }]);

    // Create order data string for MAC generation
    const orderData = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
    
    // Generate MAC
    const mac = crypto
      .createHmac('sha256', key1)
      .update(orderData)
      .digest('hex');

    // Prepare request body
    const requestBody = {
      app_id: appId,
      app_trans_id: appTransId,
      app_user: appUser,
      app_time: appTime.toString(),
      amount: amount.toString(),
      description: description,
      bank_code: "",
      item: item,
      embed_data: embedData,
      callback_url: callbackUrl,
      mac: mac
    };

    // Send request to ZaloPay
    const zaloResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody),
    });

    const zaloData = await zaloResponse.json();

    if (zaloData.return_code === 1) {
      return NextResponse.json({
        success: true,
        orderUrl: zaloData.order_url,
        appTransId: appTransId,
        zpTransToken: zaloData.zp_trans_token,
        message: 'Payment URL generated successfully'
      });
    } else {
      console.error('ZaloPay API Error:', zaloData);
      return NextResponse.json(
        { error: 'Failed to create ZaloPay payment', details: zaloData.return_message },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('ZaloPay payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Example ZaloPay Sandbox Configuration
/*
Environment Variables needed:
ZALOPAY_APP_ID=2553
ZALOPAY_KEY1=PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL
ZALOPAY_KEY2=kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create

Test Data for ZaloPay Sandbox:
- Any amount between 1,000 - 1,000,000 VND
- Test on mobile app or web browser
- Use sandbox environment for testing
*/
