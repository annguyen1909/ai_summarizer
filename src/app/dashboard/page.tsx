"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSidebar } from "@/components/sidebars/DashboardSidebar";
import { 
  Loader2, 
  FileText, 
  Languages,
  ListChecks,
  Type,
  Lightbulb,
  Copy,
  Share2,
  History,
  BarChart3,
  Crown,
  Menu,
  X
} from "lucide-react";

interface ServiceResult {
  id: string;
  type: 'summary' | 'translate' | 'keypoints' | 'title-generator' | 'simplify';
  originalText: string;
  result: string;
  createdAt: string;
}

// Guest session management
const GUEST_DAILY_LIMIT = 3;
const GUEST_STORAGE_KEY = 'guest_usage';

function getGuestUsage() {
  if (typeof window === 'undefined') return { count: 0, date: '' };
  
  const stored = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!stored) return { count: 0, date: '' };
  
  try {
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Reset if it's a new day
    if (data.date !== today) {
      return { count: 0, date: today };
    }
    
    return data;
  } catch {
    return { count: 0, date: '' };
  }
}

function updateGuestUsage() {
  if (typeof window === 'undefined') return;
  
  const today = new Date().toDateString();
  const current = getGuestUsage();
  
  const newData = {
    count: current.date === today ? current.count + 1 : 1,
    date: today
  };
  
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newData));
}

interface UsageInfo {
  currentUsage: number;
  maxUsage: number;
  resetDate: string;
  plan: string;
  canUse: boolean;
  usedToday: number;
  dailyLimit: number;
  remainingUses: number;
  isGuest: boolean;
  subscription: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [history, setHistory] = useState<ServiceResult[]>([]);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Form states for each service
  const [summaryText, setSummaryText] = useState("");
  const [summaryMode, setSummaryMode] = useState("short");
  
  const [translateText, setTranslateText] = useState("");
  const [translateDirection, setTranslateDirection] = useState("en-vi");
  
  const [keypointsText, setKeypointsText] = useState("");
  
  const [titleText, setTitleText] = useState("");
  
  const [simplifyText, setSimplifyText] = useState("");
  const [simplifyLevel, setSimplifyLevel] = useState("medium");
  
  // Results
  const [result, setResult] = useState<string>("");

