CREATE SCHEMA "public";
CREATE TABLE "app_infm" (
	"id" serial PRIMARY KEY,
	"app_name" varchar(25) NOT NULL CONSTRAINT "app_infm_app_name_key" UNIQUE
);
CREATE TABLE "chat_message" (
	"id" serial PRIMARY KEY,
	"chat_room_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp DEFAULT now()
);
CREATE TABLE "chat_room" (
	"id" serial PRIMARY KEY,
	"user1_id" integer NOT NULL UNIQUE,
	"user2_id" integer NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "chat_room_user1_id_user2_id_key" UNIQUE("user1_id","user2_id")
);
CREATE TABLE "grp_infm" (
	"id" serial PRIMARY KEY,
	"grp_name" varchar(50) NOT NULL,
	"status" integer,
	"description" varchar(255) DEFAULT NULL,
	"admin_id" integer,
	"create_date" varchar(20) DEFAULT NULL,
	"currency" varchar(5) DEFAULT '$' NOT NULL,
	"visibility" varchar(10) DEFAULT 'private' NOT NULL,
	"telegram_chat_id" bigint
);
CREATE TABLE "grp_users" (
	"group_id" integer,
	"user_id" integer,
	"can_edit" boolean DEFAULT false NOT NULL,
	CONSTRAINT "grp_users_pkey" PRIMARY KEY("group_id","user_id")
);
CREATE TABLE "json_data" (
	"id" serial PRIMARY KEY,
	"chat_id" text CONSTRAINT "json_data_chat_id_key" UNIQUE,
	"chat_history" jsonb,
	"user_id" varchar(50)
);
CREATE TABLE "member_infm" (
	"id" serial PRIMARY KEY,
	"mem_name" varchar(50) NOT NULL UNIQUE,
	"paid" double precision,
	"group_id" integer UNIQUE,
	CONSTRAINT "unique_member_per_group" UNIQUE("group_id","mem_name")
);
CREATE TABLE "settlement_log" (
	"id" serial PRIMARY KEY,
	"action_type" varchar(50) NOT NULL,
	"group_id" integer NOT NULL,
	"trip_id" integer,
	"member_id" integer,
	"excluded_member_ids" jsonb DEFAULT '[]' NOT NULL,
	"affected_members" jsonb DEFAULT '[]' NOT NULL,
	"performed_by" integer,
	"undo_of_log_id" integer,
	"is_undone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY,
	"endpoint" text NOT NULL CONSTRAINT "subscriptions_endpoint_key" UNIQUE,
	"expiration_time" timestamp,
	"keys" jsonb NOT NULL,
	"device_id" varchar(255),
	"user_agent" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"user_id" integer
);
CREATE TABLE "tel_grp_chat" (
	"id" serial PRIMARY KEY,
	"usernm" varchar(50) NOT NULL,
	"group_chat_id" text,
	"group_chat_title" text
);
CREATE TABLE "telegram_links" (
	"code" varchar PRIMARY KEY,
	"user_id" integer NOT NULL,
	"expires_at" timestamp DEFAULT (now() + '01:00:00'::interval) NOT NULL
);
CREATE TABLE "testimonials_infm" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL,
	"title" varchar(100),
	"email" varchar(100),
	"message" text NOT NULL,
	"photo_url" varchar(255),
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"ip_address" varchar(45),
	"company" varchar(255)
);
CREATE TABLE "translations" (
	"id" serial PRIMARY KEY,
	"input_text" varchar(255) NOT NULL,
	"output_text" text NOT NULL,
	"target_language" varchar(100) NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"user_id" integer NOT NULL
);
CREATE TABLE "trp_infm" (
	"id" serial PRIMARY KEY,
	"trp_name" varchar(50) NOT NULL,
	"spend" double precision,
	"mem_id" varchar(255) DEFAULT NULL,
	"status" integer,
	"description" varchar(255) DEFAULT NULL,
	"group_id" integer,
	"create_date" varchar(50) DEFAULT NULL,
	"update_dttm" varchar(50) DEFAULT NULL,
	"payer_id" integer,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" integer
);
CREATE TABLE "user_infm" (
	"id" serial PRIMARY KEY,
	"usernm" varchar(50) NOT NULL,
	"passwd" varchar(150) NOT NULL,
	"phone_number" varchar(25) DEFAULT NULL,
	"email" varchar(25) DEFAULT NULL,
	"profile_url" varchar(255) DEFAULT NULL,
	"create_date" varchar(20) DEFAULT NULL,
	"device_id" varchar(255) CONSTRAINT "user_infm_device_id_key" UNIQUE,
	"first_name" text,
	"last_name" text,
	"telegram_chat_id" text,
	"app_id" integer,
	"telegram_id" bigint CONSTRAINT "user_infm_telegram_id_key" UNIQUE
);
CREATE TABLE "visitors_infm" (
	"id" serial PRIMARY KEY,
	"ip_address" varchar(50) NOT NULL UNIQUE,
	"user_agent" varchar(255) NOT NULL UNIQUE,
	"visited_route" varchar(255) UNIQUE,
	"visit_time" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "visitors_infm_ip_address_user_agent_visited_route_key" UNIQUE("ip_address","user_agent","visited_route")
);
CREATE UNIQUE INDEX "app_infm_app_name_key" ON "app_infm" ("app_name");
CREATE UNIQUE INDEX "app_infm_pkey" ON "app_infm" ("id");
CREATE INDEX "index_1" ON "app_infm" ("id","app_name");
CREATE UNIQUE INDEX "chat_message_pkey" ON "chat_message" ("id");
CREATE UNIQUE INDEX "chat_room_pkey" ON "chat_room" ("id");
CREATE UNIQUE INDEX "chat_room_user1_id_user2_id_key" ON "chat_room" ("user1_id","user2_id");
CREATE UNIQUE INDEX "grp_infm_pkey" ON "grp_infm" ("id");
CREATE UNIQUE INDEX "grp_users_pkey" ON "grp_users" ("group_id","user_id");
CREATE UNIQUE INDEX "json_data_chat_id_key" ON "json_data" ("chat_id");
CREATE UNIQUE INDEX "json_data_pkey" ON "json_data" ("id");
CREATE UNIQUE INDEX "member_infm_pkey" ON "member_infm" ("id");
CREATE UNIQUE INDEX "unique_member_group" ON "member_infm" ("group_id","lower(TRIM(BOTH FROM mem_name))");
CREATE UNIQUE INDEX "unique_member_per_group" ON "member_infm" ("group_id","mem_name");
CREATE INDEX "idx_settlement_log_group_id" ON "settlement_log" ("group_id");
CREATE INDEX "idx_settlement_log_member_id" ON "settlement_log" ("member_id");
CREATE INDEX "idx_settlement_log_trip_id" ON "settlement_log" ("trip_id");
CREATE UNIQUE INDEX "settlement_log_pkey" ON "settlement_log" ("id");
CREATE UNIQUE INDEX "subscriptions_endpoint_key" ON "subscriptions" ("endpoint");
CREATE UNIQUE INDEX "subscriptions_pkey" ON "subscriptions" ("id");
CREATE UNIQUE INDEX "tel_grp_chat_pkey" ON "tel_grp_chat" ("id");
CREATE UNIQUE INDEX "telegram_links_pkey" ON "telegram_links" ("code");
CREATE INDEX "idx_ip_created_at" ON "testimonials_infm" ("ip_address","created_at");
CREATE UNIQUE INDEX "testimonials_infm_pkey" ON "testimonials_infm" ("id");
CREATE UNIQUE INDEX "translations_pkey" ON "translations" ("id");
CREATE UNIQUE INDEX "trp_infm_pkey" ON "trp_infm" ("id");
CREATE UNIQUE INDEX "user_infm_device_id_key" ON "user_infm" ("device_id");
CREATE UNIQUE INDEX "user_infm_pkey" ON "user_infm" ("id");
CREATE UNIQUE INDEX "user_infm_telegram_id_key" ON "user_infm" ("telegram_id");
CREATE UNIQUE INDEX "visitors_infm_ip_address_user_agent_visited_route_key" ON "visitors_infm" ("ip_address","user_agent","visited_route");
CREATE UNIQUE INDEX "visitors_infm_pkey" ON "visitors_infm" ("id");
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_room"("id") ON DELETE CASCADE;
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user_infm"("id") ON DELETE CASCADE;
ALTER TABLE "chat_room" ADD CONSTRAINT "chat_room_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "user_infm"("id") ON DELETE CASCADE;
ALTER TABLE "chat_room" ADD CONSTRAINT "chat_room_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "user_infm"("id") ON DELETE CASCADE;
ALTER TABLE "grp_infm" ADD CONSTRAINT "fk_group_admin" FOREIGN KEY ("admin_id") REFERENCES "user_infm"("id");
ALTER TABLE "grp_users" ADD CONSTRAINT "grp_users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "grp_infm"("id");
ALTER TABLE "grp_users" ADD CONSTRAINT "grp_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_infm"("id");
ALTER TABLE "settlement_log" ADD CONSTRAINT "settlement_log_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "grp_infm"("id") ON DELETE CASCADE;
ALTER TABLE "settlement_log" ADD CONSTRAINT "settlement_log_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member_infm"("id") ON DELETE SET NULL;
ALTER TABLE "settlement_log" ADD CONSTRAINT "settlement_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "user_infm"("id") ON DELETE SET NULL;
ALTER TABLE "settlement_log" ADD CONSTRAINT "settlement_log_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trp_infm"("id") ON DELETE SET NULL;
ALTER TABLE "settlement_log" ADD CONSTRAINT "settlement_log_undo_of_log_id_fkey" FOREIGN KEY ("undo_of_log_id") REFERENCES "settlement_log"("id");
ALTER TABLE "subscriptions" ADD CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "user_infm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "translations" ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "user_infm"("id") ON DELETE CASCADE;
ALTER TABLE "trp_infm" ADD CONSTRAINT "fk_group_id" FOREIGN KEY ("group_id") REFERENCES "grp_infm"("id");
ALTER TABLE "trp_infm" ADD CONSTRAINT "trp_infm_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "user_infm"("id") ON DELETE SET NULL;
ALTER TABLE "user_infm" ADD CONSTRAINT "app_id" FOREIGN KEY ("app_id") REFERENCES "app_infm"("id") ON DELETE SET NULL;