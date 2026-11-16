import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { db } from '../src/db/index.ts';
import { adminAuditLogs, aiActivityLogs } from '../src/db/schema.ts';
import { findUserById, getOrCreateFirebaseUser } from '../src/db/users.ts';

declare global {
  var _finshieldSessionSecret: string | undefined;
}

const configuredSessionSecret = (process.env.SESSION_SECRET || '').trim();
if (!configuredSessionSecret && !globalThis._finshieldSessionSecret) {
  globalThis._finshieldSessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    'SESSION_SECRET is not set; using an ephemeral CSPRNG signing secret. Set SESSION_SECRET in AI Studio Secrets for persistent sessions across server restarts.'
  );
}
const SESSION_SECRET =
  configuredSessionSecret || globalThis._finshieldSessionSecret!;

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: string;
  retentionDays: number;
  redactSensitive: boolean;
}

export interface AuthRequest extends Request {
  dbUser?: AuthenticatedUser;
}

export function createSessionToken(payload: {
  userId: number;
  uid: string;
  email: string;
  role?: string;
}): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `fs1.${data}.${sig}`;
}

export function verifySessionToken(
  token: string
): { userId: number; uid: string; email: string; role?: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'fs1') return null;
    const [, data, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'user',
    status: user.status === 'suspended' ? 'suspended' : 'active',
    preferredLanguage: user.preferredLanguage,
    retentionDays: user.retentionDays,
    redactSensitive: user.redactSensitive,
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing.' });
  }

  try {
    // 1. Check local HMAC session token first
    if (token.startsWith('fs1.')) {
      const decoded = verifySessionToken(token);
      if (!decoded) {
        return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
      }
      const user = await findUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User account not found.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({
          error: 'Your account has been suspended by an administrator. Please contact support.',
        });
      }
      req.dbUser = serializeUser(user);
      return next();
    }

    // 2. Otherwise verify Firebase ID token
    const decodedFirebase = await adminAuth.verifyIdToken(token);
    const email = decodedFirebase.email || `${decodedFirebase.uid}@firebase.user`;
    const user = await getOrCreateFirebaseUser(
      decodedFirebase.uid,
      email,
      decodedFirebase.name || email.split('@')[0]
    );
    if (user.status === 'suspended') {
      return res.status(403).json({
        error: 'Your account has been suspended by an administrator. Please contact support.',
      });
    }
    req.dbUser = serializeUser(user);
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired authentication credentials.' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.dbUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.dbUser.status === 'suspended') {
    return res.status(403).json({ error: 'Administrator account is suspended.' });
  }
  if (req.dbUser.role !== 'admin') {
    return res.status(403).json({
      error: 'Administrator privileges are required to access this resource.',
    });
  }
  return next();
}

export async function logAdminAction(params: {
  adminUserId?: number | null;
  action: string;
  targetType: string;
  targetId?: string | number;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await db.insert(adminAuditLogs).values({
      adminUserId: params.adminUserId ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId !== undefined ? String(params.targetId) : '',
      details: params.details || {},
      ipAddress: params.ipAddress || '',
    });
  } catch (err) {
    console.error('Admin audit log write failed:', err);
  }
}

export async function logAiActivity(params: {
  userId?: number | null;
  module: string;
  modelName: string;
  status: 'success' | 'error';
  latencyMs: number;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  try {
    await db.insert(aiActivityLogs).values({
      userId: params.userId ?? null,
      module: params.module,
      modelName: params.modelName,
      status: params.status,
      latencyMs: Math.max(0, Math.round(params.latencyMs)),
      errorCode: params.errorCode || null,
      errorMessage: params.errorMessage ? params.errorMessage.slice(0, 400) : null,
    });
  } catch (err) {
    console.error('AI activity log write failed:', err);
  }
}

// Simple sliding-window rate limiter per IP + route bucket
const rateBuckets = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const timestamps = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment before submitting another request.',
      });
    }
    timestamps.push(now);
    rateBuckets.set(key, timestamps);
    next();
  };
}
