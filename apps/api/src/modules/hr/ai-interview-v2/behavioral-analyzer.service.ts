// NOTE: RULE4_EXCEPTION — raw SQL retained: interview session tables are created
// by migration scripts and have no Drizzle schema definitions; conditional
// JSON aggregation patterns not expressible via Drizzle builder API.
/**
 * @module behavioral-analyzer.service
 * @description Server-side analysis of candidate video/audio frames.
 *   Pipeline:
 *     1. Browser captures video frame every 2s, sends base64 PNG via WS
 *     2. We forward to Gemini Vision API with prompt asking for emotion + posture
 *     3. Audio chunks analyzed for sentiment (Gemini multi-modal)
 *     4. Result persisted to ai_behavioral_scores
 *
 *   Used by AIInterviewLive + summarized into the post-interview PDF report.
 *
 * @layer Service (HR)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ok, Err, Result, AppErr, safeCall } from '@common/result';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';

export interface BehavioralFrame {
  sessionId: string;
  candidateId: number;
  imageBase64: string;   // PNG snapshot of the candidate's webcam
  audioBase64?: string;  // optional audio chunk (PCM/WAV)
}

export interface BehavioralResult {
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'nervous' | 'confident' | 'unknown';
  emotionConfidence: number;
  postureScore: number;       // 0-1, higher = better upright posture
  attentionScore: number;     // 0-1, higher = more focused on screen
  audioSentiment?: 'positive' | 'neutral' | 'negative';
  audioConfidence?: number;
  notes: string;
}

const SYSTEM_PROMPT = `You analyze candidate behavior during a job interview frame.
Return STRICT JSON only with this shape:
{
  "emotion": "neutral|happy|sad|angry|nervous|confident|unknown",
  "emotionConfidence": 0.0-1.0,
  "postureScore": 0.0-1.0,
  "attentionScore": 0.0-1.0,
  "notes": "1-2 sentences in Uzbek"
}
Be lenient — interviewing candidates are usually slightly nervous.`;

@Injectable()
export class BehavioralAnalyzerService {
  private readonly logger = new Logger(BehavioralAnalyzerService.name);
  private gemini: GoogleGenerativeAI | null = null;

  constructor(private readonly cfg: ConfigService) {}

  onModuleInit() {
    const key = this.cfg.get<string>('AI_INTEGRATIONS_GEMINI_API_KEY');
    if (key) {
      this.gemini = new GoogleGenerativeAI(key);
      this.logger.log('Gemini Vision initialized for behavioral analysis');
    } else {
      this.logger.warn('AI_INTEGRATIONS_GEMINI_API_KEY missing — behavioral analyzer disabled');
    }
  }

  async analyzeFrame(frame: BehavioralFrame): Promise<Result<BehavioralResult>> {
    return safeCall(async () => {
      if (!this.gemini) {
        // Graceful fallback when API key missing
        const fallback: BehavioralResult = {
          emotion: 'unknown', emotionConfidence: 0,
          postureScore: 0.5, attentionScore: 0.5,
          notes: 'AI tahlil ishlamayapti (API key yo\'q)',
        };
        await this.persist(frame, fallback);
        return fallback;
      }
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { inlineData: { mimeType: 'image/png', data: frame.imageBase64 } },
      ]);
      const text = result.response.text();
      const parsed = this.parseJson(text);
      await this.persist(frame, parsed);
      return parsed;
    }, 'EXTERNAL_SERVICE');
  }

  private parseJson(raw: string): BehavioralResult {
    const cleanedJson = raw.replace(/```json\s*|\s*```/g, '').trim();
    try {
      const obj = JSON.parse(cleanedJson) as Partial<BehavioralResult>;
      return {
        emotion: (obj.emotion ?? 'unknown') as BehavioralResult['emotion'],
        emotionConfidence: typeof obj.emotionConfidence === 'number' ? obj.emotionConfidence : 0,
        postureScore: typeof obj.postureScore === 'number' ? obj.postureScore : 0.5,
        attentionScore: typeof obj.attentionScore === 'number' ? obj.attentionScore : 0.5,
        notes: typeof obj.notes === 'string' ? obj.notes : '',
      };
    } catch {
      return { emotion: 'unknown', emotionConfidence: 0, postureScore: 0.5, attentionScore: 0.5, notes: 'JSON parse failed' };
    }
  }

  private async persist(frame: BehavioralFrame, r: BehavioralResult): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO ai_behavioral_scores
          (candidate_id, session_id, emotion, emotion_confidence,
           posture_score, attention_score, audio_sentiment, audio_confidence, notes)
        VALUES
          (${frame.candidateId}, ${frame.sessionId}, ${r.emotion}, ${r.emotionConfidence},
           ${r.postureScore}, ${r.attentionScore}, ${r.audioSentiment ?? null},
           ${r.audioConfidence ?? null}, ${r.notes})
      `);
    } catch (err) {
      this.logger.warn(`Failed to persist behavioral score: ${String(err)}`);
    }
  }

  async summarizeSession(sessionId: string): Promise<Result<{
    frameCount: number;
    dominantEmotion: string;
    avgPosture: number;
    avgAttention: number;
    confidenceLabel: 'low' | 'medium' | 'high';
  }>> {
    return safeCall(async () => {
      const rows = await db.execute(sql`
        SELECT
          emotion,
          AVG(posture_score)::float AS avg_posture,
          AVG(attention_score)::float AS avg_attention,
          COUNT(*) AS cnt
        FROM ai_behavioral_scores
        WHERE session_id = ${sessionId}
        GROUP BY emotion
        ORDER BY cnt DESC
      `);
      const data = (rows as unknown as { rows: Array<{
        emotion: string; avg_posture: number; avg_attention: number; cnt: number;
      }> }).rows;
      const total = data.reduce((s, d) => s + d.cnt, 0);
      const dominant = data[0]?.emotion ?? 'unknown';
      const avgPosture = total ? data.reduce((s, d) => s + d.avg_posture * d.cnt, 0) / total : 0.5;
      const avgAttention = total ? data.reduce((s, d) => s + d.avg_attention * d.cnt, 0) / total : 0.5;
      const overall = (avgPosture + avgAttention) / 2;
      const confidenceLabel = overall < 0.4 ? 'low' : overall < 0.7 ? 'medium' : 'high';
      return { frameCount: total, dominantEmotion: dominant, avgPosture, avgAttention, confidenceLabel };
    }, 'DB_ERROR');
  }
}
