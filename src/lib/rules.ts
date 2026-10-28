import { db } from "./db";

export interface AcademicAlert {
  level: "Sarı" | "Kırmızı";
  text: string;
  sourceArticle: string;
}

export interface RuleMap {
  [key: string]: number;
}

/**
 * Fetch active program rules from DB as a key-value dictionary
 */
export async function getProgramRules(programType: "CAP" | "YANDAL" = "CAP"): Promise<RuleMap> {
  const rules = await db.programRule.findMany({
    where: {
      program: { type: programType },
    },
  });

  const map: RuleMap = {
    MIN_ENTRY_GANO: 2.75,
    DISMISSAL_GANO_WARNING: 2.50,
    GRADUATION_MIN_GANO: 2.72,
    YANDAL_MIN_ENTRY_GANO: 2.50,
    YANDAL_MAIN_GANO_DISMISSAL: 2.30,
    YANDAL_PROGRAM_GANO_DISMISSAL: 2.00,
  };

  for (const r of rules) {
    map[r.ruleKey] = r.value;
  }

  return map;
}

/**
 * Pure evaluation function for student academic status and alert levels
 * based strictly on official Selçuk University Senate By-laws.
 */
export function evaluateStudentRules(
  enrollment: {
    status: string;
    emptyTermStreak?: number;
    mainGanoBreaches?: number;
    program: { type: string };
    termStatuses: Array<{
      mainGano?: number | null;
      programGano?: number | null;
      term?: { academicYear: string; semester: string } | null;
    }>;
  },
  rules: RuleMap
): AcademicAlert[] {
  const alerts: AcademicAlert[] = [];

  // If already removed or withdrawn, do not produce active breach warnings
  if (enrollment.status === "REMOVED") {
    alerts.push({
      level: "Kırmızı",
      text: "Öğrencinin ÇAP/YDP programından kaydı silinmiştir.",
      sourceArticle: "m.9",
    });
    return alerts;
  }

  if (enrollment.status === "FROZEN") {
    alerts.push({
      level: "Sarı",
      text: "Öğrencinin kaydı dondurulmuştur (İzinli).",
      sourceArticle: "m.9(ç)",
    });
    return alerts;
  }

  const isCap = enrollment.program.type === "CAP";
  const streak = enrollment.emptyTermStreak || 0;

  // Rule: Two consecutive semesters without enrolling in courses (m.9(d) for ÇAP, m.7(4) for YDP)
  if (streak >= 2) {
    alerts.push({
      level: "Kırmızı",
      text: "İki dönem üst üste ders almadı (Kayıt silme şartı oluştu, karar koordinatördedir).",
      sourceArticle: isCap ? "ÇAP m.9(d)" : "YDP m.7(4)",
    });
  } else if (streak === 1) {
    alerts.push({
      level: "Sarı",
      text: "1 dönem ders almadı (İkinci dönem de ders alınmazsa kayıt silinir).",
      sourceArticle: isCap ? "ÇAP m.9(d)" : "YDP m.7(4)",
    });
  }

  // GPA Evaluations using coordinator-verified academic term records
  const latestStatus = enrollment.termStatuses?.[0];
  if (latestStatus) {
    const mainGano = latestStatus.mainGano;
    const programGano = latestStatus.programGano;

    if (isCap) {
      const warningThreshold = rules["DISMISSAL_GANO_WARNING"] ?? 2.50;
      const dismissalThreshold = rules["GRADUATION_MIN_GANO"] ?? 2.72;
      const priorBreaches = enrollment.mainGanoBreaches || 0;

      if (mainGano !== null && mainGano !== undefined) {
        if (mainGano < warningThreshold && priorBreaches === 0) {
          alerts.push({
            level: "Sarı",
            text: `Ana dal GANO ${warningThreshold.toFixed(2)} altına düştü (${mainGano.toFixed(2)}). Bir defalık uyarı hakkı.`,
            sourceArticle: "ÇAP m.9(e)",
          });
        } else if (priorBreaches > 0 && mainGano < dismissalThreshold) {
          alerts.push({
            level: "Kırmızı",
            text: `Ana dal GANO ikinci kez ${dismissalThreshold.toFixed(2)} barajının altında kaldı (${mainGano.toFixed(2)}). Kayıt silme koşulu oluştu.`,
            sourceArticle: "ÇAP m.9(e)",
          });
        } else if (mainGano >= warningThreshold && mainGano < warningThreshold + 0.15) {
          alerts.push({
            level: "Sarı",
            text: `Ana dal GANO uyarı eşiğine yakın (${mainGano.toFixed(2)} / ${warningThreshold.toFixed(2)}).`,
            sourceArticle: "ÇAP m.9(e)",
          });
        }
      }
    } else {
      // YDP Minor Rules
      const ydpMainDismissal = rules["YANDAL_MAIN_GANO_DISMISSAL"] ?? 2.30;
      const ydpProgDismissal = rules["YANDAL_PROGRAM_GANO_DISMISSAL"] ?? 2.00;

      if (mainGano !== null && mainGano !== undefined && mainGano < ydpMainDismissal) {
        alerts.push({
          level: "Kırmızı",
          text: `Ana dal GANO ${ydpMainDismissal.toFixed(2)} altına düştü (${mainGano.toFixed(2)}). Yan Dal ilişiği kesilme koşulu oluştu.`,
          sourceArticle: "YDP m.7(5)",
        });
      }

      if (programGano !== null && programGano !== undefined && programGano < ydpProgDismissal) {
        alerts.push({
          level: "Sarı",
          text: `Yan dal GANO ${ydpProgDismissal.toFixed(2)} altına düştü (${programGano.toFixed(2)}).`,
          sourceArticle: "YDP m.7(6)",
        });
      }
    }
  }

  return alerts;
}

