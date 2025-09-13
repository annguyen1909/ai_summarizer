// Simple in-memory storage for development (replace with Supabase in production)

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  plan: 'free' | 'premium' | 'pro';
  currentQuota: number;
  totalQuota: number;
  totalUsage: number;
  subscriptionId?: string;
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Summary {
  id: string;
  userId: string;
  type: 'summary' | 'translate' | 'keypoints' | 'title-generator' | 'simplify';
  originalText: string;
  result: string;
  summaryMode?: string; // for summary type
  direction?: string; // for translate type
  level?: string; // for simplify type
  source?: string;
  sourceUrl?: string;
  sourceFilename?: string;
  wordCount?: number;
  isPublic: boolean;
  publicId: string | null;
  shareExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'momo' | 'zalopay' | 'vietqr';
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'completed';
  reward: number;
  createdAt: string;
}

// In-memory storage maps
export const userProfiles = new Map<string, UserProfile>();
export const summaries = new Map<string, Summary>();
export const userSummaries = new Map<string, string[]>(); // Maps userId to array of summary IDs
export const payments = new Map<string, Payment>();
export const referrals = new Map<string, Referral>();

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generatePublicId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Initialize storage with some default data if needed
export function initializeStorage() {
  // This can be used to populate initial data
  console.log('Storage initialized');
}
