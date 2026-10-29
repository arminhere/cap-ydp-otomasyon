import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import { CourseSelectionClient } from "./CourseSelectionClient";

export default async function StudentCourseSelectionPage() {
  const user = await requireUserWithRole(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: user.id },
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
          attempts: {
            where: { status: "PASSED" },
          },
        },
      },
    },
  });

  const activeTerm = await db.academicTerm.findFirst({
    where: { isCurrent: true },
  });

  const enrollment = student?.enrollments[0];
  if (!enrollment || !activeTerm) {
    return (
      <div className="py-8">
        <p className="text-slate-600">Aktif dönem veya öğrenci kaydı bulunamadı.</p>
      </div>
    );
  }

  // Already passed course IDs
  const passedCourseCodes = new Set(enrollment.attempts.map((a) => a.courseId));

  // Filter items: wireframe states "Geçilen ve muaf dersler listelenmez."
  const availableItems = enrollment.protocol.items
    .filter((item) => {
      if (item.course && passedCourseCodes.has(item.course.id)) return false;
      return true;
    })
    .map((item) => ({
      id: item.id,
      code: item.course?.code || "[Kod]",
      name: item.course
        ? item.course.name
        : item.slotLabel || "[Teknik seçmeli yuvası – ders seçin]",
      akts: item.akts,
      isElectiveSlot: !item.course,
    }));

  const currentRequest = await db.courseSelectionRequest.findUnique({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId: activeTerm.id,
      },
    },
    include: {
      items: true,
    },
  });

  const initialSelectedIds = currentRequest
    ? currentRequest.items.map((i) => i.protocolItemId)
    : [];

  const semesterName = activeTerm.semester === "GUZ" ? "Güz" : "Bahar";

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Title & Subtitle Matching Image 4 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ders Seç</h1>
        <p className="text-sm text-slate-500 mt-1">
          Dönem: [{activeTerm.academicYear} · {semesterName}] · Seçim son tarihi: [{new Date(activeTerm.selectionCloseAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}]
        </p>
      </div>

      {/* Main Table & Actions */}
      <CourseSelectionClient
        enrollmentId={enrollment.id}
        termId={activeTerm.id}
        items={availableItems}
        initialSelectedIds={initialSelectedIds}
        isApproved={currentRequest?.status === "APPROVED"}
        form01DocId={currentRequest?.formDocumentId}
      />
    </div>
  );
}
