import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";
import { History, BookOpen, CheckCircle2, Clock, XCircle } from "lucide-react";

export default async function StudentProgressPage() {
  const user = await requireUserWithRole(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: {
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          protocol: {
            include: {
              items: {
                include: { course: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          attempts: {
            include: { course: true, term: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const enrollment = student?.enrollments[0];
  if (!enrollment) {
    return (
      <div className="py-8">
        <p className="text-slate-600">Aktif ÇAP veya Yan Dal kaydı bulunamadı.</p>
      </div>
    );
  }

  // Active term enrolled courses
  const activeTerm = await db.academicTerm.findFirst({
    where: { isCurrent: true },
  });

  const enrolledCourseCodes = new Set<string>();
  if (activeTerm) {
    const activeReq = await db.courseSelectionRequest.findFirst({
      where: {
        enrollmentId: enrollment.id,
        termId: activeTerm.id,
        status: "APPROVED",
      },
      include: {
        items: { include: { course: true } },
      },
    });
    if (activeReq) {
      activeReq.items.forEach((item) => {
        if (item.course?.code) enrolledCourseCodes.add(item.course.code);
      });
    }
  }

  // Calculate Passed Courses and AKTS
  const passedAttempts = enrollment.attempts.filter((a) => a.status === "PASSED");
  const passedCourseCodes = new Set(passedAttempts.map((a) => a.course.code));

  const passedAkts = enrollment.protocol.items
    .filter((item) => item.course && passedCourseCodes.has(item.course.code))
    .reduce((sum, item) => sum + item.akts, 0);

  const enrolledAkts = enrollment.protocol.items
    .filter((item) => item.course && enrolledCourseCodes.has(item.course.code))
    .reduce((sum, item) => sum + item.akts, 0);

  const totalRequiredAkts = enrollment.protocol.totalAkts;
  const remainingAkts = Math.max(0, totalRequiredAkts - passedAkts);

  // Check if student has FORM01 generated to link to
  const form01Doc = await db.document.findFirst({
    where: {
      studentId: student.id,
      documentType: "COURSE_FORM_SIGNED",
    },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">İlerleme</h1>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-600">
          <span>
            {enrollment.program.type === "CAP" ? "Çift Anadal" : "Yandal"} ·{" "}
            {student.homeDepartment?.name || "Mühendislik"} → Bilgisayar Mühendisliği · Durum:
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-slate-300 text-slate-700 bg-white">
            {enrollment.status === "ACTIVE" ? "Aktif" : "Pasif"}
          </span>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Gerekli</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {totalRequiredAkts} AKTS
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Geçilen / Muaf</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{passedAkts} AKTS]
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Bu dönem kayıtlı</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {enrolledAkts > 0 ? `[${enrolledAkts} AKTS]` : "[—]"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Kalan</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{remainingAkts} AKTS]
          </span>
        </div>
      </div>

      {/* Protocol Curriculum Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="py-3 px-4 font-semibold text-slate-900 w-32">Ders kodu</th>
                <th className="py-3 px-4 font-semibold text-slate-900">Ders adı</th>
                <th className="py-3 px-4 font-semibold text-slate-900 w-24">AKTS</th>
                <th className="py-3 px-4 font-semibold text-slate-900 w-28">Harf notu</th>
                <th className="py-3 px-4 font-semibold text-slate-900 w-36">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrollment.protocol.items.map((item) => {
                const course = item.course;
                const courseCode = course?.code;
                const courseAttempts = enrollment.attempts.filter(
                  (a) => a.course.code === courseCode
                );
                const latestAttempt = courseAttempts[0];

                let pillText = "Henüz alınmadı";
                let letterGradeText = "—";

                if (courseCode && enrolledCourseCodes.has(courseCode)) {
                  pillText = "Kayıtlı";
                } else if (latestAttempt) {
                  letterGradeText = latestAttempt.letterGrade || "—";
                  if (latestAttempt.status === "PASSED") {
                    pillText = "Geçti";
                  } else if (latestAttempt.status === "FAILED") {
                    pillText = "Kaldı";
                  } else {
                    pillText = "Kayıtlı";
                  }
                } else if (item.footnoteNo) {
                  // If conditional footnote exemption
                  pillText = "Henüz alınmadı";
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-800 font-mono text-xs">
                      {courseCode || "[Kod]"}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      <div>{course ? course.name : item.slotLabel || "[Teknik seçmeli yuvası]"}</div>
                      {courseAttempts.length > 1 && (
                        <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-slate-600">Tekrar:</span>
                          {courseAttempts.map((att) => (
                            <span key={att.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                              {att.term.academicYear} {att.term.semester}: <strong>{att.letterGrade || "—"}</strong> ({att.status === "PASSED" ? "Geçti" : att.status === "FAILED" ? "Kaldı" : "Kayıtlı"})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      [{item.akts}]
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {letterGradeText}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-xs text-slate-700 border border-slate-300 bg-white">
                        {pillText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repeated Attempts & Full Course History Card (Professor Requirement) */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Dönemlik Ders Kayıt ve Deneme Geçmişi
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Toplam {enrollment.attempts.length} ders denemesi
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Hoca direktifi: Bir ders birden fazla kez alındığında her deneme; alındığı akademik yıl, dönem, harf notu ve başarı durumuyla birlikte ayrı ayrı izlenir.
        </p>

        {enrollment.attempts.length === 0 ? (
          <p className="text-sm text-slate-400 py-3 text-center">Henüz onaylanmış bir ders denemeniz bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Akademik Dönem</th>
                  <th className="py-2.5 px-3">Ders Kodu</th>
                  <th className="py-2.5 px-3">Ders Adı</th>
                  <th className="py-2.5 px-3">AKTS</th>
                  <th className="py-2.5 px-3">Harf Notu</th>
                  <th className="py-2.5 px-3">Durum</th>
                  <th className="py-2.5 px-3">Kayıt Türü</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {enrollment.attempts.map((att) => {
                  const isPassed = att.status === "PASSED";
                  const isFailed = att.status === "FAILED";
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-slate-700 font-semibold">
                        {att.term.academicYear} {att.term.semester === "GUZ" ? "Güz" : "Bahar"}
                      </td>
                      <td className="py-2.5 px-3 text-blue-900 font-bold">{att.course.code}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">{att.course.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{att.course.akts}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{att.letterGrade || "—"}</td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isPassed
                              ? "bg-emerald-100 text-emerald-800"
                              : isFailed
                              ? "bg-red-100 text-red-800"
                              : att.status === "EXEMPT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isPassed ? "Geçti" : isFailed ? "Kaldı" : att.status === "EXEMPT" ? "Muaf" : "Kayıtlı"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                        {att.verifiedBy ? "Koordinatör Onaylı" : "Kayıtlı"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Link & Disclaimer */}
      <div className="pt-1 text-sm text-slate-500">
        <Link
          href={form01Doc ? `/api/documents/${form01Doc.id}/download` : "/ogrenci/ders-secimi"}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          FORM01 indir
        </Link>
        <span className="text-slate-400"> · Yer tutucular [ ] örnek amaçlıdır.</span>
      </div>
    </div>
  );
}
