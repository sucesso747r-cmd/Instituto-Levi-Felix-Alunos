import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  date,
  decimal,
  integer,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Belt sequence — ORDER IS CRITICAL
export const BELT_SEQUENCE = [
  'Branca',
  'Amarela',
  'Vermelha',
  'Laranja',
  'Verde',
  'Roxa',
  'Marrom',
  'Preta',
] as const;

export type Belt = (typeof BELT_SEQUENCE)[number];

export function getNextBelt(current: Belt): Belt {
  const idx = BELT_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === BELT_SEQUENCE.length - 1) return current;
  return BELT_SEQUENCE[idx + 1];
}

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve ter pelo menos 1 letra maiúscula')
  .regex(/[a-z]/, 'A senha deve ter pelo menos 1 letra minúscula')
  .regex(/[0-9]/, 'A senha deve ter pelo menos 1 número')
  .regex(/[!@#$%^&*]/, 'A senha deve ter pelo menos 1 caractere especial (!@#$%^&*)');

export const beltColor = pgEnum('belt_color', BELT_SEQUENCE);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  student_name: varchar('student_name', { length: 255 }).notNull(),
  current_belt: beltColor('current_belt').notNull().default('Branca'),
  class_group: varchar('class_group', { length: 100 }),
  is_sensei: boolean('is_sensei').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const examPeriods = pgTable('exam_periods', {
  id: serial('id').primaryKey(),
  active: boolean('active').notNull().default(false),
  exam_date: date('exam_date').notNull(),
  registration_deadline: date('registration_deadline').notNull(),
  exam_price: decimal('exam_price', { precision: 10, scale: 2 })
    .notNull()
    .default('290.00'),
  pix_key: varchar('pix_key', { length: 255 }).notNull().default('19998098584'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const senseiEvaluations = pgTable(
  'sensei_evaluations',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id),
    exam_period_id: integer('exam_period_id')
      .notNull()
      .references(() => examPeriods.id),
    sensei_id: integer('sensei_id')
      .notNull()
      .references(() => users.id),
    is_eligible: boolean('is_eligible').notNull(),
    evaluated_at: timestamp('evaluated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.user_id, t.exam_period_id)],
);

export const examRegistrations = pgTable(
  'exam_registrations',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id')
      .notNull()
      .references(() => users.id),
    exam_period_id: integer('exam_period_id')
      .notNull()
      .references(() => examPeriods.id),
    target_belt: beltColor('target_belt').notNull(),
    payment_status: varchar('payment_status', { length: 50 })
      .notNull()
      .default('PENDENTE'),
    registered_at: timestamp('registered_at').notNull().defaultNow(),
    confirmed_at: timestamp('confirmed_at'),
  },
  (t) => [unique().on(t.user_id, t.exam_period_id)],
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expires_at: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertExamPeriodSchema = createInsertSchema(examPeriods);
export const insertSenseiEvaluationSchema = createInsertSchema(senseiEvaluations);
export const insertExamRegistrationSchema = createInsertSchema(examRegistrations);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
