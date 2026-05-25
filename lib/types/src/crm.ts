/**
 * @module @workspace/types/crm
 * @description Canonical CRM types — Deal, Lead, Contact, Company.
 */

export interface Deal {
  id: number | string;
  title: string;
  amount?: number | null;
  currency?: string | null;
  stage_id?: number | string | null;
  stage?: string | null;
  status?: 'open' | 'won' | 'lost' | string;
  customer_id?: number | string | null;
  customer_name?: string | null;
  owner_id?: number | string | null;
  probability?: number | null;
  expected_close_date?: string | Date | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export interface Lead {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  stage?: string | null;
  status?: 'new' | 'qualified' | 'converted' | 'lost' | string;
  score?: number | null;
  owner_id?: number | string | null;
  created_at?: string | Date | null;
}

export interface Contact {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company_id?: number | string | null;
  position?: string | null;
  is_primary?: boolean;
  created_at?: string | Date | null;
}

export interface Company {
  id: number | string;
  name: string;
  legal_name?: string | null;
  inn?: string | null;
  industry?: string | null;
  website?: string | null;
  size?: string | null;
  is_active?: boolean;
}
