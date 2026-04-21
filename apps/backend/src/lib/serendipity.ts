import { v4 as uuid } from 'uuid';

export interface SerendipityConfig {
  enabled: boolean;
  minDaysBeforeSurface: number;
  maxMemoriesPerDay: number;
  surfaceProbability: number;
}

export interface SerendipityScore {
  memoryId: string;
  content: string;
  intent: string;
  sourceChannel: string | null;
  createdAt: string;
  score: number;
  reason: string;
}

const DEFAULT_CONFIG: SerendipityConfig = {
  enabled: true,
  minDaysBeforeSurface: 7,
  maxMemoriesPerDay: 3,
  surfaceProbability: 0.3,
};

class SerendipityEngine {
  private memories: Array<{
    id: string;
    content: string;
    intent: string;
    sourceChannel: string | null;
    createdAt: Date;
    surfacedCount: number;
    lastSurfaced: Date | null;
  }> = [];

  private config: SerendipityConfig = DEFAULT_CONFIG;

  setConfig(config: Partial<SerendipityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  recordMemory(memory: {
    id: string;
    content: string;
    intent: string;
    sourceChannel: string | null;
    createdAt: string;
  }): void {
    this.memories.push({
      ...memory,
      createdAt: new Date(memory.createdAt),
      surfacedCount: 0,
      lastSurfaced: null,
    });

    if (this.memories.length > 1000) {
      this.memories = this.memories.slice(-500);
    }
  }

  getScoreForContext(context: {
    currentTime?: Date;
    recentMemories?: string[];
    userKeywords?: string[];
    hourOfDay?: number;
  }): SerendipityScore[] {
    if (!this.config.enabled) return [];

    const now = context.currentTime || new Date();
    const hourOfDay = context.hourOfDay ?? now.getHours();
    const recentContents = (context.recentMemories || []).map(m => m.toLowerCase());
    const keywords = (context.userKeywords || []).map(k => k.toLowerCase());

    const candidates = this.memories.filter(m => {
      const daysSince = (now.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < this.config.minDaysBeforeSurface) return false;
      if (m.surfacedCount > 2) return false;
      if (this.config.surfaceProbability < 1 && Math.random() > this.config.surfaceProbability) return false;
      return true;
    });

    const scored = candidates.map(memory => {
      let score = 0;
      let reason = '';

      const daysSince = (now.getTime() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(daysSince / 30, 1) * 0.4;

      if (daysSince > 14 && daysSince < 60) {
        score += 0.2;
        reason = 'Memory from a few weeks ago';
      } else if (daysSince >= 60) {
        score += 0.3;
        reason = 'Older memory worth revisiting';
      }

      const contentLower = memory.content.toLowerCase();
      const keywordMatches = keywords.filter(k => contentLower.includes(k));
      if (keywordMatches.length > 0) {
        score += 0.3 * keywordMatches.length;
        reason = reason || `Related to: ${keywordMatches[0]}`;
      }

      const similarMemories = recentContents.filter(r =>
        r.toLowerCase().includes(contentLower.substring(0, 50))
      ).length || 0;
      if (similarMemories === 0) {
        score += 0.15;
        reason = reason || 'Different from recent captures';
      }

      if (hourOfDay >= 9 && hourOfDay <= 11) {
        score += 0.1;
        reason = reason || 'Good time for reflection';
      }

      score = Math.min(score, 1);

      return {
        memoryId: memory.id,
        content: memory.content,
        intent: memory.intent,
        sourceChannel: memory.sourceChannel,
        createdAt: memory.createdAt.toISOString(),
        score,
        reason: reason || 'General reminder',
      };
    });

    return scored
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxMemoriesPerDay);
  }

  markSurfaced(memoryId: string): void {
    const memory = this.memories.find(m => m.id === memoryId);
    if (memory) {
      memory.surfacedCount++;
      memory.lastSurfaced = new Date();
    }
  }

  getStats(): {
    totalMemories: number;
    eligibleForSurfacing: number;
    recentlySurfaced: number;
  } {
    const now = new Date();
    const eligible = this.memories.filter(m => {
      const daysSince = (now.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= this.config.minDaysBeforeSurface && m.surfacedCount <= 2;
    });

    const recentlySurfaced = this.memories.filter(m =>
      m.lastSurfaced && (now.getTime() - m.lastSurfaced.getTime()) < 24 * 60 * 60 * 1000
    );

    return {
      totalMemories: this.memories.length,
      eligibleForSurfacing: eligible.length,
      recentlySurfaced: recentlySurfaced.length,
    };
  }

  clear(): void {
    this.memories = [];
  }
}

export const serendipityEngine = new SerendipityEngine();