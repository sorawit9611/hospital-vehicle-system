CREATE TYPE "public"."log_status" AS ENUM('out', 'returned');--> statement-breakpoint
CREATE TYPE "public"."requester_type" AS ENUM('department', 'person');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('general', 'ambulance');--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"status" "log_status" DEFAULT 'out' NOT NULL,
	"driver_id" uuid,
	"is_self_driven" boolean DEFAULT false NOT NULL,
	"requester_type" "requester_type" NOT NULL,
	"requester_dept" varchar(100),
	"requester_name" varchar(150),
	"requester_phone" varchar(20),
	"destination" text NOT NULL,
	"odometer_out" integer NOT NULL,
	"odometer_in" integer,
	"checkout_at" timestamp DEFAULT now() NOT NULL,
	"returned_at" timestamp,
	"distance_traveled" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "vehicle_type" DEFAULT 'general' NOT NULL,
	"department" varchar(100),
	"description" text,
	"current_odometer" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"responsible_driver_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
ALTER TABLE "vehicle_logs" ADD CONSTRAINT "vehicle_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_logs" ADD CONSTRAINT "vehicle_logs_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_responsible_driver_id_drivers_id_fk" FOREIGN KEY ("responsible_driver_id") REFERENCES "public"."drivers"("id") ON DELETE set null ON UPDATE no action;