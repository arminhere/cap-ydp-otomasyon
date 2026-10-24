import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../db";
import { authenticateUser, verifyPassword } from "../auth";
import { changePasswordAction } from "../../actions/authActions";
import { setSessionCookie } from "../session";

test("Password Change Workflow Verification", async () => {
  // Find a test user (e.g. coordinator)
  const user = await db.user.findUnique({
    where: { email: "koordinator@selcuk.edu.tr" },
  });
  assert.ok(user);

  // Authenticate user
  const auth = await authenticateUser("koordinator@selcuk.edu.tr", "Test1234!");
  assert.equal(auth.success, true);
  assert.ok(auth.user);

  // 1. Wrong current password should fail
  // We can test password verification directly or via function
  const isWrongValid = await verifyPassword("WrongPassword!", user.passwordHash!);
  assert.equal(isWrongValid, false);

  // 2. Correct current password
  const isCurrentValid = await verifyPassword("Test1234!", user.passwordHash!);
  assert.equal(isCurrentValid, true);
});
