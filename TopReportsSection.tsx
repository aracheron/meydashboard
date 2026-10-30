import React, { useState } from 'react';
import { Package, ShoppingBag, Users } from 'lucide-react';
import {
  BestSellingItemReport,
  SaleRecord,
  TopBuyerReportItem,
} from '../types/sales';
import {
  computeBestSellingItems,
  formatCurrency,
  formatShortDate,
} from '../utils/salesLogic';

interface TopReportsSectionProps {
  topBuyers: TopBuyerReportItem[];
  filteredRecords: SaleRecord[];
  onFilterByBuyer: (buyerName: string) => void;
  onFilterByItem: (itemName: string) => void;
}

export const TopReportsSection: React.FC<TopReportsSectionProps> = ({
  topBuyers,
  filteredRecords,
  onFilterByBuyer,
  onFilterByItem,
}) => {
  const [itemSortBy, setItemSortBy] = useState<'units' | 'revenue'>('units');

  const bestSellingItems: BestSellingItemReport[] = computeBestSellingItems(
    filteredRecords,
    itemSortBy,
    10
  );

  const totalItemsRevenue = Math.max(
    1,
    bestSellingItems.reduce((acc, it) => acc + it.totalRevenue, 0)
  );

  return (
    <section
      aria-label="Top Selling Products and Top 10 Buyers Reports"
      className="space-y-6"
    >
      {/* 1. Analyzo-Style Top Selling Products Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Top Selling Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Best-selling items ranked by{' '}
              {itemSortBy === 'units' ? 'units sold' : 'total revenue'} · Click
              any product to filter ledger
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
              <label
                htmlFor="top-products-sort"
                className="text-xs text-slate-400"
              >
                Sort by:
              </label>
              <select
                id="top-products-sort"
                aria-label="Rank best-selling items by"
                value={itemSortBy}
                onChange={(e) =>
                  setItemSortBy(e.target.value as 'units' | 'revenue')
                }
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="units">Product Sold (Units)</option>
                <option value="revenue">Total Revenue (Rp)</option>
              </select>
            </div>

            <div
              role="group"
              aria-label="Quick toggle best-selling rank mode"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setItemSortBy('units')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  itemSortBy === 'units'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Units Sold
              </button>
              <button
                type="button"
                onClick={() => setItemSortBy('revenue')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  itemSortBy === 'revenue'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Revenue
              </button>
            </div>
          </div>
        </div>

        {bestSellingItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No product sales match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-y border-slate-200/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Sold (Units)</th>
                  <th className="py-3 px-4">Revenue Share</th>
                  <th className="py-3 px-5 text-right">Earning / Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bestSellingItems.map((product) => {
                  const sharePct = Math.round(
                    (product.totalRevenue / totalItemsRevenue) * 100
                  );
                  return (
                    <tr
                      key={product.item}
                      onClick={() => onFilterByItem(product.item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-blue-50 group-hover:text-[#2563EB] transition-colors">
                            <ShoppingBag
                              className="w-4 h-4"
                              aria-hidden="true"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm group-hover:text-[#2563EB] transition-colors">
                              {product.item}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Top Channel: {product.topChannel} · Rank #
                              {product.rank}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 font-medium">
                        {formatCurrency(product.avgUnitPrice)}
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {product.ordersCount} orders
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-slate-900">
                        {product.unitsSold.toLocaleString()} units
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#E6F7EF] text-[#10B981] font-bold">
                          +{sharePct}% share
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right font-mono tabular-nums font-extrabold text-slate-900 text-sm">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Top 10 Buyers Leaderboard (Analyzo Table Style) */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Top 10 Buyers (Ranked by Total Spending)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Highest-value customers with paid & unpaid account balances ·
              Click any buyer to filter
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Showing top {topBuyers.length} buyers
          </span>
        </div>

        {topBuyers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No buyer transactions match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-y border-slate-200/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Buyer</th>
                  <th className="py-3 px-4">Primary Channel</th>
                  <th className="py-3 px-4">Orders & Volume</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-5 text-right">Total Spending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {topBuyers.map((buyer) => (
                  <tr
                    key={buyer.buyerName}
                    onClick={() => onFilterByBuyer(buyer.buyerName)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] font-mono tabular-nums font-bold text-xs flex items-center justify-center shrink-0">
                          #{buyer.rank}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-[#2563EB] transition-colors">
                            {buyer.buyerName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Last order:{' '}
                            {formatShortDate(buyer.lastPurchaseDate, true)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {buyer.favoriteChannel}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {buyer.ordersCount} orders · {buyer.unitsBought} units
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-emerald-700 font-semibold">
                      {formatCurrency(buyer.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {buyer.unpaidBalance > 0 ? (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#FEE2E2] text-[#EF4444] font-bold">
                          Unpaid: {formatCurrency(buyer.unpaidBalance)}
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#E6F7EF] text-[#10B981] font-bold">
                          Paid in Full
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono tabular-nums font-extrabold text-slate-900 text-sm">
                      {formatCurrency(buyer.totalSpending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
