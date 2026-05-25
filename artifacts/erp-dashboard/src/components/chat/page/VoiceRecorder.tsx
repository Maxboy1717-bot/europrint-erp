/**
 * @module VoiceRecorder
 * @description React UI component.
 */

import { useEffect, useState, useRef } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Props {
  onSend: (blob: Blob, durationSec: number, waveform: number[]) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: Props) {
  const { t } = useTranslation("common");
  const [isRecording, setIsRecording] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ensure the duration interval is cleared if the component unmounts while recording.
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      setWaveform([]);

      recorder.ondataavailable = (e) => { chunksRef.current.push(e.data); };

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        if (!isRecording && recorder.state !== 'recording') return;
        analyser.getByteFrequencyData(data);
        const peak = Math.max(...Array.from(data));
        setWaveform((prev) => (prev.length < 200 ? [...prev, peak] : prev));
      };

      recorder.start(100);
      setIsRecording(true);
      intervalRef.current = setInterval(() => {
        tick();
        setDurationSec((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.warn('Voice recording failed:', err);
      onCancel();
    }
  };

  const stop = (send: boolean) => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRecording(false);
    recorder.onstop = () => {
      if (send) {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onSend(blob, durationSec, waveform);
      } else {
        onCancel();
      }
      recorder.stream.getTracks().forEach((t) => t.stop());
    };
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
      {!isRecording ? (
        <Button size="sm" onClick={start}><Mic className="h-4 w-4 mr-1" /> {t("yozish")}</Button>
      ) : (
        <>
          <Button size="sm" variant="destructive" onClick={() => stop(false)} aria-label={t("cancel")}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center gap-1">
            <Square className="h-3 w-3 text-[var(--ep-red)] animate-pulse" />
            <span className="text-xs">{durationSec}s</span>
            <div className="flex-1 flex items-end gap-0.5 h-6 ml-2">
              {waveform.slice(-40).map((v, i) => (
                <div key={i} className="w-1 bg-primary rounded" style={{ height: `${(v / 255) * 100}%` }} />
              ))}
            </div>
          </div>
          <Button size="sm" onClick={() => stop(true)} aria-label={t("submitBtn")}>
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
