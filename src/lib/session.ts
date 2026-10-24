import { cookies } from "next/headers";
import { signSession, verifySession, SessionUser, UserRole } from "./auth";

const AUTH_COOKIE_NAME = "bmu2_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Get current session user from incoming Next.js cookies
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Set session cookie in Next.js Server Action / Route
 */
export async function setSessionCookie(user: SessionUser) {
  const token = signSession(user);
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * Clear session cookie (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Enforce role on the server-side. Throws error if unauthorized.
 */
export async function requireUserWithRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Oturum açmanız gerekmektedir.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN: Bu işlem için yetkiniz bulunmamaktadır.");
  }
  return user;
}
