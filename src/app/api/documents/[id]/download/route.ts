import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Yetkisiz Erişim (Oturum Gerekli)", { status: 401 });
  }

  const document = await db.document.findUnique({
    where: { id: params.id },
  });

  if (!document || !document.contentBytes) {
    return new NextResponse("Belge Bulunamadı", { status: 404 });
  }

  // Object-level authorization check:
  // Students can ONLY download their own documents!
  if (user.role === "STUDENT" && document.studentId !== user.studentId) {
    return new NextResponse("Yasaklı Erişim: Bu belgeye erişim yetkiniz yoktur.", {
      status: 403,
    });
  }

  // Coordinator and Department Head can access authorized documents
  return new NextResponse(new Uint8Array(document.contentBytes), {
    status: 200,
    headers: {
      "Content-Type": document.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.originalName)}"`,
      "Content-Length": String(document.contentBytes.length),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
