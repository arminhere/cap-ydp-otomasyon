import { db } from "@/lib/db";
import { Settings, Shield, Save } from "lucide-react";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { requireUserWithRole } from "@/lib/session";

export default async function CoordinatorSettingsPage() {
  const rules = await db.programRule.findMany({
    include: { program: true },
    orderBy: { ruleKey: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" /> Yönerge Kural ve Sayısal Parametre Ayarları
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hoca direktifi uyarınca yönergelerdeki sayısal eşikler (GANO sınırları, kural uyarıları) koda sabit gömülmemiştir; buradan güncellenebilir.
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
                  Program: {rule.program.name} · Yürürlük: {new Date(rule.effectiveFrom).toLocaleDateString("tr-TR")}
                </div>
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  const actor = await requireUserWithRole(["COORDINATOR"]);
                  const val = parseFloat(formData.get("value") as string);
                  if (isNaN(val)) return;

                  const before = await db.programRule.findUnique({ where: { id: rule.id } });
                  await db.programRule.update({
                    where: { id: rule.id },
                    data: { value: val },
                  });

                  await logAudit({
                    actorId: actor.id,
                    action: "UPDATE_PROGRAM_RULE",
                    entityType: "ProgramRule",
                    entityId: rule.id,
                    before: { value: before?.value },
                    after: { value: val },
                  });

                  revalidatePath("/koordinator/ayarlar");
                }}
                className="flex items-center gap-2 self-end md:self-center"
              >
                <input
                  type="number"
                  step="0.01"
                  name="value"
                  defaultValue={rule.value}
                  required
                  className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-center font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" /> Güncelle
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
