"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserWithRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function recordGradeAction(
  attemptId: string,
  letterGrade: string,
  numericGrade?: number
) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const attempt = await db.courseAttempt.findUnique({
    where: { id: attemptId },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              documents: {
                where: { documentType: "TRANSCRIPT", approvalStatus: "APPROVED" },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error("Ders deneme kaydı bulunamadı.");
  }

  // Critical Regulation Rule: Department transcript must be uploaded and approved
  const approvedTranscripts = attempt.enrollment.student.documents;
  if (approvedTranscripts.length === 0) {
    return {
      error:
        "Yönerge Kuralı: Dönem notlarını onaylamadan önce öğrencinin bölümümüzden aldığı derslerin ÇAP/YDP transkript belgesinin sisteme yüklenmiş ve onaylanmış olması zorunludur.",
    };
  }

  const cleanGrade = letterGrade.trim().toUpperCase();
  const passingGrades = ["AA", "BA", "BB", "CB", "CC"];
  const isPassed = passingGrades.includes(cleanGrade);
  const status = isPassed ? "PASSED" : "FAILED";

  await db.courseAttempt.update({
    where: { id: attemptId },
    data: {
      letterGrade: cleanGrade,
      numericGrade: numericGrade || null,
      status,
      verifiedBy: actor.id,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "VERIFY_COURSE_GRADE",
    entityType: "CourseAttempt",
    entityId: attemptId,
    before: { letterGrade: attempt.letterGrade, status: attempt.status },
    after: { letterGrade: cleanGrade, status, verifiedBy: actor.id },
  });

  revalidatePath(`/koordinator/ogrenci/${attempt.enrollment.studentId}`);
  revalidatePath("/ogrenci/ilerleme");
  return { success: true };
}

export async function recordTermGanoAction(
  enrollmentId: string,
  termId: string,
  mainGano: number,
  programGano?: number,
  sourceNote?: string
) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const termStatus = await db.termAcademicStatus.upsert({
    where: {
      enrollmentId_termId: { enrollmentId, termId },
    },
    update: {
      mainGano,
      programGano: programGano || null,
      sourceNote: sourceNote || "Öğrenci işleri onaylı resmi transkript belgesi",
      verifiedBy: actor.id,
      verifiedAt: new Date(),
    },
    create: {
      enrollmentId,
      termId,
      mainGano,
      programGano: programGano || null,
      sourceNote: sourceNote || "Öğrenci işleri onaylı resmi transkript belgesi",
      verifiedBy: actor.id,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "RECORD_TERM_GANO",
    entityType: "TermAcademicStatus",
    entityId: termStatus.id,
    after: { mainGano, programGano, sourceNote, verifiedBy: actor.id },
  });

  return { success: true };
}
