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
