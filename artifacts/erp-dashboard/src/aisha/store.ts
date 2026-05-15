/**
 * @module aisha/store
 * @description Zustand store for the AishaPanel state machine and last
 * response (used by TransparencyPanel).
 */

import { create } from 'zustand';

export type AishaStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted' | 'error';

export interface CommandHistoryEntry {
  id:        string;
  transcript: string;
  at:        number;
}

export interface ProvenanceSourceUI {
  type:       string;
  identifier: string;
  queriedAt:  string;
  latencyMs:  number;
  freshness:  string;
  rowCount?:  number;
}

export interface CameraSnapshotUI {
  cameraId:    string;
  cameraName:  string;
  snapshotUrl: string;
  capturedAt:  string;
}

export interface AishaResponse {
  text:    string;
  provenance: {
    sources:         ProvenanceSourceUI[];
    confidence:      number;
    citations:       Array<{ label: string; url?: string; snippet?: string }>;
    cameraSnapshots?: CameraSnapshotUI[];
  };
}

interface AishaState {
  status:       AishaStatus;
  muted:        boolean;
  history:      CommandHistoryEntry[];
  lastResponse: AishaResponse | null;

  setStatus(s: AishaStatus): void;
  toggleMute(): void;
  pushCommand(transcript: string): void;
  setResponse(r: AishaResponse): void;
}

export const useAishaStore = create<AishaState>((set) => ({
  status:       'idle',
  muted:        false,
  history:      [],
  lastResponse: null,

  setStatus: (s) => set({ status: s }),
  toggleMute: () => set((st) => ({
    muted: !st.muted,
    status: !st.muted ? 'muted' : 'idle',
  })),
  pushCommand: (transcript) => set((st) => ({
    history: [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, transcript, at: Date.now() },
      ...st.history,
    ].slice(0, 5),
  })),
  setResponse: (r) => set({ lastResponse: r }),
}));
