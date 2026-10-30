import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  PaymentStatus,
  SaleRecord,
  SalesChannel,
  SalesFilterState,
} from '../types/sales';
import {
  SALES_CHANNELS,
  computeKpiMetrics,
  formatCurrency,
  formatShortDate,
} from '../utils/salesLogic';

interface SalesLedgerProps {
  records: SaleRecord[];
  allRecords: SaleRecord[];
  filter: SalesFilterState;
  onUpdateFilter: (patch: Partial<SalesFilterState>) => void;
  onResetFilters: () => void;
  onEditSale: (sale: SaleRecord) => void;
  onDeleteSale: (id: string) => void;
  onTogglePaymentStatus: (id: string) => void;
  onOpenNewSale: () => void;
}

export const SalesLedger: React.FC<SalesLedgerProps> = ({
  records,
  allRecords,
  filter,
  onUpdateFilter,
  onResetFilters,
  onEditSale,
  onDeleteSale,
  onTogglePaymentStatus,
  onOpenNewSale,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const uniqueBuyers = Array.from(
    new Set(allRecords.map((r) => r.buyerName))
  ).sort();
  const uniqueItems = Array.from(new Set(allRecords.map((r) => r.item))).sort();

  const summary = computeKpiMetrics(records);

  const hasFilters =
    filter.searchQuery.trim() !== '' ||
    filter.channel !== 'All' ||
    filter.buyer.trim() !== '' ||
    filter.item.trim() !== '' ||
    filter.paymentStatus !== 'all' ||
    filter.datePreset !== 'all';

  return (
    <section
      aria-label="Sales Transactions Ledger"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      {/* Header & Search/Filter Controls */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Sales Ledger & Transaction History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search, filter, edit, or toggle Paid / Unpaid status for any order
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
            <span>
              Matching: <strong className="text-slate-900">{records.length}</strong> orders
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Units: <strong className="text-slate-900">{summary.totalUnitsSold}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Total: <strong className="text-slate-900">{formatCurrency(summary.totalRevenue)}</strong>
            </span>
            {summary.unpaidRevenue > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold">
                  Unpaid: {formatCurrency(summary.unpaidRevenue)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Multi-dimension Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Keyword Search */}
          <div className="relative lg:col-span-2">
            <label htmlFor="ledger-search-input" className="sr-only">
              Search sales by buyer, item, channel, or notes
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="ledger-search-input"
              type="search"
              placeholder="Search buyer, item, notes, or date..."
              value={filter.searchQuery}
              onChange={(e) => onUpdateFilter({ searchQuery: e.target.value })}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563EB]"
            />
            {filter.searchQuery && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => onUpdateFilter({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Buyer Filter */}
          <div>
            <label htmlFor="ledger-buyer-filter" className="sr-only">
              Filter by Buyer
            </label>
            <select
              id="ledger-buyer-filter"
              aria-label="Filter by Buyer"
              value={filter.buyer}
              onChange={(e) => onUpdateFilter({ buyer: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="">All Buyers ({uniqueBuyers.length})</option>
              {uniqueBuyers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Item Filter */}
          <div>
            <label htmlFor="ledger-item-filter" className="sr-only">
              Filter by Item
            </label>
            <select
              id="ledger-item-filter"
              aria-label="Filter by Item"
              value={filter.item}
              onChange={(e) => onUpdateFilter({ item: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="">All Items ({uniqueItems.length})</option>
              {uniqueItems.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Channel & Payment Status Quick Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="ledger-channel-filter" className="sr-only">
              Sales Channel
            </label>
            <select
              id="ledger-channel-filter"
              aria-label="Sales Channel"
              value={filter.channel}
              onChange={(e) =>
                onUpdateFilter({
                  channel: e.target.value as SalesChannel | 'All',
                })
              }
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="All">All Channels</option>
              {SALES_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>

            <label htmlFor="ledger-status-filter" className="sr-only">
              Payment Status
            </label>
            <select
              id="ledger-status-filter"
              aria-label="Payment Status"
              value={filter.paymentStatus}
              onChange={(e) =>
                onUpdateFilter({
                  paymentStatus: e.target.value as PaymentStatus | 'all',
                })
              }
              className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {records.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="text-sm font-semibold text-slate-800">
            No sales records match your current filters
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try clearing your search or expanding the date range to view earlier transactions, or record a new sale.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
            <button
              type="button"
              onClick={onOpenNewSale}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Record New Sale</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop High-Density Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">Item & Notes</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((sale) => {
                  const isConfirming = confirmDeleteId === sale.id;
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        <div>{formatShortDate(sale.date, true)}</div>
                        <div className="text-[10px] text-slate-400">{sale.id}</div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => onUpdateFilter({ buyer: sale.buyerName })}
                          className="text-left hover:text-[#2563EB] hover:underline cursor-pointer font-semibold"
                        >
                          {sale.buyerName}
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onUpdateFilter({ item: sale.item })}
                          className="text-left font-medium text-slate-800 hover:text-[#2563EB] hover:underline cursor-pointer"
                        >
                          {sale.item}
                        </button>
                        {sale.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                            {sale.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {sale.channel}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {sale.quantity}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatCurrency(sale.unitPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(sale.total)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onTogglePaymentStatus(sale.id)}
                          aria-label={`Mark sale ${sale.id} for ${sale.buyerName} as ${
                            sale.paymentStatus === 'paid' ? 'unpaid' : 'paid'
                          }`}
                          title="Click to toggle Paid / Unpaid status"
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:underline ${
                            sale.paymentStatus === 'paid'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {sale.paymentStatus === 'paid' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Paid</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>Unpaid · Due</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteSale(sale.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditSale(sale)}
                              aria-label={`Edit sale ${sale.id} for ${sale.buyerName}`}
                              className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(sale.id)}
                              aria-label={`Delete sale ${sale.id} for ${sale.buyerName}`}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Transaction List */}
          <div className="md:hidden divide-y divide-slate-200">
            {records.map((sale) => {
              const isConfirming = confirmDeleteId === sale.id;
              return (
                <div key={sale.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-900">
                        {sale.buyerName}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono tabular-nums">
                          {formatShortDate(sale.date, true)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{sale.channel}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900">
                        {formatCurrency(sale.total)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onTogglePaymentStatus(sale.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 cursor-pointer ${
                          sale.paymentStatus === 'paid'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {sale.paymentStatus === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            <span>Paid</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>Unpaid · Tap to Settle</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                    <span className="font-medium">{sale.item}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {sale.quantity} × {formatCurrency(sale.unitPrice)}
                    </span>
                  </div>

                  {sale.notes && (
                    <div className="text-xs text-slate-500">{sale.notes}</div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteSale(sale.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditSale(sale)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                        >
                          <Edit3 className="w-3 h-3" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(sale.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
