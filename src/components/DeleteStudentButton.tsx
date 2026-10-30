"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteStudentAction } from "@/actions/studentActions";

interface Props {
  studentId: string;
  studentName: string;
  redirectTo?: string;
  variant?: "card" | "table";
}

export function DeleteStudentButton({
  studentId,
  studentName,
  redirectTo,
  variant = "card",
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `"${studentName}" isimli öğrenciyi ve bağlı tüm intibak, ders seçimi ve evrak kayıtlarını sistemden tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`
    );

    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteStudentAction(studentId);
      if (res?.error) {
        alert(res.error);
      } else {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      }
    });
  };

  if (variant === "table") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        title="Öğrenciyi Sistemden Sil"
        className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg border border-red-200 transition text-xs disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
      ) : (
        <Trash2 className="w-4 h-4 text-red-600" />
      )}
      <span>{isPending ? "Siliniyor..." : "Öğrenciyi Sistemden Tamamen Sil"}</span>
    </button>
  );
}
