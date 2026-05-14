/**
 * @module VoiceMessagePlayer
 * @description React UI component.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  isMe: boolean;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Generate fake waveform bars (consistent per URL)
function makeBars(seed: string, count = 30): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return Array.from({ length: count }, (_, i) => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
    const base = Math.abs(h) % 100;
    // make edges shorter for natural look
    const edge = Math.min(i, count - 1 - i) / (count / 4);
    return Math.max(15, Math.min(90, base * Math.min(1, edge)));
  });
}

export function VoiceMessagePlayer({ src, isMe }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const bars = makeBars(src);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      // pause all other audio on the page
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== a) el.pause();
      });
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime  = () => setCurrent(a.currentTime);
    const onLoad  = () => setDuration(isFinite(a.duration) ? a.duration : 0);
    const onEnd   = () => { setPlaying(false); setCurrent(0); if (a) a.currentTime = 0; };
    const onPause = () => setPlaying(false);
    a.addEventListener("timeupdate",  onTime);
    a.addEventListener("loadedmetadata", onLoad);
    a.addEventListener("durationchange", onLoad);
    a.addEventListener("ended",  onEnd);
    a.addEventListener("pause",  onPause);
    return () => {
      a.removeEventListener("timeupdate",  onTime);
      a.removeEventListener("loadedmetadata", onLoad);
      a.removeEventListener("durationchange", onLoad);
      a.removeEventListener("ended",  onEnd);
      a.removeEventListener("pause",  onPause);
    };
  }, []);

  const progress = duration > 0 ? current / duration : 0;

  const outColor    = isMe ? "#4fae4e" : "var(--tg-sidebar-active)";
  const barActive   = isMe ? "#2d8c2d" : "var(--tg-sidebar-active)";
  const barInactive = isMe ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.14)";

  return (
    <div className="flex items-center gap-2.5 min-w-[210px] py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause */}
      <button
        onClick={toggle}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95",
          isMe
            ? "bg-[#4fae4e] hover:bg-[#449c44] text-white shadow-sm"
            : "bg-[var(--tg-sidebar-active)] hover:bg-[var(--tg-sidebar-active)]/90 text-white shadow-sm"
        )}
      >
        {playing
          ? <Pause  className="w-4 h-4 fill-white stroke-white" />
          : <Play   className="w-4 h-4 fill-white stroke-white ml-0.5" />
        }
      </button>

      {/* Waveform + time */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Fake waveform bars (clickable for seek) */}
        <div
          className="flex items-center gap-[2px] h-8 cursor-pointer"
          onClick={(e) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            a.currentTime = ratio * duration;
            setCurrent(a.currentTime);
          }}
        >
          {bars.map((h, i) => {
            const filled = i / bars.length < progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors"
                style={{
                  height: `${h}%`,
                  background: filled ? barActive : barInactive,
                  minWidth: 2,
                }}
              />
            );
          })}
        </div>

        {/* Duration row */}
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3 opacity-50 flex-shrink-0" style={{ color: outColor }} />
          <span className="text-[11px] opacity-60 tabular-nums">
            {playing || current > 0 ? fmt(current) : fmt(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
