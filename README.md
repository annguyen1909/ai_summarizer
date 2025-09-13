# Vietnam Summarizer - AI Vietnamese Text Summarization Tool

A comprehensive web application for Vietnamese text and URL summarization using OpenAI GPT, built with Next.js 14, Clerk Authentication, and enhanced security features.

## 🚀 Features

- **AI-Powered Summarization**: Vietnamese text and URL content summarization using OpenAI GPT-3.5
- **Secure Authentication**: Clerk integration with Google login following latest best practices
- **Two-Tier Subscription**: Free (5 daily requests) and Pro (300 monthly requests) plans
- **Payment Integration**: MoMo and ZaloPay sandbox payment processing
- **Redis Caching**: Efficient summary caching with Upstash Redis
- **Anti-Abuse Protection**: hCaptcha for free users, rate limiting, input validation
- **Usage Tracking**: Comprehensive logging and quota management
- **Mobile-First Design**: Responsive UI with TailwindCSS and shadcn/ui

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Authentication**: Clerk with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Caching**: Upstash Redis
- **AI**: OpenAI GPT-3.5 Turbo
- **Payments**: MoMo & ZaloPay (Vietnam)
- **Security**: hCaptcha, Rate limiting, Input validation

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration (REQUIRED)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Redis/Upstash Configuration (REQUIRED)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# hCaptcha Configuration (REQUIRED)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRO_PLAN_PRICE=50000
FREE_DAILY_LIMIT=5
PRO_MONTHLY_LIMIT=300
FREE_MAX_INPUT_LENGTH=2000
```

### 3. Clerk Setup (IMPORTANT)

This project follows the **current Clerk best practices** for Next.js App Router:

1. **Create Clerk Application**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Enable Google OAuth provider
   - Copy your publishable key and secret key

2. **The project uses**:
   - `clerkMiddleware()` from `@clerk/nextjs/server` (NOT the deprecated `authMiddleware`)
   - `<ClerkProvider>` in app/layout.tsx
   - Protected routes via middleware.ts
   - Server-side auth with `auth()` from `@clerk/nextjs/server`

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔐 Authentication Implementation

The Clerk integration follows current best practices:

### Middleware (middleware.ts)
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/summarize(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### API Protection
```typescript
// app/api/summarize/route.ts
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

## 🛡 Security Features

- **Rate Limiting**: Per-user quotas with Redis tracking
- **Input Validation**: Length limits and content sanitization  
- **Anti-Abuse**: hCaptcha for free users
- **Authentication**: Secure Clerk-based auth with middleware protection
- **Caching**: Redis-based summary caching for performance

## 🎯 Usage Flow

1. **Authentication**: Users sign up/login via Clerk with Google OAuth
2. **Free Plan**: 5 daily summarizations with hCaptcha verification
3. **Pro Plan**: 300 monthly summarizations without captcha
4. **Input Methods**: Direct text paste or URL content extraction
5. **Caching**: Identical content served from Redis cache without counting usage

## 📝 License

MIT License
