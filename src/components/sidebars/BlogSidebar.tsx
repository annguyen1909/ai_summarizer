"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  readTime: string;
  publishedAt: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Cách học nhanh hơn với AI",
    description: "Khám phá những phương pháp học tập hiệu quả sử dụng công nghệ AI",
    thumbnail: "/blog1.png",
    readTime: "5 phút",
    publishedAt: "2 ngày trước",
    slug: "cach-hoc-nhanh-hon-voi-ai"
  },
  {
    id: "2", 
    title: "5 thủ thuật tóm tắt tài liệu hiệu quả",
    description: "Những mẹo hay giúp bạn tóm tắt tài liệu một cách chính xác và nhanh chóng",
    thumbnail: "/blog2.png",
    readTime: "7 phút",
    publishedAt: "4 ngày trước",
    slug: "5-thu-thuat-tom-tat-tai-lieu-hieu-qua"
  },
  {
    id: "3",
    title: "Tương lai của AI trong học tập và làm việc",
    description: "Cái nhìn tổng quan về xu hướng phát triển AI trong giáo dục và công việc",
    thumbnail: "/blog3.png",
    readTime: "10 phút",
    publishedAt: "1 tuần trước",
    slug: "tuong-lai-cua-ai-trong-hoc-tap-va-lam-viec"
  },
  {
    id: "4",
    title: "Tối ưu hóa hiệu suất làm việc với AI",
    description: "Hướng dẫn sử dụng AI để cải thiện năng suất công việc hàng ngày",
    thumbnail: "/blog4.png",
    readTime: "6 phút",
    publishedAt: "2 tuần trước",
    slug: "toi-uu-hoa-hieu-suat-lam-viec-voi-ai"
  }
];

interface BlogSidebarProps {
  className?: string;
}

export function BlogSidebar({ className = "" }: BlogSidebarProps) {
  return (
    <div className={`w-full max-w-full overflow-hidden space-y-6 ${className}`}>
      {/* Blog Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-blue-900">
            📚 Blog & Tin tức
          </CardTitle>
          <CardDescription className="text-blue-700">
            Cập nhật kiến thức mới nhất về AI và học tập
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Latest Posts */}
      <div className="space-y-4">
        {blogPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
            <Link href={`/blog/${post.slug}`}>
              <CardContent className="p-4">
                <div className="flex gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={post.thumbnail}
                        alt={post.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 overflow-hidden">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <CalendarDays className="w-3 h-3" />
                        {post.publishedAt}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* View All Link */}
      <Card className="bg-gray-50 border-dashed hover:bg-gray-100 transition-colors">
        <Link href="/blog">
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              📖 Xem tất cả bài viết →
            </div>
          </CardContent>
        </Link>
      </Card>
    </div>
  );
}
