import { db } from "@/lib/db";
import { Calendar, CheckCircle2 } from "lucide-react";

export default async function CoordinatorTermsPage() {
  const terms = await db.academicTerm.findMany({
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: {
          selectionRequests: true,
          courseAttempts: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-purple-600" /> Akademik Dönem Yönetimi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dönemlik ders seçimi tarihlerini ve aktif kayıt dönemlerini buradan yönetebilirsiniz.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
            <tr>
              <th className="px-6 py-3">Akademik Yıl ve Dönem</th>
              <th className="px-6 py-3">Dönem Başlangıcı</th>
              <th className="px-6 py-3">Ders Seçim Penceresi</th>
              <th className="px-6 py-3">Kayıt Talepleri</th>
              <th className="px-6 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {terms.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-800">
                  {t.academicYear} {t.semester === "GUZ" ? "Güz" : "Bahar"} Yarıyılı
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(t.startDate).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(t.selectionOpenAt).toLocaleDateString("tr-TR")} – {new Date(t.selectionCloseAt).toLocaleDateString("tr-TR")}
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-blue-700">
                  {t._count.selectionRequests} Talep · {t._count.courseAttempts} Ders Kaydı
                </td>
                <td className="px-6 py-4">
                  {t.isCurrent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Dönem
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Tamamlandı</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
