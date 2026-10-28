"use client";

import { useState } from "react";
import Link from "next/link";

export interface RiskStudent {
  id: string;
  name: string;
  programType: string;
  status: "Silinme bekliyor" | "Aktif";
  warning: "Kırmızı" | "Sarı";
  reason: string;
}

export interface DocumentRow {
  id: string;
  studentName: string;
  docType: string;
  dateStr: string;
  status: "Beklemede" | "Onaylandı" | "Reddedildi";
  downloadUrl: string;
}

interface Props {
  activeCapCount: number;
  activeYdpCount: number;
  riskyCount: number;
  pendingCount: number;
  riskStudents: RiskStudent[];
  documents: DocumentRow[];
}

export function DepartmentHeadPanoClient({
  activeCapCount,
  activeYdpCount,
  riskyCount,
  pendingCount,
  riskStudents,
  documents,
}: Props) {
  const [selectedProgram, setSelectedProgram] = useState<string>("Tümü");

  const filteredRisky = riskStudents.filter((s) => {
    if (selectedProgram !== "Tümü" && s.programType !== selectedProgram) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Page Title & Explicit Read-Only Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pano</h1>
        <p className="text-xs text-slate-500 mt-1">
          Bu panelde yalnızca görüntüleme yapılır; onay veya düzenleme düğmesi yoktur.
        </p>
      </div>

      {/* 4 Summary Stat Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Aktif ÇAP</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{activeCapCount}]
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Aktif Yan Dal</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{activeYdpCount}]
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Riskli öğrenci</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{riskyCount}]
          </span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 block font-normal">Bekleyen onay</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            [{pendingCount}]
          </span>
        </div>
      </div>

      {/* Section 1: Riskli öğrenciler */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Riskli öğrenciler</h2>
          <div className="flex items-center gap-2 text-xs">
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-900 font-semibold">
                <th className="py-2.5 px-3">Ad Soyad</th>
                <th className="py-2.5 px-3">Program</th>
                <th className="py-2.5 px-3">Durum</th>
                <th className="py-2.5 px-3">Uyarı</th>
                <th className="py-2.5 px-3">Neden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRisky.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Aktif riskli veya uyarı gerektiren öğrenci bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                filteredRisky.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <span className="text-blue-600 font-medium">{s.name}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-800">{s.programType}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] border border-slate-300 text-slate-700 bg-white">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        s.warning === "Kırmızı"
                          ? "bg-red-50 text-red-700 border-red-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                    >
                      {s.warning}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">[{s.reason}]</td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Belgeler ve onay durumları */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Belgeler ve onay durumları</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-900 font-semibold">
                <th className="py-2.5 px-3">Öğrenci</th>
                <th className="py-2.5 px-3">Belge türü</th>
                <th className="py-2.5 px-3">Yüklenme</th>
                <th className="py-2.5 px-3">Onay durumu</th>
                <th className="py-2.5 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-slate-900 font-medium">{d.studentName}</td>
                  <td className="py-3 px-3 text-slate-700">{d.docType}</td>
                  <td className="py-3 px-3 text-slate-400">{d.dateStr}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] border border-slate-300 text-slate-700 bg-white">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={d.downloadUrl}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Görüntüle
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footnote matching wireframe */}
      <p className="text-xs text-slate-400 pt-1">
        Mesajlar: yalnızca sayısal özet gösterilir (içerik görünmez) – teyit bekleyen madde.
      </p>
    </div>
  );
}
