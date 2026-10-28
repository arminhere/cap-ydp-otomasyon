"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserWithRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const createCourseSchema = z.object({
  code: z.string().min(3, "Ders kodu en az 3 karakter olmalıdır."),
  name: z.string().min(3, "Ders adı en az 3 karakter olmalıdır."),
  akts: z.coerce.number().min(1, "AKTS en az 1 olmalıdır.").max(30),
  theoryHours: z.coerce.number().min(0).default(3),
  practiceHours: z.coerce.number().min(0).default(0),
});

export async function createCourseAction(formData: FormData) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const parsed = createCourseSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    akts: formData.get("akts"),
    theoryHours: formData.get("theoryHours"),
    practiceHours: formData.get("practiceHours"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Geçersiz ders bilgileri." };
  }

  const data = parsed.data;
  const cleanCode = data.code.trim().toUpperCase();

  const existing = await db.course.findUnique({
    where: { code: cleanCode },
  });

  if (existing) {
    return { error: `Bu ders koduna (${cleanCode}) sahip bir ders zaten katalogda kayıtlı.` };
  }

  const course = await db.course.create({
    data: {
      code: cleanCode,
      name: data.name.trim(),
      akts: data.akts,
      theoryHours: data.theoryHours,
      practiceHours: data.practiceHours,
      isActive: true,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "CREATE_CATALOG_COURSE",
    entityType: "Course",
    entityId: course.id,
    after: { code: course.code, name: course.name, akts: course.akts },
  });

  revalidatePath("/koordinator/protokoller");
  return { success: true };
}

export async function toggleCourseActiveAction(courseId: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return { error: "Ders bulunamadı." };
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: { isActive: !course.isActive },
  });

  await logAudit({
    actorId: actor.id,
    action: updated.isActive ? "ACTIVATE_COURSE" : "DEACTIVATE_COURSE",
    entityType: "Course",
    entityId: courseId,
    before: { isActive: course.isActive },
    after: { isActive: updated.isActive },
  });

  revalidatePath("/koordinator/protokoller");
  return { success: true };
}

