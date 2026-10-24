import { db } from "@/lib/db";
import Link from "next/link";
import { Users, UserPlus, CheckCircle2, ArrowRight } from "lucide-react";
import { createStudentAction } from "@/actions/studentActions";

export default async function CoordinatorStudentsPage() {
  const students = await db.student.findMany({
    include: {
      user: true,
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          protocol: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const homeDepartments = await db.homeDepartment.findMany({ where: { isActive: true } });
  const programs = await db.program.findMany({ where: { isActive: true } });
  const protocols = await db.protocol.findMany({ where: { isPublished: true } });

  return (
    <div className="space-y-6">
      {/* Header & Add Student */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> ÇAP ve Yan Dal Öğrenci Listesi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bölümümüze kayıtlı aktif öğrencileri görüntüleyin, yeni kabul edilen öğrenci ekleyin ve intibak durumlarını yönetin.
          </p>
        </div>
      </div>

      {/* New Student Form Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-blue-600" /> Kabul Edilen Yeni Öğrenci Tanımla
        </h2>
        <form
          action={async (formData) => {
            "use server";
            await createStudentAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Adı</label>
            <input
              type="text"
              name="firstName"
              required
              placeholder="Örn: Mehmet"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Soyadı</label>
            <input
              type="text"
              name="lastName"
              required
              placeholder="Örn: Kaya"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kurumsal E-posta</label>
            <input
              type="email"
              name="email"
              required
              placeholder="mehmet.kaya@ogr.selcuk.edu.tr"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ana Dal Öğrenci No</label>
            <input
              type="text"
              name="mainStudentNo"
              required
              placeholder="211202050"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ÇAP / YDP Öğrenci No</label>
            <input
              type="text"
              name="programStudentNo"
              required
              placeholder="231202150"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ana Dal Bölümü</label>
            <select
              name="homeDepartmentId"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {homeDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Program</label>
            <select
              name="programId"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">İntibak Protokolü</label>
            <select
              name="protocolId"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {protocols.map((pr) => (
                <option key={pr.id} value={pr.id}>{pr.name} (v{pr.version} - {pr.totalAkts} AKTS)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Ana Dal Danışmanı</label>
            <input
              type="text"
              name="advisorName"
              required
              placeholder="Doç. Dr. Ali Veli"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kabul Yarıyılı (Dönem)</label>
            <input
              type="number"
              name="admissionSemester"
              defaultValue={3}
              min={1}
              max={8}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kabul GANO'su</label>
            <input
              type="number"
              step="0.01"
              name="admissionGano"
              defaultValue={3.15}
              min={0}
              max={4}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kabul Türü</label>
            <select
              name="admissionType"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="ASIL">ASİL</option>
              <option value="YEDEK">YEDEK</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium text-sm transition shadow-sm"
            >
              Öğrenciyi Sisteme Ekle ve Protokolü İlişkilendir
            </button>
          </div>
        </form>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left font-semibold">
            <tr>
              <th className="px-6 py-3">Öğrenci No</th>
              <th className="px-6 py-3">Adı Soyadı</th>
              <th className="px-6 py-3">Ana Dal Bölümü</th>
              <th className="px-6 py-3">Program</th>
              <th className="px-6 py-3">Kabul GANO</th>
              <th className="px-6 py-3">Durum</th>
              <th className="px-6 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((s) => (
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
                  {s.enrollments.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                    >
                      {e.program.type === "CAP" ? "Çift Ana Dal" : "Yan Dal"}
                    </span>
                  ))}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800">{s.admissionGano.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/koordinator/ogrenci/${s.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-900 rounded-lg border border-slate-200 transition"
                  >
                    Öğrenci Kartı <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
