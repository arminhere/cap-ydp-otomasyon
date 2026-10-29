import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import { FileCheck, UploadCloud, Download, AlertCircle, FileText } from "lucide-react";
import { uploadDocumentAction } from "@/actions/documentActions";

export default async function StudentDocumentsPage() {
  const user = await requireUserWithRole(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: {
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-amber-500" /> Belge Arşivi ve Yükleme Merkezi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          İmzalı ders kayıt formlarınızı, dönem sonu transkriptlerinizi ve diğer resmi evraklarınızı bu sayfadan yükleyebilir ve onay durumlarını takip edebilirsiniz.
        </p>
      </div>

      {/* Mandatory Transcript Notice */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div>
          <strong className="font-semibold">Zorunlu Yönerge Kuralı:</strong> Her dönem sonunda bölümümüzden aldığınız derslerin güncel ÇAP/YDP transkript belgesini sisteme yüklemeniz zorunludur. Bu belge yüklenip onaylanmadan dönem sonu harf notlarınız kesinleşemez ve onaylanamaz.
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <UploadCloud className="w-5 h-5 text-blue-600" /> Yeni Belge Yükle
        </h2>

        <form
          action={async (formData) => {
            "use server";
            await uploadDocumentAction(formData);
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Belge Türü</label>
            <select
              name="documentType"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="TRANSCRIPT">ÇAP / YDP Transkripti (Not Belgesi)</option>
              <option value="COURSE_FORM_SIGNED">İmzalı FORM01 Ders Kayıt Formu</option>
              <option value="STUDENT_CERTIFICATE">Öğrenci Belgesi (e-Devlet)</option>
              <option value="MAIN_GANO_DOCUMENT">Ana Dal GANO Belgesi</option>
              <option value="PETITION">Dilekçe</option>
              <option value="OTHER">Diğer Resmi Belge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Belge Başlığı / Açıklaması</label>
            <input
              type="text"
              name="label"
              required
              placeholder="Örn: 2026-2027 Güz İmzalı Ders Kayıt Formu"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Dosya Seç (PDF / DOCX / Görsel, Max 10MB)</label>
            <input
              type="file"
              name="file"
              required
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm transition shadow-sm"
            >
              Belgeyi Sisteme Yükle ve Onaya Gönder
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">
          Yüklediğiniz Belgeler ({student?.documents.length ?? 0})
        </h2>

        {!student?.documents || student.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">Yüklenmiş Belge Yok</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Henüz sisteme bir resmi evrak veya transkript belgesi yüklemediniz.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {student.documents.map((doc) => (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> {doc.label}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      doc.approvalStatus === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : doc.approvalStatus === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {doc.approvalStatus === "APPROVED" ? "ONAYLANDI" : doc.approvalStatus === "REJECTED" ? "REDDEDİLDİ" : "ONAY BEKLİYOR"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {doc.originalName} ({Math.round(doc.sizeBytes / 1024)} KB) · {new Date(doc.uploadedAt).toLocaleString("tr-TR")}
                  </div>
                  {doc.reviewNote && (
                    <div className="text-xs text-red-600 mt-1 italic">
                      Koordinatör Notu: {doc.reviewNote}
                    </div>
                  )}
                </div>

                <a
                  href={`/api/documents/${doc.id}/download`}
                  className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-slate-200 transition"
                >
                  <Download className="w-4 h-4" /> İndir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
