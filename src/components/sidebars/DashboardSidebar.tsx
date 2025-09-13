"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Home, 
  CreditCard, 
  Crown, 
  Link as LinkIcon, 
  FileText, 
  Zap,
  Calendar,
  Clock,
  User
} from "lucide-react";

interface QuickLink {
  id: string;
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: "tip" | "feature" | "pro";
}

interface BlogTeaser {
  id: string;
  title: string;
  thumbnail: string;
  readTime: string;
  slug: string;
}

const quickLinks: QuickLink[] = [
  {
    id: "1",
    title: "Trang chủ",
    href: "/",
    icon: <Home className="w-4 h-4" />,
    description: "Về trang chủ"
  },
  {
    id: "2",
    title: "Tài khoản",
    href: "/profile",
    icon: <User className="w-4 h-4" />,
    description: "Quản lý tài khoản và gói dịch vụ"
  },
  {
    id: "3",
    title: "Bảng giá",
    href: "/pricing",
    icon: <CreditCard className="w-4 h-4" />,
    description: "Xem các gói dịch vụ"
  },
  {
    id: "4",
    title: "Nâng cấp Pro",
    href: "/pricing#pro",
    icon: <Crown className="w-4 h-4" />,
    description: "Mở khóa tính năng cao cấp"
  }
];

const tips: Tip[] = [
  {
    id: "1",
    title: "Dùng link để tóm tắt nhanh báo chí",
    description: "Chỉ cần dán URL của bài báo, AI sẽ tự động tóm tắt nội dung",
    icon: <LinkIcon className="w-4 h-4 text-blue-500" />,
    type: "tip"
  },
  {
    id: "2",
    title: "Dán nhiều đoạn text cùng lúc",
    description: "AI có thể xử lý và tóm tắt nhiều đoạn văn bản trong một lần",
    icon: <FileText className="w-4 h-4 text-green-500" />,
    type: "feature"
  },
  {
    id: "3",
    title: "Pro user có tốc độ xử lý nhanh hơn",
    description: "Ưu tiên xử lý và không giới hạn số lượng sử dụng",
    icon: <Zap className="w-4 h-4 text-yellow-500" />,
    type: "pro"
  }
];

const blogTeasers: BlogTeaser[] = [
  {
    id: "1",
    title: "Cách tối ưu prompt AI cho kết quả tốt nhất",
    thumbnail: "/sidebar-blog1.png",
    readTime: "4 phút",
    slug: "cach-toi-uu-prompt-ai"
  },
  {
    id: "2",
    title: "AI trong giáo dục: Xu hướng 2024",
    thumbnail: "/sidebar-blog2.png", 
    readTime: "6 phút",
    slug: "ai-trong-giao-duc-xu-huong-2024"
  },
  {
    id: "3",
    title: "Bảo mật thông tin khi sử dụng AI",
    thumbnail: "/sidebar-blog3.png",
    readTime: "5 phút", 
    slug: "bao-mat-thong-tin-khi-su-dung-ai"
  }
];

interface DashboardSidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export function DashboardSidebar({ className = "", onLinkClick }: DashboardSidebarProps) {
  return (
    <div className={`w-full lg:w-72 max-w-full overflow-hidden space-y-6 ${className}`}>
      {/* Quick Links */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-blue-900">
            🚀 Liên kết nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickLinks.map((link) => (
            <Link key={link.id} href={link.href} onClick={onLinkClick}>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-auto p-3 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {link.icon}
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{link.title}</div>
                    <div className="text-xs text-gray-600 truncate">{link.description}</div>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Tips & Guides */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            💡 Mẹo & Hướng dẫn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex-shrink-0">{tip.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 mb-1">
                    {tip.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {tip.description}
                  </p>
                  {tip.type === "pro" && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        <Crown className="w-3 h-3" />
                        Pro
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Blog Teasers */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">
            📖 Bài viết mới
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {blogTeasers.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} onClick={onLinkClick}>
              <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={post.thumbnail}
                        alt={post.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* View All Blog Link */}
          <Link href="/blog" onClick={onLinkClick}>
            <div className="p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer text-center">
              <div className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Xem tất cả →
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
