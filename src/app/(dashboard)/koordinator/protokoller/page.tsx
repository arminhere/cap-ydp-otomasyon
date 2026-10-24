import { db } from "@/lib/db";
import { BookOpen, Layers, CheckCircle } from "lucide-react";

export default async function CoordinatorProtocolsPage() {
  const protocols = await db.protocol.findMany({
    include: {
      program: true,
      homeDepartment: true,
      items: {
        include: { course: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const courses = await db.course.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" /> Sürümlü İntibak Protokolleri ve Ders Kataloğu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bölümümüze kabul edilen ÇAP ve Yan Dal öğrencilerine uygulanan onaylı ve sürümlü protokoller ile Bilgisayar Mühendisliği ders kataloğu.
        </p>
      </div>

      {/* Published Protocols */}
      <div className="space-y-6">
        {protocols.map((proto) => (
          <div key={proto.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" /> {proto.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kaynak Bölüm: <strong>{proto.homeDepartment?.name}</strong> | Geçerlilik: <strong>{proto.validFromYear} ve sonrası</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded font-bold text-xs">
                  Sürüm {proto.version}.0 (Değişmez)
                </span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-bold text-xs flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Yayımlandı ({proto.totalAkts} AKTS)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                  <tr>
                    <th className="px-4 py-2.5">Sıra</th>
                    <th className="px-4 py-2.5">Ders Kodu</th>
                    <th className="px-4 py-2.5">Ders Adı / Seçmeli Yuvası</th>
                    <th className="px-4 py-2.5">Önerilen Dönem</th>
                    <th className="px-4 py-2.5">AKTS</th>
                    <th className="px-4 py-2.5">Özel Şart Dipnotu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proto.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-400 font-mono">{item.sortOrder}</td>
                      <td className="px-4 py-2 font-mono font-semibold text-slate-800">
                        {item.course?.code || "-"}
                      </td>
                      <td className="px-4 py-2 text-slate-800 font-medium">
                        {item.course?.name || item.slotLabel}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{item.recommendedSemester}. Yarıyıl</td>
                      <td className="px-4 py-2 font-bold text-blue-700">{item.akts}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {item.footnoteNo ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 font-medium">
                            Dipnot {item.footnoteNo} Şartlı Muafiyet
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Course Catalog */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Bilgisayar Mühendisliği Ders Kataloğu ({courses.length} Ders)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {courses.map((c) => (
            <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
              <div>
                <span className="font-mono font-bold text-blue-900 block">{c.code}</span>
                <span className="text-slate-700 font-medium">{c.name}</span>
              </div>
              <span className="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-700">
                {c.akts} AKTS
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
