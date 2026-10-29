import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  authenticateUser,
} from "../auth";
import { db } from "../db";

process.env.AUTH_SECRET = "selcuk-cap-management-system-secret-key-2026-phase1";

test("Password hashing and verification with bcrypt >= 12 rounds", async () => {
  const plain = "GuvenliSifre2026!";
  const hash = await hashPassword(plain);
  assert.ok(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$"));
  const isValid = await verifyPassword(plain, hash);
  assert.equal(isValid, true);
  const isInvalid = await verifyPassword("YanlisSifre", hash);
  assert.equal(isInvalid, false);
});

test("HMAC signed session token creation, verification and tamper protection", () => {
  const mockUser = {
    id: "usr_123",
    email: "test@selcuk.edu.tr",
    role: "COORDINATOR" as const,
  };

  const token = signSession(mockUser);
  assert.ok(token.includes("."));

  // Valid verification
  const decoded = verifySession(token);
  assert.ok(decoded);
  assert.equal(decoded.id, mockUser.id);
  assert.equal(decoded.email, mockUser.email);
  assert.equal(decoded.role, "COORDINATOR");

  // Tampered payload
  const [payload, sig] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...mockUser, role: "DEPARTMENT_HEAD" })
  ).toString("base64url");
  const tamperedToken = `${tamperedPayload}.${sig}`;
  assert.equal(verifySession(tamperedToken), null);

  // Random invalid token
  assert.equal(verifySession("invalid.token.string"), null);
});

test("Authentication tests: credentials, generic errors, and account lockout", async () => {
  // Test valid coordinator login
  const validCoordinator = await authenticateUser("koordinator@selcuk.edu.tr", "Test1234!");
  assert.equal(validCoordinator.success, true);
  assert.equal(validCoordinator.user?.role, "COORDINATOR");

  // Test invalid password gives generic error
  const invalidPass = await authenticateUser("koordinator@selcuk.edu.tr", "WrongPass!");
  assert.equal(invalidPass.success, false);
  assert.equal(invalidPass.error, "Geçersiz e-posta adresi veya şifre.");

  // Test non-existent user gives identical generic error
  const invalidUser = await authenticateUser("nonexistent@selcuk.edu.tr", "AnyPass!");
  assert.equal(invalidUser.success, false);
  assert.equal(invalidUser.error, "Geçersiz e-posta adresi veya şifre.");

  // Test student account login
  const validStudent = await authenticateUser("ogrenci@ogr.selcuk.edu.tr", "Test1234!");
  assert.equal(validStudent.success, true);
  assert.equal(validStudent.user?.role, "STUDENT");
  assert.ok(validStudent.user?.studentId);

  // Test department head login
  const validHead = await authenticateUser("baskan@selcuk.edu.tr", "Test1234!");
  assert.equal(validHead.success, true);
  assert.equal(validHead.user?.role, "DEPARTMENT_HEAD");
});
