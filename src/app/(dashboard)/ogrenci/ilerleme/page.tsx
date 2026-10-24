import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { PieChart, CheckCircle2, XCircle, Clock, Award, BookOpen } from "lucide-react";

export default async function StudentProgressPage() {
  const user = await getCurrentUser();
  const student = await db.student.findUnique({
    where: { userId: user?.id },
    include: {
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
    return <div>Kayıt bulunamadı.</div>;
  }

  // Calculate Passed Courses and AKTS
  const passedAttempts = enrollment.attempts.filter((a) => a.status === "PASSED");
  const passedCourseCodes = new Set(passedAttempts.map((a) => a.course.code));

  const passedAkts = enrollment.protocol.items
    .filter((item) => item.course && passedCourseCodes.has(item.course.code))
    .reduce((sum, item) => sum + item.akts, 0);

  const totalRequiredAkts = enrollment.protocol.totalAkts;
  const remainingAkts = Math.max(0, totalRequiredAkts - passedAkts);
  const completionPercentage = Math.round((passedAkts / totalRequiredAkts) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-emerald-600" /> ÇAP Mezuniyet ve Akademik İlerleme Matrisi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {enrollment.protocol.name} kapsamındaki ders tamamlama durumunuzu ve kalan AKTS kredilerinizi buradan izleyebilirsiniz.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Toplam Gerekli Kredi</span>
          <span className="text-2xl font-bold text-slate-800">{totalRequiredAkts} AKTS</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Başarıyla Tamamlanan</span>
          <span className="text-2xl font-bold text-emerald-600">{passedAkts} AKTS</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Kalan Kredi Yükü</span>
          <span className="text-2xl font-bold text-amber-600">{remainingAkts} AKTS</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 block font-medium">Tamamlanma Oranı</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-700">%{completionPercentage}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800">
          Protokol Ders Başarı Matrisi
        </h2>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-sm">
          {enrollment.protocol.items.map((item) => {
            const courseCode = item.course?.code;
            const courseAttempts = enrollment.attempts.filter((a) => a.course.code === courseCode);
            const latestAttempt = courseAttempts[0];

            let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
            let statusText = "Henüz Alınmadı";

            if (latestAttempt) {
              if (latestAttempt.status === "PASSED") {
                statusColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
                statusText = `GEÇTİ (${latestAttempt.letterGrade || "Onaylı"})`;
              } else if (latestAttempt.status === "FAILED") {
                statusColor = "bg-red-100 text-red-800 border-red-300";
                statusText = `KALDI (${latestAttempt.letterGrade || "FF"})`;
              } else {
                statusColor = "bg-amber-100 text-amber-800 border-amber-300";
                statusText = "Kayıtlı (Dönem İçi)";
              }
            }

            return (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="font-semibold text-slate-900">
                    {item.course ? `${item.course.code} - ${item.course.name}` : item.slotLabel}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {item.recommendedSemester}. Yarıyıl {item.footnoteNo ? `· (Özel Şart Dipnot ${item.footnoteNo})` : ""}
                    {courseAttempts.length > 1 && (
                      <span className="text-blue-600 font-semibold ml-2">
                        · {courseAttempts.length} defa alındı (Tekrar dersi)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500">{item.akts} AKTS</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${statusColor}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
