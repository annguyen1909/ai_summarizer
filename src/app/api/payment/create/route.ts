import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

// In-memory storage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const users = new Map();
const paymentTransactions = new Map();

// MoMo configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'your_momo_partner_code',
  accessKey: process.env.MOMO_ACCESS_KEY || 'your_momo_access_key',
  secretKey: process.env.MOMO_SECRET_KEY || 'your_momo_secret_key',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create'
};

// ZaloPay configuration
const ZALOPAY_CONFIG = {
  appId: process.env.ZALOPAY_APP_ID || 'your_zalopay_app_id',
  key1: process.env.ZALOPAY_KEY1 || 'your_zalopay_key1',
  key2: process.env.ZALOPAY_KEY2 || 'your_zalopay_key2',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sandbox.zalopay.vn/v001/tpe/createorder'
};

function generateTransactionId() {
  return 'TXN' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();
}

function generateOrderId() {
  return Date.now().toString();
}

// Create MoMo payment
async function createMoMoPayment(amount: number, orderInfo: string, redirectUrl: string, ipnUrl: string) {
  const orderId = generateOrderId();
  const requestId = orderId;
  
  const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=captureWallet`;
  
  const signature = crypto
    .createHmac('sha256', MOMO_CONFIG.secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = {
    partnerCode: MOMO_CONFIG.partnerCode,
    accessKey: MOMO_CONFIG.accessKey,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData: '',
    requestType: 'captureWallet',
    signature,
    lang: 'vi'
  };

  try {
    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return { success: true, data: result, orderId };
  } catch (error) {
    console.error('MoMo payment error:', error);
    return { success: false, error: 'Failed to create MoMo payment' };
  }
}

// Create ZaloPay payment
async function createZaloPayPayment(amount: number, description: string, redirectUrl: string) {
  const orderId = generateOrderId();
  const embedData = JSON.stringify({ redirecturl: redirectUrl });
  
  const orderData = `${ZALOPAY_CONFIG.appId}|${orderId}|${amount}|${description}|${embedData}|${''  /* bankcode */}`;
  
  const mac = crypto
    .createHmac('sha256', ZALOPAY_CONFIG.key1)
    .update(orderData)
    .digest('hex');

  const requestBody = {
    app_id: ZALOPAY_CONFIG.appId,
    app_trans_id: orderId,
    app_user: 'demo',
    amount: amount.toString(),
    description,
    embed_data: embedData,
    bank_code: '',
    mac
  };

  try {
    const response = await fetch(ZALOPAY_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody).toString(),
    });

    const result = await response.json();
    return { success: true, data: result, orderId };
  } catch (error) {
    console.error('ZaloPay payment error:', error);
    return { success: false, error: 'Failed to create ZaloPay payment' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType, paymentProvider } = await request.json();

    if (!planType || !paymentProvider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate plan and amount
    let amount: number;
    let description: string;
    
    if (planType === 'trial') {
      amount = 9000; // 9,000 VND for 3-day trial
      description = 'AI Tóm tắt - Gói dùng thử 3 ngày';
    } else if (planType === 'pro') {
      amount = 49000; // 49,000 VND for monthly pro
      description = 'AI Tóm tắt - Gói Pro 1 tháng';
    } else {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const transactionId = generateTransactionId();
    
    // URLs for payment flow
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const redirectUrl = `${baseUrl}/payment/success?txn=${transactionId}`;
    const ipnUrl = `${baseUrl}/api/payment/callback`;

    let paymentResult;

    if (paymentProvider === 'momo') {
      paymentResult = await createMoMoPayment(amount, description, redirectUrl, ipnUrl);
    } else if (paymentProvider === 'zalopay') {
      paymentResult = await createZaloPayPayment(amount, description, redirectUrl);
    } else {
      return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
    }

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error }, { status: 500 });
    }

    // Store transaction
    const transaction = {
      id: transactionId,
      user_id: userId,
      transaction_id: transactionId,
      payment_provider: paymentProvider,
      plan_type: planType,
      amount,
      currency: 'VND',
      status: 'pending',
      provider_transaction_id: paymentResult.orderId,
      provider_response: paymentResult.data,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    paymentTransactions.set(transactionId, transaction);

    // Return payment URL
    const paymentUrl = paymentResult.data.payUrl || paymentResult.data.orderurl;
    
    if (!paymentUrl) {
      return NextResponse.json({ error: 'Payment URL not received' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      transactionId,
      amount,
      planType,
      paymentProvider
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle payment status check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    const transaction = paymentTransactions.get(transactionId);
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      transactionId: transaction.id,
      status: transaction.status,
      planType: transaction.plan_type,
      amount: transaction.amount,
      paymentProvider: transaction.payment_provider,
      createdAt: transaction.created_at
    });

  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
