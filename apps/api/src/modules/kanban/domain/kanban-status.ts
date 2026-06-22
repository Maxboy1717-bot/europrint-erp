/**
 * @module kanban-status
 * @description Owner-vision canonical Kanban status model (EP-KAN-015 / EP-KAN-027).
 *
 *   The owner's vision: a task board has EXACTLY 4 fixed stages —
 *     Reja (plan) -> Jarayonda (in progress) -> Tekshiruvda (in review) -> Bajarildi (done).
 *
 *   ⚠️ LIVE-MODEL REALITY (verified against the `europrint` DB):
 *   The canonical table `kanban_cards` has NO `status` column. A card's stage is
 *   its `column_id` -> `kanban_columns.name`. Columns are user-named per board.
 *   So the "status" of a card is DERIVED from its column NAME via {@link statusFromColumnName}.
 *   This keeps the working column-based board (drag-drop = move between columns)
 *   intact (Q-39 non-regression) while letting the move endpoint enforce the
 *   assigner-confirm rule for the terminal "Bajarildi" stage.
 *
 *   Assigner-confirm (EP-KAN-027/032): the person who created/assigned a card
 *   confirms its completion. The assignee may move a card INTO "Tekshiruvda"
 *   (asking for confirmation) but may NOT move it to "Bajarildi" — only the
 *   assigner (assigner_user_id, fallback owner) approves Tekshiruvda -> Bajarildi.
 */

/** The 4 fixed canonical stages. Owner vision EP-KAN-015. */
export enum KanbanStatus {
  REJA        = 'reja',        // Reja — plan / backlog / todo
  JARAYONDA   = 'jarayonda',   // Jarayonda — in progress
  TEKSHIRUVDA = 'tekshiruvda', // Tekshiruvda — in review (assignee asks for confirm)
  BAJARILDI   = 'bajarildi',   // Bajarildi — done (assigner confirmed)
}

/** Ordered list of the 4 canonical stages (column order on the board). */
export const KANBAN_STATUS_ORDER: KanbanStatus[] = [
  KanbanStatus.REJA,
  KanbanStatus.JARAYONDA,
  KanbanStatus.TEKSHIRUVDA,
  KanbanStatus.BAJARILDI,
];

/**
 * Accepted aliases (lower-cased substrings) that map an arbitrary column name —
 * or a legacy status code — onto a canonical stage. Includes the legacy
 * TaskStatus enum values (backlog/todo/in_progress/review/done) so live rows and
 * old codes are NOT orphaned, plus Uzbek/Russian column-name variants seen in
 * the templates seed and the FE quick-start (Rejada / Jarayonda / Tekshiruvda /
 * Bajarildi / Yakunlandi / Tasdiqlangan / Qabul qilindi).
 *
 * Matching is substring-based and case-insensitive, evaluated terminal-first
 * (see {@link statusFromColumnName}) so "Bajarildi" wins over "Reja" if both
 * appeared. Order within each list does not matter.
 */
export const STATUS_ALIASES: Record<KanbanStatus, string[]> = {
  [KanbanStatus.BAJARILDI]: [
    'bajarildi', 'done', 'tasdiqlangan', 'yakunlandi', 'qabul qilindi',
    'tugadi', 'tugallangan', 'completed', 'complete',
  ],
  [KanbanStatus.TEKSHIRUVDA]: [
    'tekshiruvda', 'tekshir', 'review', "ko'rib chiqish", 'korib chiqish',
    'tasdiqlash', 'on review', 'in review',
  ],
  [KanbanStatus.JARAYONDA]: [
    'jarayonda', 'jarayon', 'in_progress', 'in progress', 'progress',
    'bajarilmoqda', 'ishlanmoqda', 'doing',
  ],
  [KanbanStatus.REJA]: [
    'reja', 'rejada', 'backlog', 'todo', 'to do', 'kiruvchi', 'kiruvchi savat',
    'nomzod', 'yangi', 'new', 'plan', 'planned',
  ],
};

/**
 * Derive the canonical stage from a column name (or legacy status code).
 * Terminal stages are checked first so e.g. a "Bajarildi" column never
 * accidentally matches a looser earlier alias. Returns null when no alias
 * matches — caller decides how to treat an unmapped column (we treat unmapped
 * destinations as NON-terminal, i.e. freely movable, to avoid blocking custom
 * intermediate columns).
 *
 * @param columnName raw column name or status code (may be null/undefined)
 * @returns the matched KanbanStatus, or null when unmapped
 */
export function statusFromColumnName(columnName: string | null | undefined): KanbanStatus | null {
  if (!columnName) return null;
  const n = String(columnName).trim().toLowerCase();
  if (!n) return null;
  // Terminal-first ordering so the strongest signal wins.
  const probeOrder: KanbanStatus[] = [
    KanbanStatus.BAJARILDI,
    KanbanStatus.TEKSHIRUVDA,
    KanbanStatus.JARAYONDA,
    KanbanStatus.REJA,
  ];
  for (const status of probeOrder) {
    for (const alias of STATUS_ALIASES[status]) {
      if (n.includes(alias)) return status;
    }
  }
  return null;
}

/** True when the column represents the terminal "Bajarildi" (done) stage. */
export function isDoneColumn(columnName: string | null | undefined): boolean {
  return statusFromColumnName(columnName) === KanbanStatus.BAJARILDI;
}
