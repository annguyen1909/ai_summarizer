// Simple in-memory storage for development (same as history API)
// This should be replaced with Supabase in production

// Reuse the same storage maps from the history API
declare global {
  var historySummaries: Map<string, any> | undefined;
  var historyUserSummaries: Map<string, string[]> | undefined;
}

const summaries = globalThis.historySummaries ?? new Map();
const userSummaries = globalThis.historyUserSummaries ?? new Map();

if (process.env.NODE_ENV !== 'production') {
  globalThis.historySummaries = summaries;
  globalThis.historyUserSummaries = userSummaries;
}

// Helper function to generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

interface HistoryItem {
  type: 'summary' | 'translate' | 'keypoints' | 'title-generator' | 'simplify';
  originalText: string;
  result: string;
  metadata?: {
    summaryMode?: string;
    source?: string;
    sourceUrl?: string;
    [key: string]: any;
  };
}

export async function saveToHistory(userId: string, item: HistoryItem) {
  try {
    const historyId = generateId();
    const historyRecord = {
      id: historyId,
      user_id: userId,
      type: item.type,
      original_text: item.originalText,
      result: item.result,
      metadata: item.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in summaries map (reusing the same structure)
    summaries.set(historyId, historyRecord);

    // Add to user's history list
    const userHistoryIds = userSummaries.get(userId) || [];
    userHistoryIds.unshift(historyId); // Add to beginning for newest first
    
    // Keep only last 100 items per user
    if (userHistoryIds.length > 100) {
      const removedId = userHistoryIds.pop();
      if (removedId) {
        summaries.delete(removedId);
      }
    }
    
    userSummaries.set(userId, userHistoryIds);

    return { success: true, id: historyId };
  } catch (error) {
    console.error('Failed to save to history:', error);
    return { success: false, error };
  }
}

export async function getUserHistory(userId: string, limit = 50) {
  try {
    const userHistoryIds = userSummaries.get(userId) || [];
    const userHistoryData = userHistoryIds
      .slice(0, limit)
      .map((id: string) => summaries.get(id))
      .filter(Boolean)
      .map((item: any) => ({
        id: item.id,
        type: item.type,
        originalText: item.original_text,
        result: item.result,
        createdAt: item.created_at,
        metadata: item.metadata
      }));

    return { success: true, history: userHistoryData };
  } catch (error) {
    console.error('Failed to get user history:', error);
    return { success: false, error, history: [] };
  }
}