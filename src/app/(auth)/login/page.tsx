"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { loginAction } from "@/actions/authActions";
import { GraduationCap, ShieldCheck, UserCheck, BookOpen, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition"
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin text-white" />}
      <span>{pending ? "Giriş yapılıyor..." : "Giriş Yap"}</span>
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("Test1234!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg text-white">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Selçuk Üniversitesi
        </h2>
        <p className="mt-1 text-center text-sm text-slate-300">
          Bilgisayar Mühendisliği · ÇAP ve Yan Dal Yönetim Sistemi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kurumsal E-posta
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@selcuk.edu.tr"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Şifre
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <SubmitButton />
          </form>

          {/* Quick Test Accounts Bar for the Professor & Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Ara Sınav Test Hesapları (Hızlı Doldur)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("koordinator@selcuk.edu.tr")}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <span className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Koordinatör
                </span>
                <span className="text-slate-500">koordinator@selcuk.edu.tr</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("ogrenci@ogr.selcuk.edu.tr")}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
                  <UserCheck className="w-4 h-4 text-emerald-600" /> Öğrenci
                </span>
                <span className="text-slate-500">ogrenci@ogr.selcuk.edu.tr</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("baskan@selcuk.edu.tr")}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              >
                <span className="flex items-center gap-1.5 font-semibold text-purple-900">
                  <BookOpen className="w-4 h-4 text-purple-600" /> Bölüm Başkanı
                </span>
                <span className="text-slate-500">baskan@selcuk.edu.tr</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Tüm test hesaplarının ortak şifresi: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Test1234!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
