/**
 * @module AIInterviewLive
 * @description Live AI interview page for candidates. Opens via token link
 *   (24h). Establishes WebSocket connection to GeminiLiveGateway, requests
 *   camera + mic, streams audio to Gemini, plays Gemini's audio reply,
 *   displays running transcript.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import { io, type Socket } from 'socket.io-client';

import { tLabel } from "@/lib/i18n/tLabel";
type Phase = 'init' | 'connecting' | 'live' | 'ended' | 'error';

export default function AIInterviewLive() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params.tokenId ?? '';

  const [phase, setPhase] = useState<Phase>('init');
  const [error, setError] = useState<string>('');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [micActive, setMicActive] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

  // ── Connect WS + permissions ─────────────────────────────────────────
  async function start() {
    setPhase('connecting');
    setError('');
    try {
      // 1. Camera + mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setMicActive(true);

      // 2. Connect WS to GeminiLiveGateway
      const wsBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
      const socket = io(`${wsBase}/ai-interview-live`, { transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => socket.emit('start', { tokenId }));
      socket.on('message', (msg: { type: string; data?: string; message?: string }) => {
        if (msg.type === 'ready') {
          setPhase('live');
        } else if (msg.type === 'transcript' && msg.data) {
          setTranscript(prev => [...prev, msg.data ?? '']);
        } else if (msg.type === 'text' && msg.data) {
          setTranscript(prev => [...prev, `🤖 ${msg.data}`]);
        } else if (msg.type === 'error') {
          setError(msg.message ?? 'Xato yuz berdi');
          setPhase('error');
        }
      });
      socket.on('disconnect', () => { if (phase !== 'ended') setPhase('ended'); });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }

  async function stop() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    socketRef.current?.emit('message', { type: 'end' });
    socketRef.current?.disconnect();
    socketRef.current = null;
    if (audioCtxRef.current) { await audioCtxRef.current.close(); audioCtxRef.current = null; }
    audioWorkletRef.current?.disconnect();
    setPhase('ended');
    setMicActive(false);
  }

  useEffect(() => {
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
    }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <h1 style={{ textAlign: 'center', fontSize: 24, marginBottom: 8 }}>
          🤖 EuroPrint AI Intervyu
        </h1>

        {phase === 'init' && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: '#94a3b8', marginBottom: 20 }}>
              Tugmani bosishingiz bilan kamera va mikrofon so'raladi.
            </p>
            <button
              onClick={() => void start()}
              style={{
                background: '#22c55e', color: '#0a0a0a',
                padding: '14px 28px', borderRadius: 10, fontWeight: 700,
                border: 0, cursor: 'pointer', fontSize: 16,
              }}
            >
              ▶ Intervyuni boshlash
            </button>
          </div>
        )}

        {(phase === 'connecting' || phase === 'live') && (
          <>
            <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', height: 360 }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: phase === 'live' ? '#22c55e' : '#f59e0b',
                color: '#000', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              }}>
                {phase === 'live' ? '🔴 LIVE' : 'Ulanmoqda...'}
              </div>
              {micActive && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: '#1f2937', padding: '4px 10px', borderRadius: 999, fontSize: 12,
                }}>
                  🎤 Mikrofon yoniq
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, maxHeight: 200, overflowY: 'auto', background: '#1f2937', padding: 16, borderRadius: 8 }}>
              {transcript.length === 0
                ? <p style={{ color: '#94a3b8', fontSize: 13 }}>{tLabel('common.suhbatTranscriptiShuYerdaPaydoBoladi', "Suhbat transcripti shu yerda paydo bo'ladi...")}</p>
                : transcript.map((line, i) => (
                    <div key={i} style={{ marginBottom: 6, fontSize: 13 }}>{line}</div>
                  ))
              }
            </div>

            <button
              onClick={() => void stop()}
              style={{
                marginTop: 20, width: '100%',
                background: '#ef4444', color: '#fff',
                padding: 12, borderRadius: 8, fontWeight: 600,
                border: 0, cursor: 'pointer',
              }}
            >
              ⏹ Intervyuni yakunlash
            </button>
          </>
        )}

        {phase === 'ended' && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ marginBottom: 8 }}>{tLabel('common.intervyuTugatildi', "Intervyu tugatildi")}</h2>
            <p style={{ color: '#94a3b8' }}>{tLabel('common.natijalarHrMenejerigaYuborildi48SoatIchi', "Natijalar HR menejeriga yuborildi. 48 soat ichida javob olasiz.")}</p>
          </div>
        )}

        {phase === 'error' && (
          <div style={{ background: '#7f1d1d', padding: 20, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠</div>
            <p>{error}</p>
            <button onClick={() => setPhase('init')} style={{
              marginTop: 16, background: '#fff', color: '#000', padding: '8px 16px', borderRadius: 6, border: 0, cursor: 'pointer',
            }}>{tLabel('common.qaytaUrinish', "Qayta urinish")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
