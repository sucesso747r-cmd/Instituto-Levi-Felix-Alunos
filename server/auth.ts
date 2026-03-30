import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';
import pg from 'pg';
import { db } from './db.js';
import { users, passwordResetTokens } from '@shared/schema.js';
import { eq, and, gt } from 'drizzle-orm';

const { Pool } = pg;

declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      student_name: string;
      current_belt: string;
      class_group: string | null;
      is_sensei: boolean;
      created_at: Date;
      updated_at: Date;
    }
  }
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Não autenticado' });
}

export function isSensei(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.is_sensei === true) return next();
  res.status(401).json({ error: 'Acesso negado' });
}

export function isAdminSession(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin === true) return next();
  res.status(401).json({ error: 'Acesso administrativo necessário' });
}

export function setupAuth(app: Express) {
  const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({ pool: sessionPool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || 'change-this-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.COOKIE_SECURE === 'true',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase().trim()));

        if (!user) return done(null, false, { message: 'Email ou senha inválidos' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return done(null, false, { message: 'Email ou senha inválidos' });

        const { password_hash: _, ...safeUser } = user;
        return done(null, safeUser as Express.User);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return done(null, false);
      const { password_hash: _, ...safeUser } = user;
      done(null, safeUser as Express.User);
    } catch (err) {
      done(err);
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: unknown, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || 'Email ou senha inválidos' });
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(user);
      });
    })(req, res, next);
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  // POST /api/auth/forgot-password
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body as { email: string };
      if (!email) return res.status(400).json({ error: 'Email obrigatório' });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      // Always return success to avoid user enumeration
      if (!user) return res.json({ ok: true });

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });

      const resetUrl = `${process.env.BASE_URL}/reset-password?token=${token}`;
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'Instituto Levi Felix <noreply@institutolevifelix.com.br>',
        to: user.email,
        subject: 'Redefinição de senha — Instituto Levi Felix',
        html: `
          <p>Olá, ${user.student_name}!</p>
          <p>Você solicitou a redefinição da sua senha. Clique no link abaixo:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>Este link expira em 1 hora.</p>
          <p>Se não foi você, ignore este email.</p>
        `,
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error('forgot-password error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body as { token: string; password: string };
      if (!token || !password) return res.status(400).json({ error: 'Token e senha obrigatórios' });

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.used, false),
            gt(passwordResetTokens.expires_at, new Date()),
          ),
        );

      if (!resetToken) return res.status(400).json({ error: 'Token inválido ou expirado' });

      const passwordHash = await bcrypt.hash(password, 12);

      await db
        .update(users)
        .set({ password_hash: passwordHash })
        .where(eq(users.id, resetToken.user_id));

      return res.json({ ok: true });
    } catch (err) {
      console.error('reset-password error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  });
}
