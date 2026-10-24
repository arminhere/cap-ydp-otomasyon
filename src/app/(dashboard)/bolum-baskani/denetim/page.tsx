import { db } from "@/lib/db";
import { ShieldAlert, User, Clock, Terminal } from "lucide-react";

export default async function DepartmentHeadAuditPage() {
  const auditLogs = await db.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" /> Sistem Değişmez Denetim Kütüğü (Audit Trail)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Sistemde gerçekleştirilen tüm idari, akademik ve belge onay işlemleri aktör, zaman damgası, IP adresi ve değişiklik öncesi/sonrası değerleriyle bu sayfada değiştirilemez olarak saklanır.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="px-5 py-3">Zaman</th>
                <th className="px-5 py-3">Aktör (Kullanıcı)</th>
                <th className="px-5 py-3">İşlem / Eylem</th>
                <th className="px-5 py-3">Hedef Nesne</th>
                <th className="px-5 py-3">IP Adresi</th>
                <th className="px-5 py-3">Değişiklik Detayı (Before / After)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {log.actor?.email || "Sistem / Oturum Öncesi"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold border border-blue-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {log.entityType} ({log.entityId.slice(0, 8)}...)
                  </td>
                  <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                  <td className="px-5 py-3 text-[11px] max-w-xs truncate text-slate-500">
                    {log.afterJson || log.beforeJson || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
