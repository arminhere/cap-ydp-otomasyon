import fs from "fs";
import path from "path";
import PizZip from "pizzip";

export interface Form01Data {
  programStudentNo: string;
  studentName: string;
  homeFaculty: string;
  homeDepartment: string;
  academicYear: string;
  semester: "GUZ" | "BAHAR";
  dateStr: string;
  courses: Array<{
    code: string;
    akts: number;
    name: string;
  }>;
}

/**
 * Generates an official FORM01 (.docx) by reading the original template
 * and updating the table cells with student, term, and course details.
 */
export async function generateForm01Docx(data: Form01Data): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "documents",
    "FORM01 - Ders Kayıt Formu_04062026120421.docx"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`FORM01 template not found at: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  let docXml = zip.file("word/document.xml")?.asText();
  if (!docXml) {
    throw new Error("Invalid DOCX: word/document.xml missing");
  }

  // Insert Student No after its colon
  docXml = docXml.replace(
    /(Öğrenci No[\s\S]*?<w:t>:<\/w:t><\/w:r>)/,
    `$1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> ${data.programStudentNo}</w:t></w:r>`
  );

  // Insert Student Name after Adı Soyadı colon
  docXml = docXml.replace(
    /(Adı Soyadı[\s\S]*?<w:t>:<\/w:t><\/w:r>)/,
    `$1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> ${data.studentName}</w:t></w:r>`
  );

  // Insert Home Faculty
  docXml = docXml.replace(
    /(ANADAL[\s\S]*?Fakültesi:<\/w:t><\/w:r>)/,
    `$1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> ${data.homeFaculty}</w:t></w:r>`
  );

  // Insert Home Department
  docXml = docXml.replace(
    /(Bölümü\/Anabilim Dalı:<\/w:t><\/w:r>)/,
    `$1<w:r><w:rPr><w:b/><w:color w:val="0A2540"/></w:rPr><w:t xml:space="preserve"> ${data.homeDepartment}</w:t></w:r>`
  );

  // Date
  docXml = docXml.replace(
    /(Tarih[\s\S]*?<w:t>:<\/w:t><\/w:r>)/,
    `$1<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve"> ${data.dateStr}</w:t></w:r>`
  );

  // Academic Year
  docXml = docXml.replace(/20…-20…/g, data.academicYear);

  // Semester checkmark
  if (data.semester === "GUZ") {
    docXml = docXml.replace(/(Güz\s*:\s*<\/w:t>[\s\S]*?<w:t>)☐(<\/w:t>)/, "$1☑$2");
  } else {
    docXml = docXml.replace(/(Bahar:\s*<\/w:t>[\s\S]*?<w:t>)☐(<\/w:t>)/, "$1☑$2");
  }

  // Helper to inject run into a table cell <w:tc>
  function injectCellText(tcXml: string, text: string, isBold: boolean = false, isCenter: boolean = false): string {
    const run = `<w:r><w:rPr>${isBold ? "<w:b/>" : ""}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r>`;
    if (tcXml.includes("</w:p>")) {
      return tcXml.replace("</w:p>", `${run}</w:p>`);
    } else if (tcXml.includes("/>")) {
      return tcXml.replace(/\/>/, `>${run}</w:p>`);
    }
    return tcXml;
  }

  // Populate course table rows
  const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
  const rows = docXml.match(rowRegex);
  if (rows && rows.length >= 20) {
    for (let i = 0; i < 14; i++) {
      const rowIndex = 5 + i;
      if (rowIndex < rows.length && i < data.courses.length) {
        const course = data.courses[i];
        const oldRow = rows[rowIndex];

        const cells = oldRow.match(/<w:tc[\s>][\s\S]*?<\/w:tc>/g);
        if (cells && cells.length >= 3) {
          const c1 = injectCellText(cells[0], course.code, true);
          const c2 = injectCellText(cells[1], String(course.akts), false, true);
          const c3 = injectCellText(cells[2], course.name, false);

          const updatedRow = oldRow
            .replace(cells[0], c1)
            .replace(cells[1], c2)
            .replace(cells[2], c3);

          docXml = docXml.replace(oldRow, updatedRow);
        }
      }
    }
  }

  zip.file("word/document.xml", docXml);
  const buffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buffer;
}
