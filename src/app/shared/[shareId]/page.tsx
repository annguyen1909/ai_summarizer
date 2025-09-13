"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Share2 } from "lucide-react";

interface SharedSummary {
  id: string;
  summary: string;
  summary_mode: string;
  created_at: string;
  source: string;
}

export default function SharedSummaryPage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [summary, setSummary] = useState<SharedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedSummary = async () => {
      try {
        const response = await fetch(`/api/shared/${shareId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shared summary');
        }

        setSummary(data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedSummary();
    }
  }, [shareId]);

  const getSummaryModeLabel = (mode: string) => {
    switch (mode) {
      case 'short': return 'Tóm tắt ngắn';
      case 'bullet': return 'Điểm chính';
      case 'outline': return 'Dàn ý';
      default: return 'Tóm tắt';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'text': return 'Văn bản';
      case 'url': return 'Liên kết';
      case 'file': return 'Tệp tin';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mt-8">
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Không thể tải tóm tắt
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.href = '/'}>
                Về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="mt-8">
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Tóm tắt không tồn tại
              </h2>
              <p className="text-gray-600 mb-4">
                Liên kết này có thể đã hết hạn hoặc không còn tồn tại.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Tóm tắt văn bản
          </h1>
          <p className="text-gray-600">
            Tóm tắt được chia sẻ công khai
          </p>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {getSummaryModeLabel(summary.summary_mode)}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(summary.created_at).toLocaleDateString('vi-VN')}
                  </span>
                  <span>Nguồn: {getSourceLabel(summary.source)}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Chia sẻ</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {summary.summary}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Được tạo bởi AI Tóm tắt - Công cụ tóm tắt văn bản thông minh cho người Việt
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Tạo tóm tắt của bạn
          </Button>
        </div>
      </div>
    </div>
  );
}
