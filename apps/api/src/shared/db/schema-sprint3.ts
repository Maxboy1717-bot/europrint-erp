import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * rfm_clusters — Sprint 3 TZ-41: RFM K-Means++ cluster assignments
 *
 * Persisted every time POST /crm/rfm/cluster is called.
 * Unique constraint (customer_id, calculated_at) prevents duplication within
 * the same run; duplicate runs on the same second upsert in-place.
 */
export const rfm_clusters = pgTable(
  'rfm_clusters',
  {
    id:          text('id').primaryKey().default(sql`gen_random_uuid()`),
    customer_id: text('customer_id').notNull(),
    cluster_id:  integer('cluster_id').notNull(),
    r_norm:      decimal('r_norm', { precision: 10, scale: 6 }).notNull(),
    f_norm:      decimal('f_norm', { precision: 10, scale: 6 }).notNull(),
    m_norm:      decimal('m_norm', { precision: 10, scale: 6 }).notNull(),
    segment_label: text('segment_label').notNull(),
    calculated_at: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    custCalcUq:  uniqueIndex('rfm_clusters_cust_calc_uq').on(t.customer_id, t.calculated_at),
    clusterIdx:  index('rfm_clusters_cluster_idx').on(t.cluster_id),
    customerIdx: index('rfm_clusters_customer_idx').on(t.customer_id),
  }),
);

/**
 * churn_model_params — Sprint 3 TZ-44: Churn gradient-descent model coefficients
 *
 * Each retraining run inserts a new versioned row and deactivates all previous ones.
 * Active model is loaded by ChurnService on every /crm/churn/predict call.
 */
export const churn_model_params = pgTable(
  'churn_model_params',
  {
    id:            text('id').primaryKey().default(sql`gen_random_uuid()`),
    version:       integer('version').notNull(),
    coefficients:  jsonb('coefficients').notNull(),
    feature_names: text('feature_names').array().notNull(),
    auc:           decimal('auc', { precision: 8, scale: 6 }).notNull(),
    trained_at:    timestamp('trained_at', { withTimezone: true }).notNull().defaultNow(),
    is_active:     boolean('is_active').notNull().default(false),
    sample_size:   integer('sample_size').notNull(),
  },
  (t) => ({
    versionUq:  uniqueIndex('churn_model_params_version_uq').on(t.version),
    activeIdx:  index('churn_model_params_active_idx').on(t.is_active),
  }),
);

/**
 * imposition_layouts — Sprint 3 TZ-32: Print imposition layout results
 *
 * Persisted every time POST /print/imposition is called.
 * Stores the full placement result as JSON plus summary metrics.
 */
export const imposition_layouts = pgTable(
  'imposition_layouts',
  {
    id:            text('id').primaryKey().default(sql`gen_random_uuid()`),
    sheet_width:   decimal('sheet_width',  { precision: 10, scale: 2 }).notNull(),
    sheet_height:  decimal('sheet_height', { precision: 10, scale: 2 }).notNull(),
    product_count: integer('product_count').notNull(),
    sheet_count:   integer('sheet_count').notNull(),
    utilization:   decimal('utilization',  { precision: 8, scale: 4 }).notNull(),
    placed_count:  integer('placed_count').notNull(),
    unplaced_count: integer('unplaced_count').notNull().default(0),
    layout_json:   jsonb('layout_json').notNull(),
    created_at:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    createdIdx: index('imposition_layouts_created_idx').on(t.created_at),
  }),
);
