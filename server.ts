import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './src/db/index.ts';
import {
  adminAuditLogs,
  aiActivityLogs,
  aiFeedback,
  educationalSafetyContent,
  evidence,
  evidenceRelationships,
  investigations,
  paymentSafetyChecks,
  rescueCases,
  riskIndicators,
  scamCategories,
  sharedWarnings,
  supportRequests,
  trustedContacts,
  users,
} from './src/db/schema.ts';
import {
  countAdminUsers,
  ensureControlledInitialAdmin,
  ensureDefaultGovernanceSeed,
  findUserByEmail,
  findUserById,
  findUserByUid,
} from './src/db/users.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  AuthRequest,
  createSessionToken,
  logAdminAction,
  logAiActivity,
  rateLimit,
  requireAdmin,
  requireAuth,
  serializeUser,
  verifySessionToken,
} from './server/auth.ts';
import {
  analyzeEvidenceWithGemini,
  analyzeManipulationWithGemini,
  generateSafetySpeechWithGemini,
  reconstructScamStoryWithGemini,
  transcribeAudioWithGemini,
} from './server/geminiService.ts';
import {
  analyzeUrlStructure,
  calculateTransparentRiskScore,
  evaluatePaymentSafety,
  redactSensitiveText,
} from './server/riskEngine.ts';
import { SYNTHETIC_DEMO_CASE, SYNTHETIC_SAMPLE_SCENARIOS } from './server/syntheticScenarios.ts';
import { runSyntheticEvaluationSuite } from './server/evaluationRunner.ts';

const PORT = Number(process.env.PORT) || 3000;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Upload PNG, JPG, WEBP, MP3, WAV, WEBM, OGG, or TXT.'));
    }
  },
});

function genCode(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function handleGeminiError(res: express.Response, err: any, fallbackMessage: string) {
  console.error(fallbackMessage, err);
  const msg = String(err?.message || '');
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
    return res.status(503).json({
      error: 'AI analysis service credentials are invalid or missing. Check Gemini API settings in Secrets.',
    });
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return res.status(429).json({
      error: 'AI service rate limit reached. Please wait a few seconds and try again.',
    });
  }
  return res.status(500).json({
    error: err?.message || fallbackMessage,
  });
}

async function runTrackedAi<T>(
  userId: number | null,
  module: string,
  modelName: string,
  fn: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    await logAiActivity({
      userId,
      module,
      modelName,
      status: 'success',
      latencyMs: Date.now() - started,
    });
    return result;
  } catch (err: any) {
    const msg = String(err?.message || 'AI error');
    const code = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
      ? 'RATE_LIMIT'
      : msg.includes('API_KEY') || msg.includes('PERMISSION_DENIED')
        ? 'AUTH_ERROR'
        : 'AI_FAILURE';
    await logAiActivity({
      userId,
      module,
      modelName,
      status: 'error',
      latencyMs: Date.now() - started,
      errorCode: code,
      errorMessage: msg,
    });
    throw err;
  }
}

