import type { Express } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { isAuthenticated, isSensei, isAdminSession } from './auth.js';
import {
  users,
  examPeriods,
  senseiEvaluations,
  examRegistrations,
  getNextBelt,
  type Belt,
} from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

function sha256(str: string): Buffer {
  return crypto.createHash('sha256').update(str).digest();
}

export function registerRoutes(app: Express) {
  // ─────────────────────────────────────────────
  // EXAM — student routes
  // ─────────────────────────────────────────────

  // GET /api/exam/current
  app.get('/api/exam/current', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);

      if (!period) return res.json({ period: null, evaluation: null, registration: null });

      const [evaluation] = await db
        .select()
        .from(senseiEvaluations)
        .where(
          and(
            eq(senseiEvaluations.user_id, userId),
            eq(senseiEvaluations.exam_period_id, period.id),
          ),
        )
        .limit(1);

      const [registration] = await db
        .select()
        .from(examRegistrations)
        .where(
          and(
            eq(examRegistrations.user_id, userId),
            eq(examRegistrations.exam_period_id, period.id),
          ),
        )
        .limit(1);

      return res.json({
        period,
        evaluation: evaluation ?? null,
        registration: registration ?? null,
      });
    } catch (err) {
      console.error('GET /api/exam/current error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/exam/register
  app.post('/api/exam/register', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);

      if (!period) return res.status(400).json({ error: 'Nenhuma período de exame ativo' });

      const [evaluation] = await db
        .select()
        .from(senseiEvaluations)
        .where(
          and(
            eq(senseiEvaluations.user_id, userId),
            eq(senseiEvaluations.exam_period_id, period.id),
          ),
        )
        .limit(1);

      if (!evaluation || !evaluation.is_eligible) {
        return res.status(403).json({ error: 'Aluno não elegível para o exame' });
      }

      const [existing] = await db
        .select()
        .from(examRegistrations)
        .where(
          and(
            eq(examRegistrations.user_id, userId),
            eq(examRegistrations.exam_period_id, period.id),
          ),
        )
        .limit(1);

      if (existing) return res.status(409).json({ error: 'Já inscrito neste exame' });

      const targetBelt = getNextBelt(req.user!.current_belt as Belt);

      const [registration] = await db
        .insert(examRegistrations)
        .values({
          user_id: userId,
          exam_period_id: period.id,
          target_belt: targetBelt,
          payment_status: 'PENDENTE',
        })
        .returning();

      return res.status(201).json(registration);
    } catch (err) {
      console.error('POST /api/exam/register error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // ─────────────────────────────────────────────
  // SENSEI routes
  // ─────────────────────────────────────────────

  // GET /api/sensei/students
  app.get('/api/sensei/students', isAuthenticated, isSensei, async (req, res) => {
    try {
      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);

      const allStudents = await db
        .select()
        .from(users)
        .where(eq(users.is_sensei, false));

      if (!period) {
        const result = allStudents.map(({ password_hash: _, ...u }) => ({
          user: u,
          evaluation: null,
          registration: null,
        }));
        return res.json(result);
      }

      const evaluations = await db
        .select()
        .from(senseiEvaluations)
        .where(eq(senseiEvaluations.exam_period_id, period.id));

      const registrations = await db
        .select()
        .from(examRegistrations)
        .where(eq(examRegistrations.exam_period_id, period.id));

      const result = allStudents.map(({ password_hash: _, ...u }) => ({
        user: u,
        evaluation: evaluations.find((e) => e.user_id === u.id) ?? null,
        registration: registrations.find((r) => r.user_id === u.id) ?? null,
      }));

      return res.json(result);
    } catch (err) {
      console.error('GET /api/sensei/students error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/sensei/evaluate
  app.post('/api/sensei/evaluate', isAuthenticated, isSensei, async (req, res) => {
    try {
      const { userId, isEligible } = req.body as { userId: number; isEligible: boolean };
      if (userId == null || isEligible == null) {
        return res.status(400).json({ error: 'userId e isEligible são obrigatórios' });
      }

      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);

      if (!period) return res.status(400).json({ error: 'Nenhum período de exame ativo' });

      const [evaluation] = await db
        .insert(senseiEvaluations)
        .values({
          user_id: userId,
          exam_period_id: period.id,
          sensei_id: req.user!.id,
          is_eligible: isEligible,
        })
        .onConflictDoUpdate({
          target: [senseiEvaluations.user_id, senseiEvaluations.exam_period_id],
          set: {
            is_eligible: isEligible,
            sensei_id: req.user!.id,
            evaluated_at: new Date(),
          },
        })
        .returning();

      return res.json(evaluation);
    } catch (err) {
      console.error('POST /api/sensei/evaluate error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // ─────────────────────────────────────────────
  // ADMIN routes
  // ─────────────────────────────────────────────

  // POST /api/admin/login
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password: string };
    if (!password) return res.status(400).json({ error: 'Senha obrigatória' });

    const inputHash = sha256(password);
    const adminHash = sha256(process.env.ADMIN_PASSWORD || '');

    if (
      inputHash.length !== adminHash.length ||
      !crypto.timingSafeEqual(inputHash, adminHash)
    ) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    req.session.isAdmin = true;
    return res.json({ ok: true });
  });

  // POST /api/admin/logout
  app.post('/api/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    return res.json({ ok: true });
  });

  // GET /api/admin/exam-period
  app.get('/api/admin/exam-period', isAdminSession, async (req, res) => {
    try {
      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);
      return res.json(period ?? null);
    } catch (err) {
      console.error('GET /api/admin/exam-period error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/admin/exam-period
  app.post('/api/admin/exam-period', isAdminSession, async (req, res) => {
    try {
      const { active, examDate, registrationDeadline, examPrice, pixKey } = req.body as {
        active: boolean;
        examDate: string;
        registrationDeadline: string;
        examPrice: string;
        pixKey: string;
      };

      await db.update(examPeriods).set({ active: false }).where(eq(examPeriods.active, true));

      const [period] = await db
        .insert(examPeriods)
        .values({
          active: active ?? true,
          exam_date: examDate,
          registration_deadline: registrationDeadline,
          exam_price: examPrice ?? '290.00',
          pix_key: pixKey ?? '19998098584',
        })
        .returning();

      return res.status(201).json(period);
    } catch (err) {
      console.error('POST /api/admin/exam-period error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // GET /api/admin/users
  app.get('/api/admin/users', isAdminSession, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const safe = allUsers.map(({ password_hash: _, ...u }) => u);
      return res.json(safe);
    } catch (err) {
      console.error('GET /api/admin/users error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/admin/users
  app.post('/api/admin/users', isAdminSession, async (req, res) => {
    try {
      const { email, studentName, currentBelt, classGroup, isSenseiFlag } = req.body as {
        email: string;
        studentName: string;
        currentBelt: Belt;
        classGroup?: string;
        isSenseiFlag?: boolean;
      };

      const passwordHash = await bcrypt.hash('A123456b!', 12);

      const [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          student_name: studentName,
          current_belt: currentBelt ?? 'Branca',
          class_group: classGroup ?? null,
          is_sensei: isSenseiFlag ?? false,
        })
        .returning();

      const { password_hash: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (err) {
      console.error('POST /api/admin/users error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/admin/users/:id/reset-password
  app.post('/api/admin/users/:id/reset-password', isAdminSession, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const passwordHash = await bcrypt.hash('A123456b!', 12);

      await db
        .update(users)
        .set({ password_hash: passwordHash, updated_at: new Date() })
        .where(eq(users.id, id));

      return res.json({ ok: true });
    } catch (err) {
      console.error('POST /api/admin/users/:id/reset-password error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // GET /api/admin/registrations
  app.get('/api/admin/registrations', isAdminSession, async (req, res) => {
    try {
      const [period] = await db
        .select()
        .from(examPeriods)
        .where(eq(examPeriods.active, true))
        .limit(1);

      if (!period) return res.json([]);

      const registrations = await db
        .select({
          registration: examRegistrations,
          user: {
            id: users.id,
            email: users.email,
            student_name: users.student_name,
            current_belt: users.current_belt,
            class_group: users.class_group,
          },
        })
        .from(examRegistrations)
        .innerJoin(users, eq(examRegistrations.user_id, users.id))
        .where(eq(examRegistrations.exam_period_id, period.id));

      return res.json(registrations);
    } catch (err) {
      console.error('GET /api/admin/registrations error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // PATCH /api/admin/registrations/:id
  app.patch('/api/admin/registrations/:id', isAdminSession, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

      const { paymentStatus } = req.body as { paymentStatus: string };
      if (!paymentStatus) return res.status(400).json({ error: 'paymentStatus obrigatório' });

      const confirmedAt = paymentStatus === 'CONFIRMADO' ? new Date() : null;

      const [updated] = await db
        .update(examRegistrations)
        .set({ payment_status: paymentStatus, confirmed_at: confirmedAt })
        .where(eq(examRegistrations.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Inscrição não encontrada' });

      return res.json(updated);
    } catch (err) {
      console.error('PATCH /api/admin/registrations/:id error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });
}
