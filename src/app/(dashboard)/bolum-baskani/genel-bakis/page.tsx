import { db } from "@/lib/db";
import { PieChart, Users, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function DepartmentHeadOverviewPage() {
  const totalStudents = await db.student.count();
  const totalEnrollments = await db.programEnrollment.count({
    where: { status: "ACTIVE" },
  });
  const totalCourses = await db.course.count();
  const recentAuditLogs = await db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { actor: true },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-purple-600" /> Bölüm Başkanı İzleme Paneli (Salt Okunur)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bu panel yalnızca izleme ve denetim amaçlıdır. Hiçbir kayıt üzerinde değişiklik veya onaylama yapılamaz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Kayıtlı Öğrenci Sayısı</span>
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Aktif Program Kayıtları</span>
            <span className="text-2xl font-bold text-slate-800">{totalEnrollments}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Katalogdaki Dersler</span>
            <span className="text-2xl font-bold text-slate-800">{totalCourses}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Son İdari İşlem Kayıtları (Audit Log)
        </h2>
        <div className="divide-y divide-slate-100 text-sm">
          {recentAuditLogs.length === 0 ? (
            <p className="text-slate-400 py-3 text-center">Henüz kaydedilmiş bir işlem bulunmamaktadır.</p>
          ) : (
            recentAuditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {log.action}
                  </span>
                  <span className="text-slate-600 ml-2">Nesne: {log.entityType} ({log.entityId})</span>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(log.createdAt).toLocaleString("tr-TR")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
