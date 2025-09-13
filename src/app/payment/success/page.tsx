"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkPaymentStatus = () => {
      // Check MoMo parameters
      const momoResultCode = searchParams.get('resultCode');
      const momoMessage = searchParams.get('message');
      
      // Check ZaloPay parameters
      const zaloStatus = searchParams.get('status');
      const zaloAppTransId = searchParams.get('apptransid');

      if (momoResultCode !== null) {
        // MoMo payment result
        if (momoResultCode === '0') {
          setPaymentStatus('success');
          setMessage('Thanh toán MoMo thành công! Tài khoản của bạn đã được nâng cấp lên Pro.');
        } else {
          setPaymentStatus('failed');
          setMessage(`Thanh toán MoMo thất bại: ${momoMessage || 'Lỗi không xác định'}`);
        }
      } else if (zaloStatus !== null || zaloAppTransId !== null) {
        // ZaloPay payment result
        if (zaloStatus === '1') {
          setPaymentStatus('success');
          setMessage('Thanh toán ZaloPay thành công! Tài khoản của bạn đã được nâng cấp lên Pro.');
        } else {
          setPaymentStatus('failed');
          setMessage('Thanh toán ZaloPay thất bại hoặc bị hủy.');
        }
      } else {
        // No payment parameters found, assume success for now
        // In production, you might want to verify with your backend
        setTimeout(() => {
          setPaymentStatus('success');
          setMessage('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp lên Pro.');
        }, 2000);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {paymentStatus === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
              <CardTitle>Đang xử lý thanh toán...</CardTitle>
              <CardDescription>
                Vui lòng đợi trong giây lát
              </CardDescription>
            </>
          )}
          
          {paymentStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-green-800">Thanh toán thành công!</CardTitle>
              <CardDescription>
                Chúc mừng bạn đã nâng cấp lên gói Pro
              </CardDescription>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
              <CardTitle className="text-red-800">Thanh toán thất bại</CardTitle>
              <CardDescription>
                Có lỗi xảy ra trong quá trình thanh toán
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {paymentStatus === 'success' && (
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Quyền lợi gói Pro:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Tóm tắt không giới hạn</li>
                  <li>✓ Tóm tắt từ URL/Link</li>
                  <li>✓ Xuất file PDF</li>
                  <li>✓ Hỗ trợ ưu tiên</li>
                </ul>
              </div>
              
              <Link href="/dashboard">
                <Button className="w-full">
                  Truy cập Dashboard
                </Button>
              </Link>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="space-y-3">
              <Link href="/pricing">
                <Button className="w-full">
                  Thử lại thanh toán
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Quay về Dashboard
                </Button>
              </Link>
            </div>
          )}
          
          {paymentStatus === 'loading' && (
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Quay về Dashboard
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
