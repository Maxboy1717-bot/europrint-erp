/**
 * Communication Center — 3-Basket Document Workflow System
 * ==========================================================
 *
 * Europrint ERP'ning Kommunikatsiya Markazi moduli uchun ma'lumotlar bazasi sxemasi.
 * Hujjatlar 3 savat orqali harakat qiladi: Kiruvchi (inbox) → Kutish (pending) → Chiquvchi (outbox).
 *
 * Loyiha hujjati: 7 ta task — Task 1 (DB sxemasi).
 */

import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, index, unique,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── ENUM-like check constraints expressed as varchar (Drizzle-friendly) ───
// basket_state: 'inbox' | 'pending' | 'outbox' | 'archived'
// workflow_state: 'draft' | 'sent' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'archived'
// approval_state: 'pending' | 'approved' | 'rejected' | 'delegated' | 'escalated'
// priority: 'low' | 'normal' | 'high' | 'urgent'
// language: 'uz' | 'ru'
// step_type: 'sequential' | 'parallel'

// =============================================================================
// MODEL 14: Filiallar (eng pastdagi tobelik bo'yicha)
// =============================================================================
export const ccBranches = pgTable('cc_branches', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 200 }).notNull(),
  code:      varchar('code', { length: 50 }).notNull().unique(),
  city:      varchar('city', { length: 120 }),
  address:   text('address'),
  isActive:  boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  codeIdx: unique('cc_branches_code_uq').on(t.code),
}));

// =============================================================================
// MODEL 1: Hujjat shabloni
// =============================================================================
export const ccDocumentTemplates = pgTable('cc_document_templates', {
  id:               uuid('id').primaryKey().defaultRandom(),
  code:             varchar('code', { length: 60 }).notNull().unique(), // ADVANCE, VACATION...
  nameUz:           varchar('name_uz', { length: 200 }).notNull(),
  nameRu:           varchar('name_ru', { length: 200 }).notNull(),
  category:         varchar('category', { length: 30 }).notNull(),     // ariza|buyruq|hisobot|xabar
  /**
   * AI savollar: [{ key: string, qUz: string, qRu: string, required: boolean,
   *                  type: 'text'|'choice'|'date'|'number', choices?: string[] }]
   */
  aiQuestions:      jsonb('ai_questions').notNull().default(sql`'[]'::jsonb`),
  htmlTemplate:     text('html_template'),                              // chop etish uchun HTML
  version:          integer('version').notNull().default(1),
  isActive:         boolean('is_active').notNull().default(true),
  defaultPriority:  varchar('default_priority', { length: 20 }).notNull().default('normal'),
  maxFileSizeMb:    integer('max_file_size_mb').notNull().default(10),
  /**
   * Ruxsat etilgan fayl turlari: ['pdf','png','jpg','docx','xlsx'] — video/audio TAQIQLANGAN
   */
  allowedFileTypes: jsonb('allowed_file_types').notNull().default(sql`'["pdf","png","jpg","jpeg","docx","xlsx"]'::jsonb`),
  printRequiresReason: boolean('print_requires_reason').notNull().default(true),
  cooldownDays:     integer('cooldown_days'),                           // shu turda bir necha kunda 1 marta
  archiveAfterDays: integer('archive_after_days'),                      // null = muddatsiz
  numberFormat:     varchar('number_format', { length: 60 }).notNull().default('DOC-{YYYY}-{SEQ}'),
  inboxSlaHours:    integer('inbox_sla_hours').notNull().default(24),
  reminderHours:    integer('reminder_hours').notNull().default(20),    // SLA dan oldin
  escalationHours:  integer('escalation_hours').notNull().default(48),
  isRecurring:      boolean('is_recurring').notNull().default(false),
  cronExpression:   varchar('cron_expression', { length: 60 }),
  testMode:         boolean('test_mode').notNull().default(false),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  codeIdx:     index('cc_tmpl_code_idx').on(t.code),
  activeIdx:   index('cc_tmpl_active_idx').on(t.isActive),
  categoryIdx: index('cc_tmpl_cat_idx').on(t.category),
}));

