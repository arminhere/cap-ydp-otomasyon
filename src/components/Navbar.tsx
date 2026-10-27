import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/actions/authActions";
import { db } from "@/lib/db";

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
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-slate-900 text-base tracking-tight hover:text-blue-600 transition">
              ÇAP / Yan Dal Paneli
            </Link>

            <nav className="hidden md:flex items-center space-x-6 text-sm">
              {user.role === "COORDINATOR" && (
                <>
                  <Link href="/koordinator" className="text-blue-600 font-semibold hover:text-blue-700">
                    Pano
                  </Link>
                  <Link href="/koordinator/ogrenciler" className="text-slate-600 hover:text-blue-600 font-medium">
                    Öğrenciler
                  </Link>
                  <Link href="/koordinator/onaylar" className="text-slate-600 hover:text-blue-600 font-medium">
                    Belgeler
                  </Link>
                  <Link href="/koordinator/protokoller" className="text-slate-600 hover:text-blue-600 font-medium">
                    Protokoller
                  </Link>
                  <Link href="/yonergeler" className="text-slate-600 hover:text-blue-600 font-medium">
                    Yönergeler
                  </Link>
                  <Link href="/koordinator/ayarlar" className="text-slate-600 hover:text-blue-600 font-medium">
                    Yönetim
                  </Link>
                </>
              )}

              {user.role === "STUDENT" && (
                <>
                  <Link href="/ogrenci/ilerleme" className="text-blue-600 font-semibold hover:text-blue-700">
                    İlerleme
                  </Link>
                  <Link href="/ogrenci/belgelerim" className="text-slate-600 hover:text-blue-600 font-medium">
                    Belgelerim
                  </Link>
                  <Link href="/ogrenci/ders-secimi" className="text-slate-600 hover:text-blue-600 font-medium">
                    Ders Seç
                  </Link>
                  <Link href="/ogrenci/mesajlar" className="text-slate-600 hover:text-blue-600 font-medium">
                    Mesajlar
                  </Link>
                  <Link href="/yonergeler" className="text-slate-600 hover:text-blue-600 font-medium">
                    Yönergeler
                  </Link>
                </>
              )}

              {user.role === "DEPARTMENT_HEAD" && (
                <>
                  <Link href="/bolum-baskani/genel-bakis" className="text-blue-600 font-semibold hover:text-blue-700">
                    Pano
                  </Link>
                  <Link href="/koordinator/ogrenciler" className="text-slate-600 hover:text-blue-600 font-medium">
                    Öğrenciler
                  </Link>
                  <Link href="/bolum-baskani/denetim" className="text-slate-600 hover:text-blue-600 font-medium">
                    Belgeler & Denetim
                  </Link>
                  <Link href="/yonergeler" className="text-slate-600 hover:text-blue-600 font-medium">
                    Yönergeler
                  </Link>
                </>
              )}
            </nav>
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
