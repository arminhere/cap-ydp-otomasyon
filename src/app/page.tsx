import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "COORDINATOR") {
    redirect("/koordinator");
  } else if (user.role === "STUDENT") {
    redirect("/ogrenci/ilerleme");
  } else if (user.role === "DEPARTMENT_HEAD") {
    redirect("/bolum-baskani/genel-bakis");
  } else {
    redirect("/login");
  }
}
