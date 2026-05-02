-- Migration: Fix varchar-to-integer column type mismatches
-- Affected tables: sd_leads, sd_payments, sd_contracts
-- Root cause: FK columns were declared as varchar but reference integer PKs

--> statement-breakpoint
ALTER TABLE "sd_leads" ALTER COLUMN "customer_id" TYPE integer USING "customer_id"::integer;

--> statement-breakpoint
ALTER TABLE "sd_leads" ALTER COLUMN "manager_id" TYPE integer USING "manager_id"::integer;

--> statement-breakpoint
ALTER TABLE "sd_payments" ALTER COLUMN "customer_id" TYPE integer USING "customer_id"::integer;

--> statement-breakpoint
ALTER TABLE "sd_payments" ALTER COLUMN "order_id" TYPE integer USING "order_id"::integer;

--> statement-breakpoint
ALTER TABLE "sd_contracts" ALTER COLUMN "order_id" TYPE integer USING "order_id"::integer;
