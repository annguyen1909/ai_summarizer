"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, ArrowLeft, Share2 } from "lucide-react";
import { Footer } from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  thumbnail: string;
  readTime: string;
  publishedAt: string;
  slug: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Cách học nhanh hơn với AI",
    description: "Khám phá những phương pháp học tập hiệu quả sử dụng công nghệ AI để tăng tốc quá trình tiếp thu kiến thức của bạn.",
    content: `AI đang thay đổi cách chúng ta học tập và tiếp thu kiến thức. Với những công cụ AI thông minh, bạn có thể học nhanh hơn và hiệu quả hơn bao giờ hết.

## 1. Sử dụng AI để tóm tắt tài liệu

Thay vì đọc toàn bộ tài liệu dài, hãy sử dụng các công cụ AI như AI Tóm tắt để:
- Tóm tắt những điểm chính trong vài phút
- Trích xuất các ý quan trọng nhất
- Tạo outline cho bài học của bạn

## 2. Học qua câu hỏi với AI

AI có thể tạo ra các câu hỏi kiểm tra từ tài liệu học tập của bạn:
- Đặt câu hỏi để kiểm tra hiểu biết
- Giải thích các khái niệm phức tạp
- Tạo flashcard học thuộc lòng

## 3. Cá nhân hóa lộ trình học

AI có thể phân tích tiến độ học tập và đề xuất:
- Những chủ đề cần tập trung hơn
- Thời gian học tối ưu cho từng môn
- Phương pháp học phù hợp với từng người

Hãy bắt đầu sử dụng AI trong học tập ngay hôm nay để trải nghiệm sự khác biệt!`,
    thumbnail: "/blog1.png",
    readTime: "5 phút",
    publishedAt: "2 ngày trước",
    slug: "cach-hoc-nhanh-hon-voi-ai",
    category: "Học tập"
  },
  {
    id: "2",
    title: "5 thủ thuật tóm tắt tài liệu hiệu quả",
    description: "Những mẹo hay giúp bạn tóm tắt tài liệu một cách chính xác và nhanh chóng với sự hỗ trợ của AI.",
    content: `Tóm tắt tài liệu là kỹ năng quan trọng trong học tập và công việc. Dưới đây là 5 thủ thuật hiệu quả:

## 1. Xác định mục đích tóm tắt

Trước khi bắt đầu, hãy tự hỏi:
- Tóm tắt này dành cho ai?
- Mức độ chi tiết cần thiết là gì?
- Thông tin nào quan trọng nhất?

## 2. Sử dụng cấu trúc rõ ràng

Một bản tóm tắt tốt cần có:
- Phần mở đầu ngắn gọn
- Các điểm chính được sắp xếp logic
- Kết luận tổng hợp

## 3. Kỹ thuật "3-2-1"

- 3 điểm chính quan trọng nhất
- 2 chi tiết hỗ trợ cho mỗi điểm
- 1 kết luận tổng quát

## 4. Sử dụng AI hỗ trợ

AI có thể giúp:
- Nhận diện các từ khóa quan trọng
- Loại bỏ thông tin dư thừa
- Đảm bảo tính nhất quán

## 5. Kiểm tra và chỉnh sửa

Luôn đọc lại bản tóm tắt để:
- Đảm bảo đầy đủ thông tin quan trọng
- Kiểm tra tính logic và mạch lạc
- Điều chỉnh độ dài phù hợp`,
    thumbnail: "/blog2.png",
    readTime: "7 phút",
    publishedAt: "4 ngày trước",
    slug: "5-thu-thuat-tom-tat-tai-lieu-hieu-qua",
    category: "Kỹ năng"
  },
  {
    id: "3",
    title: "Tương lai của AI trong học tập và làm việc",
    description: "Cái nhìn tổng quan về xu hướng phát triển AI trong giáo dục và công việc, những thay đổi sắp tới.",
    content: `AI đang định hình lại cách chúng ta học tập và làm việc. Đây là những xu hướng quan trọng:

## Xu hướng trong giáo dục

### 1. Học tập cá nhân hóa
- AI sẽ tạo ra chương trình học riêng cho từng học sinh
- Điều chỉnh tốc độ và phương pháp học phù hợp
- Đánh giá tiến độ theo thời gian thực

### 2. Trợ giảng AI thông minh
- Hỗ trợ giải đáp thắc mắc 24/7
- Chấm bài và đưa ra feedback tức thì
- Tạo đề thi và bài tập tự động

## Xu hướng trong công việc

### 1. Tự động hóa tác vụ lặp lại
- AI xử lý các công việc văn phòng cơ bản
- Tóm tắt báo cáo và tài liệu
- Lập kế hoạch và quản lý thời gian

### 2. Hỗ trợ ra quyết định
- Phân tích dữ liệu và đưa ra insights
- Dự đoán xu hướng thị trường
- Tối ưu hóa quy trình làm việc

## Những thách thức cần giải quyết

- Đảm bảo tính chính xác của AI
- Bảo mật thông tin cá nhân
- Cân bằng giữa AI và yếu tố con người

Tương lai sẽ thuộc về những người biết cách kết hợp AI với kỹ năng con người!`,
    thumbnail: "/blog3.png",
    readTime: "10 phút",
    publishedAt: "1 tuần trước",
    slug: "tuong-lai-cua-ai-trong-hoc-tap-va-lam-viec",
    category: "Xu hướng"
  },
  {
    id: "4",
    title: "Cách tối ưu prompt AI cho kết quả tốt nhất",
    description: "Hướng dẫn chi tiết cách viết prompt hiệu quả để có được kết quả chính xác từ AI.",
    content: `Việc viết prompt hiệu quả là chìa khóa để có được kết quả tốt nhất từ AI. Dưới đây là những nguyên tắc quan trọng:

## 1. Rõ ràng và cụ thể

Prompt tốt cần có:
- Mục tiêu rõ ràng
- Yêu cầu cụ thể
- Định dạng mong muốn

## 2. Cung cấp context

AI cần hiểu:
- Bối cảnh của yêu cầu
- Đối tượng mục tiêu
- Tone và style mong muốn

## 3. Sử dụng ví dụ

Đưa ra ví dụ giúp AI:
- Hiểu chính xác yêu cầu
- Tạo ra output phù hợp
- Duy trì tính nhất quán

## 4. Chia nhỏ tác vụ phức tạp

Với tác vụ lớn, hãy:
- Chia thành các bước nhỏ
- Yêu cầu AI làm từng phần
- Kết hợp kết quả cuối cùng

## Ví dụ thực tế

❌ Prompt kém: "Tóm tắt bài này"
✅ Prompt tốt: "Tóm tắt bài viết này thành 3 điểm chính, mỗi điểm không quá 50 từ, tập trung vào những thông tin quan trọng nhất cho sinh viên đại học."`,
    thumbnail: "/sidebar-blog1.png",
    readTime: "4 phút",
    publishedAt: "3 ngày trước",
    slug: "cach-toi-uu-prompt-ai",
    category: "Kỹ thuật"
  }
];

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bài viết không tồn tại</h1>
          <Link href="/blog">
            <Button>← Quay lại Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            🤖 AI Tóm tắt
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
              Bảng giá
            </Link>
          </div>
        </div>
      </nav>

      {/* Back to Blog */}
      <div className="container mx-auto px-6 py-4">
        <Link href="/blog">
          <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4" />
            Quay lại Blog
          </Button>
        </Link>
      </div>

      {/* Hero Image */}
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 md:h-96 relative overflow-hidden rounded-xl">
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {post.category}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                {post.publishedAt}
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed">
              {post.description}
            </p>
          </header>

          {/* Share */}
          <div className="flex items-center gap-4 py-6 border-y border-gray-200 mb-8">
            <span className="text-sm font-medium text-gray-700">Chia sẻ:</span>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </Button>
          </div>

          {/* Content */}
          <div className="prose prose-lg prose-gray max-w-none">
            <div className="whitespace-pre-line leading-relaxed text-gray-700">
              {post.content}
            </div>
          </div>

          {/* CTA */}
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Sẵn sàng thử AI Tóm tắt?
              </h3>
              <p className="text-gray-600 mb-6">
                Áp dụng ngay những kiến thức bạn vừa học với công cụ AI của chúng tôi
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Dùng thử miễn phí →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>

      {/* Footer */}
      <Footer variant="light" />
    </div>
  );
}