// =============================================================================
// MODEL 2: Workflow bosqichi
// =============================================================================
export const ccWorkflowSteps = pgTable('cc_workflow_steps', {
  id:                uuid('id').primaryKey().defaultRandom(),
  templateId:        uuid('template_id').notNull().references(() => ccDocumentTemplates.id, { onDelete: 'cascade' }),
  templateVersion:   integer('template_version').notNull(),
  stepOrder:         integer('step_order').notNull(),
  stepType:          varchar('step_type', { length: 20 }).notNull().default('sequential'), // sequential|parallel
  /** orgsxemada lavozim kodi yoki "MANAGER_OF_SENDER" / "DEPT_HEAD" / "CEO" / "CFO" / "POSITION:<code>" */
  approverPositionCode: varchar('approver_position_code', { length: 80 }).notNull(),
  rejectionStops:    boolean('rejection_stops').notNull().default(true),
  timeLimitHours:    integer('time_limit_hours').notNull().default(24),
  isMandatory:       boolean('is_mandatory').notNull().default(true),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  tmplIdx:    index('cc_step_tmpl_idx').on(t.templateId, t.templateVersion),
  orderUq:    unique('cc_step_order_uq').on(t.templateId, t.templateVersion, t.stepOrder, t.approverPositionCode),
}));

// =============================================================================
// MODEL 3: Rad etish sabablari
// =============================================================================
export const ccRejectionReasons = pgTable('cc_rejection_reasons', {
  id:         uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => ccDocumentTemplates.id, { onDelete: 'cascade' }),
  reasonUz:   varchar('reason_uz', { length: 300 }).notNull(),
  reasonRu:   varchar('reason_ru', { length: 300 }).notNull(),
  isActive:   boolean('is_active').notNull().default(true),
  sortOrder:  integer('sort_order').notNull().default(0),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  tmplIdx: index('cc_rej_tmpl_idx').on(t.templateId, t.isActive),
}));

// =============================================================================
// MODEL 4: Hujjat (asosiy entitiya)
// =============================================================================
export const ccDocuments = pgTable('cc_documents', {
  id:                uuid('id').primaryKey().defaultRandom(),
  documentNumber:    varchar('document_number', { length: 80 }).notNull().unique(),
  templateId:        uuid('template_id').notNull().references(() => ccDocumentTemplates.id),
  templateVersion:   integer('template_version').notNull(),
  senderUserId:      integer('sender_user_id').notNull(),                 // users.id
  branchId:          uuid('branch_id').references(() => ccBranches.id),

  // ── 3 SAVAT ─────────────────────────────────────────────────────────
  basketState:       varchar('basket_state', { length: 20 }).notNull().default('inbox'),  // inbox|pending|outbox|archived
  basketOwnerUserId: integer('basket_owner_user_id'),                     // hozir kim qarayapti
  basketEnteredAt:   timestamp('basket_entered_at').notNull().defaultNow(), // 24h SLA hisoblash
  isInboxOverdue:    boolean('is_inbox_overdue').notNull().default(false),

  // ── Workflow ────────────────────────────────────────────────────────
  workflowState:     varchar('workflow_state', { length: 20 }).notNull().default('draft'), // draft|sent|in_progress|approved|rejected|cancelled|archived
  currentStepOrder:  integer('current_step_order').notNull().default(0),

  subject:           varchar('subject', { length: 500 }).notNull(),
  /** AI tomonidan yaratilgan rasmiy hujjat matni */
  aiBody:            text('ai_body').notNull(),
  /** AI savollari uchun xom javoblar (JSON) — keyin qayta tahrirlash uchun */
  aiAnswers:         jsonb('ai_answers').notNull().default(sql`'{}'::jsonb`),
  senderComment:     text('sender_comment'),
  priority:          varchar('priority', { length: 20 }).notNull().default('normal'),
  language:          varchar('language', { length: 5 }).notNull().default('uz'),

  // ── Versiya / qayta yuborish ────────────────────────────────────────
  parentDocumentId:  uuid('parent_document_id'),                          // self-ref FK qoshimcha bilan
  version:           integer('version').notNull().default(1),

  // ── Bekor qilish ────────────────────────────────────────────────────
  cancelledByUserId: integer('cancelled_by_user_id'),
  cancelledReason:   text('cancelled_reason'),
  cancelledAt:       timestamp('cancelled_at'),

  // ── Oflayn rejim ────────────────────────────────────────────────────
  createdOffline:    boolean('created_offline').notNull().default(false),
  syncedAt:          timestamp('synced_at'),

  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
  archivedAt:        timestamp('archived_at'),
}, (t) => ({
  basketOwnerIdx:  index('cc_doc_basket_owner_idx').on(t.basketOwnerUserId, t.basketState),
  senderIdx:       index('cc_doc_sender_idx').on(t.senderUserId),
  workflowIdx:     index('cc_doc_workflow_idx').on(t.workflowState),
  templateIdx:     index('cc_doc_template_idx').on(t.templateId),
  branchIdx:       index('cc_doc_branch_idx').on(t.branchId),
  numberIdx:       index('cc_doc_number_idx').on(t.documentNumber),
  inboxOverdueIdx: index('cc_doc_overdue_idx').on(t.isInboxOverdue, t.basketState),
  basketEnteredIdx: index('cc_doc_basket_entered_idx').on(t.basketEnteredAt),
  parentIdx:       index('cc_doc_parent_idx').on(t.parentDocumentId),
}));

