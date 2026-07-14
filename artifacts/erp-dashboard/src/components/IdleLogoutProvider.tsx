/**
 * @module IdleLogoutProvider
 * @description P2-5 auto-logout (decision #9). Logs the user out after a period of INACTIVITY,
 * with the timeout tightening by the sensitivity of what they're viewing: oddiy 30 min, maxfiy
 * 20, juda-maxfiy 15 (thresholds come from business_settings via /api/document-access/idle-
 * thresholds — never hardcoded). Activity (mouse/keyboard/scroll/touch) resets the timer via a
 * ref; a 15 s interval checks the elapsed idle time and calls logout()+redirect when exceeded.
 * Document editors/viewers call useSetIdleTier(tier) to raise the sensitivity while mounted.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export interface IdleThresholds { oddiyMin: number; maxfiyMin: number; judaMaxfiyMin: number }
const DEFAULTS: IdleThresholds = { oddiyMin: 30, maxfiyMin: 20, judaMaxfiyMin: 15 };

/** Pure, testable: idle timeout in ms for a document sensitivity tier. */
export function idleTimeoutMs(tier: string, t: IdleThresholds): number {
  const min = tier === 'juda-maxfiy' ? t.judaMaxfiyMin : tier === 'maxfiy' ? t.maxfiyMin : t.oddiyMin;
  return Math.max(1, min) * 60_000;
}

const IdleTierContext = createContext<(tier: string) => void>(() => {});

/** Raise the idle sensitivity tier while a sensitive document is on screen (resets on unmount). */
export function useSetIdleTier(tier: string | null | undefined): void {
  const setTier = useContext(IdleTierContext);
  useEffect(() => {
    setTier(tier ?? 'oddiy');
    return () => setTier('oddiy');
  }, [tier, setTier]);
}

export function IdleLogoutProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTier, setActiveTier] = useState('oddiy');
  const lastActivity = useRef<number>(Date.now());

  const { data: thresholds } = useQuery<IdleThresholds>({
    queryKey: ['/api/document-access/idle-thresholds'],
    queryFn: () => apiRequest<IdleThresholds>('GET', '/api/document-access/idle-thresholds'),
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });

  // Reset the idle clock on any real user activity.
  useEffect(() => {
    if (!isAuthenticated) return;
    const mark = () => { lastActivity.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, [isAuthenticated]);

  // Poll elapsed idle time; log out + redirect when the tier's timeout is exceeded.
  useEffect(() => {
    if (!isAuthenticated) return;
    lastActivity.current = Date.now(); // fresh window on (re)auth / tier change
    const timeoutMs = idleTimeoutMs(activeTier, thresholds ?? DEFAULTS);
    const iv = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= timeoutMs) {
        window.clearInterval(iv);
        void logout().finally(() => navigate('/login'));
      }
    }, 15_000);
    return () => window.clearInterval(iv);
  }, [isAuthenticated, activeTier, thresholds, logout, navigate]);

  const setTier = useCallback((tier: string) => setActiveTier(tier), []);
  return <IdleTierContext.Provider value={setTier}>{children}</IdleTierContext.Provider>;
}
