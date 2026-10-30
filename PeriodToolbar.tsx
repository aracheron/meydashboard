import React from 'react';
import { Calendar, Download, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { DateRangePreset, PaymentStatus, SalesChannel, SalesFilterState } from '../types/sales';
import { SALES_CHANNELS, formatShortDate, resolveDateBounds } from '../utils/salesLogic';

interface PeriodToolbarProps {
  filter: SalesFilterState;
  referenceDate: string;
  onUpdateFilter: (patch: Partial<SalesFilterState>) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  onRestoreSampleData: () => void;
  totalMatchingCount: number;
  totalAllCount: number;
}

export const PeriodToolbar: React.FC<PeriodToolbarProps> = ({
  filter,
  referenceDate,
  onUpdateFilter,
  onResetFilters,
  onExportCsv,
  onRestoreSampleData,
  totalMatchingCount,
  totalAllCount,
}) => {
  const { startDate, endDate } = resolveDateBounds(
    filter.datePreset,
    referenceDate,
    filter.customStartDate,
    filter.customEndDate
  );

  const datePresets: { id: DateRangePreset; label: string }[] = [
    { id: 'weekly', label: 'Weekly (7D)' },
    { id: 'monthly', label: 'Monthly (30D)' },
    { id: 'custom', label: 'Custom Range' },
    { id: 'all', label: 'All Time' },
  ];

  const paymentOptions: { id: PaymentStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Status' },
    { id: 'paid', label: 'Paid' },
    { id: 'unpaid', label: 'Unpaid' },
  ];

  const hasActiveFilter =
    filter.channel !== 'All' ||
    filter.paymentStatus !== 'all' ||
    filter.searchQuery.trim() !== '' ||
    filter.buyer.trim() !== '' ||
    filter.item.trim() !== '';

  return (
    <section
      aria-label="Date Range and Channel Controls"
      className="px-4 sm:px-7 pt-1 pb-2"
    >
      <div className="flex flex-wrap items-center justify-center xl:justify-between gap-2">
        {/* Left: Tactile Capsule Date Range Dock & Active Window Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div
            role="group"
            aria-label="Date range period"
            className="inline-flex items-center gap-0.5 p-1 rounded-full bg-gradient-to-b from-white/95 to-[#F4F5F7]/95 border-[1.5px] border-white shadow-[0_8px_22px_rgba(15,23,42,0.08)] max-w-full overflow-x-auto"
          >
            {datePresets.map((preset) => {
              const active = filter.datePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (
                      preset.id === 'custom' &&
                      (!filter.customStartDate || !filter.customEndDate)
                    ) {
                      onUpdateFilter({
                        datePreset: 'custom',
                        customStartDate: startDate || referenceDate,
                        customEndDate: endDate || referenceDate,
                      });
                    } else {
                      onUpdateFilter({ datePreset: preset.id });
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white shadow-[0_4px_12px_rgba(0,0,0,0.26),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                      : 'text-[#1C1C1E] hover:bg-black/5'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {filter.datePreset === 'custom' ? (
            <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border-[1.5px] border-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] text-xs text-neutral-700">
              <label htmlFor="custom-start-date" className="sr-only">
                Start Date
              </label>
              <input
                id="custom-start-date"
                type="date"
                aria-label="Start Date"
                value={filter.customStartDate}
                onChange={(e) => onUpdateFilter({ customStartDate: e.target.value })}
                className="px-2 py-0.5 text-xs font-semibold tabular-nums bg-white/90 border border-neutral-200 rounded-full text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
              <span className="text-neutral-400 font-semibold">to</span>
              <label htmlFor="custom-end-date" className="sr-only">
                End Date
              </label>
              <input
                id="custom-end-date"
                type="date"
                aria-label="End Date"
                value={filter.customEndDate}
                onChange={(e) => onUpdateFilter({ customEndDate: e.target.value })}
                className="px-2 py-0.5 text-xs font-semibold tabular-nums bg-white/90 border border-neutral-200 rounded-full text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border-[1.5px] border-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] text-xs text-neutral-600">
              <span className="w-5 h-5 rounded-full bg-[#2C2C2E] text-white flex items-center justify-center shrink-0">
                <Calendar className="w-3 h-3 stroke-[2.4]" aria-hidden="true" />
              </span>
              <span className="tabular-nums font-medium whitespace-nowrap">
                {startDate && endDate
                  ? `${formatShortDate(startDate, true)} – ${formatShortDate(endDate, true)}`
                  : 'All recorded dates'}
              </span>
              <span aria-hidden="true" className="text-neutral-300">
                ·
              </span>
              <span className="tabular-nums font-bold text-[#1C1C1E] whitespace-nowrap">
                {totalMatchingCount} of {totalAllCount} sales
              </span>
            </div>
          )}
        </div>

        {/* Right: Tactile Capsule Channel Selector, Payment Status Dock, Export & Reset Capsules */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Channel Filter Capsule */}
          <div className="inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border-[1.5px] border-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
            <span className="w-5 h-5 rounded-full bg-[#2C2C2E] text-white flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-3 h-3 stroke-[2.4]" aria-hidden="true" />
            </span>
            <label
              htmlFor="toolbar-channel-select"
              className="text-xs font-semibold text-neutral-500 whitespace-nowrap"
            >
              Channel:
            </label>
            <select
              id="toolbar-channel-select"
              aria-label="Filter by Sales Channel"
              value={filter.channel}
              onChange={(e) =>
                onUpdateFilter({ channel: e.target.value as SalesChannel | 'All' })
              }
              className="py-0.5 pr-1 text-xs font-bold bg-transparent text-[#1C1C1E] focus:outline-none cursor-pointer"
            >
              <option value="All">All Channels</option>
              {SALES_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Capsule Dock */}
          <div
            role="group"
            aria-label="Filter by payment status"
            className="inline-flex items-center gap-0.5 p-1 rounded-full bg-gradient-to-b from-white/95 to-[#F4F5F7]/95 border-[1.5px] border-white shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
          >
            {paymentOptions.map((opt) => {
              const active = filter.paymentStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateFilter({ paymentStatus: opt.id })}
                  className={`px-3 py-1.5 text-xs font-bold tracking-tight rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white shadow-[0_4px_12px_rgba(0,0,0,0.26),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                      : 'text-[#1C1C1E] hover:bg-black/5'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white text-xs font-bold shadow-[0_4px_12px_rgba(0,0,0,0.22)] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear Filters</span>
            </button>
          )}

          {/* Export CSV Capsule */}
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border-[1.5px] border-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] text-xs font-bold text-[#1C1C1E] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-5 h-5 rounded-full bg-[#2C2C2E] text-white flex items-center justify-center shrink-0">
              <Download className="w-3 h-3 stroke-[2.4]" aria-hidden="true" />
            </span>
            <span>Export CSV</span>
          </button>

          {/* Reset Demo Capsule */}
          <button
            type="button"
            onClick={onRestoreSampleData}
            title="Restore default sample sales data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border-[1.5px] border-white shadow-[0_6px_16px_rgba(15,23,42,0.06)] text-xs font-bold text-neutral-600 hover:text-[#1C1C1E] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </section>
  );
};
