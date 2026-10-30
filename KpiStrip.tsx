import React from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  PackageCheck,
  Wallet,
} from 'lucide-react';
import {
  DateRangePreset,
  KpiMetrics,
  PeriodComparisonMetrics,
} from '../types/sales';
import { formatCurrency } from '../utils/salesLogic';

interface KpiStripProps {
  activeKpi: KpiMetrics;
  activePreset: DateRangePreset;
  weeklySnapshot: PeriodComparisonMetrics;
  monthlySnapshot: PeriodComparisonMetrics;
  onSelectPreset: (preset: DateRangePreset) => void;
  onViewUnpaidAccounts: () => void;
  onViewLedger?: () => void;
  onViewReports?: () => void;
}

export const KpiStrip: React.FC<KpiStripProps> = ({
  activeKpi,
  activePreset,
  weeklySnapshot,
  monthlySnapshot,
  onSelectPreset,
  onViewUnpaidAccounts,
  onViewLedger,
  onViewReports,
}) => {
  const revChange =
    activePreset === 'weekly'
      ? weeklySnapshot.revenueChangePct
      : monthlySnapshot.revenueChangePct;

  return (
    <div className="space-y-5">
      {/* Top 4 Analyzo-Style Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Total Income / Revenue (Active Blue Footer Bar like Analyzo) */}
        <div className="bg-white rounded-xl border border-slate-200/90 flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Total Income
                </div>
                <div
                  data-testid="active-kpi-revenue"
                  className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums whitespace-nowrap mt-1.5"
                >
                  {formatCurrency(activeKpi.totalRevenue)}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-xl bg-[#E6F7EF] text-[#10B981] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <span className="font-bold text-[#10B981] font-mono tabular-nums">
                {revChange !== null
                  ? `${revChange >= 0 ? '+' : ''}${revChange}%`
                  : `${activeKpi.collectionRate}%`}
              </span>
              <span>
                {revChange !== null
                  ? 'Increase compared to prior period'
                  : `Paid (${formatCurrency(activeKpi.paidRevenue)})`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewReports?.()}
            className="w-full px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>View Report</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200/90 flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Total Orders
                </div>
                <div
                  data-testid="active-kpi-orders"
                  className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5"
                >
                  {activeKpi.totalOrders.toLocaleString()}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#EF4444] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <span className="font-bold text-slate-800 font-mono tabular-nums">
                {formatCurrency(activeKpi.averageOrderValue)}
              </span>
              <span>Average value per order</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewLedger?.()}
            className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 text-[#2563EB] border-t border-slate-100 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>View Report</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Card 3: Total Units Sold */}
        <div className="bg-white rounded-xl border border-slate-200/90 flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Total Units Sold
                </div>
                <div
                  data-testid="active-kpi-units"
                  className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums mt-1.5"
                >
                  {activeKpi.totalUnitsSold.toLocaleString()}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-xl bg-[#E6F7EF] text-[#10B981] flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <span className="font-bold text-[#10B981] font-mono tabular-nums">
                {activeKpi.totalOrders > 0
                  ? `${(activeKpi.totalUnitsSold / activeKpi.totalOrders).toFixed(1)}u`
                  : '0u'}
              </span>
              <span>Average units shipped per order</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewReports?.()}
            className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 text-[#2563EB] border-t border-slate-100 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>View Report</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Card 4: Unpaid Customer Receivables */}
        <div className="bg-white rounded-xl border border-slate-200/90 flex flex-col justify-between overflow-hidden shadow-2xs">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Unpaid Balance
                </div>
                <div
                  data-testid="active-kpi-unpaid"
                  className={`text-2xl font-extrabold font-mono tabular-nums whitespace-nowrap mt-1.5 ${
                    activeKpi.unpaidRevenue > 0
                      ? 'text-amber-700'
                      : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(activeKpi.unpaidRevenue)}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <span className="font-bold text-amber-700 font-mono tabular-nums">
                {activeKpi.unpaidOrdersCount} unpaid
              </span>
              <span>open customer invoices to collect</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onViewUnpaidAccounts}
            className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 text-[#2563EB] border-t border-slate-100 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Review Accounts</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Weekly (7D) & Monthly (30D) Totals Benchmark Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly Totals Card */}
        <div
          className={`bg-white rounded-xl border p-4 sm:px-5 transition-colors ${
            activePreset === 'weekly'
              ? 'border-[#2563EB] ring-1 ring-[#2563EB]/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Weekly Totals (Last 7 Days)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectPreset('weekly')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'weekly'
                  ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {activePreset === 'weekly' ? 'Active: Weekly' : 'Switch to Weekly'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2.5 border-t border-slate-100">
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">Weekly Revenue</div>
              <div
                data-testid="weekly-revenue-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums whitespace-nowrap mt-0.5"
              >
                {formatCurrency(weeklySnapshot.current.totalRevenue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Weekly Orders</div>
              <div
                data-testid="weekly-orders-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
              >
                {weeklySnapshot.current.totalOrders}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Weekly Units Sold</div>
              <div
                data-testid="weekly-units-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
              >
                {weeklySnapshot.current.totalUnitsSold}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Totals Card */}
        <div
          className={`bg-white rounded-xl border p-4 sm:px-5 transition-colors ${
            activePreset === 'monthly'
              ? 'border-[#2563EB] ring-1 ring-[#2563EB]/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Monthly Totals (Last 30 Days)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onSelectPreset('monthly')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePreset === 'monthly'
                  ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {activePreset === 'monthly'
                ? 'Active: Monthly'
                : 'Switch to Monthly'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2.5 border-t border-slate-100">
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-400">Monthly Revenue</div>
              <div
                data-testid="monthly-revenue-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums whitespace-nowrap mt-0.5"
              >
                {formatCurrency(monthlySnapshot.current.totalRevenue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Monthly Orders</div>
              <div
                data-testid="monthly-orders-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
              >
                {monthlySnapshot.current.totalOrders}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Monthly Units Sold</div>
              <div
                data-testid="monthly-units-total"
                className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
              >
                {monthlySnapshot.current.totalUnitsSold}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
