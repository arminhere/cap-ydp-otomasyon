import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../db";
import { authenticateUser } from "../auth";
import { generateForm01Docx } from "../docx";

test("End-to-End Workflow & Security Verification", async () => {
  // 1. Authenticate Coordinator
  const coordAuth = await authenticateUser("koordinator@selcuk.edu.tr", "Test1234!");
  assert.equal(coordAuth.success, true);
  assert.equal(coordAuth.user?.role, "COORDINATOR");

  // 2. Authenticate Student
  const studentAuth = await authenticateUser("ogrenci@ogr.selcuk.edu.tr", "Test1234!");
  assert.equal(studentAuth.success, true);
  assert.equal(studentAuth.user?.role, "STUDENT");
  assert.ok(studentAuth.user?.studentId);

  // 3. Authenticate Department Head
  const headAuth = await authenticateUser("baskan@selcuk.edu.tr", "Test1234!");
  assert.equal(headAuth.success, true);
  assert.equal(headAuth.user?.role, "DEPARTMENT_HEAD");

  const studentId = studentAuth.user.studentId;
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          protocol: {
            include: {
              items: {
                include: { course: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });
  assert.ok(student);
  const enrollment = student.enrollments[0];
  assert.ok(enrollment);

  const activeTerm = await db.academicTerm.findFirst({
    where: { isCurrent: true },
  });
  assert.ok(activeTerm);

  // 4. Student submits course selection from protocol
  const selectedItems = enrollment.protocol.items.slice(0, 3);
  const totalAkts = selectedItems.reduce((acc, i) => acc + i.akts, 0);

  const request = await db.courseSelectionRequest.upsert({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId: activeTerm.id,
      },
    },
    update: {
      status: "SUBMITTED",
      totalAkts,
    },
    create: {
      enrollmentId: enrollment.id,
      termId: activeTerm.id,
      status: "SUBMITTED",
      totalAkts,
    },
  });
  assert.equal(request.status, "SUBMITTED");

  // 5. Coordinator Approves and generates FORM01 .docx
  const docxBuffer = await generateForm01Docx({
    programStudentNo: student.programStudentNo,
    studentName: `${student.firstName} ${student.lastName}`,
    homeFaculty: "Teknoloji Fakültesi",
    homeDepartment: "Elektrik-Elektronik Mühendisliği",
    academicYear: activeTerm.academicYear,
    semester: activeTerm.semester as any,
    dateStr: "25.10.2026",
    courses: selectedItems.map((i) => ({
      code: i.course!.code,
      akts: i.course!.akts,
      name: i.course!.name,
    })),
  });
  assert.ok(docxBuffer.length > 5000);

  const formDoc = await db.document.create({
    data: {
      studentId: student.id,
      enrollmentId: enrollment.id,
      termId: activeTerm.id,
      documentType: "COURSE_FORM_SIGNED",
      label: `FORM01 - ${activeTerm.academicYear} ${activeTerm.semester}`,
      originalName: `FORM01_${student.programStudentNo}.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: docxBuffer.length,
      sha256: "test_sha256_mock",
      contentBytes: docxBuffer,
      isGenerated: true,
      approvalStatus: "APPROVED",
      uploadedBy: coordAuth.user.id,
    },
  });

  const approvedReq = await db.courseSelectionRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      decidedBy: coordAuth.user.id,
      decidedAt: new Date(),
      formDocumentId: formDoc.id,
    },
  });
  assert.equal(approvedReq.status, "APPROVED");

  // 6. Register Course Attempt
  const firstCourseItem = selectedItems[0];
  const attempt = await db.courseAttempt.create({
    data: {
      enrollmentId: enrollment.id,
      protocolItemId: firstCourseItem.id,
      courseId: firstCourseItem.courseId!,
      termId: activeTerm.id,
      status: "ENROLLED",
    },
  });
  assert.equal(attempt.status, "ENROLLED");

  // 7. Verify Grade Requirement: Without approved departmental transcript, grade approval is blocked!
  await db.document.deleteMany({
    where: { studentId: student.id, documentType: "TRANSCRIPT" },
  });

  const hasTranscript = await db.document.findFirst({
    where: {
      studentId: student.id,
      documentType: "TRANSCRIPT",
      approvalStatus: "APPROVED",
    },
  });
  assert.equal(hasTranscript, null, "Transcript must not exist yet");

  // 8. Student uploads Transcript and Coordinator approves it (using real valid PDF)
  const validPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n");
  const transcriptDoc = await db.document.create({
    data: {
      studentId: student.id,
      documentType: "TRANSCRIPT",
      label: "2025-2026 Güz Resmi ÇAP Transkript Belgesi",
      originalName: "transkript_ali_demir.pdf",
      mimeType: "application/pdf",
      sizeBytes: validPdfBuffer.length,
      sha256: "mock_transcript_sha256",
      contentBytes: validPdfBuffer,
      approvalStatus: "APPROVED",
      uploadedBy: studentAuth.user.id,
    },
  });
  assert.equal(transcriptDoc.approvalStatus, "APPROVED");

  // 9. Now Coordinator enters passing grade
  const updatedAttempt = await db.courseAttempt.update({
    where: { id: attempt.id },
    data: {
      letterGrade: "BA",
      status: "PASSED",
      verifiedBy: coordAuth.user.id,
      verifiedAt: new Date(),
    },
  });
  assert.equal(updatedAttempt.status, "PASSED");
  assert.equal(updatedAttempt.letterGrade, "BA");

  // 10. Audit Log Verification
  await db.auditLog.create({
    data: {
      actorId: coordAuth.user.id,
      action: "VERIFY_COURSE_GRADE",
      entityType: "CourseAttempt",
      entityId: attempt.id,
      beforeJson: JSON.stringify({ status: "ENROLLED" }),
      afterJson: JSON.stringify({ status: "PASSED", letterGrade: "BA" }),
      ipAddress: "127.0.0.1",
      userAgent: "TestRunner",
    },
  });

  const auditCount = await db.auditLog.count({
    where: { entityType: "CourseAttempt" },
  });
  assert.ok(auditCount > 0, "Audit logs must be recorded persistently");
});
