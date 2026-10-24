import { requireUserWithRole } from "@/lib/session";
import { Navbar } from "@/components/Navbar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUserWithRole(["STUDENT"]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
