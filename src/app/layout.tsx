import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { UserSync } from "@/components/UserSync";
import { AuthRedirect } from "@/components/AuthRedirect";
import { Footer } from "@/components/Footer";
import { clerkVietnameseLocalization } from "@/lib/clerk-localization";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "AI Tóm tắt - Công cụ AI cho người Việt",
  description: "AI Tóm tắt, Dịch nhanh, Keypoints, Tiêu đề AI - Công cụ AI đa năng cho sinh viên và nhân viên văn phòng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={clerkVietnameseLocalization}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      appearance={{
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorInputBackground: '#ffffff',
          colorInputText: '#1f2937',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          fontFamily: '"Inter", system-ui, sans-serif',
          borderRadius: '8px',
          fontSize: '14px',
        },
        elements: {
          card: {
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            margin: '0 auto',
          },
          headerTitle: {
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
          },
          headerSubtitle: {
            fontSize: '14px',
            textAlign: 'center',
            color: '#6b7280',
            marginBottom: '24px',
          },
          formButtonPrimary: {
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
          },
          socialButtonsBlockButton: {
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
          },
        },
      }}
    >
      <html lang="vi" className={`${inter.variable}`}>
        <body className="font-inter bg-white">
          <UserSync />
          <AuthRedirect />
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <Footer variant="dark" />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}