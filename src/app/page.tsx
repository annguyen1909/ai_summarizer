"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { BlogSidebar } from "@/components/sidebars/BlogSidebar";
import { 
  FileText, 
  Languages, 
  ListChecks, 
  Type, 
  Lightbulb,
  Download,
  Share2,
  ArrowRight,
  CheckCircle,
  Loader2,
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [demoText, setDemoText] = useState("");
  const [demoResult, setDemoResult] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guest quota management
  const getGuestUsage = () => {
    if (typeof window === 'undefined') return { count: 0, date: new Date().toDateString() };
    
    const stored = localStorage.getItem('guestUsage');
    if (!stored) return { count: 0, date: new Date().toDateString() };
    
    const usage = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Reset if new day
    if (usage.date !== today) {
      return { count: 0, date: today };
    }
    
    return usage;
  };

  const updateGuestUsage = () => {
    if (typeof window === 'undefined') return;
    
    const usage = getGuestUsage();
    const newUsage = {
      count: usage.count + 1,
      date: new Date().toDateString()
    };
    localStorage.setItem('guestUsage', JSON.stringify(newUsage));
  };

  const handleDemoSummary = async () => {
    if (!demoText.trim()) return;
    
    // Check guest quota
    const usage = getGuestUsage();
    if (usage.count >= 3) {
      setShowQuotaWarning(true);
      return;
    }
    
    setDemoLoading(true);
    try {
      const response = await fetch('/api/guest/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: demoText,
          summaryMode: 'brief'
        })
      });
      
      const data = await response.json();
      if (data.success || data.summary) {
        setDemoResult(data.summary);
        updateGuestUsage();
      }
    } catch (error) {
      console.error('Demo error:', error);
      setDemoResult('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setDemoLoading(false);
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
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
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
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg">
                  Dùng thử miễn phí
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/profile">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg">
                  Tài khoản
                </Button>
              </Link>
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
                className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bảng giá
              </Link>
              <SignedIn>
                <Link 
                  href="/profile" 
                  className="text-gray-600 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tài khoản
                </Link>
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
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg w-full">
                      Tài khoản
                    </Button>
                  </Link>
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

      {/* Main Layout - CSS Grid */}
      <div className="min-h-screen grid grid-cols-1 xl:grid-cols-[1fr_400px]">
        {/* Main Content */}
        <div className="min-w-0">
          {/* Hero Section */}
          <section className="container mx-auto px-6 py-24">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Hero Text */}
                <div className="text-center lg:text-left">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                    Công cụ AI đa năng cho 
                    <span className="text-blue-600"> sinh viên & văn phòng</span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                Tóm tắt nhanh, dịch thuật, tạo tiêu đề, gạch đầu dòng - Tất cả trong một ứng dụng dễ dùng với AI thông minh.
              </p>
              <div className="space-y-6 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center lg:justify-start">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-xl w-full sm:w-auto rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                      Bắt đầu miễn phí <ArrowRight className="h-6 w-6" />
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-8 text-xl w-full sm:w-auto rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                      Vào Dashboard <ArrowRight className="h-6 w-6" />
                    </Button>
                  </Link>
                </SignedIn>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-gray-300 text-gray-700 px-6 py-8 text-xl w-full sm:w-auto rounded-2xl hover:border-blue-300 hover:text-blue-600 transition-all"
                  onClick={() => {
                    const demoSection = document.querySelector('#demo-section');
                    demoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Dùng thử ngay ↓
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/hero-placeholder.png"
                  alt="Người dùng sử dụng AI để học tập và làm việc"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Floating stats cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">99% độ chính xác</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">10,000+ người dùng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-6 py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Ai đang sử dụng AI Tóm tắt?
          </h2>
          <p className="text-xl text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            Hàng nghìn người đang tiết kiệm thời gian mỗi ngày với AI Tóm tắt
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Students */}
            <Card className="hover:shadow-2xl transition-all duration-300 border-0 rounded-3xl bg-white">
              <CardHeader className="text-center pb-6">
                <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden">
                  <Image
                    src="/usecase-1.png"
                    alt="Sinh viên học tập với AI"
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl text-gray-900">Sinh viên</CardTitle>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  <strong>"Tóm tắt tài liệu học nhanh chóng"</strong>
                </p>
                <p className="text-gray-500 text-sm">
                  Xử lý hàng trăm trang tài liệu trong vài phút. Từ PDF bài giảng đến nghiên cứu khoa học.
                </p>
              </CardContent>
            </Card>

            {/* Office Workers */}
            <Card className="hover:shadow-2xl transition-all duration-300 border-0 rounded-3xl bg-white scale-105">
              <CardHeader className="text-center pb-6">
                <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden">
                  <Image
                    src="/usecase-2.png"
                    alt="Nhân viên văn phòng làm việc"
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl text-gray-900">Nhân viên văn phòng</CardTitle>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  <strong>"Rút gọn email, báo cáo"</strong>
                </p>
                <p className="text-gray-500 text-sm">
                  Nắm bắt nhanh nội dung email dài, báo cáo phức tạp và tài liệu công việc.
                </p>
              </CardContent>
            </Card>

            {/* News Readers */}
            <Card className="hover:shadow-2xl transition-all duration-300 border-0 rounded-3xl bg-white">
              <CardHeader className="text-center pb-6">
                <div className="relative w-full h-48 mb-6 rounded-xl overflow-hidden">
                  <Image
                    src="/usecase-3.png"
                    alt="Người đọc tin tức"
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardTitle className="text-2xl text-gray-900">Người đọc tin tức</CardTitle>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  <strong>"Nắm bắt nhanh nội dung nóng hổi"</strong>
                </p>
                <p className="text-gray-500 text-sm">
                  Cập nhật tin tức, bài báo dài chỉ trong vài giây. Luôn cập nhật mà không tốn thời gian.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Hoạt động như thế nào?
          </h2>
          <p className="text-xl text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            Chỉ 3 bước đơn giản để có bản tóm tắt hoàn hảo
          </p>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 h-full hidden md:block"></div>
            
            <div className="space-y-16">
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 text-center md:text-right">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-400 text-white rounded-full text-2xl font-bold mb-6 md:mb-4">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Dán văn bản hoặc link</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Copy và paste văn bản dài, hoặc chia sẻ link bài báo, tài liệu cần tóm tắt.
                  </p>
                </div>
                <div className="hidden md:block w-8 h-8 bg-white border-4 border-blue-500 rounded-full relative z-10"></div>
                <div className="md:w-1/2 flex justify-center">
                  <div className="relative w-64 h-48 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/step1.png"
                      alt="Dán văn bản vào ứng dụng"
                      width={256}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 flex justify-center">
                  <div className="relative w-64 h-48 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/step2.png"
                      alt="AI xử lý văn bản"
                      width={256}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden md:block w-8 h-8 bg-white border-4 border-blue-500 rounded-full relative z-10"></div>
                <div className="md:w-1/2 text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-300 to-green-400 text-white rounded-full text-2xl font-bold mb-6 md:mb-4">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">AI xử lý trong vài giây</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Công nghệ AI tiên tiến phân tích và hiểu nội dung, trích xuất những ý chính nhất.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 text-center md:text-right">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-300 to-red-400 text-white rounded-full text-2xl font-bold mb-6 md:mb-4">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Nhận bản tóm tắt súc tích</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Bạn có ngay bản tóm tắt chính xác, ngắn gọn và dễ hiểu. Tiết kiệm 80% thời gian đọc.
                  </p>
                </div>
                <div className="hidden md:block w-8 h-8 bg-white border-4 border-blue-500 rounded-full relative z-10"></div>
                <div className="md:w-1/2 flex justify-center">
                  <div className="relative w-64 h-48 rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src="/step3.png"
                      alt="Kết quả tóm tắt"
                      width={256}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-6 py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            Người dùng nói gì về chúng tôi
          </h2>
          <p className="text-xl text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            Hàng nghìn người đã tiết kiệm thời gian với AI Tóm tắt
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-0 rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/avatar1.png"
                      alt="Avatar của Thanh Trí"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Thanh Trí</h4>
                    <p className="text-gray-500 text-sm">Sinh viên ĐH Bách Khoa</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "Tóm tắt tài liệu 100 trang chỉ trong 2 phút! Giúp mình ôn thi hiệu quả hơn rất nhiều. Không thể thiếu được."
                </p>
                <div className="flex text-yellow-400 mt-4">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-0 rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/avatar2.png"
                      alt="Avatar của Bảo Huy"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Bảo Huy</h4>
                    <p className="text-gray-500 text-sm">Marketing Manager</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "Đọc báo cáo thị trường từ 50 trang xuống còn 2 đoạn cực súc tích. Tiết kiệm được 2 giờ mỗi ngày!"
                </p>
                <div className="flex text-yellow-400 mt-4">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-0 rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src="/avatar3.png"
                      alt="Avatar của Trung Đức"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Trung Đức</h4>
                    <p className="text-gray-500 text-sm">Nhà báo</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "Theo dõi tin tức quốc tế từ nhiều nguồn. AI Tóm tắt giúp mình nắm bắt nhanh xu hướng và sự kiện hot."
                </p>
                <div className="flex text-yellow-400 mt-4">
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section - Only for non-logged-in users */}
      <SignedOut>
        <section id="demo-section" className="container mx-auto px-6 py-24 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Dùng thử ngay - Không cần đăng ký
          </h2>
          <p className="text-center text-gray-600 mb-12 text-xl">
            Bạn có <span className="font-bold text-blue-600">{Math.max(0, 3 - getGuestUsage().count)}</span> lượt dùng thử miễn phí hôm nay
          </p>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Input Demo */}
            <Card className="shadow-2xl border-0 rounded-3xl bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-blue-600 flex items-center text-2xl">
                  <FileText className="h-6 w-6 mr-3" />
                  Nhập văn bản để tóm tắt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                <Textarea
                  placeholder="Dán văn bản dài ở đây để AI tóm tắt ngay lập tức..."
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  className="min-h-[250px] resize-none text-lg rounded-2xl border-2 focus:border-blue-400 focus:ring-0"
                />
                <div className="flex space-x-4">
                  <Button
                    onClick={handleDemoSummary}
                    disabled={demoLoading || !demoText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 flex-1 py-4 text-lg rounded-2xl shadow-lg"
                  >
                    {demoLoading ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Đang tóm tắt...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-3 h-5 w-5" />
                        Tóm tắt ngay
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl px-6 py-4 border-2"
                    onClick={() => setDemoText("Trí tuệ nhân tạo (AI) đang thay đổi cách chúng ta làm việc và học tập. Với khả năng xử lý dữ liệu lớn và nhận dạng mẫu, AI giúp tự động hóa nhiều tác vụ phức tạp. Trong giáo dục, AI hỗ trợ học sinh cá nhân hóa quá trình học, tạo ra những bài giảng phù hợp với từng người. Trong kinh doanh, AI tối ưu hóa quy trình, dự đoán xu hướng thị trường và cải thiện trải nghiệm khách hàng. Tuy nhiên, việc ứng dụng AI cũng đặt ra những thách thức về đạo đức và bảo mật dữ liệu mà chúng ta cần giải quyết.")}
                  >
                    Văn bản mẫu
                  </Button>
                </div>
                <div className="text-sm text-gray-500 bg-blue-50 p-4 rounded-2xl">
                  💡 <strong>Mẹo:</strong> Dán bài báo, tài liệu học tập, hoặc email dài để xem AI tóm tắt thông minh
                </div>
              </CardContent>
            </Card>

            {/* Output Demo */}
            <Card className="shadow-2xl border-0 border-l-4 border-l-blue-500 rounded-3xl bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-green-600 flex items-center text-2xl">
                  <CheckCircle className="h-6 w-6 mr-3" />
                  Kết quả AI {demoResult && "✨"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                {demoResult ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border-2 border-green-200">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
                        📄 Tóm tắt:
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {demoResult}
                      </p>
                    </div>
                    <div className="text-center space-y-4">
                      <p className="text-green-600 font-bold text-lg">
                        🎉 Hoàn thành! Còn <span className="text-2xl">{Math.max(0, 3 - getGuestUsage().count)}</span> lượt dùng thử
                      </p>
                      <div className="flex space-x-4">
                        <Link href="/dashboard" className="flex-1">
                          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-lg shadow-lg">
                            Trải nghiệm đầy đủ
                          </Button>
                        </Link>
                        <SignUpButton mode="modal">
                          <Button size="lg" variant="outline" className="flex-1 py-4 rounded-2xl text-lg border-2">
                            Đăng ký +2 lượt
                          </Button>
                        </SignUpButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">🤖</div>
                    <p className="text-gray-500 text-xl leading-relaxed">
                      Nhập văn bản bên trái và nhấn <br/><strong>"Tóm tắt ngay"</strong> để xem kết quả
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Tính năng nổi bật
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Summary */}
            <Card className="hover:shadow-lg transition-shadow border-0 bg-blue-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Tóm tắt nhanh</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">
                  Tóm tắt văn bản dài thành những ý chính ngắn gọn, dễ hiểu trong vài giây.
                </p>
              </CardContent>
            </Card>

            {/* Quick Translate */}
            <Card className="hover:shadow-lg transition-shadow border-0 bg-green-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Languages className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Dịch & Keypoints</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">
                  Dịch nhanh Anh-Việt và trích xuất những điểm quan trọng nhất.
                </p>
              </CardContent>
            </Card>

            {/* Title Generator */}
            <Card className="hover:shadow-lg transition-shadow border-0 bg-purple-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Type className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Sinh tiêu đề</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">
                  Tự động tạo ra những tiêu đề hấp dẫn, phù hợp với nội dung văn bản.
                </p>
              </CardContent>
            </Card>

            {/* Export & Share */}
            <Card className="hover:shadow-lg transition-shadow border-0 bg-orange-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Share2 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Xuất file / Chia sẻ</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 text-sm">
                  Xuất PDF hoặc chia sẻ kết quả qua link công khai một cách dễ dàng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Sẵn sàng tiết kiệm thời gian với AI?
          </h2>
          <p className="text-2xl mb-12 text-blue-100 max-w-3xl mx-auto">
            Tham gia hàng nghìn sinh viên và nhân viên văn phòng đang sử dụng AI Tóm tắt
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all">
                Bắt đầu miễn phí ngay <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-6 text-xl rounded-2xl shadow-2xl hover:shadow-3xl transition-all">
                Vào Dashboard <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
          </SignedIn>
        </div>
      </section>
      </SignedOut>

      {/* Quota Warning Modal */}
      {showQuotaWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Đã hết lượt dùng thử hôm nay!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Đăng ký miễn phí để được thêm 2 lượt sử dụng mỗi ngày, hoặc nâng cấp Pro để không giới hạn.
              </p>
              
              <div className="space-y-3">
                <SignUpButton mode="modal">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Đăng ký miễn phí (+2 lượt/ngày)
                  </button>
                </SignUpButton>
                
                <Link href="/pricing">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors">
                    🚀 Nâng cấp Pro - Không giới hạn
                  </button>
                </Link>
                
                <button
                  onClick={() => setShowQuotaWarning(false)}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Để sau
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-400 border-t pt-4">
                Quota sẽ reset vào 00:00 (GMT+7) mỗi ngày
              </div>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Right Sidebar - Sticky to content area */}
        <div className="hidden xl:block bg-gray-50 border-l border-gray-200 overflow-hidden">
          <div className="sticky top-0 h-screen overflow-y-auto overflow-x-hidden p-6">
            <BlogSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
