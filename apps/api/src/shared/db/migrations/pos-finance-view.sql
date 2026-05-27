-- POS-FINANCE-1: pos_transactions VIEW over retail_pos_transactions
-- Finance module reads pos_transactions (serial PK, camelCase columns).
-- This VIEW bridges the two so Finance always sees live POS data.
-- ADD-ONLY — existing retail_pos_transactions table is not modified.

CREATE OR REPLACE VIEW pos_transactions AS
  SELECT
    id::text                                  AS id,
    transaction_number                        AS "transactionNumber",
    receipt_number                            AS "receiptNumber",
    cashier_id                                AS "cashierId",
    customer_name                             AS "customerName",
    customer_id                               AS "customerId",
    items,
    subtotal::numeric                         AS subtotal,
    discount_amount::numeric                  AS "discountAmount",
    tax_rate::numeric                         AS "taxRate",
    tax_amount::numeric                       AS "taxAmount",
    total_amount::numeric                     AS "totalAmount",
    payment_method                            AS "paymentMethod",
    payment_details                           AS "paymentDetails",
    status,
    notes,
    refunded_at                               AS "refundedAt",
    refunded_by                               AS "refundedBy",
    created_at                                AS "createdAt"
  FROM retail_pos_transactions;

-- Grant read access to the application role (adjust role name as needed)
-- GRANT SELECT ON pos_transactions TO app_user;
