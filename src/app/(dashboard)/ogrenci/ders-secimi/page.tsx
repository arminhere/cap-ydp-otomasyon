import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { FileText, CheckCircle2, Clock, Download, AlertCircle, AlertTriangle } from "lucide-react";
import { submitCourseSelectionAction } from "@/actions/courseSelectionActions";

export default async function StudentCourseSelectionPage() {
  const user = await getCurrentUser();
  const student = await db.student.findUnique({
    where: { userId: user?.id },
    include: {
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          protocol: {
            include: {
              items: {
                include: { course: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const activeTerm = await db.academicTerm.findFirst({
    where: { isCurrent: true },
  });

  const enrollment = student?.enrollments[0];
  if (!enrollment || !activeTerm) {
    return <div>Kayıt veya aktif dönem bulunamadı.</div>;
  }

  const currentRequest = await db.courseSelectionRequest.findUnique({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId: activeTerm.id,
      },
    },
    include: {
      items: true,
    },
  });

  const selectedItemIds = new Set(currentRequest?.items.map((i) => i.protocolItemId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Dönemlik Ders Seçimi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aktif Dönem: <strong className="text-slate-800">{activeTerm.academicYear} {activeTerm.semester === "GUZ" ? "Güz" : "Bahar"} Yarıyılı</strong>
          </p>
        </div>

        {/* Status Badge */}
        {currentRequest && (
          <div>
            {currentRequest.status === "SUBMITTED" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-4 h-4" /> Koordinatör Onayı Bekliyor ({currentRequest.totalAkts} AKTS)
              </span>
            )}
            {currentRequest.status === "APPROVED" && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Ders Seçimi Onaylandı ({currentRequest.totalAkts} AKTS)
                </span>
                {currentRequest.formDocumentId && (
                  <a
                    href={`/api/documents/${currentRequest.formDocumentId}/download`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Download className="w-4 h-4" /> FORM01 Belgesini İndir (.docx)
                  </a>
                )}
              </div>
            )}
            {currentRequest.status === "REJECTED" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="w-4 h-4" /> Talep Reddedildi: {currentRequest.decisionNote || "Gerekçe belirtilmedi."}
              </div>
            )}
          </div>
        )}
      </div>

      {currentRequest?.status === "APPROVED" && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
          <div>
            <strong>Sonraki Adım:</strong> Ders seçiminiz koordinatör tarafından onaylanmış ve resmi FORM01 belgeniz üretilmiştir.
            Lütfen yukarıdaki <strong>FORM01 Belgesini İndir</strong> butonuna tıklayarak çıktısını alınız, Ana Dal Danışmanınıza ve Koordinatörünüze imzalattıktan sonra taranmış kopyayı <strong>Belgelerim</strong> sekmesinden sisteme yükleyiniz.
          </div>
        </div>
      )}

      {/* Course Selection Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-2">
          İntibak Protokolü Ders Listesi ({enrollment.protocol.name})
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Bu dönem almak istediğiniz dersleri işaretleyiniz ve onaya gönderiniz. Onaylanan dersler için sistem otomatik FORM01 belgesi üretecektir.
        </p>

        <form
          action={async (formData) => {
            "use server";
            const selected = formData.getAll("selectedItems") as string[];
            await submitCourseSelectionAction(enrollment.id, activeTerm.id, selected);
          }}
          className="space-y-4"
        >
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-sm">
            {enrollment.protocol.items.map((item) => {
              const isChecked = selectedItemIds.has(item.id);
              const isApproved = currentRequest?.status === "APPROVED";

              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition ${
                    isChecked ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="selectedItems"
                      value={item.id}
                      defaultChecked={isChecked}
                      disabled={isApproved}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-slate-800">
                        {item.course ? `${item.course.code} - ${item.course.name}` : item.slotLabel}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.recommendedSemester}. Yarıyıl Dersi {item.footnoteNo ? `· (Dipnot ${item.footnoteNo} Şartı)` : ""}
                      </div>
                    </div>
                  </div>

                  <span className="font-bold text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded">
                    {item.akts} AKTS
                  </span>
                </label>
              );
            })}
          </div>

          {currentRequest?.status !== "APPROVED" && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-sm transition shadow-sm"
              >
                {currentRequest ? "Ders Seçimini Güncelle ve Onaya Gönder" : "Ders Seçimini Onaya Gönder"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
