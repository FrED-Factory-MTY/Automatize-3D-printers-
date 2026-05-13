// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator } from "drizzle-orm/pg-core";
import { pgTable, serial, text, timestamp, varchar, boolean, uuid } from "drizzle-orm/pg-core";
/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `3d-printing-web_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);


export const users = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // This will match the Supabase auth.users ID
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default('user'), // 'admin' or 'user'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Printers Table
export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  serialNumber: varchar("serial_number", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 255 }).notNull(),
  accessCode: varchar("access_code", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Petitions (Print Jobs) Table
export const petitions = pgTable("petitions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(), // Who requested it
  printerId: serial("printer_id").references(() => printers.id), // Assigned printer (can be null initially)
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(), // Link to the 3D model file (can use Supabase Storage)
  status: varchar("status", { length: 50 }).default('pending'), // pending, printing, completed, failed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pieces (Uploaded Models) Table
export const pieces = pgTable("pieces", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(), // Local absolute path or URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
});