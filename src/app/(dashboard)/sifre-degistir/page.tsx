"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "@/actions/authActions";
import { KeyRound, Lock, CheckCircle2, AlertCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
    >
      {pending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
    </button>
  );
}

export default function ChangePasswordPage() {
  const [state, formAction] = useFormState(changePasswordAction, undefined);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-blue-600" /> Şifre Değiştir
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hesabınızın güvenliği için mevcut şifrenizi doğrulayarak yeni bir şifre belirleyebilirsiniz.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form action={formAction} className="space-y-4 text-sm">
          {state?.error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          {state?.success && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Şifreniz başarıyla güncellendi! Bir sonraki girişinizde yeni şifrenizi kullanabilirsiniz.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mevcut Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="currentPassword"
                required
                placeholder="Mevcut şifreniz"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre (En az 6 karakter)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                placeholder="Yeni şifreniz"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Yeni Şifre Tekrarı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                placeholder="Yeni şifrenizi tekrar yazınız"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
