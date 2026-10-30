"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserWithRole, getCurrentUser } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const createStudentSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  mainStudentNo: z.string().min(5, "Ana dal öğrenci no zorunludur."),
  programStudentNo: z.string().min(5, "Program öğrenci no zorunludur."),
  homeDepartmentId: z.string().min(1, "Ana dal bölümü seçiniz."),
  programId: z.string().min(1, "Program seçiniz."),
  protocolId: z.string().min(1, "Protokol seçiniz."),
  advisorName: z.string().min(2, "Danışman adı zorunludur."),
  admissionSemester: z.coerce.number().min(1).max(8),
  admissionGano: z.coerce.number().min(0).max(4),
  admissionType: z.enum(["ASIL", "YEDEK"]),
});

export async function createStudentAction(formData: FormData) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const parsed = createStudentSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    mainStudentNo: formData.get("mainStudentNo"),
    programStudentNo: formData.get("programStudentNo"),
    homeDepartmentId: formData.get("homeDepartmentId"),
    programId: formData.get("programId"),
    protocolId: formData.get("protocolId"),
    advisorName: formData.get("advisorName"),
    admissionSemester: formData.get("admissionSemester"),
    admissionGano: formData.get("admissionGano"),
    admissionType: formData.get("admissionType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Lütfen tüm alanları doğru doldurunuz." };
  }

  const data = parsed.data;

  // Check unique constraints
  const existingUser = await db.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: "Bu e-posta adresine sahip bir kullanıcı zaten mevcut." };
  }

  const existingMainNo = await db.student.findUnique({ where: { mainStudentNo: data.mainStudentNo } });
  if (existingMainNo) {
    return { error: "Bu Ana Dal Öğrenci Numarası sistemde zaten kayıtlı." };
  }

  const existingProgNo = await db.student.findUnique({ where: { programStudentNo: data.programStudentNo } });
  if (existingProgNo) {
    return { error: "Bu ÇAP/Yan Dal Öğrenci Numarası sistemde zaten kayıtlı." };
  }

  const defaultPassword = await hashPassword("Test1234!");

  const newStudent = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: defaultPassword,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        mainStudentNo: data.mainStudentNo,
        programStudentNo: data.programStudentNo,
        homeDepartmentId: data.homeDepartmentId,
        advisorName: data.advisorName,
        admissionSemester: data.admissionSemester,
        admissionGano: data.admissionGano,
        admissionType: data.admissionType,
      },
    });

    await tx.programEnrollment.create({
      data: {
        studentId: student.id,
        programId: data.programId,
        protocolId: data.protocolId,
        status: "ACTIVE",
      },
    });

    return student;
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE_STUDENT",
    entityType: "Student",
    entityId: newStudent.id,
    after: { ...data, studentId: newStudent.id },
  });

  revalidatePath("/koordinator/ogrenciler");
  return { success: true };
}

const updateProfileSchema = z.object({
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
  secondaryEmail: z.string().email("Geçerli bir ikinci e-posta giriniz."),
});

export async function updateStudentProfileAction(
  prevState: any,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || !user.studentId) {
    throw new Error("UNAUTHORIZED: Yalnızca öğrenciler kendi profillerini güncelleyebilir.");
  }

  const parsed = updateProfileSchema.safeParse({
    phone: formData.get("phone"),
    secondaryEmail: formData.get("secondaryEmail"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message };
  }

  const before = await db.student.findUnique({ where: { id: user.studentId } });

  await db.student.update({
    where: { id: user.studentId },
    data: {
      phone: parsed.data.phone,
      secondaryEmail: parsed.data.secondaryEmail,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "UPDATE_PROFILE",
    entityType: "Student",
    entityId: user.studentId,
    before: { phone: before?.phone, secondaryEmail: before?.secondaryEmail },
    after: parsed.data,
  });

  revalidatePath("/ogrenci/ders-secimi");
  return { success: true };
}

export async function updateCoordinatorNoteAction(studentId: string, note: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const before = await db.student.findUnique({
    where: { id: studentId },
    select: { coordinatorNote: true },
  });

  await db.student.update({
    where: { id: studentId },
    data: { coordinatorNote: note.trim() },
  });

  await logAudit({
    actorId: actor.id,
    action: "UPDATE_COORDINATOR_NOTE",
    entityType: "Student",
    entityId: studentId,
    before: { coordinatorNote: before?.coordinatorNote },
    after: { coordinatorNote: note.trim() },
  });

  revalidatePath(`/koordinator/ogrenci/${studentId}`);
  return { success: true };
}

export async function executeAdminDecisionAction(
  enrollmentId: string,
  newStatus: string,
  reasonNote: string
) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  if (!reasonNote || reasonNote.trim().length === 0) {
    return { error: "İdari karar için gerekçe ve dayanak kararı belirtilmesi zorunludur." };
  }

  const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: true },
  });

  if (!enrollment) {
    throw new Error("Kayıt bulunamadı.");
  }

  const beforeStatus = enrollment.status;

  await db.programEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: newStatus,
      statusReason: reasonNote.trim(),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "EXECUTE_ADMIN_DECISION",
    entityType: "ProgramEnrollment",
    entityId: enrollmentId,
    before: { status: beforeStatus },
    after: { status: newStatus, statusReason: reasonNote.trim() },
  });

  revalidatePath(`/koordinator/ogrenci/${enrollment.studentId}`);
  revalidatePath("/koordinator/ogrenciler");
  revalidatePath("/koordinator");
  revalidatePath("/bolum-baskani/genel-bakis");
  return { success: true };
}


export async function deleteStudentAction(studentId: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      enrollments: {
        include: {
          selectionRequests: true,
          attempts: true,
          termStatuses: true,
        },
      },
      documents: true,
      messageThreads: true,
    },
  });

  if (!student) {
    return { error: "Öğrenci bulunamadı." };
  }

  const enrollmentIds = student.enrollments.map((e) => e.id);
  const requestIds = student.enrollments.flatMap((e) => e.selectionRequests.map((r) => r.id));
  const documentIds = student.documents.map((d) => d.id);

  await db.$transaction(async (tx) => {
    // 1. Delete associated audit logs to prevent foreign key errors
    await tx.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: student.userId },
          { entityId: student.userId },
          { entityId: student.id },
          ...enrollmentIds.map((id) => ({ entityId: id })),
          ...requestIds.map((id) => ({ entityId: id })),
          ...documentIds.map((id) => ({ entityId: id })),
        ],
      },
    });

    // 2. Delete user (student, enrollments, documents, attempts cascade automatically)
    await tx.user.delete({
      where: { id: student.userId },
    });
  });

  // Log the deletion action by coordinator
  await logAudit({
    actorId: actor.id,
    action: "DELETE_STUDENT",
    entityType: "Student",
    entityId: studentId,
    before: {
      name: `${student.firstName} ${student.lastName}`,
      mainStudentNo: student.mainStudentNo,
      programStudentNo: student.programStudentNo,
      email: student.user.email,
    },
  });

  revalidatePath("/koordinator/ogrenciler");
  revalidatePath("/koordinator");
  revalidatePath("/bolum-baskani/ogrenciler");
  revalidatePath("/bolum-baskani/genel-bakis");

  return { success: true };
}
