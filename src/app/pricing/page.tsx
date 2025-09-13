"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, FileText, Languages, ListChecks, Type, Lightbulb, Menu, X } from "lucide-react";
import { useUser, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Footer } from "@/components/Footer";

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePayment = async (paymentMethod: 'momo' | 'zalopay', planType: 'trial' | 'pro') => {
    if (!isSignedIn) {
      window.location.href = '/sign-up';
      return;
    }

    const amount = planType === 'trial' ? 9000 : 89000;
    const planName = planType === 'trial' ? 'Trial' : 'Pro';

    try {
      const response = await fetch(`/api/payment/${paymentMethod}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user?.primaryEmailAddress?.emailAddress,
          amount: amount,
          planName: planName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = data.payUrl || data.orderUrl;
      } else {
        alert('Có lỗi xảy ra khi tạo đơn thanh toán: ' + data.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Có lỗi xảy ra khi kết nối tới hệ thống thanh toán');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            🤖 AI Tóm tắt
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>
            <Link href="/pricing" className="text-blue-600 font-medium">
              Bảng giá
            </Link>
            <SignedIn>
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg">
                  Đăng nhập
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Dùng thử miễn phí
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Vào Dashboard
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link 
                href="/pricing" 
                className="text-blue-600 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bảng giá
              </Link>
              <SignedIn>
                <Link 
                  href="/dashboard" 
                  className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              </SignedIn>
              <SignedOut>
                <div className="flex flex-col space-y-3 pt-2">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg w-full">
                      Đăng nhập
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full">
                      Dùng thử miễn phí
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex flex-col space-y-3 pt-2">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full">
                      Vào Dashboard
                    </Button>
                  </Link>
                  <div className="flex justify-center pt-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </nav>

      {/* Header */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Chọn gói phù hợp với bạn
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Truy cập đầy đủ 5 dịch vụ AI: Tóm tắt, Dịch thuật, Keypoints, Tạo tiêu đề, Đơn giản hóa
        </p>
        
        {/* Service Icons */}
        <div className="flex justify-center space-x-8 mb-12">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Tóm tắt</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <Languages className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Dịch thuật</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
              <ListChecks className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Keypoints</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <Type className="h-6 w-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">Tiêu đề</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-2">
              <Lightbulb className="h-6 w-6 text-pink-600" />
            </div>
            <span className="text-sm text-gray-600">Đơn giản</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="relative border-gray-200 flex flex-col h-full">
            {/* Card Header */}
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Miễn phí</CardTitle>
              <CardDescription className="text-lg">
                Dành cho người dùng thử nghiệm
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">0đ</span>
                <span className="text-gray-600">/tháng</span>
              </div>
            </CardHeader>
            
            {/* Card Content - Features */}
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>5 lượt sử dụng mỗi ngày</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tất cả 5 dịch vụ AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Lưu lịch sử 7 ngày</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Chia sẻ kết quả cơ bản</span>
                </div>
                {/* Empty space for alignment */}
                <div className="h-6"></div>
                <div className="h-6"></div>
                <div className="h-6"></div>
                <div className="h-6"></div>
              </div>
              
              {/* Card Button */}
              <div className="mt-auto">
                <Link href="/sign-up" className="block">
                  <Button className="w-full bg-gray-600 hover:bg-gray-700 rounded-lg" variant="outline">
                    Bắt đầu miễn phí
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Trial Plan */}
          <Card className="relative border-2 border-red-500 shadow-xl flex flex-col h-full scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Phổ biến
              </span>
            </div>
            
            {/* Card Header */}
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Dùng thử 3 ngày</CardTitle>
              <CardDescription className="text-lg">
                Trải nghiệm đầy đủ tính năng
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">9,000đ</span>
                <span className="text-gray-600">/3 ngày</span>
              </div>
            </CardHeader>
            
            {/* Card Content - Features */}
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Không giới hạn sử dụng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tất cả 5 dịch vụ AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tải file PDF, Word, TXT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Xuất kết quả PDF</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Chia sẻ không giới hạn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Lưu lịch sử vĩnh viễn</span>
                </div>
              </div>
              
              {/* Card Button */}
              <div className="mt-auto">
                <p className="text-sm text-gray-600 mb-4 text-center">Thanh toán qua:</p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700 rounded-lg" 
                    onClick={() => handlePayment('momo', 'trial')}
                  >
                    💳 MoMo - 9,000đ
                  </Button>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg" 
                    onClick={() => handlePayment('zalopay', 'trial')}
                  >
                    💰 ZaloPay - 9,000đ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-blue-500 flex flex-col h-full">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Tiết kiệm nhất
              </span>
            </div>
            
            {/* Card Header */}
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-gray-900">Pro hàng tháng</CardTitle>
              <CardDescription className="text-lg">
                Dành cho người dùng thường xuyên
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">89,000đ</span>
                <span className="text-gray-600">/tháng</span>
                <div className="text-sm text-green-600 mt-1">Tiết kiệm 72% so với dùng thử</div>
              </div>
            </CardHeader>
            
            {/* Card Content - Features */}
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Không giới hạn sử dụng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tất cả 5 dịch vụ AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tải file PDF, Word, TXT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Xuất kết quả PDF</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Chia sẻ không giới hạn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Lưu lịch sử vĩnh viễn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Hỗ trợ ưu tiên</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Truy cập tính năng beta</span>
                </div>
              </div>
              
              {/* Card Button */}
              <div className="mt-auto">
                <p className="text-sm text-gray-600 mb-4 text-center">Thanh toán qua:</p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700 rounded-lg" 
                    onClick={() => handlePayment('momo', 'pro')}
                  >
                    💳 MoMo - 89,000đ
                  </Button>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg" 
                    onClick={() => handlePayment('zalopay', 'pro')}
                  >
                    💰 ZaloPay - 89,000đ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Câu hỏi thường gặp
          </h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tôi có thể sử dụng miễn phí không?
              </h3>
              <p className="text-gray-600">
                Có! Bạn có thể sử dụng miễn phí 5 lượt mỗi ngày với tất cả 5 dịch vụ AI.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Các dịch vụ AI bao gồm những gì?
              </h3>
              <p className="text-gray-600">
                Tóm tắt văn bản, Dịch Anh-Việt, Trích xuất keypoints, Tạo tiêu đề, Đơn giản hóa văn bản.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tôi có thể hủy đăng ký không?
              </h3>
              <p className="text-gray-600">
                Có, bạn có thể hủy đăng ký bất cứ lúc nào. Không có ràng buộc dài hạn.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dữ liệu của tôi có được bảo mật không?
              </h3>
              <p className="text-gray-600">
                Hoàn toàn! Chúng tôi tuân thủ các tiêu chuẩn bảo mật cao nhất và không lưu trữ nội dung cá nhân.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bắt đầu sử dụng AI ngay hôm nay
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia hàng nghìn người dùng đang tiết kiệm thời gian với AI Tóm tắt
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Dùng thử miễn phí ngay
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="light" />
    </div>
  );
}
