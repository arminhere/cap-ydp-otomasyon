"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authenticateUser } from "@/lib/auth";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre alanı zorunludur."),
});

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Geçersiz giriş bilgileri." };
  }

  const { email, password } = validation.data;
  const result = await authenticateUser(email, password);

  if (!result.success || !result.user) {
    return { error: result.error || "Geçersiz e-posta veya şifre." };
  }

  // Set secure HTTP-only cookie
  await setSessionCookie(result.user);

  // Audit login event
  await logAudit({
    actorId: result.user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: result.user.id,
  });

  // Redirect based on role
  if (result.user.role === "COORDINATOR") {
    redirect("/koordinator/ogrenciler");
  } else if (result.user.role === "STUDENT") {
    redirect("/ogrenci/ders-secimi");
  } else if (result.user.role === "DEPARTMENT_HEAD") {
    redirect("/bolum-baskani/genel-bakis");
  } else {
    redirect("/login");
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
