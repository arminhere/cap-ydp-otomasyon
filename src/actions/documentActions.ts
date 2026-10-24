"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserWithRole, getCurrentUser } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function uploadDocumentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Oturum açmanız gerekmektedir.");
  }

  const file = formData.get("file") as File | null;
  const documentType = formData.get("documentType") as string;
  const label = formData.get("label") as string;
  let targetStudentId = formData.get("studentId") as string | null;

  if (user.role === "STUDENT") {
    targetStudentId = user.studentId ?? null;
  }

  if (!targetStudentId) {
    return { error: "Öğrenci kimliği belirlenemedi." };
  }

  if (!file || file.size === 0) {
    return { error: "Lütfen yüklenecek bir dosya seçiniz." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Dosya boyutu 10MB sınırını aşamaz." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Yalnızca PDF, DOCX ve resim (PNG, JPEG) dosyalarına izin verilmektedir." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  const newDoc = await db.document.create({
    data: {
      studentId: targetStudentId,
      documentType: documentType || "OTHER",
      label: label || file.name,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256,
      contentBytes: buffer,
      approvalStatus: user.role === "COORDINATOR" ? "APPROVED" : "PENDING",
      uploadedBy: user.id,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "UPLOAD_DOCUMENT",
    entityType: "Document",
    entityId: newDoc.id,
    after: { originalName: file.name, mimeType: file.type, sizeBytes: file.size },
  });

  revalidatePath("/ogrenci/belgelerim");
  revalidatePath("/koordinator/onaylar");
  return { success: true };
}

export async function reviewDocumentAction(documentId: string, status: "APPROVED" | "REJECTED", note?: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  if (status === "REJECTED" && (!note || note.trim().length === 0)) {
    return { error: "Reddedilen belgeler için gerekçe belirtilmesi zorunludur." };
  }

  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    throw new Error("Belge bulunamadı.");
  }

  await db.document.update({
    where: { id: documentId },
    data: {
      approvalStatus: status,
      reviewedBy: actor.id,
      reviewedAt: new Date(),
      reviewNote: note?.trim() || null,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: status === "APPROVED" ? "APPROVE_DOCUMENT" : "REJECT_DOCUMENT",
    entityType: "Document",
    entityId: documentId,
    before: { approvalStatus: doc.approvalStatus },
    after: { approvalStatus: status, reviewNote: note },
  });

  revalidatePath("/koordinator/onaylar");
  revalidatePath("/ogrenci/belgelerim");
  return { success: true };
}