// =============================================================================
// MODEL 5: Savat harakati tarixi (audit trail)
// =============================================================================
export const ccBasketHistory = pgTable('cc_basket_history', {
  id:           uuid('id').primaryKey().defaultRandom(),
  documentId:   uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  ownerUserId:  integer('owner_user_id').notNull(),
  fromBasket:   varchar('from_basket', { length: 20 }),
  toBasket:     varchar('to_basket', { length: 20 }).notNull(),
  movedByUserId: integer('moved_by_user_id'),
  note:         text('note'),
  movedAt:      timestamp('moved_at').notNull().defaultNow(),
}, (t) => ({
  docIdx:   index('cc_bh_doc_idx').on(t.documentId, t.movedAt),
  ownerIdx: index('cc_bh_owner_idx').on(t.ownerUserId),
}));

// =============================================================================
// MODEL 6: Tasdiqlash yozuvi
// =============================================================================
export const ccApprovals = pgTable('cc_approvals', {
  id:                uuid('id').primaryKey().defaultRandom(),
  documentId:        uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  stepOrder:         integer('step_order').notNull(),
  approverUserId:    integer('approver_user_id').notNull(),
  state:             varchar('state', { length: 20 }).notNull().default('pending'),
  rejectionReasonId: uuid('rejection_reason_id').references(() => ccRejectionReasons.id),
  comment:           text('comment'),
  signedAt:          timestamp('signed_at'),
  signatureHash:     varchar('signature_hash', { length: 200 }),         // PIN-based hash
  deadlineAt:        timestamp('deadline_at'),
  escalatedAt:       timestamp('escalated_at'),
  delegatedToUserId: integer('delegated_to_user_id'),
  rejectionStops:    boolean('rejection_stops').notNull().default(true),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  docIdx:      index('cc_appr_doc_idx').on(t.documentId, t.stepOrder),
  approverIdx: index('cc_appr_approver_idx').on(t.approverUserId, t.state),
  stateIdx:    index('cc_appr_state_idx').on(t.state),
  deadlineIdx: index('cc_appr_deadline_idx').on(t.deadlineAt),
}));

// =============================================================================
// MODEL 7: Fayl biriktirilishi
// =============================================================================
export const ccAttachments = pgTable('cc_attachments', {
  id:               uuid('id').primaryKey().defaultRandom(),
  documentId:       uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  fileName:         varchar('file_name', { length: 300 }).notNull(),
  fileUrl:          varchar('file_url', { length: 1000 }).notNull(),
  fileSizeBytes:    integer('file_size_bytes').notNull(),
  mimeType:         varchar('mime_type', { length: 120 }).notNull(),
  uploadedByUserId: integer('uploaded_by_user_id').notNull(),
  uploadedAt:       timestamp('uploaded_at').notNull().defaultNow(),
}, (t) => ({
  docIdx: index('cc_att_doc_idx').on(t.documentId),
}));

