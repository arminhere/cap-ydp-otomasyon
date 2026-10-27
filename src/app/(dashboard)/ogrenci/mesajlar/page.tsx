import { requireUserWithRole } from "@/lib/session";
import { db } from "@/lib/db";
import { MessageSquare, Send } from "lucide-react";
import { sendMessageAction } from "@/actions/messageActions";

export default async function StudentMessagesPage() {
  const user = await requireUserWithRole(["STUDENT"]);
  const student = await db.student.findUnique({
    where: { userId: user.id },
    include: {
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
    return <div>Öğrenci kaydı bulunamadı.</div>;
  }

  const thread = student.messageThreads[0];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-purple-600" /> ÇAP Koordinatörü ile Yazışma
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Protokol dersleriniz, intibakınız, ders kayıtlarınız veya muafiyetlerinizle ilgili koordinatörünüze buradan mesaj gönderebilirsiniz.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[550px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
          {!thread || thread.messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Henüz bir yazışma başlatmadınız. Aşağıdaki kutucuktan koordinatörünüze mesaj yazabilirsiniz.
            </div>
          ) : (
            thread.messages.map((m) => {
              const isMe = m.sender.id === user?.id;
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-[80%] shadow-sm ${
                    isMe
                      ? "ml-auto bg-blue-700 text-white"
                      : "mr-auto bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <span
                    className={`block text-[10px] mt-1.5 text-right ${
                      isMe ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form
          action={async (formData) => {
            "use server";
            const text = formData.get("message") as string;
            await sendMessageAction(student.id, "Öğrenci Danışmanlık Talebi", text);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            name="message"
            required
            placeholder="Koordinatörünüze sormak istediğiniz konuyu yazınız..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Send className="w-4 h-4" /> Gönder
          </button>
        </form>
      </div>
    </div>
  );
}