async function recalculateInvestigationRisk(investigationId: number, userId: number) {
  const evItems = await db
    .select()
    .from(evidence)
    .where(and(eq(evidence.investigationId, investigationId), eq(evidence.userId, userId)))
    .orderBy(evidence.createdAt);

  const activeCategories = await db
    .select()
    .from(scamCategories)
    .where(eq(scamCategories.isActive, true));

  const customRuleWeights: Record<string, number> = {};
  for (const cat of activeCategories) {
    const key = cat.ruleWeightsJson?.indicatorKey;
    const w = cat.ruleWeightsJson?.weight;
    if (key && typeof w === 'number') {
      customRuleWeights[key] = w;
    }
  }

  const allIndicators = evItems.flatMap((ev) =>
    (ev.detectedIndicators || []).map((ind) => ({
      type: ind.type,
      severity: (ind.severity as any) || 'moderate',
      evidence: ind.evidence,
      explanation: ind.explanation,
    }))
  );

  const risk = calculateTransparentRiskScore(allIndicators, {
    hasEvidence: evItems.length > 0,
    customRuleWeights,
  });

  await db.delete(riskIndicators).where(eq(riskIndicators.investigationId, investigationId));

  if (risk.scoredIndicators.length > 0) {
    await db.insert(riskIndicators).values(
      risk.scoredIndicators.map((ind) => ({
        investigationId,
        indicatorType: ind.type,
        category: 'risk_rule',
        severity: ind.severity,
        weight: ind.appliedPoints,
        detected: ind.detected,
        supportingEvidence: ind.supportingEvidence,
        explanation: ind.explanation,
      }))
    );
  }

  await db
    .update(investigations)
    .set({
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      recommendedActions: risk.recommendedActions,
      updatedAt: new Date(),
    })
    .where(and(eq(investigations.id, investigationId), eq(investigations.userId, userId)));

  return risk;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Run idempotent startup seeding in the background so port 3000 opens immediately on cold start
  void Promise.all([
    ensureControlledInitialAdmin(),
    ensureDefaultGovernanceSeed(),
  ]).catch((err) => {
    console.error('Background startup seed error:', err);
  });

  // Health check
  app.get('/api/health', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.json({
        ok: true,
        service: 'FINSHIELD AI',
        database: 'connected',
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      });
    } catch {
      res.status(500).json({ ok: false, service: 'FINSHIELD AI', database: 'error' });
    }
  });

  // Public synthetic scenarios catalog (clearly labeled synthetic)
  app.get('/api/synthetic/scenarios', (_req, res) => {
    res.json({
      isSynthetic: true,
      scenarios: SYNTHETIC_SAMPLE_SCENARIOS,
      demoInvestigation: SYNTHETIC_DEMO_CASE,
    });
  });

  // Public or authenticated synthetic benchmark evaluation
  app.post('/api/evaluation/run', rateLimit(5, 60_000), async (_req, res) => {
    try {
      const report = await runSyntheticEvaluationSuite();
      res.json(report);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to run synthetic evaluation suite.');
    }
  });

  // Contact / Support form handler (public, persisted to PostgreSQL)
  app.post('/api/contact', rateLimit(15, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2).max(120),
        email: z.string().email(),
        topic: z.string().min(2).max(120),
        message: z.string().min(10).max(2000),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please complete all fields with valid details.' });
      }

      let optionalUserId: number | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer fs1.')) {
        const dec = verifySessionToken(authHeader.slice(7).trim());
        if (dec) optionalUserId = dec.userId;
      }

      const refCode = genCode('SUP');
      await db.insert(supportRequests).values({
        referenceCode: refCode,
        userId: optionalUserId,
        name: parsed.data.name.trim(),
        email: parsed.data.email.toLowerCase().trim(),
        topic: parsed.data.topic.trim(),
        message: redactSensitiveText(parsed.data.message.trim()),
        status: 'open',
      });

      res.status(201).json({
        submitted: true,
        referenceId: refCode,
        receivedAt: new Date().toISOString(),
        note: 'For urgent active financial fraud, call 1930 immediately or report at https://cybercrime.gov.in/.',
      });
    } catch (err) {
      console.error('Contact submission error:', err);
      res.status(500).json({ error: 'Failed to submit support inquiry.' });
    }
  });

  // Public & User Safety Advisories (managed by Admin)
  app.get('/api/safety-advisories', async (req, res) => {
    try {
      const lang = req.query.lang ? String(req.query.lang) : null;
      const allContent = await db
        .select()
        .from(educationalSafetyContent)
        .where(eq(educationalSafetyContent.isPublished, true))
        .orderBy(desc(educationalSafetyContent.updatedAt));

      const filtered = lang
        ? allContent.filter((c) => c.language === lang)
        : allContent;

      const categories = await db
        .select()
        .from(scamCategories)
        .where(eq(scamCategories.isActive, true))
        .orderBy(scamCategories.id);

      res.json({
        advisories: filtered.length > 0 ? filtered : allContent,
        categories,
      });
    } catch (err) {
      console.error('Safety advisories error:', err);
      res.status(500).json({ error: 'Failed to load safety advisories.' });
    }
  });

  // ==================== USER AUTHENTICATION ====================

  app.post('/api/auth/register', rateLimit(15, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(128),
        preferredLanguage: z.enum(['en', 'hi', 'mr']).optional().default('en'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Please enter a valid name, email address, and password (minimum 8 characters).',
        });
      }

      const existing = await findUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 10);
      const uid = `local_${crypto.randomUUID()}`;
      // Always force role='user' and status='active' regardless of client payload
      const inserted = await db
        .insert(users)
        .values({
          uid,
          name: parsed.data.name.trim(),
          email: parsed.data.email.toLowerCase().trim(),
          passwordHash,
          role: 'user',
          status: 'active',
          preferredLanguage: parsed.data.preferredLanguage,
          lastLoginAt: new Date(),
        })
        .returning();

      const user = inserted[0];
      const token = createSessionToken({
        userId: user.id,
        uid: user.uid,
        email: user.email,
        role: user.role,
      });
      res.status(201).json({
        token,
        user: {
          ...serializeUser(user),
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  app.post('/api/auth/login', rateLimit(20, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid email and password are required.' });
      }

      const user = await findUserByEmail(parsed.data.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({
          error: 'Invalid email or password. If you signed up with Google, use Google Sign-In.',
        });
      }

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          error: 'This account has been suspended by an administrator. Please contact support.',
        });
      }

      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

      const token = createSessionToken({
        userId: user.id,
        uid: user.uid,
        email: user.email,
        role: user.role,
      });
      res.json({
        token,
        user: {
          ...serializeUser(user),
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  });

  app.post('/api/auth/forgot-password', rateLimit(10, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const user = await findUserByEmail(parsed.data.email);
      if (!user || !user.passwordHash) {
        return res.json({
          sent: true,
          message:
            'If an email/password account matches that address, a single-use 15-minute recovery code has been issued.',
        });
      }

      const resetCode = String(crypto.randomInt(100000, 999999));
      const resetTokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');
      const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db
        .update(users)
        .set({ resetTokenHash, resetTokenExpiresAt })
        .where(eq(users.id, user.id));

      const hasSmtp = Boolean(process.env.SMTP_HOST);
      res.json({
        sent: true,
        message: hasSmtp
          ? 'If an email/password account matches that address, a recovery code has been sent.'
          : 'No external email server is configured in this workspace. Use the one-time 15-minute verification code below to reset your password.',
        sandboxCode: !hasSmtp && process.env.NODE_ENV !== 'production' ? resetCode : undefined,
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Unable to initiate password reset.' });
    }
  });

  app.post('/api/auth/reset-password', rateLimit(10, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        resetCode: z.string().min(6).max(64),
        newPassword: z.string().min(8).max(128),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Valid email, verification code, and new password (min 8 characters) are required.',
        });
      }

      const user = await findUserByEmail(parsed.data.email);
      if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
        return res.status(400).json({ error: 'Invalid or expired recovery code.' });
      }

      if (new Date() > new Date(user.resetTokenExpiresAt)) {
        return res.status(400).json({ error: 'Recovery code has expired. Request a new code.' });
      }

      const suppliedHash = crypto
        .createHash('sha256')
        .update(parsed.data.resetCode.trim())
        .digest('hex');
      const a = Buffer.from(suppliedHash);
      const b = Buffer.from(user.resetTokenHash);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(400).json({ error: 'Invalid recovery code.' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
      await db
        .update(users)
        .set({
          passwordHash,
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));

      res.json({ reset: true, message: 'Password updated successfully. You may now sign in.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Failed to reset password.' });
    }
  });

  app.post('/api/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(128),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Current password and new password (min 8 chars) are required.' });
      }

      const fullUser = await findUserById(req.dbUser!.id);
      if (!fullUser || !fullUser.passwordHash) {
        return res.status(400).json({ error: 'Password changes apply only to email/password accounts.' });
      }

      const valid = await bcrypt.compare(parsed.data.currentPassword, fullUser.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
      await db.update(users).set({ passwordHash }).where(eq(users.id, fullUser.id));
      res.json({ updated: true });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ loggedOut: true });
  });

  // Sync Firebase Google user and return DB profile
  app.post('/api/auth/firebase', requireAuth, async (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        name: z.string().min(2).max(100).optional(),
        preferredLanguage: z.enum(['en', 'hi', 'mr']).optional(),
        retentionDays: z.number().int().min(7).max(365).optional(),
        redactSensitive: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid profile settings.' });
      }

      const updates: Partial<typeof users.$inferInsert> = {};
      if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
      if (parsed.data.preferredLanguage !== undefined)
        updates.preferredLanguage = parsed.data.preferredLanguage;
      if (parsed.data.retentionDays !== undefined) updates.retentionDays = parsed.data.retentionDays;
      if (parsed.data.redactSensitive !== undefined)
        updates.redactSensitive = parsed.data.redactSensitive;

      const updated = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, req.dbUser!.id))
        .returning();

      res.json({ user: serializeUser(updated[0]) });
    } catch (err) {
      console.error('Profile update error:', err);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  });

  app.delete('/api/profile/data', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      await db.delete(investigations).where(eq(investigations.userId, userId));
      await db.delete(paymentSafetyChecks).where(eq(paymentSafetyChecks.userId, userId));
      await db.delete(rescueCases).where(eq(rescueCases.userId, userId));
      await db.delete(trustedContacts).where(eq(trustedContacts.userId, userId));
      await db.delete(aiFeedback).where(eq(aiFeedback.userId, userId));
      res.json({ deleted: true });
    } catch (err) {
      console.error('Delete user data error:', err);
      res.status(500).json({ error: 'Failed to delete user records.' });
    }
  });

  // ==================== INVESTIGATIONS ====================

  app.get('/api/investigations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const rows = await db
        .select()
        .from(investigations)
        .where(eq(investigations.userId, userId))
        .orderBy(desc(investigations.createdAt));

      const evRows = await db.select().from(evidence).where(eq(evidence.userId, userId));
      const countByInv = new Map<number, number>();
      for (const e of evRows) {
        countByInv.set(e.investigationId, (countByInv.get(e.investigationId) || 0) + 1);
      }

      res.json({
        investigations: rows.map((inv) => ({
          ...inv,
          evidenceCount: countByInv.get(inv.id) || 0,
        })),
      });
    } catch (err) {
      console.error('Fetch investigations error:', err);
      res.status(500).json({ error: 'Failed to load investigations.' });
    }
  });

  app.get('/api/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const riskFilter = String(req.query.risk || 'ALL').toUpperCase();
      const search = String(req.query.q || '').trim().toLowerCase();

      const rows = await db
        .select()
        .from(investigations)
        .where(eq(investigations.userId, userId))
        .orderBy(desc(investigations.createdAt));

      const evRows = await db.select().from(evidence).where(eq(evidence.userId, userId));
      const countByInv = new Map<number, number>();
      for (const e of evRows) {
        countByInv.set(e.investigationId, (countByInv.get(e.investigationId) || 0) + 1);
      }

      const filtered = rows
        .map((inv) => ({
          ...inv,
          evidenceCount: countByInv.get(inv.id) || 0,
        }))
        .filter((inv) => {
          if (riskFilter !== 'ALL' && inv.riskLevel.toUpperCase() !== riskFilter) return false;
          if (
            search &&
            !inv.title.toLowerCase().includes(search) &&
            !inv.investigationCode.toLowerCase().includes(search)
          ) {
            return false;
          }
          return true;
        });

      res.json({ history: filtered });
    } catch (err) {
      console.error('History error:', err);
      res.status(500).json({ error: 'Failed to load investigation history.' });
    }
  });

  app.post('/api/investigations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        title: z.string().min(2).max(160),
        suspectedCategory: z.string().optional().default('Pending Analysis'),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Investigation title is required.' });
      }

      const created = await db
        .insert(investigations)
        .values({
          investigationCode: genCode('INV'),
          userId: req.dbUser!.id,
          title: parsed.data.title.trim(),
          suspectedCategory: parsed.data.suspectedCategory,
          riskLevel: 'LOW',
          riskScore: 0,
          status: 'active',
        })
        .returning();

      res.status(201).json({ investigation: created[0] });
    } catch (err) {
      console.error('Create investigation error:', err);
      res.status(500).json({ error: 'Failed to create investigation.' });
    }
  });

  // Load clearly labeled SYNTHETIC DEMONSTRATION DATA and analyze with real Gemini + Risk Engine
  app.post('/api/investigations/seed-demo', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userId = req.dbUser!.id;
      const lang = req.dbUser!.preferredLanguage || 'en';
      const createdInv = await db
        .insert(investigations)
        .values({
          investigationCode: genCode('DEMO'),
          userId,
          title: SYNTHETIC_DEMO_CASE.title,
          suspectedCategory: SYNTHETIC_DEMO_CASE.suspectedCategory,
          summary: SYNTHETIC_DEMO_CASE.summary,
          status: 'active',
          isSyntheticDemo: true,
        })
        .returning();

      const inv = createdInv[0];
      const insertedEvidence: Array<typeof evidence.$inferSelect> = [];

      for (const item of SYNTHETIC_DEMO_CASE.items) {
        const ai = await runTrackedAi(userId, 'evidence_analysis', 'gemini-4-hydrogen', () =>
          analyzeEvidenceWithGemini({
            evidenceType: item.evidenceType,
            rawText: item.rawInput,
            language: lang,
          })
        );

        const evRow = await db
          .insert(evidence)
          .values({
            investigationId: inv.id,
            userId,
            evidenceType: item.evidenceType,
            title: item.title,
            rawInput: item.rawInput,
            extractedText: ai.extracted_text || item.rawInput,
            analysisSummary: ai.summary,
            detectedIndicators: ai.risk_indicators,
            extractedDetails: {
              urls: ai.urls_mentioned,
              amounts: ai.amounts_mentioned,
              upiIds: ai.upi_ids_mentioned,
              phoneNumbers: ai.phone_numbers_mentioned,
              claimedEntity: ai.claimed_entity,
              paymentInstructions: ai.payment_instructions,
            },
            potentialRisks: ai.potential_risks,
            analysisStatus: 'completed',
            eventTimestamp: item.eventTimestamp,
          })
          .returning();

        insertedEvidence.push(evRow[0]);
      }

      // Reconstruct connected story across all 3 items using Gemini
      const story = await runTrackedAi(userId, 'scam_reconstruction', 'gemini-4-hydrogen', () =>
        reconstructScamStoryWithGemini(
          insertedEvidence.map((e, idx) => ({
            index: idx,
            evidenceType: e.evidenceType,
            title: e.title,
            eventTimestamp: e.eventTimestamp,
            extractedText: e.extractedText,
            analysisSummary: e.analysisSummary,
          })),
          lang
        )
      );

      for (const rel of story.relationships) {
        const src = insertedEvidence[rel.source_index];
        const tgt = insertedEvidence[rel.target_index];
        if (src && tgt) {
          await db.insert(evidenceRelationships).values({
            investigationId: inv.id,
            sourceEvidenceId: src.id,
            targetEvidenceId: tgt.id,
            relationshipType: rel.relationship_type,
            eventTime: rel.event_time,
            indicatorLabel: rel.indicator_label,
            explanation: rel.explanation,
          });
        }
      }

      const risk = await recalculateInvestigationRisk(inv.id, userId);

      await db
        .update(investigations)
        .set({
          suspectedCategory: story.suspected_scam_category || inv.suspectedCategory,
          summary: story.investigation_summary,
          explanation: story.evidence_linked_explanation,
          status: 'analyzed',
          updatedAt: new Date(),
        })
        .where(eq(investigations.id, inv.id));

      res.status(201).json({
        investigationId: inv.id,
        risk,
        isSyntheticDemo: true,
      });
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to generate synthetic demo investigation.');
    }
  });

  app.get('/api/investigations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid investigation ID.' });

      const userId = req.dbUser!.id;
      const rows = await db
        .select()
        .from(investigations)
        .where(and(eq(investigations.id, id), eq(investigations.userId, userId)))
        .limit(1);

      if (!rows.length) return res.status(404).json({ error: 'Investigation not found.' });

      const evItems = await db
        .select()
        .from(evidence)
        .where(eq(evidence.investigationId, id))
        .orderBy(evidence.createdAt);

      const indicators = await db
        .select()
        .from(riskIndicators)
        .where(eq(riskIndicators.investigationId, id));

      const relationships = await db
        .select()
        .from(evidenceRelationships)
        .where(eq(evidenceRelationships.investigationId, id));

      res.json({
        investigation: rows[0],
        evidence: evItems,
        riskIndicators: indicators,
        relationships,
      });
    } catch (err) {
      console.error('Get investigation error:', err);
      res.status(500).json({ error: 'Failed to load investigation details.' });
    }
  });

  app.delete('/api/investigations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid investigation ID.' });
      const userId = req.dbUser!.id;

      const deleted = await db
        .delete(investigations)
        .where(and(eq(investigations.id, id), eq(investigations.userId, userId)))
        .returning();

      if (!deleted.length) return res.status(404).json({ error: 'Investigation not found.' });
      res.json({ deleted: true, id });
    } catch (err) {
      console.error('Delete investigation error:', err);
      res.status(500).json({ error: 'Failed to delete investigation.' });
    }
  });

  // ==================== EVIDENCE UPLOAD & ANALYSIS ====================

  app.post(
    '/api/evidence/upload',
    requireAuth,
    rateLimit(30, 60_000),
    upload.single('file'),
    async (req: AuthRequest, res) => {
      try {
        const userId = req.dbUser!.id;
        const lang = String(req.body.language || req.dbUser!.preferredLanguage || 'en');
        const evidenceType = String(req.body.evidenceType || 'screenshot');
        const title = String(req.body.title || req.file?.originalname || 'Submitted Evidence');
        const eventTimestamp = req.body.eventTimestamp ? String(req.body.eventTimestamp) : null;
        let investigationId = req.body.investigationId ? Number(req.body.investigationId) : null;
        const rawTextInput = String(req.body.rawText || '');
        const urlInput = String(req.body.url || '');

        if (!req.file && !rawTextInput.trim() && !urlInput.trim()) {
          return res
            .status(400)
            .json({ error: 'Please provide text, a URL, an image screenshot, or an audio recording.' });
        }

        // Create an investigation automatically if none provided
        if (!investigationId) {
          const invCreated = await db
            .insert(investigations)
            .values({
              investigationCode: genCode('INV'),
              userId,
              title: title.slice(0, 120),
              status: 'active',
            })
            .returning();
          investigationId = invCreated[0].id;
        } else {
          const owns = await db
            .select()
            .from(investigations)
            .where(and(eq(investigations.id, investigationId), eq(investigations.userId, userId)))
            .limit(1);
          if (!owns.length) {
            return res.status(404).json({ error: 'Target investigation not found.' });
          }
        }

        let extractedText = rawTextInput.trim();
        let fileReference: string | null = null;
        let mimeType: string | null = null;
        let imageBase64: string | undefined;
        let imageMimeType: string | undefined;
        let urlCharacteristics: string[] = [];
        let urlContextNote = '';
        let speechNote = '';

        if (req.file) {
          const fileMime = req.file.mimetype;
          mimeType = fileMime;
          fileReference = req.file.originalname;
          if (fileMime.startsWith('image/')) {
            imageBase64 = req.file.buffer.toString('base64');
            imageMimeType = fileMime;
          } else if (fileMime.startsWith('audio/')) {
            const audioB64 = req.file.buffer.toString('base64');
            const stt = await runTrackedAi(userId, 'audio_transcription', 'gemini-3.5-transcribe', () =>
              transcribeAudioWithGemini(audioB64, fileMime)
            );
            extractedText = stt.transcript || '[No discernible speech detected in audio]';
            speechNote = stt.note;
          } else if (fileMime === 'text/plain') {
            extractedText = req.file.buffer.toString('utf8');
          }
        }

        if (urlInput.trim()) {
          const urlInfo = analyzeUrlStructure(urlInput.trim());
          urlCharacteristics = urlInfo.characteristics;
          urlContextNote = `URL=${urlInfo.url}; Host=${urlInfo.hostname}; StructuralFlags=${
            urlInfo.characteristics.join(' | ') || 'None'
          }; Note=${urlInfo.reputationNote}`;
          extractedText = [extractedText, `Submitted URL: ${urlInfo.url}`].filter(Boolean).join('\n');
        }

        if (req.dbUser!.redactSensitive && extractedText) {
          extractedText = redactSensitiveText(extractedText);
        }

        const ai = await runTrackedAi(userId, 'evidence_analysis', 'gemini-4-hydrogen', () =>
          analyzeEvidenceWithGemini({
            evidenceType,
            rawText: extractedText,
            imageBase64,
            imageMimeType,
            urlContextNote,
            language: lang,
          })
        );

        const finalExtracted =
          req.dbUser!.redactSensitive
            ? redactSensitiveText(ai.extracted_text || extractedText)
            : ai.extracted_text || extractedText;

        const insertedEv = await db
          .insert(evidence)
          .values({
            investigationId,
            userId,
            evidenceType,
            title,
            fileReference,
            mimeType,
            rawInput: req.dbUser!.redactSensitive
              ? redactSensitiveText(rawTextInput || urlInput || fileReference || '')
              : rawTextInput || urlInput || fileReference || '',
            extractedText: finalExtracted,
            analysisSummary: speechNote ? `${ai.summary}\n\n${speechNote}` : ai.summary,
            detectedIndicators: ai.risk_indicators,
            extractedDetails: {
              urls: ai.urls_mentioned,
              amounts: ai.amounts_mentioned,
              upiIds: ai.upi_ids_mentioned,
              phoneNumbers: ai.phone_numbers_mentioned,
              claimedEntity: ai.claimed_entity,
              paymentInstructions: ai.payment_instructions,
              domainCharacteristics: urlCharacteristics,
            },
            potentialRisks: ai.potential_risks,
            analysisStatus: 'completed',
            eventTimestamp,
          })
          .returning();

        const risk = await recalculateInvestigationRisk(investigationId, userId);

        res.status(201).json({
          investigationId,
          evidence: insertedEv[0],
          risk,
        });
      } catch (err) {
        return handleGeminiError(res, err, 'Failed to process and analyze uploaded evidence.');
      }
    }
  );

  app.post('/api/evidence/analyze', requireAuth, rateLimit(30, 60_000), async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        investigationId: z.number().int().optional(),
        evidenceType: z.string().min(2).max(50),
        title: z.string().min(1).max(160).optional(),
        rawText: z.string().optional().default(''),
        url: z.string().optional().default(''),
        eventTimestamp: z.string().optional(),
        language: z.enum(['en', 'hi', 'mr']).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success || (!parsed.data.rawText.trim() && !parsed.data.url.trim())) {
        return res.status(400).json({ error: 'Provide message text, transcript, or URL to analyze.' });
      }

      const userId = req.dbUser!.id;
      const lang = parsed.data.language || req.dbUser!.preferredLanguage || 'en';

      let investigationId = parsed.data.investigationId;
      if (!investigationId) {
        const createdInv = await db
          .insert(investigations)
          .values({
            investigationCode: genCode('INV'),
            userId,
            title: (parsed.data.title || `${parsed.data.evidenceType.toUpperCase()} Investigation`).slice(
              0,
              120
            ),
            status: 'active',
          })
          .returning();
        investigationId = createdInv[0].id;
      }

      let urlCharacteristics: string[] = [];
      let urlContextNote = '';
      let content = parsed.data.rawText.trim();

      if (parsed.data.url.trim()) {
        const urlInfo = analyzeUrlStructure(parsed.data.url.trim());
        urlCharacteristics = urlInfo.characteristics;
        urlContextNote = `URL=${urlInfo.url}; Host=${urlInfo.hostname}; StructuralFlags=${
          urlInfo.characteristics.join(' | ') || 'None'
        }; Note=${urlInfo.reputationNote}`;
        content = [content, `Submitted URL: ${urlInfo.url}`].filter(Boolean).join('\n');
      }

      if (req.dbUser!.redactSensitive) {
        content = redactSensitiveText(content);
      }

      const ai = await runTrackedAi(userId, 'evidence_analysis', 'gemini-4-hydrogen', () =>
        analyzeEvidenceWithGemini({
          evidenceType: parsed.data.evidenceType,
          rawText: content,
          urlContextNote,
          language: lang,
        })
      );

      const inserted = await db
        .insert(evidence)
        .values({
          investigationId,
          userId,
          evidenceType: parsed.data.evidenceType,
          title: parsed.data.title || `${parsed.data.evidenceType.toUpperCase()} Evidence`,
          rawInput: content,
          extractedText: ai.extracted_text || content,
          analysisSummary: ai.summary,
          detectedIndicators: ai.risk_indicators,
          extractedDetails: {
            urls: ai.urls_mentioned,
            amounts: ai.amounts_mentioned,
            upiIds: ai.upi_ids_mentioned,
            phoneNumbers: ai.phone_numbers_mentioned,
            claimedEntity: ai.claimed_entity,
            paymentInstructions: ai.payment_instructions,
            domainCharacteristics: urlCharacteristics,
          },
          potentialRisks: ai.potential_risks,
          analysisStatus: 'completed',
          eventTimestamp: parsed.data.eventTimestamp || null,
        })
        .returning();

      const risk = await recalculateInvestigationRisk(investigationId, userId);

      res.status(201).json({
        investigationId,
        evidence: inserted[0],
        risk,
      });
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to analyze evidence.');
    }
  });

  app.delete('/api/evidence/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid evidence ID.' });
      const userId = req.dbUser!.id;

      const deleted = await db
        .delete(evidence)
        .where(and(eq(evidence.id, id), eq(evidence.userId, userId)))
        .returning();

      if (!deleted.length) return res.status(404).json({ error: 'Evidence item not found.' });

      const risk = await recalculateInvestigationRisk(deleted[0].investigationId, userId);
      res.json({ deleted: true, risk });
    } catch (err) {
      console.error('Delete evidence error:', err);
      res.status(500).json({ error: 'Failed to remove evidence.' });
    }
  });

  // ==================== MANIPULATION DETECTION ====================

  app.post('/api/manipulation/analyze', requireAuth, rateLimit(30, 60_000), async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        text: z.string().min(5).max(8000),
        language: z.enum(['en', 'hi', 'mr']).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please provide communication text (at least 5 characters).' });
      }
      const lang = parsed.data.language || req.dbUser!.preferredLanguage || 'en';
      const cleaned = req.dbUser!.redactSensitive
        ? redactSensitiveText(parsed.data.text)
        : parsed.data.text;
      const result = await runTrackedAi(
        req.dbUser!.id,
        'manipulation_detection',
        'gemini-4-hydrogen',
        () => analyzeManipulationWithGemini(cleaned, lang)
      );
      res.json(result);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to analyze psychological manipulation signals.');
    }
  });

  // ==================== SCAM STORY RECONSTRUCTION ====================

  app.post(
    '/api/investigations/reconstruct',
    requireAuth,
    rateLimit(20, 60_000),
    async (req: AuthRequest, res) => {
      try {
        const schema = z.object({
          investigationId: z.number().int(),
          language: z.enum(['en', 'hi', 'mr']).optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: 'Valid investigationId is required.' });
        }

        const userId = req.dbUser!.id;
        const lang = parsed.data.language || req.dbUser!.preferredLanguage || 'en';
        const invRows = await db
          .select()
          .from(investigations)
          .where(
            and(
              eq(investigations.id, parsed.data.investigationId),
              eq(investigations.userId, userId)
            )
          )
          .limit(1);

        if (!invRows.length) return res.status(404).json({ error: 'Investigation not found.' });

        const evItems = await db
          .select()
          .from(evidence)
          .where(eq(evidence.investigationId, parsed.data.investigationId))
          .orderBy(evidence.createdAt);

        if (evItems.length === 0) {
          return res.status(400).json({
            error: 'Submit at least one evidence item before reconstructing the scam story.',
          });
        }

        const story = await runTrackedAi(userId, 'scam_reconstruction', 'gemini-4-hydrogen', () =>
          reconstructScamStoryWithGemini(
            evItems.map((e, idx) => ({
              index: idx,
              evidenceType: e.evidenceType,
              title: e.title,
              eventTimestamp: e.eventTimestamp,
              extractedText: e.extractedText,
              analysisSummary: e.analysisSummary,
            })),
            lang
          )
        );

        await db
          .delete(evidenceRelationships)
          .where(eq(evidenceRelationships.investigationId, parsed.data.investigationId));

        for (const rel of story.relationships) {
          const src = evItems[rel.source_index];
          const tgt = evItems[rel.target_index];
          if (src && tgt) {
            await db.insert(evidenceRelationships).values({
              investigationId: parsed.data.investigationId,
              sourceEvidenceId: src.id,
              targetEvidenceId: tgt.id,
              relationshipType: rel.relationship_type,
              eventTime: rel.event_time,
              indicatorLabel: rel.indicator_label,
              explanation: rel.explanation,
            });
          }
        }

        const risk = await recalculateInvestigationRisk(parsed.data.investigationId, userId);

        await db
          .update(investigations)
          .set({
            suspectedCategory: story.suspected_scam_category,
            summary: story.investigation_summary,
            explanation: story.evidence_linked_explanation,
            status: 'analyzed',
            updatedAt: new Date(),
          })
          .where(eq(investigations.id, parsed.data.investigationId));

        res.json({
          reconstruction: story,
          risk,
        });
      } catch (err) {
        return handleGeminiError(res, err, 'Failed to reconstruct scam story.');
      }
    }
  );

  // ==================== EXPLAINABLE RISK ASSESSMENT ====================

  app.post('/api/risk/assess', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        investigationId: z.number().int(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid investigationId is required.' });
      }
      const userId = req.dbUser!.id;
      const inv = await db
        .select()
        .from(investigations)
        .where(
          and(
            eq(investigations.id, parsed.data.investigationId),
            eq(investigations.userId, userId)
          )
        )
        .limit(1);
      if (!inv.length) return res.status(404).json({ error: 'Investigation not found.' });

      const risk = await recalculateInvestigationRisk(parsed.data.investigationId, userId);
      res.json({ investigation: inv[0], risk });
    } catch (err) {
      console.error('Risk assessment error:', err);
      res.status(500).json({ error: 'Failed to compute risk assessment.' });
    }
  });

  // ==================== PAYMENT SAFETY CHECKPOINT ====================

  app.post('/api/payment-safety/check', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        amount: z.string().min(1).max(40),
        purpose: z.string().min(2).max(200),
        recipientFamiliarity: z.enum(['known', 'merchant', 'unknown']),
        contactMethod: z.enum([
          'phone_call',
          'sms',
          'whatsapp',
          'email',
          'in_person',
          'official_app',
        ]),
        requestedByCaller: z.boolean(),
        urgencyInvolved: z.boolean(),
        kycRelated: z.boolean(),
        confidentialInfoAsked: z.boolean(),
        independentlyVerified: z.boolean(),
        saveAssessment: z.boolean().optional().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please complete all payment safety fields.' });
      }

      const evaluation = evaluatePaymentSafety(parsed.data);

      let savedRecord = null;
      if (parsed.data.saveAssessment) {
        const inserted = await db
          .insert(paymentSafetyChecks)
          .values({
            userId: req.dbUser!.id,
            amount: parsed.data.amount,
            purpose: parsed.data.purpose,
            recipientFamiliarity: parsed.data.recipientFamiliarity,
            contactMethod: parsed.data.contactMethod,
            requestedByCaller: parsed.data.requestedByCaller,
            urgencyInvolved: parsed.data.urgencyInvolved,
            kycRelated: parsed.data.kycRelated,
            confidentialInfoAsked: parsed.data.confidentialInfoAsked,
            independentlyVerified: parsed.data.independentlyVerified,
            riskLevel: evaluation.riskLevel,
            riskScore: evaluation.riskScore,
            reasons: evaluation.reasons,
            recommendedAction: evaluation.recommendedAction,
          })
          .returning();
        savedRecord = inserted[0];
      }

      res.json({ evaluation, savedRecord });
    } catch (err) {
      console.error('Payment safety check error:', err);
      res.status(500).json({ error: 'Failed to evaluate payment safety.' });
    }
  });

  app.get('/api/payment-safety/history', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(paymentSafetyChecks)
        .where(eq(paymentSafetyChecks.userId, req.dbUser!.id))
        .orderBy(desc(paymentSafetyChecks.createdAt));
      res.json({ checks: rows });
    } catch (err) {
      console.error('Payment safety history error:', err);
      res.status(500).json({ error: 'Failed to load payment safety checks.' });
    }
  });

  // ==================== FINSHIELD RESCUE ====================

  app.post('/api/rescue/create', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        incidentDate: z.string().min(4).max(30),
        incidentTime: z.string().min(2).max(30),
        amountInvolved: z.string().min(1).max(50),
        paymentMethod: z.string().min(2).max(60),
        transactionReference: z.string().min(2).max(120),
        bankProvider: z.string().min(2).max(100),
        suspectedCategory: z.string().min(2).max(100),
        description: z.string().min(5).max(3000),
        actionsTaken: z.array(z.string()).optional().default([]),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Please complete all required incident details.' });
      }

      // Guardrail: never store OTP/PIN/CVV strings even if accidentally typed in description
      const sanitizedDescription = redactSensitiveText(parsed.data.description);
      const rescueCode = genCode('RSC');
      const reportReference = genCode('RPT');

      const pendingActions = [
        'Call 1930 (National Cyber Crime Helpline) immediately if not already called.',
        'Submit official complaint at https://cybercrime.gov.in/ with transaction reference and screenshots.',
        `Contact ${parsed.data.bankProvider} official fraud-dispute desk to report Transaction Ref: ${parsed.data.transactionReference}.`,
        'Preserve all SMS, call logs, UPI screenshots, and bank statement entries.',
      ];

      const timelineEvents = [
        {
          time: `${parsed.data.incidentDate} ${parsed.data.incidentTime}`,
          title: 'Reported Financial Incident',
          detail: `${parsed.data.suspectedCategory} involving ${parsed.data.amountInvolved} via ${parsed.data.paymentMethod} (Ref: ${parsed.data.transactionReference}).`,
        },
        {
          time: new Date().toISOString().slice(0, 16).replace('T', ' '),
          title: 'FINSHIELD RESCUE Case Organised',
          detail: 'Incident dossier created for official reporting preparation.',
        },
      ];

      const created = await db
        .insert(rescueCases)
        .values({
          rescueCode,
          userId: req.dbUser!.id,
          incidentDate: parsed.data.incidentDate,
          incidentTime: parsed.data.incidentTime,
          amountInvolved: parsed.data.amountInvolved,
          paymentMethod: parsed.data.paymentMethod,
          transactionReference: parsed.data.transactionReference,
          bankProvider: parsed.data.bankProvider,
          suspectedCategory: parsed.data.suspectedCategory,
          description: sanitizedDescription,
          actionsTaken: parsed.data.actionsTaken,
          pendingActions,
          evidenceItems: [],
          timelineEvents,
          reportReference,
          status: 'open',
        })
        .returning();

      res.status(201).json({ rescueCase: created[0] });
    } catch (err) {
      console.error('Rescue creation error:', err);
      res.status(500).json({ error: 'Failed to create rescue case.' });
    }
  });

  app.get('/api/rescue', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(rescueCases)
        .where(eq(rescueCases.userId, req.dbUser!.id))
        .orderBy(desc(rescueCases.createdAt));
      res.json({ rescueCases: rows });
    } catch (err) {
      console.error('List rescue cases error:', err);
      res.status(500).json({ error: 'Failed to load rescue cases.' });
    }
  });

  app.get('/api/rescue/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid rescue case ID.' });
      const rows = await db
        .select()
        .from(rescueCases)
        .where(and(eq(rescueCases.id, id), eq(rescueCases.userId, req.dbUser!.id)))
        .limit(1);
      if (!rows.length) return res.status(404).json({ error: 'Rescue case not found.' });
      res.json({ rescueCase: rows[0] });
    } catch (err) {
      console.error('Get rescue case error:', err);
      res.status(500).json({ error: 'Failed to load rescue case.' });
    }
  });

  app.post(
    '/api/rescue/:id/evidence',
    requireAuth,
    upload.single('file'),
    async (req: AuthRequest, res) => {
      try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid rescue case ID.' });
        const rows = await db
          .select()
          .from(rescueCases)
          .where(and(eq(rescueCases.id, id), eq(rescueCases.userId, req.dbUser!.id)))
          .limit(1);
        if (!rows.length) return res.status(404).json({ error: 'Rescue case not found.' });

        const current = rows[0];
        const newItem = {
          id: crypto.randomUUID().slice(0, 8),
          type: String(req.body.type || 'document'),
          title: String(req.body.title || req.file?.originalname || 'Uploaded Evidence'),
          summary: redactSensitiveText(
            String(req.body.summary || (req.file ? `Attached file: ${req.file.originalname}` : ''))
          ),
          timestamp: String(req.body.timestamp || new Date().toISOString().slice(0, 16).replace('T', ' ')),
          fileReference: req.file?.originalname,
        };

        const updatedEvidence = [...(current.evidenceItems || []), newItem];
        const updatedTimeline = [
          ...(current.timelineEvents || []),
          {
            time: newItem.timestamp,
            title: `Evidence Added: ${newItem.title}`,
            detail: `${newItem.type.toUpperCase()} — ${newItem.summary}`,
          },
        ];

        const updated = await db
          .update(rescueCases)
          .set({
            evidenceItems: updatedEvidence,
            timelineEvents: updatedTimeline,
          })
          .where(eq(rescueCases.id, id))
          .returning();

        res.json({ rescueCase: updated[0] });
      } catch (err) {
        console.error('Rescue evidence error:', err);
        res.status(500).json({ error: 'Failed to attach rescue evidence.' });
      }
    }
  );

  app.get('/api/rescue/:id/report', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid rescue case ID.' });
      const rows = await db
        .select()
        .from(rescueCases)
        .where(and(eq(rescueCases.id, id), eq(rescueCases.userId, req.dbUser!.id)))
        .limit(1);
      if (!rows.length) return res.status(404).json({ error: 'Rescue case not found.' });

      const c = rows[0];
      res.json({
        report: {
          branding: 'FINSHIELD AI',
          incidentId: c.rescueCode,
          reportReference: c.reportReference,
          incidentDate: c.incidentDate,
          incidentTime: c.incidentTime,
          amountInvolved: c.amountInvolved,
          paymentMethod: c.paymentMethod,
          transactionReference: c.transactionReference,
          bankProvider: c.bankProvider,
          suspectedCategory: c.suspectedCategory,
          summary: c.description,
          evidenceIndex: c.evidenceItems,
          chronologicalTimeline: c.timelineEvents,
          actionsTaken: c.actionsTaken,
          pendingActions: c.pendingActions,
          officialGuidance: {
            helpline: '1930 (National Cyber Crime Helpline, India)',
            portal: 'https://cybercrime.gov.in/',
            bankNote: `Contact ${c.bankProvider} through official customer-care channels printed on your card or official website.`,
          },
          mandatoryDisclaimer:
            'This document is an AI-generated evidence-organising report. It is not an official police complaint, legal determination or guarantee of financial recovery.',
        },
      });
    } catch (err) {
      console.error('Rescue report error:', err);
      res.status(500).json({ error: 'Failed to prepare rescue report.' });
    }
  });

  // ==================== TRUSTED CIRCLE ====================

  app.get('/api/contacts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const contacts = await db
        .select()
        .from(trustedContacts)
        .where(eq(trustedContacts.userId, req.dbUser!.id))
        .orderBy(desc(trustedContacts.createdAt));

      const warnings = await db
        .select()
        .from(sharedWarnings)
        .where(eq(sharedWarnings.userId, req.dbUser!.id))
        .orderBy(desc(sharedWarnings.sharedAt));

      res.json({ contacts, sharedWarnings: warnings });
    } catch (err) {
      console.error('Get contacts error:', err);
      res.status(500).json({ error: 'Failed to load trusted contacts.' });
    }
  });

  app.post('/api/contacts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        contactName: z.string().min(2).max(100),
        relationship: z.string().min(2).max(60),
        contactDetails: z.string().min(4).max(120),
        explicitConsentConfirmed: z.literal(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Contact name, relationship, contact details, and explicit consent confirmation are required.',
        });
      }

      const inserted = await db
        .insert(trustedContacts)
        .values({
          userId: req.dbUser!.id,
          contactName: parsed.data.contactName.trim(),
          relationship: parsed.data.relationship.trim(),
          contactDetails: parsed.data.contactDetails.trim(),
          consentStatus: 'granted',
          canReceiveRedactedAlerts: true,
        })
        .returning();

      res.status(201).json({ contact: inserted[0] });
    } catch (err) {
      console.error('Create contact error:', err);
      res.status(500).json({ error: 'Failed to add trusted contact.' });
    }
  });

  app.patch('/api/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid contact ID.' });
      const schema = z.object({
        consentStatus: z.enum(['granted', 'revoked']),
        canReceiveRedactedAlerts: z.boolean(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid permission payload.' });

      const updated = await db
        .update(trustedContacts)
        .set({
          consentStatus: parsed.data.consentStatus,
          canReceiveRedactedAlerts: parsed.data.canReceiveRedactedAlerts,
        })
        .where(and(eq(trustedContacts.id, id), eq(trustedContacts.userId, req.dbUser!.id)))
        .returning();

      if (!updated.length) return res.status(404).json({ error: 'Trusted contact not found.' });
      res.json({ contact: updated[0] });
    } catch (err) {
      console.error('Update contact error:', err);
      res.status(500).json({ error: 'Failed to update contact permissions.' });
    }
  });

  app.delete('/api/contacts/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid contact ID.' });
      const deleted = await db
        .delete(trustedContacts)
        .where(and(eq(trustedContacts.id, id), eq(trustedContacts.userId, req.dbUser!.id)))
        .returning();
      if (!deleted.length) return res.status(404).json({ error: 'Trusted contact not found.' });
      res.json({ deleted: true });
    } catch (err) {
      console.error('Delete contact error:', err);
      res.status(500).json({ error: 'Failed to remove trusted contact.' });
    }
  });

  app.post('/api/contacts/share-warning', requireAuth, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        contactId: z.number().int(),
        investigationId: z.number().int().optional(),
        customMessage: z.string().min(5).max(1000),
        riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
        userApprovedSharing: z.literal(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Explicit user approval is required to share a warning.' });
      }

      const contactRows = await db
        .select()
        .from(trustedContacts)
        .where(
          and(
            eq(trustedContacts.id, parsed.data.contactId),
            eq(trustedContacts.userId, req.dbUser!.id)
          )
        )
        .limit(1);

      if (!contactRows.length) return res.status(404).json({ error: 'Trusted contact not found.' });
      const contact = contactRows[0];
      if (contact.consentStatus !== 'granted' || !contact.canReceiveRedactedAlerts) {
        return res.status(403).json({
          error: 'Sharing permission is revoked for this contact. Re-enable consent before sharing.',
        });
      }

      const redacted = redactSensitiveText(parsed.data.customMessage);
      const inserted = await db
        .insert(sharedWarnings)
        .values({
          userId: req.dbUser!.id,
          contactId: contact.id,
          investigationId: parsed.data.investigationId || null,
          redactedSummary: redacted,
          riskLevel: parsed.data.riskLevel,
        })
        .returning();

      await db
        .update(trustedContacts)
        .set({ lastSharedAt: new Date() })
        .where(eq(trustedContacts.id, contact.id));

      res.status(201).json({
        sharedWarning: inserted[0],
        note: 'Sensitive account/OTP/ID numbers were automatically redacted prior to logging this warning summary.',
      });
    } catch (err) {
      console.error('Share warning error:', err);
      res.status(500).json({ error: 'Failed to share warning.' });
    }
  });

  // ==================== VOICE ASSISTANCE (STT + TTS) ====================

  app.post(
    '/api/voice/transcribe',
    requireAuth,
    rateLimit(20, 60_000),
    upload.single('audio'),
    async (req: AuthRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'Please record or upload an audio file.' });
        }
        const base64Audio = req.file.buffer.toString('base64');
        const stt = await runTrackedAi(
          req.dbUser!.id,
          'audio_transcription',
          'gemini-3.5-transcribe',
          () => transcribeAudioWithGemini(base64Audio, req.file!.mimetype)
        );
        res.json(stt);
      } catch (err) {
        return handleGeminiError(res, err, 'Failed to transcribe audio recording.');
      }
    }
  );

  app.post('/api/voice/tts', requireAuth, rateLimit(20, 60_000), async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        text: z.string().min(2).max(1500),
        language: z.enum(['en', 'hi', 'mr']).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Text is required for speech output.' });
      }
      const lang = parsed.data.language || req.dbUser!.preferredLanguage || 'en';
      const audio = await runTrackedAi(
        req.dbUser!.id,
        'safety_tts',
        'gemini-3.8-flash-lite-tts',
        () => generateSafetySpeechWithGemini(parsed.data.text, lang)
      );
      res.json(audio);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to generate safety speech audio.');
    }
  });

  // ==================== USER AI FEEDBACK & SUPPORT ====================

  app.post('/api/feedback', requireAuth, rateLimit(20, 60_000), async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        investigationId: z.number().int().optional(),
        evidenceId: z.number().int().optional(),
        moduleType: z.enum([
          'evidence',
          'manipulation',
          'reconstruction',
          'risk',
          'payment_safety',
        ]),
        userReason: z.string().min(5).max(1500),
        expectedOutcome: z.string().max(400).optional().default(''),
        reportedContentExcerpt: z.string().max(600).optional().default(''),
        aiPredictedRisk: z.string().max(120).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Please explain why the AI result appears incorrect (minimum 5 characters).',
        });
      }

      const userId = req.dbUser!.id;
      if (parsed.data.investigationId) {
        const ownsInv = await db
          .select({ id: investigations.id })
          .from(investigations)
          .where(
            and(
              eq(investigations.id, parsed.data.investigationId),
              eq(investigations.userId, userId)
            )
          )
          .limit(1);
        if (!ownsInv.length) {
          return res.status(404).json({ error: 'Investigation not found.' });
        }
      }

      const inserted = await db
        .insert(aiFeedback)
        .values({
          userId,
          investigationId: parsed.data.investigationId ?? null,
          evidenceId: parsed.data.evidenceId ?? null,
          moduleType: parsed.data.moduleType,
          userReason: parsed.data.userReason.trim(),
          expectedOutcome: parsed.data.expectedOutcome.trim(),
          reportedContentExcerpt: redactSensitiveText(parsed.data.reportedContentExcerpt.trim()),
          aiPredictedRisk: parsed.data.aiPredictedRisk.trim(),
          status: 'open',
        })
        .returning();

      res.status(201).json({ feedback: inserted[0] });
    } catch (err) {
      console.error('AI feedback submit error:', err);
      res.status(500).json({ error: 'Failed to submit feedback.' });
    }
  });

  app.get('/api/feedback/my', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(aiFeedback)
        .where(eq(aiFeedback.userId, req.dbUser!.id))
        .orderBy(desc(aiFeedback.createdAt));
      res.json({ feedback: rows });
    } catch (err) {
      console.error('Load user feedback error:', err);
      res.status(500).json({ error: 'Failed to load submitted feedback.' });
    }
  });

  app.post('/api/support', requireAuth, rateLimit(15, 60_000), async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        topic: z.string().min(2).max(120),
        message: z.string().min(8).max(2000),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Topic and message (min 8 chars) are required.' });
      }
      const refCode = genCode('SUP');
      const inserted = await db
        .insert(supportRequests)
        .values({
          referenceCode: refCode,
          userId: req.dbUser!.id,
          name: req.dbUser!.name,
          email: req.dbUser!.email,
          topic: parsed.data.topic.trim(),
          message: redactSensitiveText(parsed.data.message.trim()),
          status: 'open',
        })
        .returning();

      res.status(201).json({ ticket: inserted[0] });
    } catch (err) {
      console.error('User support request error:', err);
      res.status(500).json({ error: 'Failed to submit support request.' });
    }
  });

  app.get('/api/support/my', requireAuth, async (req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(supportRequests)
        .where(eq(supportRequests.userId, req.dbUser!.id))
        .orderBy(desc(supportRequests.createdAt));
      res.json({ tickets: rows });
    } catch (err) {
      console.error('Load user support tickets error:', err);
      res.status(500).json({ error: 'Failed to load support tickets.' });
    }
  });

  // ==================== ADMIN AUTHENTICATION & BOOTSTRAP ====================

  app.get('/api/admin/bootstrap-status', async (_req, res) => {
    try {
      const adminCount = await countAdminUsers();
      res.json({
        hasAdmin: adminCount > 0,
        setupSecretConfigured: Boolean(process.env.ADMIN_SETUP_SECRET),
      });
    } catch (err) {
      console.error('Bootstrap status error:', err);
      res.status(500).json({ error: 'Unable to check administrator setup status.' });
    }
  });

  app.post('/api/admin/bootstrap', rateLimit(5, 60_000), async (req, res) => {
    try {
      const adminCount = await countAdminUsers();
      if (adminCount > 0) {
        return res.status(403).json({
          error: 'An administrator account already exists. Use the Admin Login page.',
        });
      }

      const expectedSecret = (process.env.ADMIN_SETUP_SECRET || '').trim();
      if (!expectedSecret) {
        return res.status(403).json({
          error:
            'Initial administrator setup requires ADMIN_SETUP_SECRET or ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD in server environment.',
        });
      }

      const schema = z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(10).max(128),
        setupSecret: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Provide name, valid email, password (min 10 chars), and setup secret.',
        });
      }

      const providedBuf = Buffer.from(parsed.data.setupSecret.trim());
      const expectedBuf = Buffer.from(expectedSecret);
      if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
        return res.status(403).json({ error: 'Invalid administrator setup secret.' });
      }

      const existing = await findUserByEmail(parsed.data.email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const inserted = await db
        .insert(users)
        .values({
          uid: `admin_${crypto.randomUUID()}`,
          name: parsed.data.name.trim(),
          email: parsed.data.email.toLowerCase().trim(),
          passwordHash,
          role: 'admin',
          status: 'active',
          preferredLanguage: 'en',
          lastLoginAt: new Date(),
        })
        .returning();

      const adminUser = inserted[0];
      await logAdminAction({
        adminUserId: adminUser.id,
        action: 'admin_bootstrap_created',
        targetType: 'user',
        targetId: adminUser.id,
        details: { email: adminUser.email },
        ipAddress: req.ip || '',
      });

      const token = createSessionToken({
        userId: adminUser.id,
        uid: adminUser.uid,
        email: adminUser.email,
        role: 'admin',
      });
      res.status(201).json({ token, user: serializeUser(adminUser) });
    } catch (err) {
      console.error('Admin bootstrap error:', err);
      res.status(500).json({ error: 'Failed to initialize administrator account.' });
    }
  });

  app.post('/api/admin/auth/login', rateLimit(15, 60_000), async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid administrator email and password are required.' });
      }

      const user = await findUserByEmail(parsed.data.email);
      if (!user || !user.passwordHash) {
        await logAdminAction({
          adminUserId: null,
          action: 'admin_login_failed',
          targetType: 'auth',
          details: { email: parsed.data.email.toLowerCase(), reason: 'unknown_account' },
          ipAddress: req.ip || '',
        });
        return res.status(401).json({ error: 'Invalid administrator credentials.' });
      }

      const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!validPassword) {
        await logAdminAction({
          adminUserId: user.role === 'admin' ? user.id : null,
          action: 'admin_login_failed',
          targetType: 'auth',
          targetId: user.id,
          details: { email: user.email, reason: 'bad_password' },
          ipAddress: req.ip || '',
        });
        return res.status(401).json({ error: 'Invalid administrator credentials.' });
      }

      if (user.role !== 'admin') {
        await logAdminAction({
          adminUserId: null,
          action: 'admin_login_denied_non_admin',
          targetType: 'user',
          targetId: user.id,
          details: { email: user.email },
          ipAddress: req.ip || '',
        });
        return res.status(403).json({
          error: 'Access denied. This portal is restricted to authorized FINSHIELD AI administrators.',
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Administrator account is suspended.' });
      }

      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
      await logAdminAction({
        adminUserId: user.id,
        action: 'admin_login_success',
        targetType: 'auth',
        targetId: user.id,
        details: { email: user.email },
        ipAddress: req.ip || '',
      });

      const token = createSessionToken({
        userId: user.id,
        uid: user.uid,
        email: user.email,
        role: 'admin',
      });
      res.json({ token, user: serializeUser(user) });
    } catch (err) {
      console.error('Admin login error:', err);
      res.status(500).json({ error: 'Administrator authentication failed.' });
    }
  });

  app.post('/api/admin/auth/google', rateLimit(15, 60_000), async (req, res) => {
    const authHeader = req.headers.authorization;
    const headerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '';
    const bodyToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    const idToken = bodyToken || headerToken;

    if (!idToken) {
      return res.status(401).json({ error: 'Google ID token is required.' });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error('Admin Google token verification error:', err);
      return res.status(401).json({ error: 'Invalid or expired Google Sign-In credentials.' });
    }

    try {
      const email = (decoded.email || '').toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ error: 'Verified Google account has no email address.' });
      }

      let user = await findUserByUid(decoded.uid);
      if (!user) {
        user = await findUserByEmail(email);
      }

      // Controlled initial admin setup via ADMIN_EMAIL env var if zero admins exist
      if ((!user || user.role !== 'admin') && process.env.ADMIN_EMAIL?.trim().toLowerCase() === email) {
        const adminCount = await countAdminUsers();
        if (adminCount === 0) {
          if (user) {
            const promoted = await db
              .update(users)
              .set({ uid: decoded.uid, role: 'admin', status: 'active', lastLoginAt: new Date() })
              .where(eq(users.id, user.id))
              .returning();
            user = promoted[0];
          } else {
            const created = await db
              .insert(users)
              .values({
                uid: decoded.uid,
                name: decoded.name || email.split('@')[0],
                email,
                role: 'admin',
                status: 'active',
                preferredLanguage: 'en',
                lastLoginAt: new Date(),
              })
              .returning();
            user = created[0];
          }
        }
      }

      if (!user || user.role !== 'admin') {
        await logAdminAction({
          adminUserId: null,
          action: 'admin_login_denied_non_admin',
          targetType: 'user',
          targetId: user?.id,
          details: { email, provider: 'google' },
          ipAddress: req.ip || '',
        });
        return res.status(403).json({
          error: 'Access denied. This Google account does not have administrator privileges.',
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'Administrator account is suspended.' });
      }

      const updated = await db
        .update(users)
        .set({ uid: decoded.uid, lastLoginAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();

      await logAdminAction({
        adminUserId: updated[0].id,
        action: 'admin_login_google_success',
        targetType: 'auth',
        targetId: updated[0].id,
        details: { email: updated[0].email, provider: 'google' },
        ipAddress: req.ip || '',
      });

      const token = createSessionToken({
        userId: updated[0].id,
        uid: updated[0].uid,
        email: updated[0].email,
        role: 'admin',
      });

      res.json({ token, user: serializeUser(updated[0]) });
    } catch (err) {
      console.error('Admin Google sign-in database error:', err);
      res.status(500).json({ error: 'Administrator sign-in service temporarily unavailable.' });
    }
  });

  // ==================== ADMIN GOVERNANCE ROUTES (RBAC PROTECTED) ====================

  app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const [
        totalUsersRow,
        activeUsersRow,
        suspendedUsersRow,
        totalInvRow,
        totalEvRow,
        openFeedbackRow,
        openSupportRow,
      ] = await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(users).where(eq(users.status, 'active')),
        db.select({ value: count() }).from(users).where(eq(users.status, 'suspended')),
        db.select({ value: count() }).from(investigations),
        db.select({ value: count() }).from(evidence),
        db.select({ value: count() }).from(aiFeedback).where(eq(aiFeedback.status, 'open')),
        db.select({ value: count() }).from(supportRequests).where(eq(supportRequests.status, 'open')),
      ]);

      const categoryStats = await db
        .select({
          category: investigations.suspectedCategory,
          count: count(),
        })
        .from(investigations)
        .groupBy(investigations.suspectedCategory);

      const aiLogs = await db
        .select()
        .from(aiActivityLogs)
        .orderBy(desc(aiActivityLogs.createdAt))
        .limit(200);

      const totalAiCalls = aiLogs.length;
      const errorAiCalls = aiLogs.filter((l) => l.status === 'error').length;
      const avgLatencyMs =
        totalAiCalls > 0
          ? Math.round(aiLogs.reduce((acc, l) => acc + (l.latencyMs || 0), 0) / totalAiCalls)
          : 0;

      const byModuleMap = new Map<string, { total: number; errors: number }>();
      for (const log of aiLogs) {
        const prev = byModuleMap.get(log.module) || { total: 0, errors: 0 };
        prev.total += 1;
        if (log.status === 'error') prev.errors += 1;
        byModuleMap.set(log.module, prev);
      }

      res.json({
        metrics: {
          totalUsers: Number(totalUsersRow[0]?.value || 0),
          activeUsers: Number(activeUsersRow[0]?.value || 0),
          suspendedUsers: Number(suspendedUsersRow[0]?.value || 0),
          totalInvestigations: Number(totalInvRow[0]?.value || 0),
          totalEvidence: Number(totalEvRow[0]?.value || 0),
          openFeedback: Number(openFeedbackRow[0]?.value || 0),
          openSupport: Number(openSupportRow[0]?.value || 0),
        },
        scamCategoriesDetected: categoryStats.map((c) => ({
          category: c.category || 'Pending Analysis',
          count: Number(c.count || 0),
        })),
        aiPerformance: {
          recentCallsCount: totalAiCalls,
          successCount: totalAiCalls - errorAiCalls,
          errorCount: errorAiCalls,
          avgLatencyMs,
          byModule: Array.from(byModuleMap.entries()).map(([module, stats]) => ({
            module,
            ...stats,
          })),
        },
        systemHealth: {
          database: 'healthy',
          geminiApiConfigured: Boolean(process.env.GEMINI_API_KEY),
          firebaseAuthConfigured: true,
          uptimeSeconds: Math.round(process.uptime()),
          serverTime: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Admin overview error:', err);
      res.status(500).json({ error: 'Failed to load administrator overview.' });
    }
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const statusFilter = String(req.query.status || 'all').toLowerCase();

      const allUsers = await db
        .select({
          id: users.id,
          uid: users.uid,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          preferredLanguage: users.preferredLanguage,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          q
            ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
            : undefined
        )
        .orderBy(desc(users.createdAt));

      const invCounts = await db
        .select({
          userId: investigations.userId,
          total: count(),
        })
        .from(investigations)
        .groupBy(investigations.userId);
      const countMap = new Map<number, number>();
      for (const row of invCounts) {
        countMap.set(row.userId, Number(row.total || 0));
      }

      const filtered = allUsers
        .filter((u) => statusFilter === 'all' || u.status === statusFilter)
        .map((u) => ({
          ...u,
          investigationCount: countMap.get(u.id) || 0,
        }));

      res.json({ users: filtered });
    } catch (err) {
      console.error('Admin users list error:', err);
      res.status(500).json({ error: 'Failed to load user accounts.' });
    }
  });

  app.patch('/api/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isInteger(targetId)) {
        return res.status(400).json({ error: 'Invalid user ID.' });
      }
      if (targetId === req.dbUser!.id) {
        return res.status(400).json({ error: 'You cannot suspend your own active admin account.' });
      }

      const schema = z.object({
        status: z.enum(['active', 'suspended']),
        reason: z.string().max(300).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid status ("active" or "suspended") is required.' });
      }

      const target = await findUserById(targetId);
      if (!target) {
        return res.status(404).json({ error: 'User account not found.' });
      }
      if (target.role === 'admin') {
        return res.status(403).json({ error: 'Cannot modify another administrator status here.' });
      }

      const updated = await db
        .update(users)
        .set({ status: parsed.data.status })
        .where(eq(users.id, targetId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: parsed.data.status === 'suspended' ? 'user_suspended' : 'user_reactivated',
        targetType: 'user',
        targetId,
        details: { email: target.email, reason: parsed.data.reason },
        ipAddress: req.ip || '',
      });

      res.json({ user: updated[0] });
    } catch (err) {
      console.error('Admin user status error:', err);
      res.status(500).json({ error: 'Failed to update user status.' });
    }
  });

  app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const targetId = Number(req.params.id);
      if (!Number.isInteger(targetId)) {
        return res.status(400).json({ error: 'Invalid user ID.' });
      }
      if (targetId === req.dbUser!.id) {
        return res.status(400).json({ error: 'You cannot change your own administrator role.' });
      }

      const schema = z.object({
        role: z.enum(['user', 'admin']),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Valid role ("user" or "admin") is required.' });
      }

      const target = await findUserById(targetId);
      if (!target) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      const updated = await db
        .update(users)
        .set({ role: parsed.data.role })
        .where(eq(users.id, targetId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'user_role_updated',
        targetType: 'user',
        targetId,
        details: { email: target.email, previousRole: target.role, newRole: parsed.data.role },
        ipAddress: req.ip || '',
      });

      res.json({ user: updated[0] });
    } catch (err) {
      console.error('Admin user role update error:', err);
      res.status(500).json({ error: 'Failed to update user role.' });
    }
  });

  app.get('/api/admin/feedback', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const statusFilter = String(req.query.status || 'all').toLowerCase();
      const rows = await db
        .select({
          id: aiFeedback.id,
          userId: aiFeedback.userId,
          userName: users.name,
          userEmail: users.email,
          investigationId: aiFeedback.investigationId,
          moduleType: aiFeedback.moduleType,
          userReason: aiFeedback.userReason,
          expectedOutcome: aiFeedback.expectedOutcome,
          reportedContentExcerpt: aiFeedback.reportedContentExcerpt,
          aiPredictedRisk: aiFeedback.aiPredictedRisk,
          status: aiFeedback.status,
          adminNotes: aiFeedback.adminNotes,
          reviewedAt: aiFeedback.reviewedAt,
          createdAt: aiFeedback.createdAt,
        })
        .from(aiFeedback)
        .leftJoin(users, eq(aiFeedback.userId, users.id))
        .orderBy(desc(aiFeedback.createdAt));

      const filtered =
        statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter);
      res.json({ feedback: filtered });
    } catch (err) {
      console.error('Admin feedback list error:', err);
      res.status(500).json({ error: 'Failed to load AI feedback reports.' });
    }
  });

  app.patch('/api/admin/feedback/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid feedback ID.' });

      const schema = z.object({
        status: z.enum(['open', 'reviewed', 'resolved', 'dismissed']),
        adminNotes: z.string().max(1000).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid feedback update.' });

      const updated = await db
        .update(aiFeedback)
        .set({
          status: parsed.data.status,
          adminNotes: parsed.data.adminNotes.trim(),
          reviewedByAdminId: req.dbUser!.id,
          reviewedAt: new Date(),
        })
        .where(eq(aiFeedback.id, id))
        .returning();

      if (!updated.length) return res.status(404).json({ error: 'Feedback item not found.' });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'ai_feedback_reviewed',
        targetType: 'ai_feedback',
        targetId: id,
        details: { status: parsed.data.status },
        ipAddress: req.ip || '',
      });

      res.json({ feedback: updated[0] });
    } catch (err) {
      console.error('Admin feedback update error:', err);
      res.status(500).json({ error: 'Failed to update feedback status.' });
    }
  });

  app.get('/api/admin/scam-rules', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const rows = await db.select().from(scamCategories).orderBy(scamCategories.id);
      res.json({ rules: rows });
    } catch (err) {
      console.error('Admin scam rules error:', err);
      res.status(500).json({ error: 'Failed to load scam categories and rules.' });
    }
  });

  app.post('/api/admin/scam-rules', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        slug: z.string().min(2).max(80),
        name: z.string().min(2).max(120),
        description: z.string().min(5).max(500),
        severityDefault: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
        isActive: z.boolean().optional().default(true),
        indicatorKey: z.string().max(80).optional(),
        weight: z.number().int().min(0).max(50).optional(),
        keywords: z.array(z.string()).optional().default([]),
        guidance: z.string().max(300).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid scam category / rule fields.' });
      }

      const inserted = await db
        .insert(scamCategories)
        .values({
          slug: parsed.data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
          name: parsed.data.name.trim(),
          description: parsed.data.description.trim(),
          severityDefault: parsed.data.severityDefault,
          isActive: parsed.data.isActive,
          ruleWeightsJson: {
            indicatorKey: parsed.data.indicatorKey,
            weight: parsed.data.weight,
            keywords: parsed.data.keywords,
            guidance: parsed.data.guidance,
          },
        })
        .returning();

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'scam_rule_created',
        targetType: 'scam_category',
        targetId: inserted[0].id,
        details: { slug: inserted[0].slug, name: inserted[0].name },
        ipAddress: req.ip || '',
      });

      res.status(201).json({ rule: inserted[0] });
    } catch (err) {
      console.error('Create scam rule error:', err);
      res.status(500).json({ error: 'Failed to create scam category/rule.' });
    }
  });

  app.patch('/api/admin/scam-rules/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid rule ID.' });

      const schema = z.object({
        name: z.string().min(2).max(120).optional(),
        description: z.string().min(5).max(500).optional(),
        severityDefault: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
        isActive: z.boolean().optional(),
        weight: z.number().int().min(0).max(50).optional(),
        indicatorKey: z.string().max(80).optional(),
        keywords: z.array(z.string()).optional(),
        guidance: z.string().max(300).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid rule update.' });

      const existingRows = await db
        .select()
        .from(scamCategories)
        .where(eq(scamCategories.id, id))
        .limit(1);
      if (!existingRows.length) return res.status(404).json({ error: 'Rule not found.' });
      const current = existingRows[0];

      const nextWeights = {
        ...(current.ruleWeightsJson || {}),
        ...(parsed.data.weight !== undefined ? { weight: parsed.data.weight } : {}),
        ...(parsed.data.indicatorKey !== undefined ? { indicatorKey: parsed.data.indicatorKey } : {}),
        ...(parsed.data.keywords !== undefined ? { keywords: parsed.data.keywords } : {}),
        ...(parsed.data.guidance !== undefined ? { guidance: parsed.data.guidance } : {}),
      };

      const updated = await db
        .update(scamCategories)
        .set({
          name: parsed.data.name ?? current.name,
          description: parsed.data.description ?? current.description,
          severityDefault: parsed.data.severityDefault ?? current.severityDefault,
          isActive: parsed.data.isActive ?? current.isActive,
          ruleWeightsJson: nextWeights,
          updatedAt: new Date(),
        })
        .where(eq(scamCategories.id, id))
        .returning();

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'scam_rule_updated',
        targetType: 'scam_category',
        targetId: id,
        details: { name: updated[0].name, isActive: updated[0].isActive, weight: nextWeights.weight },
        ipAddress: req.ip || '',
      });

      res.json({ rule: updated[0] });
    } catch (err) {
      console.error('Update scam rule error:', err);
      res.status(500).json({ error: 'Failed to update scam category/rule.' });
    }
  });

  app.get('/api/admin/education', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const rows = await db
        .select()
        .from(educationalSafetyContent)
        .orderBy(desc(educationalSafetyContent.updatedAt));
      res.json({ items: rows });
    } catch (err) {
      console.error('Admin education list error:', err);
      res.status(500).json({ error: 'Failed to load educational safety content.' });
    }
  });

  app.post('/api/admin/education', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const schema = z.object({
        title: z.string().min(3).max(160),
        category: z.string().min(2).max(80),
        language: z.enum(['en', 'hi', 'mr']).default('en'),
        summary: z.string().min(10).max(1500),
        actionChecklist: z.array(z.string()).default([]),
        isPublished: z.boolean().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid educational content.' });

      const inserted = await db
        .insert(educationalSafetyContent)
        .values({
          ...parsed.data,
          updatedByAdminId: req.dbUser!.id,
        })
        .returning();

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'education_content_created',
        targetType: 'educational_safety_content',
        targetId: inserted[0].id,
        details: { title: inserted[0].title, language: inserted[0].language },
        ipAddress: req.ip || '',
      });

      res.status(201).json({ item: inserted[0] });
    } catch (err) {
      console.error('Create education error:', err);
      res.status(500).json({ error: 'Failed to create educational safety item.' });
    }
  });

  app.patch('/api/admin/education/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid item ID.' });

      const schema = z.object({
        title: z.string().min(3).max(160).optional(),
        category: z.string().min(2).max(80).optional(),
        language: z.enum(['en', 'hi', 'mr']).optional(),
        summary: z.string().min(10).max(1500).optional(),
        actionChecklist: z.array(z.string()).optional(),
        isPublished: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid update payload.' });

      const updated = await db
        .update(educationalSafetyContent)
        .set({
          ...parsed.data,
          updatedByAdminId: req.dbUser!.id,
          updatedAt: new Date(),
        })
        .where(eq(educationalSafetyContent.id, id))
        .returning();

      if (!updated.length) return res.status(404).json({ error: 'Educational item not found.' });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'education_content_updated',
        targetType: 'educational_safety_content',
        targetId: id,
        details: { title: updated[0].title, isPublished: updated[0].isPublished },
        ipAddress: req.ip || '',
      });

      res.json({ item: updated[0] });
    } catch (err) {
      console.error('Update education error:', err);
      res.status(500).json({ error: 'Failed to update educational item.' });
    }
  });

  app.delete('/api/admin/education/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid item ID.' });
      const deleted = await db
        .delete(educationalSafetyContent)
        .where(eq(educationalSafetyContent.id, id))
        .returning();
      if (!deleted.length) return res.status(404).json({ error: 'Educational item not found.' });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'education_content_deleted',
        targetType: 'educational_safety_content',
        targetId: id,
        details: { title: deleted[0].title },
        ipAddress: req.ip || '',
      });
      res.json({ deleted: true });
    } catch (err) {
      console.error('Delete education error:', err);
      res.status(500).json({ error: 'Failed to delete educational item.' });
    }
  });

  app.get('/api/admin/support', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const statusFilter = String(req.query.status || 'all').toLowerCase();
      const rows = await db
        .select()
        .from(supportRequests)
        .orderBy(desc(supportRequests.createdAt));

      const filtered =
        statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter);
      res.json({ tickets: filtered });
    } catch (err) {
      console.error('Admin support list error:', err);
      res.status(500).json({ error: 'Failed to load support requests.' });
    }
  });

  app.patch('/api/admin/support/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid support ticket ID.' });

      const schema = z.object({
        status: z.enum(['open', 'in_progress', 'resolved']),
        adminReply: z.string().max(1500).optional().default(''),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: 'Invalid support update.' });

      const updated = await db
        .update(supportRequests)
        .set({
          status: parsed.data.status,
          adminReply: parsed.data.adminReply.trim(),
          assignedAdminId: req.dbUser!.id,
          updatedAt: new Date(),
        })
        .where(eq(supportRequests.id, id))
        .returning();

      if (!updated.length) return res.status(404).json({ error: 'Support ticket not found.' });

      await logAdminAction({
        adminUserId: req.dbUser!.id,
        action: 'support_ticket_updated',
        targetType: 'support_request',
        targetId: id,
        details: { referenceCode: updated[0].referenceCode, status: parsed.data.status },
        ipAddress: req.ip || '',
      });

      res.json({ ticket: updated[0] });
    } catch (err) {
      console.error('Admin support update error:', err);
      res.status(500).json({ error: 'Failed to update support ticket.' });
    }
  });

  app.get('/api/admin/ai-logs', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const logs = await db
        .select()
        .from(aiActivityLogs)
        .orderBy(desc(aiActivityLogs.createdAt))
        .limit(100);
      res.json({ logs });
    } catch (err) {
      console.error('Admin AI logs error:', err);
      res.status(500).json({ error: 'Failed to load AI monitoring logs.' });
    }
  });

  app.get('/api/admin/audit-logs', requireAuth, requireAdmin, async (_req: AuthRequest, res) => {
    try {
      const logs = await db
        .select({
          id: adminAuditLogs.id,
          adminUserId: adminAuditLogs.adminUserId,
          adminEmail: users.email,
          adminName: users.name,
          action: adminAuditLogs.action,
          targetType: adminAuditLogs.targetType,
          targetId: adminAuditLogs.targetId,
          details: adminAuditLogs.details,
          ipAddress: adminAuditLogs.ipAddress,
          createdAt: adminAuditLogs.createdAt,
        })
        .from(adminAuditLogs)
        .leftJoin(users, eq(adminAuditLogs.adminUserId, users.id))
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(120);
      res.json({ logs });
    } catch (err) {
      console.error('Admin audit logs error:', err);
      res.status(500).json({ error: 'Failed to load audit logs.' });
    }
  });

  // Error handler for Multer upload errors
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Invalid request.' });
    }
    next();
  });

  // Vite middleware in dev, static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINSHIELD AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
