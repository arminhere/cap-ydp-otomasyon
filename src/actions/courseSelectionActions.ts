"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserWithRole, getCurrentUser } from "@/lib/session";
import { generateForm01Docx } from "@/lib/docx";
import { logAudit } from "@/lib/audit";

export async function submitCourseSelectionAction(
  enrollmentId: string,
  termId: string,
  selectedProtocolItemIds: string[]
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || !user.studentId) {
    throw new Error("UNAUTHORIZED: Yalnızca öğrenciler ders seçimi yapabilir.");
  }

  // Object-level check: Verify student owns this enrollment
  const enrollment = await db.programEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: true },
  });

  if (!enrollment || enrollment.studentId !== user.studentId) {
    throw new Error("FORBIDDEN: Başka bir öğrencinin kaydı üzerinde işlem yapamazsınız.");
  }

  if (selectedProtocolItemIds.length === 0) {
    return { error: "Lütfen en az bir ders seçiniz." };
  }

  // Fetch the selected protocol items
  const protocolItems = await db.protocolItem.findMany({
    where: {
      id: { in: selectedProtocolItemIds },
      protocolId: enrollment.protocolId,
    },
    include: { course: true },
  });

  if (protocolItems.length !== selectedProtocolItemIds.length) {
    return { error: "Seçilen bazı dersler protokolünüzde bulunamadı." };
  }

  const totalAkts = protocolItems.reduce((sum, item) => sum + item.akts, 0);

  // Upsert the course selection request
  const request = await db.$transaction(async (tx) => {
    // Delete old selection items if draft/rejected exists
    const existing = await tx.courseSelectionRequest.findUnique({
      where: {
        enrollmentId_termId: { enrollmentId, termId },
      },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        throw new Error("Onaylanmış bir ders seçimi yeniden gönderilemez.");
      }
      await tx.courseSelectionItem.deleteMany({
        where: { requestId: existing.id },
      });
    }

    const req = await tx.courseSelectionRequest.upsert({
      where: {
        enrollmentId_termId: { enrollmentId, termId },
      },
      update: {
        status: "SUBMITTED",
        totalAkts,
        submittedAt: new Date(),
        decisionNote: null,
      },
      create: {
        enrollmentId,
        termId,
        status: "SUBMITTED",
        totalAkts,
        submittedAt: new Date(),
      },
    });

    for (const item of protocolItems) {
      if (!item.courseId) continue;
      await tx.courseSelectionItem.create({
        data: {
          requestId: req.id,
          protocolItemId: item.id,
          courseId: item.courseId,
        },
      });
    }

    return req;
  });

  await logAudit({
    actorId: user.id,
    action: "SUBMIT_COURSE_SELECTION",
    entityType: "CourseSelectionRequest",
    entityId: request.id,
    after: { totalAkts, courseCount: protocolItems.length },
  });

  revalidatePath("/ogrenci/ders-secimi");
  revalidatePath("/koordinator/onaylar");
  return { success: true };
}

export async function approveCourseSelectionAction(requestId: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  const request = await db.courseSelectionRequest.findUnique({
    where: { id: requestId },
    include: {
      enrollment: {
        include: {
          student: { include: { homeDepartment: true } },
          protocol: true,
        },
      },
      term: true,
      items: {
        include: { course: true },
      },
    },
  });

  if (!request) {
    throw new Error("Ders seçim talebi bulunamadı.");
  }

  const student = request.enrollment.student;
  const coursesForDoc = request.items.map((i) => ({
    code: i.course.code,
    akts: i.course.akts,
    name: i.course.name,
  }));

  // Generate FORM01 (.docx)
  const docxBuffer = await generateForm01Docx({
    programStudentNo: student.programStudentNo,
    studentName: `${student.firstName} ${student.lastName}`,
    homeFaculty: student.homeDepartment.faculty,
    homeDepartment: student.homeDepartment.name,
    academicYear: request.term.academicYear,
    semester: request.term.semester as "GUZ" | "BAHAR",
    dateStr: new Date().toLocaleDateString("tr-TR"),
    courses: coursesForDoc,
  });

  await db.$transaction(async (tx) => {
    // 1. Save generated document in DB
    const doc = await tx.document.create({
      data: {
        studentId: student.id,
        enrollmentId: request.enrollmentId,
        termId: request.termId,
        documentType: "COURSE_FORM_SIGNED",
        label: `FORM01 - ${request.term.academicYear} ${request.term.semester}`,
        originalName: `FORM01_${student.programStudentNo}_${request.term.academicYear}.docx`,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: docxBuffer.length,
        sha256: "generated_sha256",
        contentBytes: docxBuffer,
        isGenerated: true,
        approvalStatus: "APPROVED",
        uploadedBy: actor.id,
      },
    });

    // 2. Update request
    await tx.courseSelectionRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        decidedBy: actor.id,
        decidedAt: new Date(),
        formDocumentId: doc.id,
      },
    });

    // 3. Register active course attempts for the term
    for (const item of request.items) {
      await tx.courseAttempt.create({
        data: {
          enrollmentId: request.enrollmentId,
          protocolItemId: item.protocolItemId,
          courseId: item.courseId,
          termId: request.termId,
          status: "ENROLLED",
        },
      });
    }
  });

  await logAudit({
    actorId: actor.id,
    action: "APPROVE_COURSE_SELECTION",
    entityType: "CourseSelectionRequest",
    entityId: requestId,
    after: { status: "APPROVED", decidedBy: actor.id },
  });

  revalidatePath("/koordinator/onaylar");
  revalidatePath("/ogrenci/ders-secimi");
  return { success: true };
}

export async function rejectCourseSelectionAction(requestId: string, reasonNote: string) {
  const actor = await requireUserWithRole(["COORDINATOR"]);

  if (!reasonNote || reasonNote.trim().length === 0) {
    return { error: "Lütfen bir ret gerekçesi giriniz." };
  }

  await db.courseSelectionRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      decidedBy: actor.id,
      decidedAt: new Date(),
      decisionNote: reasonNote.trim(),
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "REJECT_COURSE_SELECTION",
    entityType: "CourseSelectionRequest",
    entityId: requestId,
    after: { status: "REJECTED", decisionNote: reasonNote },
  });

  revalidatePath("/koordinator/onaylar");
  revalidatePath("/ogrenci/ders-secimi");
  return { success: true };
}