// =============================================================================
// MODEL 8: To'liq audit trail
// =============================================================================
export const ccAuditTrail = pgTable('cc_audit_trail', {
  id:             uuid('id').primaryKey().defaultRandom(),
  documentId:     uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  /**
   * action: created|sent|moved_to_inbox|moved_to_pending|moved_to_outbox|approved|
   *         rejected|cancelled|printed|viewed|delegated|escalated|reopened|archived
   */
  action:         varchar('action', { length: 40 }).notNull(),
  fromBasket:     varchar('from_basket', { length: 20 }),
  toBasket:       varchar('to_basket', { length: 20 }),
  fromWorkflow:   varchar('from_workflow', { length: 20 }),
  toWorkflow:     varchar('to_workflow', { length: 20 }),
  performedByUserId: integer('performed_by_user_id'),
  comment:        text('comment'),
  printReason:    text('print_reason'),
  ipAddress:      varchar('ip_address', { length: 50 }),
  userAgent:      varchar('user_agent', { length: 500 }),
  viaTelegram:    boolean('via_telegram').notNull().default(false),
  performedAt:    timestamp('performed_at').notNull().defaultNow(),
}, (t) => ({
  docIdx:    index('cc_audit_doc_idx').on(t.documentId, t.performedAt),
  actionIdx: index('cc_audit_action_idx').on(t.action),
  userIdx:   index('cc_audit_user_idx').on(t.performedByUserId),
}));

// =============================================================================
// MODEL 9: Versiya tarixi
// =============================================================================
export const ccDocumentVersions = pgTable('cc_document_versions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  documentId:       uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  version:          integer('version').notNull(),
  aiBody:           text('ai_body').notNull(),
  senderComment:    text('sender_comment'),
  createdByUserId:  integer('created_by_user_id').notNull(),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  docVerUq: unique('cc_ver_doc_uq').on(t.documentId, t.version),
}));

// =============================================================================
// MODEL 10: Delegatsiya
// =============================================================================
export const ccDelegations = pgTable('cc_delegations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  fromUserId:      integer('from_user_id').notNull(),
  toUserId:        integer('to_user_id').notNull(),
  startsAt:        timestamp('starts_at').notNull(),
  endsAt:          timestamp('ends_at').notNull(),
  isActive:        boolean('is_active').notNull().default(true),
  setByUserId:     integer('set_by_user_id'),
  reason:          text('reason'),
  createdAt:       timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  activeIdx: index('cc_deleg_active_idx').on(t.fromUserId, t.isActive, t.startsAt, t.endsAt),
}));

// =============================================================================
// MODEL 11: Chop etish jurnali
// =============================================================================
export const ccPrintLog = pgTable('cc_print_log', {
  id:              uuid('id').primaryKey().defaultRandom(),
  documentId:      uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  printedByUserId: integer('printed_by_user_id').notNull(),
  reason:          text('reason').notNull(),
  printedAt:       timestamp('printed_at').notNull().defaultNow(),
}, (t) => ({
  docIdx: index('cc_print_doc_idx').on(t.documentId),
}));

// =============================================================================
// MODEL 12: Bildirishnoma
// =============================================================================
export const ccNotifications = pgTable('cc_notifications', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       integer('user_id').notNull(),
  documentId:   uuid('document_id').references(() => ccDocuments.id, { onDelete: 'cascade' }),
  /**
   * type: new_document|moved_to_pending|moved_to_outbox|approved|rejected|
   *       cancelled|inbox_24h_warning|escalated|complaint|broadcast|overdue
   */
  type:         varchar('type', { length: 40 }).notNull(),
  priority:     varchar('priority', { length: 20 }).notNull().default('normal'),
  titleUz:      varchar('title_uz', { length: 300 }).notNull(),
  titleRu:      varchar('title_ru', { length: 300 }).notNull(),
  messageUz:    text('message_uz').notNull(),
  messageRu:    text('message_ru').notNull(),
  isRead:       boolean('is_read').notNull().default(false),
  readAt:       timestamp('read_at'),
  sentViaTelegram: boolean('sent_via_telegram').notNull().default(false),
  telegramMessageId: varchar('telegram_message_id', { length: 50 }),
  createdAt:    timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx:    index('cc_notif_user_idx').on(t.userId, t.isRead, t.createdAt),
  docIdx:     index('cc_notif_doc_idx').on(t.documentId),
  unreadIdx:  index('cc_notif_unread_idx').on(t.userId, t.isRead),
}));

