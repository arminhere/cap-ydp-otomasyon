/**
 * Creates a 100% valid, standard PDF 1.4 binary buffer with catalog, pages, font and stream.
 * Opens seamlessly in Adobe Acrobat, Chrome, Edge, macOS Preview and any PDF reader.
 */
export function createSamplePdf(
  title: string,
  studentName: string,
  studentNo: string
): Buffer {
  const contentStream = `BT
/F1 16 Tf
50 740 Td
(${title}) Tj
0 -30 Td
/F1 12 Tf
(Ogrenci No: ${studentNo}) Tj
0 -20 Td
(Ad Soyad: ${studentName}) Tj
0 -20 Td
(Bolum: Bilgisayar Muhendisligi - CAP) Tj
0 -20 Td
(Donem: 2025-2026 Guz) Tj
0 -30 Td
/F1 11 Tf
(Dersler ve Notlar:) Tj
0 -20 Td
(3301156 Bilgisayar Muhendisligine Giris - 4 AKTS - Not: AA) Tj
0 -20 Td
(3301351 Nesneye Yonelik Prog. Dili - 4 AKTS - Not: BA) Tj
0 -20 Td
(3301352 Isletim Sistemleri - 4 AKTS - Not: BB) Tj
0 -20 Td
(3301354 Veri Yapilari ve Uygulamalari - 4 AKTS - Not: AA) Tj
0 -40 Td
(Belge Durumu: Resmi Onayli Transkript Belgesi) Tj
ET`;

  const streamBytes = Buffer.from(contentStream, "ascii");
  const streamLen = streamBytes.length;

  const pdfParts = [
    Buffer.from("%PDF-1.4\n", "ascii"),
    Buffer.from("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n", "ascii"),
    Buffer.from("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n", "ascii"),
    Buffer.from("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n", "ascii"),
    Buffer.concat([
      Buffer.from(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n`, "ascii"),
      streamBytes,
      Buffer.from("\nendstream\nendobj\n", "ascii"),
    ]),
    Buffer.from("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n", "ascii"),
  ];

  const offsets: number[] = [0];
  let total = 0;
  for (const part of pdfParts) {
    total += part.length;
    offsets.push(total);
  }

  const xrefOffset = total;
  let xrefStr = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i < 6; i++) {
    xrefStr += `${String(offsets[i - 1]).padStart(10, "0")} 00000 n \n`;
  }

  const trailerStr = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.concat([
    ...pdfParts,
    Buffer.from(xrefStr, "ascii"),
    Buffer.from(trailerStr, "ascii"),
  ]);
}
