import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { BookOpen, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default async function RegulationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Yönergeler ve Mevzuat</h1>
        <p className="text-sm text-slate-500 mt-1">
          Selçuk Üniversitesi Senatosu tarafından onaylanan resmi ÇAP ve Yan Dal mevzuat kuralları.
        </p>
      </div>

      {/* Grid of Governing Regulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ÇAP Yönergesi Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Çift Ana Dal Programı (ÇAP) Yönergesi
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Selçuk Üniversitesi Senatosu Kararı (02.06.2026). Mühendislik Fakültesi bölümleri arasındaki ikinci lisans diploması şartlarını kapsar.
          </p>

          <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">Temel Başarı ve Mezuniyet Şartları:</div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span><strong>135 AKTS Kredi Yükü:</strong> 20 zorunlu temel ders ve 8 teknik seçmeli ders başarıyla tamamlanmalıdır.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span><strong>2.50 GANO Uyarı Eşiği:</strong> Ana dal veya ÇAP ortalaması 2.50&apos;nin altına düşen öğrenciye bir dönemlik uyarı verilir.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
              <span><strong>2.72 Mezuniyet & İlişik Kesme:</strong> İki dönem üst üste 2.50 sağlayamayan veya 2.72 genel barajının altında kalan öğrencinin ÇAP kaydı silinir (m.9).</span>
            </div>
          </div>
        </div>

        {/* Yan Dal Yönergesi Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">
              Yan Dal Programı (YDP) Yönergesi
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Selçuk Üniversitesi Yan Dal Sertifika Eğitim ve Öğretim Yönergesi. Öğrencinin ilgi duyduğu alanda yan dal sertifikası almasını düzenler.
          </p>

          <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1">Temel Kurallar:</div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
              <span><strong>Asgari Kredi:</strong> En az 30 AKTS karşılığı bölüm ders paketinin başarıyla tamamlanması zorunludur.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span><strong>Ana Dal Başarısı:</strong> Ana dal GANO&apos;su 2.30&apos;un altına düşen öğrencinin yan dal programına devam hakkı dondurulur.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
              <span><strong>İki Dönem Kuralı:</strong> İki dönem üst üste ders kaydı yaptırmayan öğrencinin ilişiği kesilir.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Documents in Repository */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <h2 className="text-base font-bold text-slate-900">Arşiv Belgeleri ve Şablonlar</h2>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-slate-800">FORM01 - Ders Kayıt Formu Şablonu (.docx)</span>
            </div>
            <span className="text-slate-400">Resmi Fakülte Şablonu</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-slate-800">Protokol - Elektrik-Elektronikten Bilgisayara (135 AKTS)</span>
            </div>
            <span className="text-slate-400">Bölüm Kurulu Onaylı</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-slate-800">Çift Ana Dal ve Yan Dal Öğrenci Rehberi (2025/2026)</span>
            </div>
            <span className="text-slate-400">Öğrenci Kılavuzu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
