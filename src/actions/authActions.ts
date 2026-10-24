"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authenticateUser, verifyPassword, hashPassword } from "@/lib/auth";
import { setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";

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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi giriniz."),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır."),
    confirmPassword: z.string().min(1, "Yeni şifre tekrarı zorunludur."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Yeni şifreler birbiriyle eşleşmiyor.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "İşlem yapabilmek için oturum açmanız gerekmektedir." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || !dbUser.passwordHash) {
    return { error: "Kullanıcı kaydı bulunamadı." };
  }

  const isCurrentValid = await verifyPassword(
    parsed.data.currentPassword,
    dbUser.passwordHash
  );

  if (!isCurrentValid) {
    return { error: "Mevcut şifrenizi hatalı girdiniz." };
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  await logAudit({
    actorId: user.id,
    action: "CHANGE_PASSWORD",
    entityType: "User",
    entityId: user.id,
  });

  return { success: true };
}
