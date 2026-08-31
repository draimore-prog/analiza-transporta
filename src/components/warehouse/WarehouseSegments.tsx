"use client";

import React, { useMemo } from "react";
import { CostItem } from "@/types/cost";
import { formatKM } from "@/lib/calculations";
import { Zap, Layers, Activity } from "lucide-react";

interface WarehouseSegmentsProps {
  warehouseCostData: CostItem[];
  onSelectSegment: (seg: string) => void;
}

export function WarehouseSegments({
  warehouseCostData,
  onSelectSegment
}: WarehouseSegmentsProps) {
  const segmentStats = useMemo(() => {
    const statsMap = new Map<string, { cost: number; count: number }>();

    warehouseCostData.forEach((c) => {
      const seg = c.segment || "Ostalo";
      const current = statsMap.get(seg) || { cost: 0, count: 0 };
      current.cost += c.cost || 0;
      current.count += 1;
      statsMap.set(seg, current);
    });

    return Array.from(statsMap.entries()).sort((a, b) => b[1].cost - a[1].cost);
  }, [warehouseCostData]);

  const totalSegmentCost = useMemo(() => {
    return segmentStats.reduce((acc, [, s]) => acc + s.cost, 0);
  }, [segmentStats]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Raspodjela Troškova po Segmentima Skladišta
          </h3>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 rounded-full">
            Klik na karticu otvara opravke segmenta
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Utrošak po vrstama intervencija za viljuškare (Baterije, Točkovi, Hidraulika, Elektronika, Mehanika, Ulja)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segmentStats.map(([segName, stats], idx) => {
            const perc = totalSegmentCost > 0 ? ((stats.cost / totalSegmentCost) * 100).toFixed(1) : "0";

            return (
              <div
                key={segName}
                onClick={() => onSelectSegment(segName)}
                className="card bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {segName}
                    </h4>
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                    {perc}%
                  </span>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ukupan Utrošak</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {formatKM(stats.cost)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Broj Opravki</span>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                      {stats.count.toLocaleString("bs-BA")}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${perc}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
