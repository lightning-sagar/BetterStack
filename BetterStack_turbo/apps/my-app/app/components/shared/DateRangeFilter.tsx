"use client";

import { CalendarDays, RotateCcw } from "lucide-react";

type DateRangeFilterProps = {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onReset?: () => void;
  className?: string;
};

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onReset,
  className = "",
}: DateRangeFilterProps) {
  return (
    <div className={`rounded-xl border border-surface-high/40 bg-surface-low p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-md bg-surface-high px-3 py-2 text-on-surface-variant">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Date Range</span>
        </div>

        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => onFromDateChange(event.target.value)}
          className="rounded-md border border-surface-high/50 bg-surface-high px-3 py-2 text-xs text-on-surface"
        />

        <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">To</label>
        <input
          type="date"
          value={toDate}
          onChange={(event) => onToDateChange(event.target.value)}
          className="rounded-md border border-surface-high/50 bg-surface-high px-3 py-2 text-xs text-on-surface"
        />

        <button
          type="button"
          onClick={() => {
            if (onReset) {
              onReset();
              return;
            }
            onFromDateChange("");
            onToDateChange("");
          }}
          className="inline-flex items-center gap-2 rounded-md bg-surface-high px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
