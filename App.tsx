/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ActiveTab, Header } from './components/Header';
import { PeriodToolbar } from './components/PeriodToolbar';
import { KpiStrip } from './components/KpiStrip';
import { ChartsSection } from './components/ChartsSection';
import { TopReportsSection } from './components/TopReportsSection';
import { SalesLedger } from './components/SalesLedger';
import { CustomerAccountsView } from './components/CustomerAccountsView';
import { ProductsView } from './components/ProductsView';
import { SaleFormModal } from './components/SaleFormModal';
import {
  ProductInput,
  ProductItem,
  SaleInput,
  SaleRecord,
  SalesFilterState,
} from './types/sales';
import {
  computeChannelBreakdown,
  computeCustomerAccounts,
  computeKpiMetrics,
  computeProductCatalogMetrics,
  computeSalesTrend,
  computeTopBuyers,
  computeWeeklyAndMonthlySnapshots,
  createProductItem,
  createSaleRecord,
  filterSalesRecords,
} from './utils/salesLogic';
import {
  generateInitialProductsData,
  generateInitialSalesData,
  getTodayDateString,
} from './utils/seedData';

const STORAGE_KEY = 'mey_sales_dashboard_records_v3';
const PRODUCTS_STORAGE_KEY = 'mey_sales_dashboard_products_v2';

const DEFAULT_FILTER: SalesFilterState = {
  searchQuery: '',
  channel: 'All',
  buyer: '',
  item: '',
  paymentStatus: 'all',
  datePreset: 'monthly',
  customStartDate: '',
  customEndDate: '',
};

