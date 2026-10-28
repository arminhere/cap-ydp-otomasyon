import { db } from "@/lib/db";
import { BookOpen, Layers, CheckCircle, PlusCircle, Power, Check, AlertCircle } from "lucide-react";
import { createCourseAction, toggleCourseActiveAction } from "@/actions/courseActions";

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
          Bölümümüze kabul edilen ÇAP ve Yan Dal öğrencilerine uygulanan onaylı ve sürümlü protokoller ile Bilgisayar Mühendisliği ders kataloğu. Hoca direktifi gereğince katalog dersleri dinamik olarak düzenlenebilir ve pasife alınabilir.
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

      {/* Course Catalog Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Bilgisayar Mühendisliği Bölüm Ders Kataloğu
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Toplam {courses.length} ders ({courses.filter((c) => c.isActive).length} aktif, {courses.filter((c) => !c.isActive).length} pasif). Kataloğa yeni ders ekleyebilir veya derslerin durumunu değiştirebilirsiniz.
            </p>
          </div>
        </div>

        {/* Add Course Form */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <PlusCircle className="w-4 h-4 text-emerald-600" /> Kataloğa Yeni Ders Ekle
          </h3>
          <form
            action={async (formData) => {
              "use server";
              await createCourseAction(formData);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs"
          >
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Ders Kodu</label>
              <input
                type="text"
                name="code"
                required
                placeholder="Örn: 3301780"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono uppercase bg-white outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">Ders Adı</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Örn: Bulut Bilişim ve Dağıtık Sistemler"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">AKTS Kredisi</label>
              <input
                type="number"
                name="akts"
                required
                min={1}
                max={30}
                defaultValue={4}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-center font-bold outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded transition flex items-center justify-center gap-1 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>
          </form>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {courses.map((c) => (
            <div
              key={c.id}
              className={`p-3 rounded-lg border flex justify-between items-center transition ${
                c.isActive
                  ? "bg-white border-slate-200 shadow-sm"
                  : "bg-slate-100 border-slate-300 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900 block">{c.code}</span>
                  {!c.isActive && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-300 text-slate-700 font-bold text-[10px]">
                      PASİF
                    </span>
                  )}
                </div>
                <span className="text-slate-700 font-medium block mt-0.5">{c.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-bold text-slate-700">
                  {c.akts} AKTS
                </span>
                <form
                  action={async () => {
                    "use server";
                    await toggleCourseActiveAction(c.id);
                  }}
                >
                  <button
                    type="submit"
                    title={c.isActive ? "Dersi Pasife Al" : "Dersi Aktifleştir"}
                    className={`p-1.5 rounded border transition ${
                      c.isActive
                        ? "text-slate-500 hover:text-red-600 hover:bg-red-50 border-slate-200"
                        : "text-emerald-700 hover:bg-emerald-100 border-emerald-300 bg-emerald-50"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
