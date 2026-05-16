/**
 * @module EventsCalendarTypes
 * @description Shared TypeScript interfaces, Zod schema, and pure helper
 * utilities for the EventsCalendar feature.  No JSX or React imports here.
 */

import { z } from "zod";

import { tLabel } from '@/lib/i18n/tLabel';
// ---------------------------------------------------------------------------
// Badge helper type (re-exported so consumers don't import from shadcn directly)
// ---------------------------------------------------------------------------
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------
export interface CalendarEvent {
  id: string;
  title: string;
  titleRu: string;
  description?: string;
  descriptionRu?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  eventType: string;
  maxParticipants?: number;
  targetDepartments?: string[];
  targetPositions?: string[];
}

export interface Department {
  id: string;
  name: string;
}

export interface Position {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Zod schema + inferred form type
// ---------------------------------------------------------------------------
export const eventFormSchema = z.object({
  title: z.string().min(1, "Sarlavha talab qilinadi"),
  titleRu: z.string().min(1, "Sarlavha (RU) talab qilinadi"),
  description: z.string().optional(),
  descriptionRu: z.string().optional(),
  startDate: z.string().min(1, "Boshlanish sanasi talab qilinadi"),
  startTime: z.string().optional(),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  eventType: z.string().min(1, "Tadbir turi talab qilinadi"),
  maxParticipants: z.number().optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetPositions: z.array(z.string()).optional(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable label and a Badge variant for a given event type
 * key.  Falls back to the "other" entry for unknown types.
 */
export function getEventTypeBadge(type: string): { label: string; variant: BadgeVariant } {
  const types: Record<string, { label: string; variant: BadgeVariant }> = {
    training:   { label: tLabel('common.EventsCalendar.trening', "Trening"),       variant: "default"   },
    meeting:    { label: "Yig'ilish",     variant: "secondary" },
    webinar:    { label: "Vebinar",       variant: "outline"   },
    conference: { label: "Konferensiya",  variant: "default"   },
    other:      { label: "Boshqa",        variant: "secondary" },
  };
  return types[type] ?? types.other;
}
