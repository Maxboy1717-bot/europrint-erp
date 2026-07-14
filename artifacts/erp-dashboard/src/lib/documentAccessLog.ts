/**
 * @module documentAccessLog
 * @description Fire-and-forget client logger for FE-observable document access (STEP 3.3,
 * decision #6/#7). Best-effort: it NEVER blocks or throws — copy must keep working even if the
 * log call fails. Server resolves the sensitivity tier + identity; we only send type/id/action.
 * Backend endpoint whitelists action to view|copy (print/export are logged server-side).
 */

import { apiRequest } from '@/lib/queryClient';

export function logDocumentAccess(
  documentType: string,
  documentId: string | number,
  action: 'view' | 'copy',
): void {
  if (!documentId) return;
  void apiRequest('POST', '/api/document-access/log', { documentType, documentId, action }).catch(() => {
    /* best-effort — swallow */
  });
}
