/**
 * @module AishaOrb
 * @description Cyan/indigo HUD-glow orb (matches the aisha-core palette).
 * Pulses while listening, slowly rotates hue while thinking, animates while
 * speaking. Colors and keyframes live in aisha-immersive.css (.aisha-mini-orb,
 * .aisha-pulse/.aisha-rotate/.aisha-wave/.aisha-fade/.aisha-shake).
 */

import { useMemo } from 'react';
import type { AishaStatus } from '@/aisha/store';
import './aisha-immersive.css';

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
      style={{ width: size, height: size }}
      className={`aisha-mini-orb ${animation}`}
    />
  );
}
