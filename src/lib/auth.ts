import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { adminUsers, resellers } from '../db/schema.ts';
import { adminAuth } from './firebase-admin.ts';

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SQL_PASSWORD ||
  'belma-beauty-cms-session-signing-key-2026';

export interface AdminUserPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  uid?: string | null;
}

export interface ResellerSessionPayload {
  id: number;
  email: string;
  name: string;
  phone: string;
  city: string;
  tierCode: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthRequest extends Request {
  adminUser?: AdminUserPayload;
  resellerUser?: ResellerSessionPayload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(keyHex, 'hex');
  if (derivedBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
}

export function createSessionToken(payload: AdminUserPayload): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string): (AdminUserPayload & { exp: number }) | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(body)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

export async function resolveAdminFromRequest(req: Request): Promise<AdminUserPayload | null> {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = parseCookie(req.headers.cookie, 'belma_admin_session');

  // 1. Try Firebase ID Token if Bearer token looks like a Firebase JWT (3 segments)
  if (bearerToken && bearerToken.split('.').length === 3) {
    try {
      const decoded = await adminAuth.verifyIdToken(bearerToken);
      const email = decoded.email?.toLowerCase();
      if (!email) return null;

      const existing = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);

      if (existing.length > 0) {
        const admin = existing[0];
        if (!admin.isActive || admin.role !== 'administrator') return null;
        if (!admin.uid) {
          await db
            .update(adminUsers)
            .set({ uid: decoded.uid, lastLoginAt: new Date() })
            .where(eq(adminUsers.id, admin.id));
        }
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          uid: decoded.uid,
        };
      }
      return null;
    } catch {
      // Fall through to check local session token
    }
  }

  // 2. Try Server-Signed Admin Session Token (Bearer or Cookie)
  const tokenToCheck = bearerToken || cookieToken;
  if (!tokenToCheck) return null;

  const verified = verifySessionToken(tokenToCheck);
  if (!verified) return null;

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, verified.id))
    .limit(1);

  if (rows.length === 0) return null;
  const admin = rows[0];
  if (!admin.isActive || admin.role !== 'administrator') return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    uid: admin.uid,
  };
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const admin = await resolveAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ error: 'Akses ditolak. Silakan login sebagai administrator.' });
    }
    req.adminUser = admin;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ error: 'Sesi admin tidak valid atau kedaluwarsa.' });
  }
};

export function createResellerSessionToken(id: number, email: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const body = Buffer.from(
    JSON.stringify({ type: 'reseller', id, email, exp })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

export async function resolveResellerFromRequest(
  req: Request
): Promise<ResellerSessionPayload | null> {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const cookieToken = parseCookie(req.headers.cookie, 'belma_reseller_session');
  const tokenToCheck = bearerToken || cookieToken;
  if (!tokenToCheck) return null;

  try {
    const parts = tokenToCheck.split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expected = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(body)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (
      !decoded ||
      decoded.type !== 'reseller' ||
      typeof decoded.exp !== 'number' ||
      decoded.exp < Date.now()
    ) {
      return null;
    }

    const rows = await db
      .select()
      .from(resellers)
      .where(eq(resellers.id, Number(decoded.id)))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      email: r.email,
      name: r.name,
      phone: r.phone || '',
      city: r.city || '',
      tierCode: r.tierCode || 'RESELLER',
      role: r.role || 'reseller',
      isActive: Boolean(r.isActive),
      createdAt: r.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export const requireResellerAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const reseller = await resolveResellerFromRequest(req);
    if (!reseller) {
      return res.status(401).json({ error: 'Silakan login dengan akun reseller Anda.' });
    }
    req.resellerUser = reseller;
    next();
  } catch (error) {
    console.error('Reseller auth verification error:', error);
    return res.status(401).json({ error: 'Sesi reseller tidak valid atau kedaluwarsa.' });
  }
};

