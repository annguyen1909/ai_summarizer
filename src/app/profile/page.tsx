"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton, UserProfile } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Crown, 
  User, 
  Calendar,
  Settings,
  LogOut
} from "lucide-react";

interface UserSubscription {
  plan: 'Free' | 'Pro' | 'Trial';
  subscriptionExpiry?: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription>({ plan: 'Free' });
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Load user subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        try {
          const response = await fetch('/api/user/subscription');
          if (response.ok) {
            const data = await response.json();
            setSubscription(data);
          }
        } catch (error) {
          console.error('Error loading subscription:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isLoaded && user) {
      loadSubscription();
    }
  }, [user, isLoaded]);

  const handlePayment = (method: 'momo' | 'zalopay') => {
    // Redirect to pricing page with payment method
    router.push(`/pricing?method=${method}`);
  };

  const handleManageAccount = () => {
    // Open Clerk's user management modal
    setShowUserProfile(true);
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              🤖 AI Tóm tắt
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {user.fullName || user.firstName || 'Người dùng'}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User Info Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Thông tin tài khoản
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tên hiển thị</span>
                    <span className="text-sm font-medium">{user.fullName || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm font-medium">{user.primaryEmailAddress?.emailAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ngày tham gia</span>
                    <span className="text-sm font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Gói hiện tại
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={subscription.plan === 'Pro' ? 'default' : 'outline'}
                      className={subscription.plan === 'Pro' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                      {subscription.plan === 'Pro' ? (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Pro
                        </div>
                      ) : (
                        subscription.plan === 'Trial' ? 'Dùng thử' : 'Miễn phí'
                      )}
                    </Badge>
                  </div>
                  
                  {subscription.plan === 'Pro' && subscription.subscriptionExpiry && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Hết hạn: {new Date(subscription.subscriptionExpiry).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                  
                  {subscription.plan === 'Free' && (
                    <p className="text-sm text-gray-600">
                      Nâng cấp lên Pro để sử dụng không giới hạn
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Thao tác</h3>
                
                {/* Upgrade buttons for free users */}
                {subscription.plan === 'Free' && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                      onClick={() => handlePayment('momo')}
                    >
                      💳 Nâng cấp bằng MoMo
                    </Button>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handlePayment('zalopay')}
                    >
                      💰 Nâng cấp bằng ZaloPay
                    </Button>
                  </div>
                )}

                {/* Account Management */}
                <Button 
                  variant="outline" 
                  className="w-full flex items-center gap-2"
                  onClick={handleManageAccount}
                >
                  <Settings className="w-4 h-4" />
                  Quản lý tài khoản
                </Button>

                {/* Sign Out */}
                <SignOutButton>
                  <Button 
                    variant="destructive" 
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </Button>
                </SignOutButton>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Cần hỗ trợ? {' '}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Liên hệ với chúng tôi
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-opacity-95 flex items-center justify-center z-50 p-4">
          <div className="bg-transparent rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative shadow-2xl border">
            <button
              onClick={() => setShowUserProfile(false)}
              className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <UserProfile 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 bg-white"
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
