"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function sendMessageAction(
  targetStudentId: string,
  subject: string,
  body: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Oturum açmanız gerekmektedir.");
  }

  // Student can only message in their own thread
  if (user.role === "STUDENT" && user.studentId !== targetStudentId) {
    throw new Error("FORBIDDEN: Başka bir öğrenci adına mesaj gönderemezsiniz.");
  }

  if (!body || body.trim().length === 0) {
    return { error: "Mesaj içeriği boş bırakılamaz." };
  }

  // Find or create thread
  let thread = await db.messageThread.findFirst({
    where: { studentId: targetStudentId },
  });

  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        studentId: targetStudentId,
        subject: subject || "Genel Bilgilendirme ve Danışmanlık",
        status: "OPEN",
      },
    });
  }

  const message = await db.message.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body: body.trim(),
    },
  });

  await logAudit({
    actorId: user.id,
    action: "SEND_MESSAGE",
    entityType: "Message",
    entityId: message.id,
    after: { threadId: thread.id, length: body.length },
  });

  revalidatePath("/ogrenci/mesajlar");
  revalidatePath(`/koordinator/ogrenci/${targetStudentId}`);
  return { success: true };
}
