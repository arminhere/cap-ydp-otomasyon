import { db } from "@/lib/db";
import { requireUserWithRole } from "@/lib/session";
import { Users, Shield, CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

export default async function DepartmentHeadStudentsPage() {
  await requireUserWithRole(["DEPARTMENT_HEAD"]);

  const students = await db.student.findMany({
    include: {
      user: true,
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          protocol: true,
          termStatuses: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { term: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> ÇAP ve Yan Dal Öğrenci Kütüğü
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bölümümüze kabul edilen ÇAP ve Yan Dal öğrencilerinin genel akademik durumu ve kayıt listesi (Bölüm Başkanı salt okunur denetim görünümü).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Salt Okunur Denetim Modu</span>
        </div>
      </div>

      {/* Student List Table (Read-Only) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left font-semibold">
            <tr>
              <th className="px-6 py-3">Öğrenci No</th>
              <th className="px-6 py-3">Adı Soyadı</th>
              <th className="px-6 py-3">Ana Dal Bölümü</th>
              <th className="px-6 py-3">Program</th>
              <th className="px-6 py-3">Danışman</th>
              <th className="px-6 py-3">Kabul GANO</th>
              <th className="px-6 py-3">Son Dönem GANO</th>
              <th className="px-6 py-3">Kayıt Durumu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Kayıtlı öğrenci bulunamadı.
                </td>
              </tr>
            ) : (
              students.map((s) => {
                const enrollment = s.enrollments[0];
                const latestTermStatus = enrollment?.termStatuses[0];

                const statusBadge =
                  enrollment?.status === "ACTIVE"
                    ? { label: "Aktif", bg: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 }
                    : enrollment?.status === "FROZEN"
                    ? { label: "Donduruldu", bg: "bg-blue-100 text-blue-800", icon: Clock }
                    : enrollment?.status === "REMOVED"
                    ? { label: "Kaydı Silindi", bg: "bg-red-100 text-red-800", icon: XCircle }
                    : { label: enrollment?.status || "Aktif", bg: "bg-slate-100 text-slate-700", icon: CheckCircle2 };

                const StatusIcon = statusBadge.icon;

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {s.programStudentNo}
                      <div className="text-xs text-slate-400 font-normal">Ana Dal: {s.mainStudentNo}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {s.firstName} {s.lastName}
                      <div className="text-xs text-slate-400">{s.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.homeDepartment.name}</td>
                    <td className="px-6 py-4">
                      {enrollment && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {enrollment.program.type === "CAP" ? "Çift Ana Dal" : "Yan Dal"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{s.advisorName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{s.admissionGano.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {latestTermStatus?.mainGano !== null && latestTermStatus?.mainGano !== undefined ? (
                        <span>
                          {latestTermStatus.mainGano.toFixed(2)}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {latestTermStatus.term.academicYear} {latestTermStatus.term.semester}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.bg}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {statusBadge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

