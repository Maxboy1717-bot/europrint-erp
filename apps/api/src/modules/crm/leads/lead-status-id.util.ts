/**
 * @module lead-status-id.util
 * @description Maps the app's fine-grained lead lifecycle status
 * (new/contacted/qualified/proposal/negotiation/converted/lost) onto the live
 * crm_leads.status_id CHECK domain (Bitrix coarse state: NEW/IN_PROCESS/CONVERTED/JUNK).
 *
 * The lifecycle code itself is persisted verbatim in status_description; status_id only
 * ever holds one of the four coarse values. Writing the lifecycle straight into status_id
 * (e.g. getStatus().toUpperCase() -> 'QUALIFIED') violates crm_leads_status_id_chk and 500s.
 */
export type BitrixLeadStatusId = 'NEW' | 'IN_PROCESS' | 'CONVERTED' | 'JUNK';

export function toBitrixStatusId(lifecycle: string | null | undefined): BitrixLeadStatusId {
  switch (String(lifecycle ?? '').toLowerCase()) {
    case 'new':         return 'NEW';
    case 'converted':
    case 'won':         return 'CONVERTED';
    case 'lost':        return 'JUNK';
    // Board kanban fine stages (LEAD_STAGES) + legacy lifecycle codes → coarse IN_PROCESS.
    case 'in_progress':
    case 'analysis':
    case 'final':
    case 'contacted':
    case 'qualified':
    case 'proposal':
    case 'negotiation': return 'IN_PROCESS';
    default:            return 'NEW';
  }
}
