import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed with synthetic data...");

  const defaultPasswordHash = await bcrypt.hash("Test1234!", 12);

  // 1. Create Coordinator User
  const coordinator = await prisma.user.upsert({
    where: { email: "koordinator@selcuk.edu.tr" },
    update: { passwordHash: defaultPasswordHash, status: "ACTIVE" },
    create: {
      email: "koordinator@selcuk.edu.tr",
      passwordHash: defaultPasswordHash,
      role: "COORDINATOR",
      status: "ACTIVE",
    },
  });
  console.log("Coordinator user ready:", coordinator.email);

  // 2. Create Department Head User
  const departmentHead = await prisma.user.upsert({
    where: { email: "baskan@selcuk.edu.tr" },
    update: { passwordHash: defaultPasswordHash, status: "ACTIVE" },
    create: {
      email: "baskan@selcuk.edu.tr",
      passwordHash: defaultPasswordHash,
      role: "DEPARTMENT_HEAD",
      status: "ACTIVE",
    },
  });
  console.log("Department Head user ready:", departmentHead.email);

  // 3. Create Home Department (Elektrik-Elektronik Mühendisliği)
  const homeDept = await prisma.homeDepartment.upsert({
    where: { code: "EEM" },
    update: {},
    create: {
      code: "EEM",
      name: "Elektrik-Elektronik Mühendisliği",
      faculty: "Teknoloji Fakültesi",
      allowedFor: "BOTH",
    },
  });

  // 4. Create Programs (CAP and YANDAL)
  const capProgram = await prisma.program.upsert({
    where: { code: "BM-CAP" },
    update: {},
    create: {
      code: "BM-CAP",
      name: "Bilgisayar Mühendisliği Çift Ana Dal Programı",
      type: "CAP",
    },
  });

  const yandalProgram = await prisma.program.upsert({
    where: { code: "BM-YDP" },
    update: {},
    create: {
      code: "BM-YDP",
      name: "Bilgisayar Mühendisliği Yan Dal Programı",
      type: "YANDAL",
    },
  });

  // 5. Create Configurable Program Rules (from Yönerge)
  await prisma.programRule.upsert({
    where: { programId_ruleKey: { programId: capProgram.id, ruleKey: "MIN_ENTRY_GANO" } },
    update: { value: 2.75 },
    create: {
      programId: capProgram.id,
      ruleKey: "MIN_ENTRY_GANO",
      value: 2.75,
      description: "ÇAP Başvuru için asgari ana dal GANO şartı",
      sourceArticle: "m.5(d)",
    },
  });

  await prisma.programRule.upsert({
    where: { programId_ruleKey: { programId: capProgram.id, ruleKey: "DISMISSAL_GANO_WARNING" } },
    update: { value: 2.50 },
    create: {
      programId: capProgram.id,
      ruleKey: "DISMISSAL_GANO_WARNING",
      value: 2.50,
      description: "Ana dal GANO bir defaya mahsus düşebilecek asgari sınır",
      sourceArticle: "m.9(e)",
    },
  });

  await prisma.programRule.upsert({
    where: { programId_ruleKey: { programId: capProgram.id, ruleKey: "GRADUATION_MIN_GANO" } },
    update: { value: 2.72 },
    create: {
      programId: capProgram.id,
      ruleKey: "GRADUATION_MIN_GANO",
      value: 2.72,
      description: "Mezuniyet ve kalıcı ilişik kesme eşiği",
      sourceArticle: "m.8(c) / m.9(e)",
    },
  });

  // 6. Create Computer Engineering Courses
  const courseList = [
    { code: "3301156", name: "BİLGİSAYAR MÜHENDİSLİĞİNE GİRİŞ", akts: 4 },
    { code: "3301351", name: "NESNEYE YÖNELİK PROG. DİLİ", akts: 4 },
    { code: "3301352", name: "İŞLETİM SİSTEMLERİ", akts: 4 },
    { code: "3301354", name: "VERİ YAPILARI VE UYGULAMALARI", akts: 4 },
    { code: "3301452", name: "PROGRAMLAMA DİLİ-2", akts: 4 },
    { code: "3301454", name: "VERİ TABANI YÖNETİM SİSTEMLERİ", akts: 5 },
    { code: "3301455", name: "YAZILIM MÜHENDİSLİĞİ", akts: 4 },
    { code: "3301456", name: "MOBİL PROGRAMLAMA", akts: 4 },
    { code: "3301552", name: "PROGRAMLAMA DİLİ-3", akts: 5 },
    { code: "3301553", name: "VERİ HABERLEŞMESİ VE AĞLAR", akts: 5 },
    { code: "3301651", name: "YAPAY ZEKA", akts: 4 },
    { code: "3301652", name: "OTOMATA TEORİSİ VE BİÇİMSEL DİLLER", akts: 4 },
    { code: "3301653", name: "GÖRÜNTÜ İŞLEME", akts: 4 },
    { code: "3301654", name: "MÜHENDİSLİK TASARIMI", akts: 6 },
    { code: "3301751", name: "BİLGİSAYAR MÜHENDİSLİĞİ UYGULAMALARI", akts: 4 },
    { code: "3301752", name: "BİLGİSAYAR MİMARİSİ ve ORGANİZASYONU", akts: 4 },
    { code: "3301753", name: "VERİ BİLİMİ", akts: 4 },
    { code: "3301851", name: "İŞLETMEDE MESLEKİ EĞİTİM", akts: 20 },
    { code: "3301852", name: "STAJ 1", akts: 5 },
    { code: "3301853", name: "STAJ 2", akts: 5 },
    // Seçmeli yuvaları için temsil dersler
    { code: "3301561", name: "Sinyal İşleme", akts: 4 },
    { code: "3301568", name: "Veri Madenciliği", akts: 4 },
    { code: "3301663", name: "Gömülü Sistemler", akts: 4 },
    { code: "3301665", name: "Robotik", akts: 4 },
    { code: "3301770", name: "Veri İletişim Teknikleri", akts: 4 },
  ];

  const dbCourses: Record<string, any> = {};
  for (const c of courseList) {
    const created = await prisma.course.upsert({
      where: { code: c.code },
      update: { name: c.name, akts: c.akts },
      create: { code: c.code, name: c.name, akts: c.akts },
    });
    dbCourses[c.code] = created;
  }
  console.log("Computer Engineering course catalog seeded.");

  // 7. Create EEM -> BM Protocol (135 AKTS)
  const protocol = await prisma.protocol.upsert({
    where: {
      programId_homeDepartmentId_version: {
        programId: capProgram.id,
        homeDepartmentId: homeDept.id,
        version: 1,
      },
    },
    update: { isPublished: true, totalAkts: 135 },
    create: {
      programId: capProgram.id,
      homeDepartmentId: homeDept.id,
      name: "Elektrik-Elektronik Mühendisliği -> Bilgisayar Mühendisliği ÇAP Protokolü",
      validFromYear: 2024,
      version: 1,
      totalAkts: 135,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  // Only create protocol items if not already populated
  const existingItemsCount = await prisma.protocolItem.count({ where: { protocolId: protocol.id } });

  const protocolItemsData = [
    { code: "3301156", sem: 1, akts: 4, fn: null },
    { code: "3301351", sem: 3, akts: 4, fn: null },
    { code: "3301352", sem: 3, akts: 4, fn: null },
    { code: "3301354", sem: 3, akts: 4, fn: 1 },
    { code: "3301452", sem: 4, akts: 4, fn: null },
    { code: "3301454", sem: 4, akts: 5, fn: null },
    { code: "3301455", sem: 4, akts: 4, fn: null },
    { code: "3301456", sem: 4, akts: 4, fn: null },
    { code: "3301552", sem: 5, akts: 5, fn: null },
    { code: "3301553", sem: 5, akts: 5, fn: null },
    { slot: "5. YARIYIL TEKNİK SEÇMELİ DERS", sem: 5, akts: 4, fn: 2 },
    { slot: "5. YARIYIL TEKNİK SEÇMELİ DERS", sem: 5, akts: 4, fn: 3 },
    { slot: "5. YARIYIL TEKNİK SEÇMELİ DERS", sem: 5, akts: 4, fn: null },
    { code: "3301651", sem: 6, akts: 4, fn: 4 },
    { code: "3301652", sem: 6, akts: 4, fn: null },
    { code: "3301653", sem: 6, akts: 4, fn: 5 },
    { code: "3301654", sem: 6, akts: 6, fn: null },
    { slot: "6. YARIYIL TEKNİK SEÇMELİ DERS", sem: 6, akts: 4, fn: 6 },
    { slot: "6. YARIYIL TEKNİK SEÇMELİ DERS", sem: 6, akts: 4, fn: 7 },
    { slot: "6. YARIYIL TEKNİK SEÇMELİ DERS", sem: 6, akts: 4, fn: null },
    { code: "3301751", sem: 7, akts: 4, fn: null },
    { code: "3301752", sem: 7, akts: 4, fn: null },
    { code: "3301753", sem: 7, akts: 4, fn: null },
    { slot: "7. YARIYIL TEKNİK SEÇMELİ DERS", sem: 7, akts: 4, fn: 8 },
    { slot: "7. YARIYIL TEKNİK SEÇMELİ DERS", sem: 7, akts: 4, fn: null },
    { code: "3301851", sem: 8, akts: 20, fn: null },
    { code: "3301852", sem: 8, akts: 5, fn: null },
    { code: "3301853", sem: 8, akts: 5, fn: null },
  ];

  if (existingItemsCount === 0) {
    let sortIndex = 1;
    for (const item of protocolItemsData) {
      await prisma.protocolItem.create({
        data: {
          protocolId: protocol.id,
          itemType: item.code ? "COURSE" : "ELECTIVE_SLOT",
          courseId: item.code ? dbCourses[item.code]?.id : null,
          slotLabel: item.slot ?? null,
          akts: item.akts,
          recommendedSemester: item.sem,
          footnoteNo: item.fn,
          sortOrder: sortIndex++,
        },
      });
    }
    console.log("EEM -> BM Protocol created with 28 items (135 AKTS).");
  }

  // 8. Create Academic Term (2026-2027 Güz)
  const currentTerm = await prisma.academicTerm.upsert({
    where: {
      academicYear_semester: {
        academicYear: "2026-2027",
        semester: "GUZ",
      },
    },
    update: {
      isCurrent: true,
      startDate: new Date("2026-09-15"),
      selectionOpenAt: new Date("2026-09-15"),
      selectionCloseAt: new Date("2026-10-31"),
    },
    create: {
      academicYear: "2026-2027",
      semester: "GUZ",
      startDate: new Date("2026-09-15"),
      selectionOpenAt: new Date("2026-09-15"),
      selectionCloseAt: new Date("2026-10-31"),
      isCurrent: true,
    },
  });

  // Ensure any previous terms are not marked as current
  await prisma.academicTerm.updateMany({
    where: {
      id: { not: currentTerm.id },
    },
    data: { isCurrent: false },
  });

  // 9. Create Synthetic Student Account
  const studentUser = await prisma.user.upsert({
    where: { email: "ogrenci@ogr.selcuk.edu.tr" },
    update: { passwordHash: defaultPasswordHash, status: "ACTIVE" },
    create: {
      email: "ogrenci@ogr.selcuk.edu.tr",
      passwordHash: defaultPasswordHash,
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      firstName: "Ali",
      lastName: "Demir (Sentetik)",
      mainStudentNo: "211202001",
      programStudentNo: "231202099",
      phone: "+90 555 123 4567",
      secondaryEmail: "alidemir.test@gmail.com",
      homeDepartmentId: homeDept.id,
      advisorName: "Prof. Dr. Ahmet Yılmaz",
      admissionSemester: 3,
      admissionGano: 3.42,
      admissionType: "ASIL",
    },
  });

  const enrollment = await prisma.programEnrollment.upsert({
    where: {
      studentId_programId: {
        studentId: student.id,
        programId: capProgram.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      programId: capProgram.id,
      protocolId: protocol.id,
      status: "ACTIVE",
    },
  });
  console.log("Synthetic student seeded:", student.firstName, student.lastName);

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
