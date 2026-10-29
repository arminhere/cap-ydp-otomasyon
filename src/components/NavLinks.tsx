"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/auth";
import { Menu, X, LogOut, KeyRound } from "lucide-react";
import { logoutAction } from "@/actions/authActions";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  matchPrefixes?: string[];
}

const coordinatorNav: NavItem[] = [
  { href: "/koordinator", label: "Pano", exact: true },
  { href: "/koordinator/ogrenciler", label: "Öğrenciler", matchPrefixes: ["/koordinator/ogrenciler", "/koordinator/ogrenci"] },
  { href: "/koordinator/onaylar", label: "Belgeler" },
  { href: "/koordinator/protokoller", label: "Protokoller" },
  { href: "/yonergeler", label: "Yönergeler" },
  { href: "/koordinator/ayarlar", label: "Yönetim" },
];

const studentNav: NavItem[] = [
  { href: "/ogrenci/ilerleme", label: "İlerleme" },
  { href: "/ogrenci/belgelerim", label: "Belgelerim" },
  { href: "/ogrenci/ders-secimi", label: "Ders Seç" },
  { href: "/ogrenci/mesajlar", label: "Mesajlar" },
  { href: "/yonergeler", label: "Yönergeler" },
];

const departmentHeadNav: NavItem[] = [
  { href: "/bolum-baskani/genel-bakis", label: "Pano" },
  { href: "/bolum-baskani/ogrenciler", label: "Öğrenciler", matchPrefixes: ["/bolum-baskani/ogrenciler"] },
  { href: "/bolum-baskani/denetim", label: "Belgeler & Denetim" },
  { href: "/yonergeler", label: "Yönergeler" },
];

export function NavLinks({
  role,
  roleTitle,
}: {
  role: UserRole;
  roleTitle?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const items =
    role === "COORDINATOR"
      ? coordinatorNav
      : role === "STUDENT"
      ? studentNav
      : departmentHeadNav;

  const isItemActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    if (item.matchPrefixes) {
      return item.matchPrefixes.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1 text-sm md:mr-auto md:ml-8">
        {items.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? "bg-blue-50 text-blue-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menüyü Aç/Kapat"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 space-y-1">
            {roleTitle && (
              <div className="pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Aktif Oturum
                </span>
                <span className="text-xs font-medium text-slate-800 block mt-0.5">
                  {roleTitle}
                </span>
              </div>
            )}

            {items.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/sifre-degistir"
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Şifre Değiştir
              </Link>

              <form action={logoutAction} className="inline">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold py-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Çıkış Yap
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