export default function App() {
  const referenceDate = useMemo(() => getTodayDateString(), []);

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed data if storage is unavailable
    }
    return generateInitialSalesData(getTodayDateString());
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to seed products
    }
    return generateInitialProductsData();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [filter, setFilter] = useState<SalesFilterState>(DEFAULT_FILTER);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [prefillProduct, setPrefillProduct] = useState<ProductItem | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch {
      // Ignore storage quota errors
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore storage quota errors
    }
  }, [products]);

  useEffect(() => {
    if (!feedbackBanner) return;
    const timer = setTimeout(() => setFeedbackBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [feedbackBanner]);

  const handleUpdateFilter = (patch: Partial<SalesFilterState>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  };

  const handleResetFilters = () => {
    setFilter((prev) => ({
      ...DEFAULT_FILTER,
      datePreset: prev.datePreset,
      customStartDate: prev.customStartDate,
      customEndDate: prev.customEndDate,
    }));
  };

  // Filtered sales for the active period and criteria
  const filteredSales = useMemo(
    () => filterSalesRecords(sales, filter, referenceDate),
    [sales, filter, referenceDate]
  );

  // Active KPI metrics
  const activeKpi = useMemo(
    () => computeKpiMetrics(filteredSales),
    [filteredSales]
  );

  // Side-by-side Weekly (7D) and Monthly (30D) snapshots (respecting active channel/buyer/item/status filters)
  const preDateFilteredSales = useMemo(
    () =>
      filterSalesRecords(
        sales,
        { ...filter, datePreset: 'all' },
        referenceDate
      ),
    [sales, filter, referenceDate]
  );

  const { weekly: weeklySnapshot, monthly: monthlySnapshot } = useMemo(
    () =>
      computeWeeklyAndMonthlySnapshots(preDateFilteredSales, referenceDate),
    [preDateFilteredSales, referenceDate]
  );

  // Trend points
  const trendPoints = useMemo(
    () =>
      computeSalesTrend(
        filteredSales,
        filter.datePreset,
        referenceDate,
        filter.customStartDate,
        filter.customEndDate
      ),
    [
      filteredSales,
      filter.datePreset,
      referenceDate,
      filter.customStartDate,
      filter.customEndDate,
    ]
  );

  // Channel breakdown
  const channelBreakdown = useMemo(
    () => computeChannelBreakdown(filteredSales),
    [filteredSales]
  );

  // Top 10 buyers
  const topBuyers = useMemo(
    () => computeTopBuyers(filteredSales, 10),
    [filteredSales]
  );

  // Customer accounts (unpaid count for nav badge)
  const customerAccounts = useMemo(
    () => computeCustomerAccounts(sales),
    [sales]
  );
  const unpaidAccountsCount = useMemo(
    () => customerAccounts.filter((c) => c.unpaidBalance > 0).length,
    [customerAccounts]
  );

  // Enriched product catalog with live sales metrics
  const enrichedProducts = useMemo(
    () => computeProductCatalogMetrics(products, filteredSales),
    [products, filteredSales]
  );

  // CRUD Handlers
  const handleSaveSale = (input: SaleInput, existingId?: string) => {
    if (existingId) {
      setSales((prev) =>
        prev.map((item) =>
          item.id === existingId ? createSaleRecord(existingId, input) : item
        )
      );
      setFeedbackBanner(`Updated sale ${existingId} for ${input.buyerName}.`);
    } else {
      const nextNum = sales.length + 1;
      const newId = `SALE-${String(nextNum).padStart(4, '0')}`;
      const record = createSaleRecord(newId, input);
      setSales((prev) => [record, ...prev]);
      setFeedbackBanner(
        `Recorded new ${input.channel} sale for ${input.buyerName}.`
      );
    }
    setEditingSale(null);
  };

  const handleDeleteSale = (id: string) => {
    const target = sales.find((s) => s.id === id);
    setSales((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      setFeedbackBanner(`Deleted sale ${id} (${target.buyerName}).`);
    }
  };

  const handleTogglePaymentStatus = (id: string) => {
    setSales((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus = s.paymentStatus === 'paid' ? 'unpaid' : 'paid';
        return { ...s, paymentStatus: nextStatus };
      })
    );
  };

  const handleMarkCustomerAllPaid = (buyerName: string) => {
    const normalized = buyerName.trim().toLowerCase();
    setSales((prev) =>
      prev.map((s) =>
        s.buyerName.trim().toLowerCase() === normalized
          ? { ...s, paymentStatus: 'paid' }
          : s
      )
    );
    setFeedbackBanner(`All open invoices for ${buyerName} marked as Paid.`);
  };

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Date',
      'Buyer Name',
      'Item',
      'Quantity',
      'Unit Price',
      'Total',
      'Channel',
      'Payment Status',
      'Notes',
    ];
    const rows = filteredSales.map((s) => [
      s.id,
      s.date,
      `"${s.buyerName.replace(/"/g, '""')}"`,
      `"${s.item.replace(/"/g, '""')}"`,
      s.quantity,
      s.unitPrice,
      s.total,
      s.channel,
      s.paymentStatus,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mey-sales-dashboard-${referenceDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedbackBanner(`Exported ${filteredSales.length} sales records to CSV.`);
  };

  const handleRestoreSampleData = () => {
    const fresh = generateInitialSalesData(referenceDate);
    setSales(fresh);
    setProducts(generateInitialProductsData());
    setFilter(DEFAULT_FILTER);
    setFeedbackBanner('Restored sample multi-channel sales and product catalog.');
  };

  const handleSaveProduct = (input: ProductInput, existingId?: string) => {
    if (existingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === existingId ? createProductItem(existingId, input) : p
        )
      );
      setFeedbackBanner(`Updated product "${input.name}" in catalog.`);
    } else {
      const nextNum = products.length + 1;
      const newId = `PROD-${String(nextNum).padStart(3, '0')}`;
      const newProd = createProductItem(newId, input);
      setProducts((prev) => [newProd, ...prev]);
      setFeedbackBanner(`Added "${input.name}" to product list.`);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      setFeedbackBanner(`Removed "${target.name}" from product list.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6] text-slate-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewSale={() => {
          setEditingSale(null);
          setPrefillProduct(null);
          setIsModalOpen(true);
        }}
        unpaidAccountsCount={unpaidAccountsCount}
        searchQuery={filter.searchQuery}
        onSearchChange={(q) => handleUpdateFilter({ searchQuery: q })}
        datePreset={filter.datePreset}
        onSelectPreset={(preset) =>
          handleUpdateFilter({ datePreset: preset })
        }
        onExportCsv={handleExportCsv}
        onRestoreSampleData={handleRestoreSampleData}
        totalRevenue={activeKpi.totalRevenue}
        totalOrders={activeKpi.totalOrders}
        unpaidRevenue={activeKpi.unpaidRevenue}
      />

      <div className="flex-1 flex flex-col max-w-[1360px] w-full mx-auto">
        <PeriodToolbar
          filter={filter}
          referenceDate={referenceDate}
          onUpdateFilter={handleUpdateFilter}
          onResetFilters={handleResetFilters}
          onExportCsv={handleExportCsv}
          onRestoreSampleData={handleRestoreSampleData}
          totalMatchingCount={filteredSales.length}
          totalAllCount={sales.length}
        />

        {feedbackBanner && (
          <div
            role="status"
            aria-live="polite"
            className="bg-[#2563EB] text-white text-xs font-medium px-4 py-2 text-center"
          >
            {feedbackBanner}
          </div>
        )}

        <main className="flex-1 w-full px-4 sm:px-7 py-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              <KpiStrip
                activeKpi={activeKpi}
                activePreset={filter.datePreset}
                weeklySnapshot={weeklySnapshot}
                monthlySnapshot={monthlySnapshot}
                onSelectPreset={(preset) =>
                  handleUpdateFilter({ datePreset: preset })
                }
                onViewUnpaidAccounts={() => setActiveTab('accounts')}
                onViewLedger={() => setActiveTab('ledger')}
                onViewReports={() => setActiveTab('reports')}
              />

              <ChartsSection
                trendPoints={trendPoints}
                channelBreakdown={channelBreakdown}
                selectedChannel={filter.channel}
                onSelectChannel={(ch) => handleUpdateFilter({ channel: ch })}
                activePreset={filter.datePreset}
                onSelectPreset={(preset) =>
                  handleUpdateFilter({ datePreset: preset })
                }
              />

              <TopReportsSection
                topBuyers={topBuyers}
                filteredRecords={filteredSales}
                onFilterByBuyer={(buyerName) => {
                  handleUpdateFilter({
                    buyer: filter.buyer === buyerName ? '' : buyerName,
                  });
                }}
                onFilterByItem={(itemName) => {
                  handleUpdateFilter({
                    item: filter.item === itemName ? '' : itemName,
                  });
                }}
              />

              <SalesLedger
                records={filteredSales}
                allRecords={sales}
                filter={filter}
                onUpdateFilter={handleUpdateFilter}
                onResetFilters={handleResetFilters}
                onEditSale={(sale) => {
                  setEditingSale(sale);
                  setIsModalOpen(true);
                }}
                onDeleteSale={handleDeleteSale}
                onTogglePaymentStatus={handleTogglePaymentStatus}
                onOpenNewSale={() => {
                  setEditingSale(null);
                  setIsModalOpen(true);
                }}
              />
            </>
          )}

          {activeTab === 'ledger' && (
            <SalesLedger
              records={filteredSales}
              allRecords={sales}
              filter={filter}
              onUpdateFilter={handleUpdateFilter}
              onResetFilters={handleResetFilters}
              onEditSale={(sale) => {
                setEditingSale(sale);
                setIsModalOpen(true);
              }}
              onDeleteSale={handleDeleteSale}
              onTogglePaymentStatus={handleTogglePaymentStatus}
              onOpenNewSale={() => {
                setEditingSale(null);
                setIsModalOpen(true);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <KpiStrip
                activeKpi={activeKpi}
                activePreset={filter.datePreset}
                weeklySnapshot={weeklySnapshot}
                monthlySnapshot={monthlySnapshot}
                onSelectPreset={(preset) =>
                  handleUpdateFilter({ datePreset: preset })
                }
                onViewUnpaidAccounts={() => setActiveTab('accounts')}
                onViewLedger={() => setActiveTab('ledger')}
                onViewReports={() => setActiveTab('reports')}
              />
              <TopReportsSection
                topBuyers={topBuyers}
                filteredRecords={filteredSales}
                onFilterByBuyer={(buyerName) => {
                  handleUpdateFilter({ buyer: buyerName });
                  setActiveTab('ledger');
                }}
                onFilterByItem={(itemName) => {
                  handleUpdateFilter({ item: itemName });
                  setActiveTab('ledger');
                }}
              />
            </div>
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={enrichedProducts}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onQuickSellProduct={(product) => {
                setEditingSale(null);
                setPrefillProduct(product);
                setIsModalOpen(true);
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <CustomerAccountsView
              allRecords={sales}
              onToggleSalePayment={handleTogglePaymentStatus}
              onMarkCustomerAllPaid={handleMarkCustomerAllPaid}
            />
          )}
        </main>

        <footer className="bg-white border-t border-slate-200/80 mt-8">
          <div className="px-4 sm:px-7 py-6 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900">
              <img
                src="/assets/aistudio/7b28e06408ac1e88d09b6d997b2fc09e_512d6534.jpg"
                alt="MEY SALES DASHBOARD Footer Banner"
                className="w-full h-44 sm:h-56 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/7b28e06408ac1e88d09b6d997b2fc09e_512d6534.jpg"
                      alt="Footer emblem"
                      className="w-10 h-10 rounded-lg object-cover border border-white/30 shrink-0"
                    />
                    <div>
                      <div className="text-sm font-extrabold tracking-tight font-display">
                        Mey Personal Dashboard
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <SaleFormModal
        isOpen={isModalOpen}
        editingSale={editingSale}
        prefillProduct={prefillProduct}
        products={products}
        defaultDate={referenceDate}
        existingRecords={sales}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSale(null);
          setPrefillProduct(null);
        }}
        onSave={handleSaveSale}
      />
    </div>
  );
}