// =============================================================================
// MODEL 13: Shikoyat (faqat direktorga)
// =============================================================================
export const ccComplaints = pgTable('cc_complaints', {
  id:               uuid('id').primaryKey().defaultRandom(),
  documentId:       uuid('document_id').notNull().references(() => ccDocuments.id, { onDelete: 'cascade' }),
  complainantUserId: integer('complainant_user_id').notNull(),
  reason:           text('reason').notNull(),
  state:            varchar('state', { length: 20 }).notNull().default('pending'), // pending|reviewed
  directorComment:  text('director_comment'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  reviewedAt:       timestamp('reviewed_at'),
}, (t) => ({
  stateIdx: index('cc_compl_state_idx').on(t.state, t.createdAt),
  docIdx:   index('cc_compl_doc_idx').on(t.documentId),
}));

// =============================================================================
// MODEL 15: Bildirishnoma sozlamalari
// =============================================================================
export const ccNotificationPrefs = pgTable('cc_notification_prefs', {
  userId:           integer('user_id').primaryKey(),
  urgentOnly:       boolean('urgent_only').notNull().default(false),
  telegramEnabled:  boolean('telegram_enabled').notNull().default(true),
  remindersEnabled: boolean('reminders_enabled').notNull().default(true),
  language:         varchar('language', { length: 5 }).notNull().default('uz'),
  updatedAt:        timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// PIN HASH SAQLASH — har xodim o'z PIN'ini qo'yadi (Phase 2)
// =============================================================================
export const ccUserPins = pgTable('cc_user_pins', {
  userId:    integer('user_id').primaryKey(),
  pinHash:   varchar('pin_hash', { length: 200 }).notNull(),    // bcrypt
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================================================
// AI INTERVIEW SESSIONS — Telegram bot uchun (Task 4 va 6)
// =============================================================================
export const ccAiSessions = pgTable('cc_ai_sessions', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            integer('user_id').notNull(),
  templateId:        uuid('template_id').notNull().references(() => ccDocumentTemplates.id),
  channel:           varchar('channel', { length: 20 }).notNull().default('web'),  // web|telegram
  currentQuestionIdx: integer('current_question_idx').notNull().default(0),
  answers:           jsonb('answers').notNull().default(sql`'{}'::jsonb`),
  language:          varchar('language', { length: 5 }).notNull().default('uz'),
  isCompleted:       boolean('is_completed').notNull().default(false),
  draftDocumentId:   uuid('draft_document_id').references(() => ccDocuments.id),
  startedAt:         timestamp('started_at').notNull().defaultNow(),
  completedAt:       timestamp('completed_at'),
  expiresAt:         timestamp('expires_at'),
}, (t) => ({
  userIdx: index('cc_ai_user_idx').on(t.userId, t.isCompleted),
}));

// =============================================================================
// TYPES (Drizzle inferring)
// =============================================================================
export type CcBranch              = typeof ccBranches.$inferSelect;
export type CcDocumentTemplate    = typeof ccDocumentTemplates.$inferSelect;
export type CcWorkflowStep        = typeof ccWorkflowSteps.$inferSelect;
export type CcRejectionReason     = typeof ccRejectionReasons.$inferSelect;
export type CcDocument            = typeof ccDocuments.$inferSelect;
export type CcBasketHistoryRow    = typeof ccBasketHistory.$inferSelect;
export type CcApproval            = typeof ccApprovals.$inferSelect;
export type CcAttachment          = typeof ccAttachments.$inferSelect;
export type CcAuditEvent          = typeof ccAuditTrail.$inferSelect;
export type CcDocumentVersion     = typeof ccDocumentVersions.$inferSelect;
export type CcDelegation          = typeof ccDelegations.$inferSelect;
export type CcPrintEvent          = typeof ccPrintLog.$inferSelect;
export type CcNotification        = typeof ccNotifications.$inferSelect;
export type CcComplaint           = typeof ccComplaints.$inferSelect;
export type CcNotificationPref    = typeof ccNotificationPrefs.$inferSelect;
export type CcAiSession           = typeof ccAiSessions.$inferSelect;
export type CcUserPin             = typeof ccUserPins.$inferSelect;

export const CC_BASKET_STATES = ['inbox', 'pending', 'outbox', 'archived'] as const;
export type CcBasketState = typeof CC_BASKET_STATES[number];

export const CC_WORKFLOW_STATES = ['draft', 'sent', 'in_progress', 'approved', 'rejected', 'cancelled', 'archived'] as const;
export type CcWorkflowState = typeof CC_WORKFLOW_STATES[number];

export const CC_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type CcPriority = typeof CC_PRIORITIES[number];
