/**
 * @module download-block.hook
 * @description Document Control STEP 3.2 — backend-enforced "no download by default" (owner
 * decision #1 + #10). A Fastify `onSend` hook (NOT a Nest interceptor, because most export
 * endpoints use `@Res()` and bypass Nest's response pipeline; onSend fires on every response
 * and can rewrite headers before they flush). Un-bypassable: a direct API call hits the same
 * hook.
 *
 * Policy: any outgoing `Content-Disposition: attachment` is rewritten to `inline` (content
 * still renders in-app / in the browser viewer, but the browser no longer force-downloads a
 * file) UNLESS the route is on the client-facing carve-out allowlist (#8).
 *
 * The allowlisted routes are already `@Roles`-gated at their controllers, so reaching them
 * means the caller was authorized — the hook does not re-check roles, it only preserves the
 * attachment for those sanctioned exits:
 *   - customer invoice / export-invoice PDF        (sd-invoices.controller.ts:101,138)
 *   - commercial proposal / KP PDF                 (sd-quotations.controller.ts:116)
 *   - vendor reconciliation act PDF                (mm-reconciliation.controller.ts)
 *   - the reason+role+audit-gated storage download (storage.controller.ts:202) — the
 *     sanctioned internal export path (it enforces reason + DOWNLOAD_ALLOWED_ROLES itself).
 *
 * Access-event logging (who/what/when) + watermarking are separate steps (3.3, 3.4), not
 * done here — this commit is only the header block + carve-out.
 */

import type { FastifyInstance } from 'fastify';

// Client-facing / sanctioned export routes that MAY keep `attachment`. Matched against
// request.url (global prefix '/api'). Kept as data so the list is easy to review/extend.
const ALLOW_ATTACHMENT_PATTERNS: readonly RegExp[] = [
  /\/sd\/invoices\/[^/]+\/(export-)?pdf(?:$|\?)/i, // customer invoice / export invoice PDF (#8)
  /\/sd\/quotations\/[^/]+\/pdf(?:$|\?)/i, // commercial proposal (KP) PDF (#8)
  /\/mm\/reconciliation\/[^/]+\/pdf(?:$|\?)/i, // vendor reconciliation act PDF (#8)
  /\/storage\/download\//i, // sanctioned reason+role+audit-gated internal download
];

export function configureDownloadBlock(fastify: FastifyInstance): void {
  fastify.addHook('onSend', (request, reply, payload, done) => {
    try {
      const cd = reply.getHeader('content-disposition');
      if (cd && /attachment/i.test(String(cd))) {
        const url = request.url || '';
        const allowed = ALLOW_ATTACHMENT_PATTERNS.some((re) => re.test(url));
        if (!allowed) {
          // Block the default download: force inline so the document is viewable in-app
          // but the browser does not trigger a file "Save As".
          reply.header('content-disposition', String(cd).replace(/attachment/gi, 'inline'));
        }
      }
    } catch {
      // Never break a response over header policy — fail open on the header rewrite only.
    }
    done(null, payload as unknown as string);
  });
}
