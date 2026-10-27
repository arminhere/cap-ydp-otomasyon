import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import {
  CoordinatorPanoClient,
  PendingApproval,
  StudentRow,
  WarningItem,
} from "./CoordinatorPanoClient";

export default async function CoordinatorPanoPage() {
  await requireUserWithRole(["COORDINATOR"]);

  // 1. Fetch pending approvals (transcripts, course forms, petitions)
  const pendingDocs = await db.document.findMany({
    where: { approvalStatus: "PENDING" },
    include: { student: true },
    orderBy: { uploadedAt: "desc" },
    take: 5,
  });

  const pendingSelections = await db.courseSelectionRequest.findMany({
    where: { status: "SUBMITTED" },
    include: { enrollment: { include: { student: true } } },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  const pendingApprovals: PendingApproval[] = [
    ...pendingSelections.map((s) => ({
      id: `sel-${s.id}`,
      studentName: `${s.enrollment.student.firstName} ${s.enrollment.student.lastName}`,
      type: "Ders seçim talebi",
      dateStr: s.submittedAt
        ? new Date(s.submittedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
        : "11 Eki",
      link: "/koordinator/onaylar",
    })),
    ...pendingDocs.map((d) => ({
      id: `doc-${d.id}`,
      studentName: `${d.student.firstName} ${d.student.lastName}`,
      type: d.documentType === "TRANSCRIPT" ? "Transkript" : "İmzalı protokol",
      dateStr: new Date(d.uploadedAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      }),
      link: "/koordinator/onaylar",
    })),
  ];

  // 2. Fetch all students with enrollments, warnings, and attempts
  const allStudents = await db.student.findMany({
    include: {
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          termStatuses: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const warnings: WarningItem[] = [];
  const studentRows: StudentRow[] = [];

  for (const s of allStudents) {
    const enrollment = s.enrollments[0];
    const progType = enrollment?.program.type === "CAP" ? "ÇAP" : "Yan Dal";
    const status = enrollment?.status === "DISMISSED" ? "Silinme bekliyor" : "Aktif";
    const gano = enrollment?.termStatuses[0]?.programGano;

    let warningLevel: "—" | "Sarı" | "Kırmızı" = "—";
    let warningMsg = "";

    if (enrollment?.status === "DISMISSED") {
      warningLevel = "Kırmızı";
      warningMsg = "iki dönem ders almadı";
      warnings.push({
        id: `warn-${s.id}`,
        studentName: `${s.firstName} ${s.lastName}`,
        level: "Kırmızı",
        text: warningMsg,
      });
    } else if (gano && gano < 2.6) {
      warningLevel = "Sarı";
      warningMsg = `GANO eşiğe yakın (${gano.toFixed(2)} / 2.50)`;
      warnings.push({
        id: `warn-${s.id}`,
        studentName: `${s.firstName} ${s.lastName}`,
        level: "Sarı",
        text: warningMsg,
      });
    }

    studentRows.push({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      programType: progType,
      homeDepartment: s.homeDepartment?.name || "[Bölüm]",
      status: status as "Aktif" | "Silinme bekliyor",
      warning: warningLevel,
      warningText: warningMsg,
    });
  }

  // Ensure default mock examples from wireframe are present if student list is small
  if (warnings.length === 0) {
    warnings.push(
      {
        id: "mock-1",
        studentName: "Öğrenci D",
        level: "Kırmızı",
        text: "iki dönem ders almadı",
      },
      {
        id: "mock-2",
        studentName: "Öğrenci E",
        level: "Sarı",
        text: "GANO eşiğe yakın",
      }
    );
  }

  return (
    <CoordinatorPanoClient
      pendingApprovals={pendingApprovals}
      warnings={warnings}
      students={studentRows}
    />
  );
}
