import { Redis } from '@upstash/redis';
import * as crypto from 'crypto';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache configuration
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
const CACHE_PREFIX = 'summary:';

export class CacheService {
  /**
   * Generate cache key from input text
   */
  private static generateCacheKey(text: string): string {
    const hash = crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
    return `${CACHE_PREFIX}${hash}`;
  }

  /**
   * Get cached summary
   */
  static async get(text: string): Promise<string | null> {
    try {
      const key = this.generateCacheKey(text);
      const cached = await redis.get(key);
      return cached as string | null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached summary
   */
  static async set(text: string, summary: string): Promise<boolean> {
    try {
      const key = this.generateCacheKey(text);
      await redis.setex(key, CACHE_TTL, summary);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Check if Redis is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      console.error('Redis not available:', error);
      return false;
    }
  }

  /**
   * Clear cache (for admin use)
   */
  static async clearAll(): Promise<boolean> {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache stats
   */
  static async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
  } | null> {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      
      return {
        totalKeys: keys.length,
        memoryUsage: 'Available' // Simplified since Upstash Redis doesn't expose memory info
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}
