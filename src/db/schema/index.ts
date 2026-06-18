import {
    pgTable, uuid, varchar, text,
    integer, timestamp, pgEnum, boolean,
} from "drizzle-orm/pg-core";

export const vehicleTypeEnum  = pgEnum("vehicle_type",  ["general", "ambulance"]);
export const logStatusEnum    = pgEnum("log_status",    ["out", "returned"]);
export const requesterTypeEnum = pgEnum("requester_type", ["department", "person"]);


// ตารางพนักงานขับรถ
export const drivers = pgTable("drivers", {
    id:        uuid("id").defaultRandom().primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName:  varchar("last_name",  { length: 100 }).notNull(),
    phone:     varchar("phone",      { length: 20  }),
    isActive:  integer("is_active").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ตารางยานพาหนะ
export const vehicles = pgTable("vehicles", {
    id:              uuid("id").defaultRandom().primaryKey(),
    plateNumber:     varchar("plate_number", { length: 20  }).notNull().unique(),
    name:            varchar("name",         { length: 100 }).notNull(),
    type:            vehicleTypeEnum("type").notNull().default("general"),
    department:      varchar("department",   { length: 100 }),
    description:     text("description"),
    currentOdometer: integer("current_odometer").notNull().default(0),
    isActive:        integer("is_active").notNull().default(1),

    // ผู้รับผิดชอบรถ (FK → drivers)
    responsibleDriverId: uuid("responsible_driver_id")
                            .references(() => drivers.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// ตารางบันทึกการใช้งาน
export const vehicleLogs = pgTable("vehicle_logs", {
    id:        uuid("id").defaultRandom().primaryKey(),
    vehicleId: uuid("vehicle_id").notNull()
                    .references(() => vehicles.id, { onDelete: "cascade" }),
    status:    logStatusEnum("status").notNull().default("out"),

    // ─── พนักงานขับรถ ───────────────────────
    driverId:     uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    isSelfDriven: boolean("is_self_driven").notNull().default(false),

    // ─── ผู้ขอใช้รถ ────────
    requesterType: requesterTypeEnum("requester_type").notNull(),
    requesterDept:  varchar("requester_dept",  { length: 100 }), 
    requesterName:  varchar("requester_name",  { length: 150 }), 
    requesterPhone: varchar("requester_phone", { length: 20  }),

    // ─── ข้อมูลการเดินทาง ────────────────────
    destination:      text("destination").notNull(),
    odometerOut:      integer("odometer_out").notNull(),
    odometerIn:       integer("odometer_in"),
    checkoutAt:       timestamp("checkout_at").defaultNow().notNull(),
    returnedAt:       timestamp("returned_at"),
    distanceTraveled: integer("distance_traveled"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
export type Vehicle       = typeof vehicles.$inferSelect;
export type NewVehicle    = typeof vehicles.$inferInsert;
export type Driver        = typeof drivers.$inferSelect;
export type NewDriver     = typeof drivers.$inferInsert;
export type VehicleLog    = typeof vehicleLogs.$inferSelect;
export type NewVehicleLog = typeof vehicleLogs.$inferInsert;