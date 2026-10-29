import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  User,
  BookOpen,
  FileText,
  MessageSquare,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertTriangle,
  Lock,
  Save,
  PlusCircle,
  Shield,
  FileSignature,
  ArrowLeft,
} from "lucide-react";
import {
  recordGradeAction,
  recordTermGanoAction,
  recordRetroactiveAttemptAction,
} from "@/actions/gradeActions";
import { reviewDocumentAction } from "@/actions/documentActions";
import { sendMessageAction } from "@/actions/messageActions";
import {
  updateCoordinatorNoteAction,
  executeAdminDecisionAction,
} from "@/actions/studentActions";

export default async function CoordinatorStudentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const student = await db.student.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      homeDepartment: true,
      enrollments: {
        include: {
          program: true,
          protocol: {
            include: {
              items: { include: { course: true } },
            },
          },
          attempts: {
            include: { course: true, term: true },
            orderBy: { createdAt: "desc" },
          },
          termStatuses: {
            include: { term: true },
          },
        },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      messageThreads: {
        include: {
          messages: {
            include: { sender: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const enrollment = student.enrollments[0];
  const activeTerm = await db.academicTerm.findFirst({ where: { isCurrent: true } });
  const allTerms = await db.academicTerm.findMany({ orderBy: { startDate: "desc" } });
  const allCourses = await db.course.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  const thread = student.messageThreads[0];

  const statusBadge =
    enrollment?.status === "ACTIVE"
      ? { label: "Aktif", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : enrollment?.status === "FROZEN"
      ? { label: "Donduruldu (İzinli)", bg: "bg-blue-50 text-blue-700 border-blue-200" }
      : enrollment?.status === "REMOVED"
      ? { label: "Kaydı Silindi", bg: "bg-red-50 text-red-700 border-red-200" }
      : enrollment?.status === "COMPLETED"
      ? { label: "Mezun / Tamamlandı", bg: "bg-purple-50 text-purple-700 border-purple-200" }
      : { label: enrollment?.status || "Aktif", bg: "bg-slate-100 text-slate-700 border-slate-300" };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/koordinator/ogrenciler"
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Öğrenci Kütüğüne Dön
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500 font-medium">
          {student.firstName} {student.lastName} ({student.programStudentNo})
        </span>
      </div>

      {/* Student Profile Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {student.firstName} {student.lastName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              ÇAP No: <span className="font-mono font-medium text-slate-800">{student.programStudentNo}</span> | Ana Dal No: <span className="font-mono font-medium text-slate-800">{student.mainStudentNo}</span>
            </p>
            {enrollment?.statusReason && (
              <p className="text-xs text-slate-600 mt-1 italic">
                İdari Karar Dayanağı: {enrollment.statusReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
            Bölüm: {student.homeDepartment.name}
          </span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">
            Danışman: {student.advisorName}
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-medium">
            Kabul GANO: {student.admissionGano.toFixed(2)} ({student.admissionType})
          </span>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course Attempts & Grade Verification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-blue-600" /> Ders Kayıt ve Deneme Geçmişi (Not Girişi)
            </h2>

            {enrollment?.attempts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                Öğrencinin henüz onaylanmış bir ders kaydı bulunmamaktadır.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 space-y-4">
                {enrollment?.attempts.map((att) => (
                  <div key={att.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {att.course.code} - {att.course.name} ({att.course.akts} AKTS)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dönem: {att.term.academicYear} {att.term.semester} | Durum:{" "}
                        <span className={`font-semibold ${
                          att.status === "PASSED" ? "text-emerald-600" : att.status === "FAILED" ? "text-red-600" : "text-amber-600"
                        }`}>
                          {att.status === "PASSED" ? "GEÇTİ" : att.status === "FAILED" ? "KALDI" : att.status === "EXEMPT" ? "MUAF" : "KAYITLI"}
                        </span>
                        {att.letterGrade && ` (Harf Notu: ${att.letterGrade})`}
                      </div>
                    </div>

                    {/* Grade Update Form */}
                    <form
                      action={async (formData) => {
                        "use server";
                        const letterGrade = formData.get("letterGrade") as string;
                        await recordGradeAction(att.id, letterGrade);
                      }}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="letterGrade"
                        defaultValue={att.letterGrade || "AA"}
                        className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 outline-none"
                      >
                        <option value="AA">AA (4.00)</option>
                        <option value="BA">BA (3.50)</option>
                        <option value="BB">BB (3.00)</option>
                        <option value="CB">CB (2.50)</option>
                        <option value="CC">CC (2.00)</option>
                        <option value="DC">DC (1.50 - Şartlı/Kaldı)</option>
                        <option value="DD">DD (1.00 - Kaldı)</option>
                        <option value="FF">FF (0.00 - Kaldı)</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                      >
                        Notu Onayla
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retroactive Course Attempt Entry Form (Professor email requirement L65) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" /> Geriye Dönük Ders / Not Kaydı Ekle (Mevcut Öğrenci İntibakı)
            </h2>
            <p className="text-xs text-slate-500">
              Hoca direktifi: Daha önce bölüme kabul edilmiş öğrencilerin geçmiş dönemlerde aldığı dersler ve notlar onay kilidine takılmadan doğrudan koordinatör tarafından geriye dönük işlenebilir.
            </p>

            <form
              action={async (formData) => {
                "use server";
                if (!enrollment) return;
                const courseId = formData.get("courseId") as string;
                const termId = formData.get("termId") as string;
                const letterGrade = formData.get("letterGrade") as string;
                const status = formData.get("status") as "PASSED" | "FAILED" | "EXEMPT";
                await recordRetroactiveAttemptAction(enrollment.id, courseId, termId, letterGrade, status);
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
            >
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Ders</label>
                <select
                  name="courseId"
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.akts} AKTS)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Alındığı Akademik Dönem</label>
                <select
                  name="termId"
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {allTerms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.academicYear} {t.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Harf Notu</label>
                <select
                  name="letterGrade"
                  required
                  defaultValue="AA"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-bold text-center outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="AA">AA (4.00)</option>
                  <option value="BA">BA (3.50)</option>
                  <option value="BB">BB (3.00)</option>
                  <option value="CB">CB (2.50)</option>
                  <option value="CC">CC (2.00)</option>
                  <option value="DC">DC (1.50)</option>
                  <option value="DD">DD (1.00)</option>
                  <option value="FF">FF (0.00)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Başarı Durumu</label>
                <select
                  name="status"
                  required
                  defaultValue="PASSED"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="PASSED">GEÇTİ (Başarılı)</option>
                  <option value="FAILED">KALDI (Başarısız)</option>
                  <option value="EXEMPT">MUAF (Özel Şartlı)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Geriye Dönük Not Kaydını Sisteme İşle
                </button>
              </div>
            </form>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-amber-600" /> Öğrenci Belge Arşivi
            </h2>

            {student.documents.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Henüz yüklenmiş bir belge yok.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {student.documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        {doc.label}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          doc.approvalStatus === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.approvalStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {doc.approvalStatus === "APPROVED" ? "ONAYLANDI" : doc.approvalStatus === "REJECTED" ? "REDDEDİLDİ" : "BEKLİYOR"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {doc.originalName} ({Math.round(doc.sizeBytes / 1024)} KB) · {new Date(doc.uploadedAt).toLocaleDateString("tr-TR")}
                      </div>
                      {doc.reviewNote && (
                        <div className="text-xs text-red-600 mt-1 italic">
                          Ret Gerekçesi: {doc.reviewNote}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition"
                        title="İndir"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {doc.approvalStatus === "PENDING" && (
                        <>
                          <form
                            action={async () => {
                              "use server";
                              await reviewDocumentAction(doc.id, "APPROVED");
                            }}
                          >
                            <button
                              type="submit"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                            >
                              Onayla
                            </button>
                          </form>

                          <form
                            action={async (formData) => {
                              "use server";
                              const note = formData.get("note") as string;
                              await reviewDocumentAction(doc.id, "REJECTED", note || "Eksik/okunaksız belge.");
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="text"
                              name="note"
                              placeholder="Ret gerekçesi..."
                              className="px-2 py-1 border border-slate-300 rounded text-xs outline-none"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                            >
                              Reddet
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Administrative Decisions, Private Notes & Messages */}
        <div className="space-y-6">
          {/* Administrative Decision Card (Email L28) */}
          {enrollment && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" /> İdari Karar ve Durum Yönetimi
              </h2>
              <p className="text-xs text-slate-500">
                Hoca direktifi: Sistem kurallara göre uyarır; mezuniyet, sertifika, kayıt dondurma veya ilişik kesme kararını gerekçesiyle koordinatör verir.
              </p>

              <form
                action={async (formData) => {
                  "use server";
                  const newStatus = formData.get("newStatus") as string;
                  const reasonNote = formData.get("reasonNote") as string;
                  await executeAdminDecisionAction(enrollment.id, newStatus, reasonNote);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Öğrenci Kayıt Durumu</label>
                  <select
                    name="newStatus"
                    defaultValue={enrollment.status}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="ACTIVE">Aktif (Öğrenim devam ediyor)</option>
                    <option value="FROZEN">Donduruldu (Mazeret/Dönem İzni - m.9(ç))</option>
                    <option value="REMOVED">Kayıt Silindi (İlişik Kesildi - m.9(d)/(e))</option>
                    <option value="COMPLETED">Mezun / Tamamlandı (m.8(c))</option>
                    <option value="WITHDRAWN">Kendi İsteğiyle Ayrıldı (m.9(a))</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Dayanak ve Gerekçe Notu</label>
                  <textarea
                    name="reasonNote"
                    rows={2}
                    required
                    placeholder="Örn: 2026/14 sayılı Fakülte Yönetim Kurulu kararı uyarınca..."
                    defaultValue={enrollment.statusReason || ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition shadow-sm"
                >
                  İdari Kararı Kaydet ve Uygula
                </button>
              </form>
            </div>
          )}

          {/* Private Coordinator Note (Email L25: "Öğrenci görmez") */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" /> Koordinatör Özel Notu
            </h2>
            <p className="text-xs text-slate-500">
              Bu not yalnızca koordinatör tarafından görülebilir; öğrenci paneline hiçbir şekilde yansımaz.
            </p>

            <form
              action={async (formData) => {
                "use server";
                const note = formData.get("coordinatorNote") as string;
                await updateCoordinatorNoteAction(student.id, note);
              }}
              className="space-y-2 text-xs"
            >
              <textarea
                name="coordinatorNote"
                rows={3}
                defaultValue={student.coordinatorNote || ""}
                placeholder="Öğrenci hakkında özel danışmanlık notları..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-amber-50/50 outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Özel Notu Kaydet
              </button>
            </form>
          </div>

          {/* Messages Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-purple-600" /> Öğrenci ile Yazışma
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
              {!thread || thread.messages.length === 0 ? (
                <p className="text-slate-400 text-center py-6">Henüz bir mesaj bulunmuyor.</p>
              ) : (
                thread.messages.map((m) => {
                  const isCoord = m.sender.role === "COORDINATOR";
                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg max-w-[85%] ${
                        isCoord
                          ? "ml-auto bg-blue-600 text-white"
                          : "mr-auto bg-white border border-slate-200 text-slate-800"
                      }`}
                    >
                      <p>{m.body}</p>
                      <span className={`block text-[9px] mt-1 ${isCoord ? "text-blue-200" : "text-slate-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form
              action={async (formData) => {
                "use server";
                const text = formData.get("message") as string;
                await sendMessageAction(student.id, "Danışmanlık Yazışması", text);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                name="message"
                required
                placeholder="Öğrenciye mesaj yazın..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
