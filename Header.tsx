import React from 'react';
import {
  Clock,
  Home,
  Package,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { DateRangePreset } from '../types/sales';
import { formatCompactCurrency } from '../utils/salesLogic';

export type ActiveTab = 'overview' | 'ledger' | 'products' | 'reports' | 'accounts';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewSale: () => void;
  unpaidAccountsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  datePreset: DateRangePreset;
  onSelectPreset: (preset: DateRangePreset) => void;
  onExportCsv: () => void;
  onRestoreSampleData: () => void;
  totalRevenue?: number;
  totalOrders?: number;
  unpaidRevenue?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewSale,
  unpaidAccountsCount,
  searchQuery,
  onSearchChange,
  datePreset,
  onSelectPreset,
  totalRevenue = 0,
  totalOrders = 0,
  unpaidRevenue = 0,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'ledger',
      label: 'History',
      icon: <ReceiptText className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
    },
    {
      id: 'overview',
      label: 'Home',
      icon: <Home className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
    },
    {
      id: 'reports',
      label: 'Progress',
      icon: <TrendingUp className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
    },
    {
      id: 'accounts',
      label:
        unpaidAccountsCount > 0 ? `Accounts (${unpaidAccountsCount})` : 'Accounts',
      icon: <Wallet className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
    },
  ];

  const cyclePreset = () => {
    const order: DateRangePreset[] = ['weekly', 'monthly', 'all'];
    const nextIdx = (order.indexOf(datePreset) + 1) % order.length;
    onSelectPreset(order[nextIdx]);
  };

  const presetShortLabel =
    datePreset === 'weekly'
      ? '7 Days'
      : datePreset === 'monthly'
      ? '30 Days'
      : datePreset === 'custom'
      ? 'Custom'
      : 'All Time';

  return (
    <header className="bg-[#F1F3F6]">
      {/* Top Utility Bar: Brand Logo, Search, and Profile */}
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-7 pt-4 pb-2">
        {/* Brand Lockup */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('overview');
          }}
          className="flex items-center gap-3 shrink-0"
        >
          <img
            src="/assets/aistudio/heres_twilighttt_8e3bfb26.jpeg"
            alt="MEY SALES DASHBOARD Logo"
            className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200/80 shadow-2xs shrink-0"
          />
          <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 font-display whitespace-nowrap">
            MEY SALES DASHBOARD
          </span>
        </a>

        {/* Search Input */}
        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <label htmlFor="global-header-search" className="sr-only">
            Search anything here
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="global-header-search"
            type="search"
            placeholder="Search anything here (buyer, item, channel, notes)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs bg-white/90 border border-white shadow-2xs rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear global search"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Store Admin Profile Lockup */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/assets/aistudio/heres_twilighttt_8e3bfb26.jpeg"
            alt="Mey Arrifah"
            className="w-9 h-9 rounded-full object-cover bg-white border border-white shadow-2xs shrink-0"
          />
          <div className="hidden sm:block leading-tight">
            <div className="text-xs font-bold text-slate-900 whitespace-nowrap">
              Mey Arrifah
            </div>
            <div className="text-[11px] text-slate-500 whitespace-nowrap">
              Admin Store
            </div>
          </div>
        </div>
      </div>

      {/* 2-Tier Tactile Capsule Navigation Bar (Matching Uploaded Reference Image) */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-7 pt-2 pb-5 flex flex-col items-center justify-center gap-3">
        {/* Tier 1: Top Mini Status & Action Capsules */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {/* Left Pill: Period / Time Indicator (Click to cycle 7D / 30D / All) */}
          <button
            type="button"
            onClick={cyclePreset}
            title="Click to switch period (Weekly / Monthly / All Time)"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border border-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] text-xs sm:text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-full bg-neutral-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span className="tabular-nums">{presetShortLabel}</span>
          </button>

          {/* Center Pill: Live Sales & Receivables Summary Readout */}
          <button
            type="button"
            onClick={() => onSelectTab('accounts')}
            title="Click to inspect customer accounts and receivables"
            className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border border-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="text-neutral-900 font-bold">
              Sales{' '}
              <span className="font-medium text-neutral-500 tabular-nums">
                {totalOrders}x · {formatCompactCurrency(totalRevenue)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-neutral-600 font-semibold tabular-nums">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
              <span>
                {unpaidRevenue > 0
                  ? `Due ${formatCompactCurrency(unpaidRevenue)}`
                  : 'All Settled'}
              </span>
            </span>
          </button>

          {/* Right Circular Action Button: Record Sale */}
          <button
            type="button"
            onClick={onOpenNewSale}
            aria-label="Record Sale"
            title="Record New Sale"
            className="w-10 h-10 rounded-full bg-gradient-to-b from-white to-[#F4F5F7] border border-white shadow-[0_4px_12px_rgba(15,23,42,0.08)] flex items-center justify-center text-neutral-900 hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.6]" aria-hidden="true" />
          </button>
        </div>

        {/* Tier 2: Main Floating Capsule Dock */}
        <nav
          aria-label="Primary Navigation"
          className="inline-flex items-center gap-1 sm:gap-2 p-2 rounded-full bg-gradient-to-b from-white/95 to-[#F4F5F7]/95 border-[1.5px] border-white shadow-[0_10px_28px_rgba(15,23,42,0.09)] max-w-full overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`inline-flex items-center gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-bold tracking-tight transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28),inset_0_1px_1px_rgba(255,255,255,0.2)]'
                    : 'text-[#1C1C1E] hover:bg-black/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
