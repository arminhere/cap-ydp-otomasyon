import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/authActions";
import {
  GraduationCap,
  Users,
  CheckSquare,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  FileText,
  FileCheck,
  MessageSquare,
  PieChart,
  ShieldAlert,
} from "lucide-react";

export async function Navbar() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <Link href="/" className="font-bold text-base hover:text-blue-300 transition">
                ÇAP / YDP Takip Sistemi
              </Link>
              <p className="text-[11px] text-slate-400">Selçuk Üniversitesi Bilgisayar Mühendisliği</p>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center space-x-1">
            {user.role === "COORDINATOR" && (
              <>
                <Link
                  href="/koordinator/ogrenciler"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <Users className="w-4 h-4 text-blue-400" /> Öğrenciler
                </Link>
                <Link
                  href="/koordinator/onaylar"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" /> Onay Merkezi
                </Link>
                <Link
                  href="/koordinator/protokoller"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <BookOpen className="w-4 h-4 text-emerald-400" /> Protokoller
                </Link>
                <Link
                  href="/koordinator/donemler"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <Calendar className="w-4 h-4 text-purple-400" /> Dönemler
                </Link>
                <Link
                  href="/koordinator/ayarlar"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Kurallar
                </Link>
              </>
            )}

            {user.role === "STUDENT" && (
              <>
                <Link
                  href="/ogrenci/ders-secimi"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Ders Seçimi
                </Link>
                <Link
                  href="/ogrenci/ilerleme"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <PieChart className="w-4 h-4 text-emerald-400" /> İlerleme Matrisi
                </Link>
                <Link
                  href="/ogrenci/belgelerim"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" /> Belgelerim
                </Link>
                <Link
                  href="/ogrenci/mesajlar"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <MessageSquare className="w-4 h-4 text-purple-400" /> Mesajlar
                </Link>
              </>
            )}

            {user.role === "DEPARTMENT_HEAD" && (
              <>
                <Link
                  href="/bolum-baskani/genel-bakis"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <PieChart className="w-4 h-4 text-purple-400" /> Bölüm İstatistikleri
                </Link>
                <Link
                  href="/bolum-baskani/denetim"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Denetim Kayıtları (Audit)
                </Link>
              </>
            )}
          </nav>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user.email}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                user.role === "COORDINATOR"
                  ? "bg-blue-900/60 text-blue-300 border border-blue-700"
                  : user.role === "STUDENT"
                  ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                  : "bg-purple-900/60 text-purple-300 border border-purple-700"
              }`}>
                {user.role === "COORDINATOR" ? "KOORDİNATÖR" : user.role === "STUDENT" ? "ÖĞRENCİ" : "BÖLÜM BAŞKANI"}
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Çıkış Yap"
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
