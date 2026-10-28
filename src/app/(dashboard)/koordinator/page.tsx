import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import { evaluateStudentRules, getProgramRules } from "@/lib/rules";
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
        : "Yeni",
      link: "/koordinator/onaylar",
    })),
    ...pendingDocs.map((d) => ({
      id: `doc-${d.id}`,
      studentName: `${d.student.firstName} ${d.student.lastName}`,
      type: d.documentType === "TRANSCRIPT" ? "Transkript Belgesi" : d.label || "Resmi Belge",
      dateStr: new Date(d.uploadedAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      }),
      link: "/koordinator/onaylar",
    })),
  ];

  // 2. Fetch configurable rules from database
  const capRules = await getProgramRules("CAP");

  // 3. Fetch all students with enrollments, term statuses, and attempts
  const allStudents = await db.student.findMany({
    include: {
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          termStatuses: {
            orderBy: { createdAt: "desc" },
            take: 2,
            include: { term: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const warnings: WarningItem[] = [];
  const studentRows: StudentRow[] = [];

  for (const s of allStudents) {
    const enrollment = s.enrollments[0];
    if (!enrollment) continue;

    const progType = enrollment.program.type === "CAP" ? "ÇAP" : "Yan Dal";
    const statusLabel =
      enrollment.status === "ACTIVE"
        ? "Aktif"
        : enrollment.status === "REMOVED"
        ? "Silinme bekliyor"
        : enrollment.status === "FROZEN"
        ? "Donduruldu"
        : "Aktif";

    // Dynamic rule evaluation based on official regulations
    const studentAlerts = evaluateStudentRules(enrollment, capRules);

    let warningLevel: "—" | "Sarı" | "Kırmızı" = "—";
    let warningMsg = "";

    if (studentAlerts.length > 0) {
      // Pick highest severity alert (Kırmızı > Sarı)
      const primaryAlert =
        studentAlerts.find((a) => a.level === "Kırmızı") || studentAlerts[0];
      warningLevel = primaryAlert.level;
      warningMsg = `${primaryAlert.text} (${primaryAlert.sourceArticle})`;

      warnings.push({
        id: `warn-${s.id}`,
        studentName: `${s.firstName} ${s.lastName}`,
        level: primaryAlert.level,
        text: `${primaryAlert.text} [${primaryAlert.sourceArticle}]`,
      });
    }

    studentRows.push({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      programType: progType,
      homeDepartment: s.homeDepartment?.name || "[Bölüm]",
      status: statusLabel as "Aktif" | "Silinme bekliyor",
      warning: warningLevel,
      warningText: warningMsg,
    });
  }

  return (
    <CoordinatorPanoClient
      pendingApprovals={pendingApprovals}
      warnings={warnings}
      students={studentRows}
    />
  );
}
