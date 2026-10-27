"use client";

import { useState } from "react";
import Link from "next/link";

export interface StudentRow {
  id: string;
  name: string;
  programType: string;
  homeDepartment: string;
  status: "Aktif" | "Silinme bekliyor";
  warning: "—" | "Sarı" | "Kırmızı";
  warningText?: string;
}

export interface PendingApproval {
  id: string;
  studentName: string;
  type: string;
  dateStr: string;
  link: string;
}

export interface WarningItem {
  id: string;
  studentName: string;
  level: "Kırmızı" | "Sarı";
  text: string;
}

interface Props {
  pendingApprovals: PendingApproval[];
  warnings: WarningItem[];
  students: StudentRow[];
}

export function CoordinatorPanoClient({ pendingApprovals, warnings, students }: Props) {
  const [selectedProgram, setSelectedProgram] = useState<string>("Tümü");
  const [selectedStatus, setSelectedStatus] = useState<string>("Tümü");

  const filteredStudents = students.filter((s) => {
    if (selectedProgram !== "Tümü" && s.programType !== selectedProgram) return false;
    if (selectedStatus !== "Tümü" && s.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pano</h1>

      {/* Top 2 Columns: Bekleyen onaylar & Uyarılar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bekleyen onaylar (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Bekleyen onaylar</h2>
          {pendingApprovals.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Bekleyen yeni onay talebi bulunmamaktadır.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-slate-900 font-medium">{item.studentName}</td>
                    <td className="py-2.5 text-slate-600">{item.type}</td>
                    <td className="py-2.5 text-slate-400">{item.dateStr}</td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={item.link}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        İncele
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right: Uyarılar (1 Col) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Uyarılar</h2>
          {warnings.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Kritik uyarı bulunmamaktadır.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              {warnings.map((w) => (
                <div key={w.id} className="flex items-start gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium border shrink-0 ${
                      w.level === "Kırmızı"
                        ? "border-slate-300 text-slate-700 bg-white"
                        : "border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    {w.level}
                  </span>
                  <span className="text-slate-800 font-normal leading-relaxed">
                    <strong>{w.studentName}</strong> — {w.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Öğrenciler Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Öğrenciler</h2>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Program</span>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              >
                <option value="Tümü">Tümü</option>
                <option value="ÇAP">ÇAP</option>
                <option value="Yan Dal">Yan Dal</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Durum</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              >
                <option value="Tümü">Tümü</option>
                <option value="Aktif">Aktif</option>
                <option value="Silinme bekliyor">Silinme bekliyor</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-900">
                <th className="py-2.5 px-3">Ad Soyad</th>
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3">Geldiği bölüm</th>
                <th className="py-2.5 px-3">Durum</th>
                <th className="py-2.5 px-3">Uyarı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3">
                    <Link
                      href={`/koordinator/ogrenci/${s.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">{s.programType}</td>
                  <td className="py-3 px-3 text-slate-600">{s.homeDepartment}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] border border-slate-300 text-slate-700 bg-white">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {s.warning === "—" ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] border border-slate-300 text-slate-700 bg-white">
                        {s.warning}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
