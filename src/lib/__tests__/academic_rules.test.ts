import test from "node:test";
import assert from "node:assert/strict";
import { evaluateStudentRules, RuleMap } from "../rules";

test("Academic Rules Evaluation: ÇAP and YDP Regulation Compliance", () => {
  const defaultRules: RuleMap = {
    MIN_ENTRY_GANO: 2.75,
    DISMISSAL_GANO_WARNING: 2.50,
    GRADUATION_MIN_GANO: 2.72,
    YANDAL_MIN_ENTRY_GANO: 2.50,
    YANDAL_MAIN_GANO_DISMISSAL: 2.30,
    YANDAL_PROGRAM_GANO_DISMISSAL: 2.00,
  };

  // 1. ÇAP m.9(e): First GPA drop below 2.50 produces a Yellow Warning
  const studentFirstDrop = {
    status: "ACTIVE",
    emptyTermStreak: 0,
    mainGanoBreaches: 0,
    program: { type: "CAP" },
    termStatuses: [{ mainGano: 2.45, programGano: 3.10 }],
  };
  const alerts1 = evaluateStudentRules(studentFirstDrop, defaultRules);
  assert.equal(alerts1.length, 1);
  assert.equal(alerts1[0].level, "Sarı");
  assert.ok(alerts1[0].text.includes("2.50 altına düştü"));
  assert.equal(alerts1[0].sourceArticle, "ÇAP m.9(e)");

  // 2. ÇAP m.9(e): Second drop under 2.72 produces Red Dismissal Alert
  const studentSecondDrop = {
    status: "ACTIVE",
    emptyTermStreak: 0,
    mainGanoBreaches: 1, // Has already received prior warning
    program: { type: "CAP" },
    termStatuses: [{ mainGano: 2.65, programGano: 2.90 }],
  };
  const alerts2 = evaluateStudentRules(studentSecondDrop, defaultRules);
  assert.equal(alerts2.length, 1);
  assert.equal(alerts2[0].level, "Kırmızı");
  assert.ok(alerts2[0].text.includes("ikinci kez 2.72 barajının altında kaldı"));

  // 3. ÇAP m.9(d): Two consecutive empty terms produces Red Dismissal Alert
  const studentTwoEmptyTerms = {
    status: "ACTIVE",
    emptyTermStreak: 2,
    program: { type: "CAP" },
    termStatuses: [{ mainGano: 3.20, programGano: 3.40 }],
  };
  const alerts3 = evaluateStudentRules(studentTwoEmptyTerms, defaultRules);
  assert.equal(alerts3.length, 1);
  assert.equal(alerts3[0].level, "Kırmızı");
  assert.ok(alerts3[0].text.includes("İki dönem üst üste ders almadı"));
  assert.equal(alerts3[0].sourceArticle, "ÇAP m.9(d)");

  // 4. One empty term produces Yellow Warning
  const studentOneEmptyTerm = {
    status: "ACTIVE",
    emptyTermStreak: 1,
    program: { type: "CAP" },
    termStatuses: [{ mainGano: 3.20, programGano: 3.40 }],
  };
  const alerts4 = evaluateStudentRules(studentOneEmptyTerm, defaultRules);
  assert.equal(alerts4.length, 1);
  assert.equal(alerts4[0].level, "Sarı");

  // 5. YDP m.7(5): Primary GPA drops below 2.30 produces Red Alert
  const ydpLowGano = {
    status: "ACTIVE",
    emptyTermStreak: 0,
    program: { type: "YANDAL" },
    termStatuses: [{ mainGano: 2.15, programGano: 2.50 }],
  };
  const alerts5 = evaluateStudentRules(ydpLowGano, defaultRules);
  assert.equal(alerts5.length, 1);
  assert.equal(alerts5[0].level, "Kırmızı");
  assert.ok(alerts5[0].text.includes("2.30 altına düştü"));
  assert.equal(alerts5[0].sourceArticle, "YDP m.7(5)");

  // 6. Configurable rule test: Changing threshold dynamically affects evaluation
  const customRules: RuleMap = {
    ...defaultRules,
    DISMISSAL_GANO_WARNING: 2.60, // Changed from 2.50 by coordinator
  };
  const studentAt255 = {
    status: "ACTIVE",
    emptyTermStreak: 0,
    mainGanoBreaches: 0,
    program: { type: "CAP" },
    termStatuses: [{ mainGano: 2.55, programGano: 3.10 }],
  };
  // Under default (2.50), 2.55 is not below 2.50 (it's close)
  // Under custom (2.60), 2.55 is below threshold
  const alertsCustom = evaluateStudentRules(studentAt255, customRules);
  assert.equal(alertsCustom.length, 1);
  assert.ok(alertsCustom[0].text.includes("2.60 altına düştü"));
});

