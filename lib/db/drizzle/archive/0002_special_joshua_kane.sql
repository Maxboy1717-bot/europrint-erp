CREATE TABLE "customer_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"product_name_ru" text,
	"quantity" integer NOT NULL,
	"unit" varchar(20) DEFAULT 'dona',
	"unit_price" numeric(18, 4) NOT NULL,
	"total_price" numeric(18, 4) NOT NULL,
	"specifications" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_favorites_customer_id_product_id_unique" UNIQUE("customer_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "public_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text,
	"description_ru" text,
	"image_url" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "website_chat_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"customer_id" integer,
	"role" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"provider" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"company_name" text,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"review_ru" text,
	"product_id" integer,
	"order_id" integer,
	"is_approved" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_barcode_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(200) NOT NULL,
	"barcode_type" varchar(20) DEFAULT 'qr' NOT NULL,
	"passport_id" integer NOT NULL,
	"quantity" numeric(18, 4) DEFAULT '1' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"printed_at" timestamp,
	"printed_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_barcode_assignments_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "inventory_passports" (
	"id" serial PRIMARY KEY NOT NULL,
	"passport_number" varchar(100) NOT NULL,
	"product_id" varchar(50) NOT NULL,
	"product_name" text NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"warehouse_id" varchar(50),
	"batch_number" varchar(100),
	"serial_number" varchar(100),
	"manufactured_at" timestamp,
	"expires_at" timestamp,
	"specifications" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_passports_passport_number_unique" UNIQUE("passport_number")
);
--> statement-breakpoint
CREATE TABLE "pos_movement_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_id" integer NOT NULL,
	"passport_id" integer,
	"barcode_assignment_id" integer,
	"product_id" varchar(50) NOT NULL,
	"product_name" text NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT '0' NOT NULL,
	"total_price" numeric(18, 4) DEFAULT '0' NOT NULL,
	"batch_number" varchar(100),
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_movement_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"direction" varchar(10) DEFAULT 'in' NOT NULL,
	"requires_document" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_movement_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pos_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_number" varchar(50) NOT NULL,
	"movement_type_id" integer NOT NULL,
	"from_warehouse_id" varchar(50),
	"to_warehouse_id" varchar(50),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"reference_doc" varchar(100),
	"notes" text,
	"telegram_sent" boolean DEFAULT false NOT NULL,
	"created_by" integer NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_movements_movement_number_unique" UNIQUE("movement_number")
);
--> statement-breakpoint
CREATE TABLE "pos_pdf_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"movement_type_id" integer,
	"template_content" text NOT NULL,
	"paper_size" varchar(10) DEFAULT 'A4' NOT NULL,
	"orientation" varchar(10) DEFAULT 'portrait' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_pdf_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pos_telegram_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"movement_type_id" integer,
	"warehouse_id" varchar(50),
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_warehouse_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"warehouse_id" varchar(50) NOT NULL,
	"can_read" boolean DEFAULT true NOT NULL,
	"can_write" boolean DEFAULT false NOT NULL,
	"can_approve" boolean DEFAULT false NOT NULL,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "pos_warehouse_access_user_id_warehouse_id_unique" UNIQUE("user_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "role_movement_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"movement_type_id" integer NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_approve" boolean DEFAULT false NOT NULL,
	"can_cancel" boolean DEFAULT false NOT NULL,
	"max_amount" numeric(18, 4),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "role_movement_permissions_role_movement_type_id_unique" UNIQUE("role","movement_type_id")
);
--> statement-breakpoint
ALTER TABLE "work_centers" ADD COLUMN "certification_lms_course_id" integer;--> statement-breakpoint
ALTER TABLE "work_centers" ADD COLUMN "required_skill_name" varchar(100);--> statement-breakpoint
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_items" ADD CONSTRAINT "customer_order_items_product_id_public_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."public_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_favorites" ADD CONSTRAINT "product_favorites_customer_id_customer_accounts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_favorites" ADD CONSTRAINT "product_favorites_product_id_public_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."public_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_chat_logs" ADD CONSTRAINT "website_chat_logs_customer_id_customer_accounts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_reviews" ADD CONSTRAINT "website_reviews_customer_id_customer_accounts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_reviews" ADD CONSTRAINT "website_reviews_product_id_public_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."public_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "website_reviews" ADD CONSTRAINT "website_reviews_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_barcode_assignments" ADD CONSTRAINT "inventory_barcode_assignments_passport_id_inventory_passports_id_fk" FOREIGN KEY ("passport_id") REFERENCES "public"."inventory_passports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_barcode_assignments" ADD CONSTRAINT "inventory_barcode_assignments_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_passports" ADD CONSTRAINT "inventory_passports_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_passports" ADD CONSTRAINT "inventory_passports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movement_lines" ADD CONSTRAINT "pos_movement_lines_movement_id_pos_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."pos_movements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movement_lines" ADD CONSTRAINT "pos_movement_lines_passport_id_inventory_passports_id_fk" FOREIGN KEY ("passport_id") REFERENCES "public"."inventory_passports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movement_lines" ADD CONSTRAINT "pos_movement_lines_barcode_assignment_id_inventory_barcode_assignments_id_fk" FOREIGN KEY ("barcode_assignment_id") REFERENCES "public"."inventory_barcode_assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movements" ADD CONSTRAINT "pos_movements_movement_type_id_pos_movement_types_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "public"."pos_movement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movements" ADD CONSTRAINT "pos_movements_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movements" ADD CONSTRAINT "pos_movements_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movements" ADD CONSTRAINT "pos_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movements" ADD CONSTRAINT "pos_movements_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_pdf_templates" ADD CONSTRAINT "pos_pdf_templates_movement_type_id_pos_movement_types_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "public"."pos_movement_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_pdf_templates" ADD CONSTRAINT "pos_pdf_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_telegram_routes" ADD CONSTRAINT "pos_telegram_routes_movement_type_id_pos_movement_types_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "public"."pos_movement_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_telegram_routes" ADD CONSTRAINT "pos_telegram_routes_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_warehouse_access" ADD CONSTRAINT "pos_warehouse_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_warehouse_access" ADD CONSTRAINT "pos_warehouse_access_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_warehouse_access" ADD CONSTRAINT "pos_warehouse_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_movement_permissions" ADD CONSTRAINT "role_movement_permissions_movement_type_id_pos_movement_types_id_fk" FOREIGN KEY ("movement_type_id") REFERENCES "public"."pos_movement_types"("id") ON DELETE cascade ON UPDATE no action;