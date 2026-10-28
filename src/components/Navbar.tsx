import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/authActions";
import { db } from "@/lib/db";
import { NavLinks } from "./NavLinks";

export async function Navbar() {
  const user = await getCurrentUser();
  if (!user) return null;

  let displayName = user.email;
  if (user.role === "STUDENT") {
    const student = await db.student.findUnique({
      where: { userId: user.id },
      select: { firstName: true, lastName: true },
    });
    if (student) {
      displayName = `${student.firstName} ${student.lastName}`;
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Dynamic Left Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-slate-900 text-base tracking-tight hover:text-blue-600 transition">
              ÇAP / Yan Dal Paneli
            </Link>

            <NavLinks role={user.role} />
          </div>

          {/* User Role Indicator & Logout */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-700 font-medium">
              {user.role === "COORDINATOR" && "Koordinatör"}
              {user.role === "STUDENT" && `${displayName} · Öğrenci`}
              {user.role === "DEPARTMENT_HEAD" && "Bölüm Başkanı · Salt okunur"}
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
                className="text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
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
