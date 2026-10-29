import test from "node:test";
import assert from "node:assert/strict";
import PizZip from "pizzip";
import { generateForm01Docx } from "../docx";

test("FORM01 docx generation produces valid, openable Word document", async () => {
  const testData = {
    programStudentNo: "231202099",
    studentName: "Ali Demir",
    homeFaculty: "Teknoloji Fakültesi",
    homeDepartment: "Elektrik-Elektronik Mühendisliği",
    academicYear: "2026-2027",
    semester: "GUZ" as const,
    dateStr: "25.10.2026",
    courses: [
      { code: "3301156", akts: 4, name: "BİLGİSAYAR MÜHENDİSLİĞİNE GİRİŞ" },
      { code: "3301351", akts: 4, name: "NESNEYE YÖNELİK PROG. DİLİ" },
      { code: "3301352", akts: 4, name: "İŞLETİM SİSTEMLERİ" },
      { code: "3301354", akts: 4, name: "VERİ YAPILARI VE UYGULAMALARI" },
    ],
  };

  const buffer = await generateForm01Docx(testData);
  assert.ok(buffer);
  assert.ok(buffer.length > 5000, "Generated file size must be reasonable for docx");

  // Verify internal XML contents
  const zip = new PizZip(buffer);
  const docXml = zip.file("word/document.xml")?.asText();
  assert.ok(docXml);
  assert.ok(docXml.includes("231202099"), "Must include student number");
  assert.ok(docXml.includes("Ali Demir"), "Must include student name");
  assert.ok(docXml.includes("2026-2027"), "Must include academic year");
  assert.ok(docXml.includes("3301156"), "Must include course code");
});
