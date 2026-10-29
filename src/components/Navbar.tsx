import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/authActions";
import { db } from "@/lib/db";
import { NavLinks } from "./NavLinks";

export async function Navbar() {
  const user = await getCurrentUser();
  if (!user) return null;

  let displayName = user.email;
  let roleTitle = "Koordinatör";
  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true },
    });
    if (student) {
      displayName = `${student.firstName} ${student.lastName}`;
    }
    roleTitle = `${displayName} · Öğrenci`;
  } else if (user.role === "DEPARTMENT_HEAD") {
    roleTitle = "Bölüm Başkanı · Salt okunur";
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            href="/"
            className="font-bold text-slate-900 text-base tracking-tight hover:text-blue-600 transition flex items-center gap-2 shrink-0"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            ÇAP / Yan Dal Paneli
          </Link>

          {/* Navigation (Desktop links & Mobile toggle) */}
          <NavLinks role={user.role} roleTitle={roleTitle} />

          {/* Desktop User Role Indicator & Logout */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="text-slate-700 font-medium text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {roleTitle}
            </span>

            <Link
              href="/sifre-degistir"
              className="text-xs text-slate-500 hover:text-slate-800 underline transition"
            >
              Şifre
            </Link>

            <form action={logoutAction} className="inline">
              <button
                type="submit"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
