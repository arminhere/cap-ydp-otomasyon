import { db } from "@/lib/db";
import { CheckSquare, FileText, AlertCircle, Check, X, Download } from "lucide-react";
import { approveCourseSelectionAction, rejectCourseSelectionAction } from "@/actions/courseSelectionActions";
import { reviewDocumentAction } from "@/actions/documentActions";

export default async function CoordinatorApprovalsPage() {
  const pendingRequests = await db.courseSelectionRequest.findMany({
    where: { status: "SUBMITTED" },
    include: {
      enrollment: {
        include: {
          student: { include: { homeDepartment: true } },
          protocol: true,
        },
      },
      term: true,
      items: {
        include: { course: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const pendingDocuments = await db.document.findMany({
    where: { approvalStatus: "PENDING" },
    include: { student: true },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-amber-500" /> Onay ve İnceleme Merkezi
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Öğrencilerin dönemlik ders seçim taleplerini inceleyin, FORM01 belgesini üreterek onaylayın veya belgeleri doğrulayın.
        </p>
      </div>

      {/* 1. Pending Course Selection Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" /> Bekleyen Dönemlik Ders Seçim Talepleri ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            Şu anda onay bekleyen bir ders seçim talebi bulunmamaktadır.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 space-y-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="font-semibold text-slate-900">
                    {req.enrollment.student.firstName} {req.enrollment.student.lastName} ({req.enrollment.student.programStudentNo})
                  </div>
                  <div className="text-xs text-slate-500">
                    Bölüm: {req.enrollment.student.homeDepartment.name} | Dönem: {req.term.academicYear} {req.term.semester} | Toplam AKTS: <strong className="text-blue-700">{req.totalAkts} AKTS</strong>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {req.items.map((i) => (
                      <span
                        key={i.id}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200"
                      >
                        {i.course.code} - {i.course.name} ({i.course.akts} AKTS)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <form
                    action={async () => {
                      "use server";
                      await approveCourseSelectionAction(req.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Check className="w-4 h-4" /> Onayla ve FORM01 Üret
                    </button>
                  </form>

                  <form
                    action={async (formData) => {
                      "use server";
                      const note = formData.get("note") as string;
                      await rejectCourseSelectionAction(req.id, note || "Ders seçimi uygun görülmedi.");
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      name="note"
                      placeholder="Ret gerekçesi..."
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <X className="w-4 h-4" /> Reddet
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Pending Documents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-600" /> Bekleyen Öğrenci Belgeleri ({pendingDocuments.length})
        </h2>

        {pendingDocuments.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            Şu anda onay bekleyen bir öğrenci belgesi bulunmamaktadır.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800">
                    {doc.student.firstName} {doc.student.lastName} · <span className="text-slate-500 font-normal">{doc.label}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Tür: {doc.documentType} · Dosya: {doc.originalName} ({Math.round(doc.sizeBytes / 1024)} KB) · Tarih: {new Date(doc.uploadedAt).toLocaleString("tr-TR")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition"
                    title="İndir ve İncele"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <form
                    action={async () => {
                      "use server";
                      await reviewDocumentAction(doc.id, "APPROVED");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Onayla
                    </button>
                  </form>

                  <form
                    action={async (formData) => {
                      "use server";
                      const note = formData.get("note") as string;
                      await reviewDocumentAction(doc.id, "REJECTED", note || "Eksik/geçersiz belge.");
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      name="note"
                      placeholder="Gerekçe..."
                      className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Reddet
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
