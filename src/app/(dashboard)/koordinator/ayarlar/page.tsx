import { db } from "@/lib/db";
import { Settings, Shield, Save, History, Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireUserWithRole } from "@/lib/session";

export default async function CoordinatorSettingsPage() {
  const rules = await db.programRule.findMany({
    include: { program: true },
    orderBy: { ruleKey: "asc" },
  });

  const ruleHistories = await db.programRuleHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" /> Yönerge Kural ve Sayısal Parametre Ayarları
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hoca direktifi uyarınca yönergelerdeki sayısal eşikler (GANO sınırları, kural uyarıları) koda sabit gömülmemiştir; buradan güncellenebilir. Her kural değişikliğinde eski sürüm ve değerler tarihsel kütükte kalıcı olarak saklanır.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Aktif Yönerge Eşikleri
        </h2>

        <div className="divide-y divide-slate-100 text-sm">
          {rules.map((rule) => (
            <div key={rule.id} className="py-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="font-semibold text-slate-800 flex items-center gap-2">
                  {rule.description}
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-xs">
                    {rule.ruleKey}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-xs">
                    Madde: {rule.sourceArticle}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Program: {rule.program.name} · Yürürlük Tarihi: {new Date(rule.effectiveFrom).toLocaleDateString("tr-TR")}
                </div>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const actor = await requireUserWithRole(["COORDINATOR"]);
                  const val = parseFloat(formData.get("value") as string);
                  const reason = (formData.get("reason") as string) || "Senato kararı güncellemesi";
                  if (isNaN(val)) return;

                  const before = await db.programRule.findUnique({ where: { id: rule.id } });
                  if (!before) return;

                  // 1. Update active rule
                  await db.programRule.update({
                    where: { id: rule.id },
                    data: {
                      value: val,
                      effectiveFrom: new Date(),
                    },
                  });

                  // 2. Persist historical version archive (Directive L61)
                  await db.programRuleHistory.create({
                    data: {
                      ruleId: rule.id,
                      programId: rule.programId,
                      ruleKey: rule.ruleKey,
                      oldValue: before.value,
                      newValue: val,
                      changedBy: actor.id,
                      reason,
                    },
                  });

                  // 3. Log to audit trail
                  await logAudit({
                    actorId: actor.id,
                    action: "UPDATE_PROGRAM_RULE",
                    entityType: "ProgramRule",
                    entityId: rule.id,
                    before: { value: before.value },
                    after: { value: val, reason },
                  });

                  revalidatePath("/koordinator/ayarlar");
                  revalidatePath("/koordinator");
                  revalidatePath("/bolum-baskani/genel-bakis");
                }}
                className="flex flex-col sm:flex-row items-end sm:items-center gap-2 self-end md:self-center"
              >
                <input
                  type="text"
                  name="reason"
                  placeholder="Değişiklik gerekçesi..."
                  className="w-44 px-2.5 py-1.5 border border-slate-300 rounded text-xs outline-none focus:ring-1 focus:ring-blue-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    name="value"
                    defaultValue={rule.value}
                    required
                    className="w-20 px-2.5 py-1.5 border border-slate-300 rounded text-sm text-center font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Güncelle
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Rule Version Archive */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" /> Tarihsel Kural Sürüm Arşivi (Mevzuat Değişiklik Kütüğü)
        </h2>
        <p className="text-xs text-slate-500">
          Geçmiş dönemlerde yürürlükte olan eşik değerleri ve yapılan mevzuat güncellemelerinin değiştirilemez kayıtları.
        </p>

        {ruleHistories.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Henüz bir kural güncelleme geçmişi bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-4 py-2.5">Tarih</th>
                  <th className="px-4 py-2.5">Kural Anahtarı</th>
                  <th className="px-4 py-2.5">Eski Eşik</th>
                  <th className="px-4 py-2.5">Yeni Eşik</th>
                  <th className="px-4 py-2.5">Gerekçe / Karar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ruleHistories.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-2 font-bold text-blue-900">{h.ruleKey}</td>
                    <td className="px-4 py-2 text-slate-500 line-through">{h.oldValue.toFixed(2)}</td>
                    <td className="px-4 py-2 text-emerald-700 font-bold">{h.newValue.toFixed(2)}</td>
                    <td className="px-4 py-2 text-slate-600 font-sans">{h.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