  const loadUsageInfo = useCallback(async () => {
    if (user) {
      try {
        const response = await fetch('/api/user/usage');
        if (response.ok) {
          const data = await response.json();
          setUsageInfo(data.usageInfo);
        } else {
          console.error('Failed to load usage info');
        }
      } catch (error) {
        console.error('Error loading usage info:', error);
      }
    }
  }, [user]);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/summaries/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.summaries || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  // Load user profile and history
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        loadUsageInfo();
        loadHistory();
      } else {
        // Setup guest profile
        setupGuestProfile();
      }
    }
  }, [user, isLoaded, loadUsageInfo, loadHistory]);

  const setupGuestProfile = () => {
    const guestUsage = getGuestUsage();
    const remainingQuota = Math.max(0, GUEST_DAILY_LIMIT - guestUsage.count);
    
    setUsageInfo({
      currentUsage: guestUsage.count,
      maxUsage: GUEST_DAILY_LIMIT,
      resetDate: new Date().toISOString(),
      plan: 'guest',
      canUse: remainingQuota > 0,
      remainingUses: remainingQuota,
      usedToday: guestUsage.count,
      dailyLimit: GUEST_DAILY_LIMIT,
      subscription: 'Free',
      isGuest: true
    });
  };

  const checkQuotaAndProceed = (callback: () => void) => {
    if (!usageInfo) return;
    
    if (!user) {
      // Guest user
      const guestUsage = getGuestUsage();
      if (guestUsage.count >= GUEST_DAILY_LIMIT) {
        setShowQuotaModal(true);
        return;
      }
    } else {
      // Logged in user
      if (!usageInfo.canUse) {
        setShowQuotaModal(true);
        return;
      }
    }
    
    callback();
  };

  const updateQuotaAfterUsage = () => {
    if (!user) {
      // Update guest usage
      updateGuestUsage();
      setupGuestProfile();
    } else {
      // Reload usage info for logged in users
      loadUsageInfo();
    }
  };

  const handleSummary = async () => {
    if (!summaryText.trim()) return;
    
    checkQuotaAndProceed(async () => {
      setLoading(true);
      try {
        let response;
        
        if (user) {
          // Logged in user - use existing API
          response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: summaryText,
              summaryMode,
              source: 'text'
            })
          });
        } else {
          // Guest user - use guest API
          response = await fetch('/api/guest/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: summaryText,
              summaryMode
            })
          });
        }
        
        const data = await response.json();
        if (data.summary) {
          setResult(data.summary);
          updateQuotaAfterUsage();
          if (user) {
            loadHistory();
          }
        } else if (data.error) {
          console.error('API Error:', data.error);
          // Show error to user
          setResult(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Summary error:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    
    checkQuotaAndProceed(async () => {
      setLoading(true);
      try {
        let response;
        
        if (user) {
          // Logged in user - use existing API
          response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: translateText,
              direction: translateDirection
            })
          });
        } else {
          // Guest user - use guest API
          response = await fetch('/api/guest/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: translateText,
              direction: translateDirection
            })
          });
        }
        
        const data = await response.json();
        if (data.success && data.translatedText) {
          setResult(data.translatedText);
          updateQuotaAfterUsage();
          if (user) {
            loadHistory();
          }
        } else if (data.error) {
          console.error('API Error:', data.error);
          setResult(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleKeypoints = async () => {
    if (!keypointsText.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/keypoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: keypointsText })
      });
      
      const data = await response.json();
      if (data.success && data.keypoints) {
        setResult(data.keypoints);
        updateQuotaAfterUsage();
        if (user) {
          loadHistory();
        }
      } else if (data.error) {
        console.error('API Error:', data.error);
        setResult(`Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error('Keypoints error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleGenerator = async () => {
    if (!titleText.trim()) return;
    
    checkQuotaAndProceed(async () => {
      setLoading(true);
      try {
        let response;
        
        if (user) {
          // Logged in user - use existing API
          response = await fetch('/api/title-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: titleText, count: 3 })
          });
        } else {
          // Guest user - use guest API
          response = await fetch('/api/guest/title-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: titleText, count: 3 })
          });
        }
        
        const data = await response.json();
        if (data.success && data.titles) {
          setResult(data.titles);
          updateQuotaAfterUsage();
          if (user) {
            loadHistory();
          }
        } else if (data.error) {
          console.error('API Error:', data.error);
          setResult(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Title generation error:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSimplify = async () => {
    if (!simplifyText.trim()) return;
    
    checkQuotaAndProceed(async () => {
      setLoading(true);
      try {
        let response;
        
        if (user) {
          // Logged in user - use existing API
          response = await fetch('/api/simplify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: simplifyText,
              level: simplifyLevel
            })
          });
        } else {
          // Guest user - use guest API
          response = await fetch('/api/guest/simplify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: simplifyText,
              level: simplifyLevel
            })
          });
        }
        
        const data = await response.json();
        if (data.success && data.simplifiedText) {
          setResult(data.simplifiedText);
          updateQuotaAfterUsage();
          if (user) {
            loadHistory();
          }
        } else if (data.error) {
          console.error('API Error:', data.error);
          setResult(`Lỗi: ${data.error}`);
        }
      } catch (error) {
        console.error('Simplification error:', error);
      } finally {
        setLoading(false);
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                🤖 AI Tóm tắt
              </Link>
              <div className="hidden md:block text-gray-500">
                {user ? (
                  <>Xin chào, <span className="font-medium text-gray-700">{user.firstName || user.emailAddresses[0]?.emailAddress}</span></>
                ) : (
                  <>Dùng thử miễn phí - <span className="font-bold text-blue-600">{usageInfo?.usedToday || 0}/{usageInfo?.dailyLimit || GUEST_DAILY_LIMIT}</span> lượt hôm nay</>
                )}
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {usageInfo && (
                <div className="text-sm bg-blue-50 px-4 py-2 rounded-xl">
                  <span className="text-gray-600">Còn lại: </span>
                  <span className="font-bold text-blue-600">
                    {usageInfo.remainingUses}/{usageInfo.dailyLimit || 5}
                  </span>
                </div>
              )}
              {user ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowQuotaModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    Nâng cấp
                  </button>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                      Đăng nhập
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>

            {/* Mobile hamburger menu */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-6 py-4 border-t border-gray-200">
              <div className="space-y-4">
                <div className="text-gray-500 px-2">
                  {user ? (
                    <>Xin chào, <span className="font-medium text-gray-700">{user.firstName || user.emailAddresses[0]?.emailAddress}</span></>
                  ) : (
                    <>Dùng thử miễn phí - <span className="font-bold text-blue-600">{usageInfo?.usedToday || 0}/{usageInfo?.dailyLimit || GUEST_DAILY_LIMIT}</span> lượt hôm nay</>
                  )}
                </div>
                
                {usageInfo && (
                  <div className="text-sm bg-blue-50 px-4 py-2 rounded-xl mx-2">
                    <span className="text-gray-600">Còn lại: </span>
                    <span className="font-bold text-blue-600">
                      {usageInfo.remainingUses}/{usageInfo.dailyLimit || 5}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2 px-2">
                  <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                    Trang chủ
                  </Link>
                  <Link href="/pricing" className="block py-2 text-gray-700 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                    Bảng giá
                  </Link>
                </div>
                
                {user ? (
                  <div className="px-2 pt-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                ) : (
                  <div className="space-y-2 px-2 pt-2">
                    <button
                      onClick={() => { setShowQuotaModal(true); setMobileMenuOpen(false); }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      Nâng cấp
                    </button>
                    <SignInButton mode="modal">
                      <button 
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Đăng nhập
                      </button>
                    </SignInButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout - CSS Grid */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* Left Sidebar */}
        <div className="hidden lg:block bg-gray-50 border-r border-gray-200">
          <div className="sticky top-0 h-screen overflow-y-auto p-4">
            <DashboardSidebar />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileSidebarOpen(false)}>
            <div className="w-full max-w-md h-full bg-white overflow-y-auto overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <DashboardSidebar onLinkClick={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="min-w-0">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {/* Mobile Sidebar Toggle Button */}
            <div className="lg:hidden mb-3 sm:mb-4">
              <Button
                variant="outline"
                onClick={() => setMobileSidebarOpen(true)}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <Menu className="w-4 h-4" />
                Menu
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-8">
              {/* Main Content - Full width since sidebar is separate */}
              <div>
                {/* Quota Bar */}
            {usageInfo && (
              <Card className="mb-4 sm:mb-6">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium">
                        {!user ? 'Lượt dùng thử miễn phí' : 'Lượt sử dụng hôm nay'}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {(usageInfo.dailyLimit || 5) - usageInfo.remainingUses}/{usageInfo.dailyLimit || 5}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div 
                      className={`h-1.5 sm:h-2 rounded-full ${!user ? 'bg-orange-500' : 'bg-blue-600'}`}
                      style={{ 
                        width: `${(((usageInfo.dailyLimit || 5) - usageInfo.remainingUses) / (usageInfo.dailyLimit || 5)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                    <div className="text-xs text-gray-500">
                      Gói: <span className="capitalize font-medium">
                        {usageInfo.isGuest ? 'Dùng thử' : usageInfo.subscription}
                      </span>
                    </div>
                    {!user && (
                      <button
                        onClick={() => setShowQuotaModal(true)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Nâng cấp ngay
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggested Actions Section */}
            {(!result || result.length === 0) && (
              <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900 flex items-center">
                    <Lightbulb className="h-6 w-6 mr-3 text-blue-600" />
                    Gợi ý sử dụng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div 
                      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
                      onClick={() => setActiveTab("summary")}
                    >
                      <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src="/action-text.png"
                          alt="Dán văn bản để tóm tắt"
                          width={200}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Tóm tắt văn bản</h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Dán văn bản dài, bài báo, tài liệu để nhận bản tóm tắt súc tích ngay lập tức.
                      </p>
                    </div>

                    <div 
                      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-200"
                      onClick={() => setActiveTab("translate")}
                    >
                      <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
                        <Image
                          src="/action-link.png"
                          alt="Dán link để dịch thuật"
                          width={200}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                          <Languages className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Dịch thuật nhanh</h3>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Dịch văn bản giữa tiếng Việt, Anh, Trung, Nhật, Hàn với độ chính xác cao.
                      </p>
                    </div>

                    {!user ? (
                      <div 
                        className="bg-gradient-to-br from-purple-100 to-blue-100 p-6 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-200"
                        onClick={() => setShowQuotaModal(true)}
                      >
                        <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden">
                          <Image
                            src="/action-upgrade.png"
                            alt="Nâng cấp lên Pro"
                            width={200}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                            <Crown className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="font-bold text-gray-900">Nâng cấp Pro</h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Sử dụng không giới hạn tất cả tính năng AI với gói Pro chỉ từ 19k/tháng.
                        </p>
                      </div>
                    ) : (
                      <div 
                        className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-orange-200"
                        onClick={() => setActiveTab("title-generator")}
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
                            <Type className="h-6 w-6 text-orange-600" />
                          </div>
                          <h3 className="font-bold text-gray-900">Tạo tiêu đề</h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Sinh tiêu đề hấp dẫn và phù hợp cho bài viết, báo cáo của bạn.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Tabs */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl text-gray-900">Chọn dịch vụ AI</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 text-xs sm:text-sm">
                    <TabsTrigger value="summary" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline sm:inline">Tóm tắt</span>
                    </TabsTrigger>
                    <TabsTrigger value="translate" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline sm:inline">Dịch</span>
                    </TabsTrigger>
                    <TabsTrigger value="keypoints" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <ListChecks className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline sm:inline">Key</span>
                    </TabsTrigger>
                    <TabsTrigger value="title" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <Type className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline sm:inline">Tiêu đề</span>
                    </TabsTrigger>
                    <TabsTrigger value="simplify" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline sm:inline">Đơn giản</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Summary Tab */}
                  <TabsContent value="summary" className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Văn bản cần tóm tắt
                      </label>
                      <Textarea
                        placeholder="Nhập hoặc dán văn bản cần tóm tắt..."
                        value={summaryText}
                        onChange={(e) => setSummaryText(e.target.value)}
                        className="min-h-[120px] sm:min-h-[150px] text-sm sm:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Chế độ tóm tắt
                      </label>
                      <Select value={summaryMode} onValueChange={setSummaryMode}>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Ngắn gọn</SelectItem>
                          <SelectItem value="bullet">Gạch đầu dòng</SelectItem>
                          <SelectItem value="outline">Dàn ý chi tiết</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleSummary}
                      disabled={loading || !summaryText.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-2 sm:py-3 text-sm sm:text-base"
                    >
                      {loading ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />}
                      Tóm tắt ngay
                    </Button>
                  </TabsContent>

                  {/* Translate Tab */}
                  <TabsContent value="translate" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Văn bản cần dịch
                      </label>
                      <Textarea
                        placeholder="Nhập văn bản cần dịch..."
                        value={translateText}
                        onChange={(e) => setTranslateText(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hướng dịch
                      </label>
                      <Select value={translateDirection} onValueChange={setTranslateDirection}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-vi">Anh → Việt</SelectItem>
                          <SelectItem value="vi-en">Việt → Anh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleTranslate}
                      disabled={loading || !translateText.trim()}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
                      Dịch ngay
                    </Button>
                  </TabsContent>

                  {/* Keypoints Tab */}
                  <TabsContent value="keypoints" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Văn bản trích xuất ý chính
                      </label>
                      <Textarea
                        placeholder="Nhập văn bản để trích xuất những ý chính..."
                        value={keypointsText}
                        onChange={(e) => setKeypointsText(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <Button 
                      onClick={handleKeypoints}
                      disabled={loading || !keypointsText.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                      Trích xuất keypoints
                    </Button>
                  </TabsContent>

                  {/* Title Generator Tab */}
                  <TabsContent value="title" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Văn bản tạo tiêu đề
                      </label>
                      <Textarea
                        placeholder="Nhập nội dung để tạo tiêu đề phù hợp..."
                        value={titleText}
                        onChange={(e) => setTitleText(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <Button 
                      onClick={handleTitleGenerator}
                      disabled={loading || !titleText.trim()}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Type className="mr-2 h-4 w-4" />}
                      Tạo tiêu đề
                    </Button>
                  </TabsContent>

                  {/* Simplify Tab */}
                  <TabsContent value="simplify" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Văn bản cần đơn giản hóa
                      </label>
                      <Textarea
                        placeholder="Nhập văn bản phức tạp để đơn giản hóa..."
                        value={simplifyText}
                        onChange={(e) => setSimplifyText(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mức độ đơn giản
                      </label>
                      <Select value={simplifyLevel} onValueChange={setSimplifyLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Cơ bản (cho học sinh tiểu học)</SelectItem>
                          <SelectItem value="medium">Trung bình (cho đại chúng)</SelectItem>
                          <SelectItem value="advanced">Nâng cao (cho sinh viên)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleSimplify}
                      disabled={loading || !simplifyText.trim()}
                      className="w-full bg-pink-600 hover:bg-pink-700"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                      Đơn giản hóa
                    </Button>
                  </TabsContent>
                </Tabs>

                {/* Results */}
                {result && (
                  <Card className="mt-4 sm:mt-6">
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="text-base sm:text-lg text-gray-900 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                        <span>Kết quả</span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result)}
                            className="text-xs sm:text-sm"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Copy</span>
                            <span className="sm:hidden">Sao chép</span>
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Chia sẻ</span>
                            <span className="sm:hidden">Chia sẻ</span>
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed break-words overflow-hidden">
                          {result}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* History Panel */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <History className="h-4 w-4 text-blue-600" />
                    </div>
                    {user ? 'Lịch sử gần đây' : 'Tính năng Premium'}
                  </div>
                  {user && history.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                      Xem tất cả
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {user ? (
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <History className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Chưa có lịch sử</p>
                        <p className="text-xs text-gray-400 mt-1">Lịch sử sử dụng sẽ hiển thị ở đây</p>
                      </div>
                    ) : (
                      history.slice(0, 5).map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 hover:border-gray-200">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                              <Image
                                src="/history-doc.png"
                                alt="Document icon"
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  item.type === 'summary' ? 'bg-blue-50 text-blue-700' :
                                  item.type === 'translate' ? 'bg-green-50 text-green-700' :
                                  item.type === 'keypoints' ? 'bg-purple-50 text-purple-700' :
                                  item.type === 'title-generator' ? 'bg-orange-50 text-orange-700' :
                                  'bg-pink-50 text-pink-700'
                                }`}>
                                  {item.type === 'summary' ? 'Tóm tắt' :
                                   item.type === 'translate' ? 'Dịch thuật' :
                                   item.type === 'keypoints' ? 'Điểm chính' :
                                   item.type === 'title-generator' ? 'Tiêu đề' :
                                   'Đơn giản hóa'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {item.originalText.substring(0, 80)}...
                          </p>
                        </div>
                      ))
                    )}
                    {history.length > 10 && (
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        Xem tất cả
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Đăng nhập để được:
                      </p>
                      <div className="space-y-2 text-xs text-left">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Lưu lịch sử sử dụng</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Tăng từ 3 → 5 lượt/ngày</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Quản lý profile cá nhân</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Ưu tiên hỗ trợ</span>
                        </div>
                      </div>
                    </div>
                    <SignInButton mode="modal">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Đăng nhập miễn phí
                      </Button>
                    </SignInButton>
                    <button
                      onClick={() => setShowQuotaModal(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors text-sm"
                    >
                      🚀 Nâng cấp Pro (Không giới hạn)
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Panel - Only for logged-in users */}
            {user && usageInfo && (
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    Thống kê tuần này
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {(usageInfo.dailyLimit || 5) - usageInfo.remainingUses}
                      </div>
                      <div className="text-xs text-gray-500">Đã sử dụng hôm nay</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {usageInfo.remainingUses}
                      </div>
                      <div className="text-xs text-gray-500">Còn lại hôm nay</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {history.length}
                      </div>
                      <div className="text-xs text-gray-500">Lịch sử</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm">
                      <div className="text-2xl font-bold text-orange-600 mb-1">7</div>
                      <div className="text-xs text-gray-500">Ngày streak</div>
                    </div>
                  </div>
                  
                  {usageInfo.subscription === 'Free' ? (
                    <Button 
                      onClick={() => setShowQuotaModal(true)}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Nâng cấp Pro
                    </Button>
                  ) : (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-green-200">
                      <div className="flex items-center text-green-700">
                        <Crown className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Đang dùng gói Pro</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Quota Modal */}
      {showQuotaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {!user ? 'Đã hết lượt dùng thử!' : 'Đã hết quota hôm nay!'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {!user 
                  ? 'Đăng nhập để được thêm 2 lượt sử dụng miễn phí mỗi ngày, hoặc nâng cấp Pro để không giới hạn.'
                  : 'Nâng cấp lên gói Pro để sử dụng không giới hạn các tính năng AI.'
                }
              </p>
              
              <div className="space-y-3">
                {!user && (
                  <SignInButton mode="modal">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Đăng nhập miễn phí (+2 lượt)
                    </button>
                  </SignInButton>
                )}
                
                <button 
                  onClick={() => window.open('/pricing', '_blank')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  🚀 Nâng cấp Pro - Không giới hạn
                </button>
                
                <button
                  onClick={() => setShowQuotaModal(false)}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Để sau
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-400 border-t pt-4">
                {!user ? (
                  'Quota sẽ reset vào 00:00 (GMT+7) mỗi ngày'
                ) : (
                  'Hoặc đến ngày mai để quota được làm mới'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
