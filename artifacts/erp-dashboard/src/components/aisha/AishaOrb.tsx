/**
 * @module AishaOrb
 * @description Minimal indigo-gradient orb. Pulses while listening, slowly
 * rotates while thinking, animates while speaking. No dark-HUD chrome.
 */

import { useMemo } from 'react';
import type { AishaStatus } from '@/aisha/store';

interface Props { status: AishaStatus; size?: number }

export function AishaOrb({ status, size = 64 }: Props) {
  const animation = useMemo(() => {
    switch (status) {
      case 'listening': return 'aisha-pulse';
      case 'thinking':  return 'aisha-rotate';
      case 'speaking':  return 'aisha-wave';
      case 'muted':     return 'aisha-fade';
      case 'error':     return 'aisha-shake';
      default:          return '';
    }
  }, [status]);

  return (
    <div
      role="img"
      aria-label={`Aisha ${status}`}
      data-status={status}
      style={{
        width:       size,
        height:      size,
        borderRadius: '50%',
        background:  'linear-gradient(135deg, #818cf8 0%, #4f46e5 50%, #312e81 100%)',
        boxShadow:   status === 'idle' ? '0 4px 12px rgba(79,70,229,.18)' : '0 6px 20px rgba(79,70,229,.35)',
        transition:  'box-shadow .2s ease, opacity .2s ease',
        opacity:     status === 'muted' ? 0.5 : 1,
      }}
      className={animation}
    />
  );
}
