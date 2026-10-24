import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type UserRole = "COORDINATOR" | "STUDENT" | "DEPARTMENT_HEAD";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string;
}

/**
 * Hash password with bcrypt cost factor >= 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSecretKey(): string {
  const secret = process.env.AUTH_SECRET || "selcuk-cap-management-system-secret-key-2026-phase1";
  return secret;
}

/**
 * Create a cryptographically signed session token: Base64(payload).signature
 */
export function signSession(user: SessionUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecretKey())
      .update(encodedPayload)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      studentId: payload.studentId,
    };
  } catch {
    return null;
  }
}

/**
 * Login user with rate limiting / lockout and generic errors
 */
export async function authenticateUser(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    include: { student: true },
  });

  const genericError = "Geçersiz e-posta adresi veya şifre.";

  // If user does not exist, run a dummy bcrypt compare to prevent timing side-channel attacks
  if (!user || !user.passwordHash) {
    await bcrypt.compare(pass, "$2a$12$e80k/oGvN5eL4m/e3G0P0ePj5u8y5.u7.t8gQp2m3Y9a7B3e2b2K6");
    return { success: false, error: genericError };
  }

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMins = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
    );
    return {
      success: false,
      error: `Çok fazla hatalı giriş denemesi. Hesabınız ${remainingMins} dakika süreyle kilitlendi.`,
    };
  }

  const isValid = await verifyPassword(pass, user.passwordHash);

  if (!isValid) {
    const updatedFailedCount = user.failedLoginCount + 1;
    let lockDate: Date | null = null;
    if (updatedFailedCount >= 5) {
      lockDate = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: updatedFailedCount,
        lockedUntil: lockDate,
      },
    });

    return { success: false, error: genericError };
  }

  // Successful login: reset failed attempts
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      status: "ACTIVE",
    },
  });

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    studentId: user.student?.id,
  };

  return { success: true, user: sessionUser };
}
