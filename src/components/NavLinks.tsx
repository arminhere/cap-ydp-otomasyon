"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/auth";

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

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();

  const items =
    role === "COORDINATOR"
      ? coordinatorNav
      : role === "STUDENT"
      ? studentNav
      : departmentHeadNav;

  return (
    <nav className="hidden md:flex items-center space-x-6 text-sm">
      {items.map((item) => {
        let isActive = false;
        if (item.exact) {
          isActive = pathname === item.href;
        } else if (item.matchPrefixes) {
          isActive = item.matchPrefixes.some(
            (p) => pathname === p || pathname.startsWith(p + "/")
          );
        } else {
          isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`transition font-medium ${
              isActive
                ? "text-blue-600 font-semibold"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

