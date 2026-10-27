"use client";

import { useState } from "react";
import { submitCourseSelectionAction } from "@/actions/courseSelectionActions";

interface ProtocolItemData {
  id: string;
  code: string;
  name: string;
  akts: number;
  isElectiveSlot: boolean;
}

interface Props {
  enrollmentId: string;
  termId: string;
  items: ProtocolItemData[];
  initialSelectedIds: string[];
  isApproved: boolean;
  form01DocId?: string | null;
}

export function CourseSelectionClient({
  enrollmentId,
  termId,
  items,
  initialSelectedIds,
  isApproved,
  form01DocId,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    if (isApproved) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const totalSelectedAkts = items
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.akts, 0);

  const handleSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const res = await submitCourseSelectionAction(
        enrollmentId,
        termId,
        Array.from(selectedIds)
      );
      if (res?.success) {
        setMessage(isDraft ? "Taslak kaydedildi." : "Ders seçiminiz onaya gönderildi.");
      } else {
        setMessage(res?.error || "İşlem sırasında bir hata oluştu.");
      }
    } catch {
      setMessage("Sunucu bağlantısı sırasında bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-md">
          {message}
        </div>
      )}

      {isApproved && form01DocId && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md flex items-center justify-between">
          <span>Ders seçiminiz koordinatör tarafından onaylanmıştır.</span>
          <a
            href={`/api/documents/${form01DocId}/download`}
            className="text-blue-700 underline font-medium hover:text-blue-900"
          >
            FORM01 indir (.docx)
          </a>
        </div>
      )}

      {/* Main Table Matching Image 4 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white">
              <th className="py-3 px-4 w-12 text-center"></th>
              <th className="py-3 px-4 font-semibold text-slate-900 w-36">Ders kodu</th>
              <th className="py-3 px-4 font-semibold text-slate-900">Ders adı</th>
              <th className="py-3 px-4 font-semibold text-slate-900 w-24">AKTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <tr
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`cursor-pointer transition ${
                    checked ? "bg-slate-50/80" : "hover:bg-slate-50/40"
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                      disabled={isApproved}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                    {item.code}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-medium">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-normal">
                    [{item.akts}]
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer Footnote */}
      <p className="text-xs text-slate-500">
        Geçilen ve muaf dersler listelenmez. Çakışma kontrolü sizin beyanınız ve koordinatör denetimiyle yapılır.
      </p>

      {/* Bottom Bar: Total AKTS on Left, Buttons on Right */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="text-base font-bold text-slate-900">
          Toplam: [{totalSelectedAkts}] AKTS
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting || isApproved}
            onClick={() => handleSubmit(true)}
            className={`px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-medium transition ${
              isApproved ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer"
            }`}
          >
            Taslağı kaydet
          </button>
          <button
            type="button"
            disabled={isSubmitting || isApproved}
            onClick={() => handleSubmit(false)}
            className={`px-5 py-2 text-white rounded-md text-sm font-medium transition shadow-sm ${
              isApproved
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            }`}
          >
            {isSubmitting ? "Gönderiliyor..." : isApproved ? "Onaylandı" : "Onaya gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
