/**
 * @module AiCrmPageTypes
 * @description Types and interfaces for AiCrmPage.
 */

export interface Deal {
  id: number;
  title: string;
  amount?: number;
  stage?: string;
  probability?: number;
  assignedTo?: string;
}

export interface Contact {
  id: number;
  name: string;
  email?: string;
  company?: string;
  lastActivity?: string;
}

export interface AiScore {
  score?: number;
  probability?: number;
  risk?: string;
  reasoning?: string;
  recommendation?: string;
  nextAction?: string;
  template?: string;
  subject?: string;
}
