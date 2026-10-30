import {
  BestSellingItemReport,
  ChannelBreakdownItem,
  CustomerAccountSummary,
  DailyTrendPoint,
  DateRangePreset,
  KpiMetrics,
  PeriodComparisonMetrics,
  ProductInput,
  ProductItem,
  ProductWithSalesMetrics,
  SaleInput,
  SaleRecord,
  SalesChannel,
  SalesFilterState,
  TopBuyerReportItem,
} from '../types/sales';

export const SALES_CHANNELS: SalesChannel[] = [
  'WhatsApp',
  'Shopee',
  'Tokopedia',
  'Offline Store',
];

/**
 * Automatically calculates the total price for a sale line item.
 */
export function calculateSaleTotal(quantity: number, unitPrice: number): number {
  const safeQty = Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 0;
  const safePrice = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
  return Math.round(safeQty * safePrice);
}

/**
 * Validates a sale input payload and returns an object of field errors (empty if valid).
 */
export function validateSaleInput(input: SaleInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim())) {
    errors.date = 'Please enter a valid sale date (YYYY-MM-DD).';
  }
  if (!input.buyerName || input.buyerName.trim().length < 2) {
    errors.buyerName = 'Buyer name must be at least 2 characters.';
  }
  if (!input.item || input.item.trim().length < 2) {
    errors.item = 'Item name must be at least 2 characters.';
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1.';
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
    errors.unitPrice = 'Unit price must be greater than 0.';
  }
  if (!SALES_CHANNELS.includes(input.channel)) {
    errors.channel = 'Please select a valid sales channel.';
  }
  return errors;
}

/**
 * Creates a normalized SaleRecord with automatic total calculation.
 */
export function createSaleRecord(id: string, input: SaleInput): SaleRecord {
  const quantity = Math.max(1, Math.round(Number(input.quantity) || 0));
  const unitPrice = Math.max(0, Math.round(Number(input.unitPrice) || 0));
  return {
    id,
    date: input.date.trim(),
    buyerName: input.buyerName.trim(),
    item: input.item.trim(),
    quantity,
    unitPrice,
    total: calculateSaleTotal(quantity, unitPrice),
    channel: input.channel,
    paymentStatus: input.paymentStatus === 'unpaid' ? 'unpaid' : 'paid',
    notes: input.notes?.trim() || '',
  };
}

/**
 * Adds days to a YYYY-MM-DD date string in UTC so timezone offsets never shift the day.
 */
export function shiftDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD into a concise human label like "29 Oct" or "29 Oct 2026".
 */
export function formatShortDate(dateStr: string, includeYear = false): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[(m - 1) % 12] || '';
  return includeYear ? `${d} ${monthName} ${y}` : `${d} ${monthName}`;
}

/**
 * Formats currency in IDR (Rp) with clean tabular formatting.
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount || 0);
  const sign = rounded < 0 ? '-' : '';
  const absStr = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp ${absStr}`;
}

/**
 * Formats large currency compactly for chart axes (e.g. Rp 2,4 jt / Rp 450 rb).
 */
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount || 0);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000)}rb`;
  }
  return `${sign}Rp ${abs}`;
}

/**
 * Resolves the active [startDate, endDate] inclusive bounds for a preset relative to referenceDate.
 */
export function resolveDateBounds(
  preset: DateRangePreset,
  referenceDate: string,
  customStartDate?: string,
  customEndDate?: string
): { startDate: string | null; endDate: string | null } {
  if (preset === 'all') {
    return { startDate: null, endDate: null };
  }
  if (preset === 'weekly') {
    // 7 days inclusive ending on referenceDate
    return {
      startDate: shiftDateString(referenceDate, -6),
      endDate: referenceDate,
    };
  }
  if (preset === 'monthly') {
    // 30 days inclusive ending on referenceDate
    return {
      startDate: shiftDateString(referenceDate, -29),
      endDate: referenceDate,
    };
  }
  // Custom range
  const start = customStartDate?.trim() || null;
  const end = customEndDate?.trim() || null;
  if (start && end && start > end) {
    return { startDate: end, endDate: start };
  }
  return { startDate: start, endDate: end };
}

/**
 * Filters sales records according to the provided filter state and reference date.
 */
export function filterSalesRecords(
  records: SaleRecord[],
  filter: SalesFilterState,
  referenceDate: string
): SaleRecord[] {
  const { startDate, endDate } = resolveDateBounds(
    filter.datePreset,
    referenceDate,
    filter.customStartDate,
    filter.customEndDate
  );

  const query = filter.searchQuery.trim().toLowerCase();
  const buyerQuery = filter.buyer.trim().toLowerCase();
  const itemQuery = filter.item.trim().toLowerCase();

  return records
    .filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      if (filter.channel !== 'All' && r.channel !== filter.channel) return false;
      if (filter.paymentStatus !== 'all' && r.paymentStatus !== filter.paymentStatus) return false;
      if (buyerQuery && !r.buyerName.toLowerCase().includes(buyerQuery)) return false;
      if (itemQuery && !r.item.toLowerCase().includes(itemQuery)) return false;
      if (query) {
        const hay = `${r.buyerName} ${r.item} ${r.channel} ${r.notes || ''} ${r.date}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
}

/**
 * Computes aggregate KPI metrics for any list of SaleRecords.
 */
export function computeKpiMetrics(records: SaleRecord[]): KpiMetrics {
  let totalRevenue = 0;
  let totalUnitsSold = 0;
  let paidRevenue = 0;
  let unpaidRevenue = 0;
  let unpaidOrdersCount = 0;

  for (const r of records) {
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    totalRevenue += lineTotal;
    totalUnitsSold += r.quantity;
    if (r.paymentStatus === 'unpaid') {
      unpaidRevenue += lineTotal;
      unpaidOrdersCount += 1;
    } else {
      paidRevenue += lineTotal;
    }
  }

  const totalOrders = records.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const collectionRate =
    totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 1000) / 10 : 100;

  return {
    totalRevenue,
    totalOrders,
    totalUnitsSold,
    averageOrderValue,
    paidRevenue,
    unpaidRevenue,
    unpaidOrdersCount,
    collectionRate,
  };
}

/**
 * Computes both Weekly (last 7 days) and Monthly (last 30 days) KPI snapshots simultaneously
 * so the user can always see Weekly vs Monthly performance at a glance in addition to the active filter.
 */
export function computeWeeklyAndMonthlySnapshots(
  allRecords: SaleRecord[],
  referenceDate: string
): { weekly: PeriodComparisonMetrics; monthly: PeriodComparisonMetrics } {
  const weeklyStart = shiftDateString(referenceDate, -6);
  const prevWeeklyStart = shiftDateString(referenceDate, -13);
  const prevWeeklyEnd = shiftDateString(referenceDate, -7);

  const monthlyStart = shiftDateString(referenceDate, -29);
  const prevMonthlyStart = shiftDateString(referenceDate, -59);
  const prevMonthlyEnd = shiftDateString(referenceDate, -30);

  const weeklyCurr = computeKpiMetrics(
    allRecords.filter((r) => r.date >= weeklyStart && r.date <= referenceDate)
  );
  const weeklyPrev = computeKpiMetrics(
    allRecords.filter((r) => r.date >= prevWeeklyStart && r.date <= prevWeeklyEnd)
  );

  const monthlyCurr = computeKpiMetrics(
    allRecords.filter((r) => r.date >= monthlyStart && r.date <= referenceDate)
  );
  const monthlyPrev = computeKpiMetrics(
    allRecords.filter((r) => r.date >= prevMonthlyStart && r.date <= prevMonthlyEnd)
  );

  const calcPct = (curr: number, prev: number): number | null => {
    if (prev <= 0) return null;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  return {
    weekly: {
      current: weeklyCurr,
      previousRevenue: weeklyPrev.totalRevenue,
      revenueChangePct: calcPct(weeklyCurr.totalRevenue, weeklyPrev.totalRevenue),
      previousOrders: weeklyPrev.totalOrders,
      ordersChangePct: calcPct(weeklyCurr.totalOrders, weeklyPrev.totalOrders),
      previousUnits: weeklyPrev.totalUnitsSold,
      unitsChangePct: calcPct(weeklyCurr.totalUnitsSold, weeklyPrev.totalUnitsSold),
    },
    monthly: {
      current: monthlyCurr,
      previousRevenue: monthlyPrev.totalRevenue,
      revenueChangePct: calcPct(monthlyCurr.totalRevenue, monthlyPrev.totalRevenue),
      previousOrders: monthlyPrev.totalOrders,
      ordersChangePct: calcPct(monthlyCurr.totalOrders, monthlyPrev.totalOrders),
      previousUnits: monthlyPrev.totalUnitsSold,
      unitsChangePct: calcPct(monthlyCurr.totalUnitsSold, monthlyPrev.totalUnitsSold),
    },
  };
}

/**
 * Generates chronological daily trend points across the active date range.
 */
export function computeSalesTrend(
  records: SaleRecord[],
  preset: DateRangePreset,
  referenceDate: string,
  customStartDate?: string,
  customEndDate?: string
): DailyTrendPoint[] {
  const byDate = new Map<
    string,
    { revenue: number; paidRevenue: number; unpaidRevenue: number; orders: number; units: number }
  >();

  for (const r of records) {
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    const existing = byDate.get(r.date) || {
      revenue: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
      orders: 0,
      units: 0,
    };
    existing.revenue += lineTotal;
    if (r.paymentStatus === 'unpaid') {
      existing.unpaidRevenue += lineTotal;
    } else {
      existing.paidRevenue += lineTotal;
    }
    existing.orders += 1;
    existing.units += r.quantity;
    byDate.set(r.date, existing);
  }

  let { startDate, endDate } = resolveDateBounds(
    preset,
    referenceDate,
    customStartDate,
    customEndDate
  );

  if (!startDate || !endDate) {
    if (records.length === 0) {
      startDate = shiftDateString(referenceDate, -6);
      endDate = referenceDate;
    } else {
      const sortedDates = Array.from(byDate.keys()).sort();
      startDate = sortedDates[0];
      endDate = sortedDates[sortedDates.length - 1];
    }
  }

  // Cap contiguous zero-fill to 60 days so extreme custom ranges remain fast and legible
  const points: DailyTrendPoint[] = [];
  let cursor = startDate;
  let guard = 0;
  while (cursor <= endDate && guard < 90) {
    const entry = byDate.get(cursor) || {
      revenue: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
      orders: 0,
      units: 0,
    };
    points.push({
      date: cursor,
      label: formatShortDate(cursor),
      revenue: entry.revenue,
      paidRevenue: entry.paidRevenue,
      unpaidRevenue: entry.unpaidRevenue,
      orders: entry.orders,
      units: entry.units,
    });
    cursor = shiftDateString(cursor, 1);
    guard += 1;
  }

  return points;
}

/**
 * Computes revenue, orders, units, and share percentage by sales channel.
 */
export function computeChannelBreakdown(records: SaleRecord[]): ChannelBreakdownItem[] {
  const map = new Map<
    SalesChannel,
    { revenue: number; orders: number; units: number; paidRevenue: number; unpaidRevenue: number }
  >();

  for (const ch of SALES_CHANNELS) {
    map.set(ch, { revenue: 0, orders: 0, units: 0, paidRevenue: 0, unpaidRevenue: 0 });
  }

  let grandTotal = 0;
  for (const r of records) {
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    grandTotal += lineTotal;
    const item = map.get(r.channel) || {
      revenue: 0,
      orders: 0,
      units: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
    };
    item.revenue += lineTotal;
    item.orders += 1;
    item.units += r.quantity;
    if (r.paymentStatus === 'unpaid') {
      item.unpaidRevenue += lineTotal;
    } else {
      item.paidRevenue += lineTotal;
    }
    map.set(r.channel, item);
  }

  return Array.from(map.entries())
    .map(([channel, stats]) => ({
      channel,
      revenue: stats.revenue,
      orders: stats.orders,
      units: stats.units,
      paidRevenue: stats.paidRevenue,
      unpaidRevenue: stats.unpaidRevenue,
      sharePct: grandTotal > 0 ? Math.round((stats.revenue / grandTotal) * 1000) / 10 : 0,
    }))
    .filter((item) => item.orders > 0 || grandTotal === 0)
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Computes the Top 10 Buyers report ranked by total spending.
 */
export function computeTopBuyers(records: SaleRecord[], limit = 10): TopBuyerReportItem[] {
  const buyerMap = new Map<
    string,
    {
      buyerName: string;
      totalSpending: number;
      paidAmount: number;
      unpaidBalance: number;
      ordersCount: number;
      unitsBought: number;
      channelCounts: Map<SalesChannel, number>;
      lastPurchaseDate: string;
    }
  >();

  for (const r of records) {
    const key = r.buyerName.trim().toLowerCase();
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    const existing = buyerMap.get(key) || {
      buyerName: r.buyerName.trim(),
      totalSpending: 0,
      paidAmount: 0,
      unpaidBalance: 0,
      ordersCount: 0,
      unitsBought: 0,
      channelCounts: new Map<SalesChannel, number>(),
      lastPurchaseDate: r.date,
    };

    existing.totalSpending += lineTotal;
    if (r.paymentStatus === 'unpaid') {
      existing.unpaidBalance += lineTotal;
    } else {
      existing.paidAmount += lineTotal;
    }
    existing.ordersCount += 1;
    existing.unitsBought += r.quantity;
    existing.channelCounts.set(r.channel, (existing.channelCounts.get(r.channel) || 0) + 1);
    if (r.date > existing.lastPurchaseDate) {
      existing.lastPurchaseDate = r.date;
    }
    buyerMap.set(key, existing);
  }

  const sorted = Array.from(buyerMap.values()).sort((a, b) => {
    if (b.totalSpending !== a.totalSpending) return b.totalSpending - a.totalSpending;
    return b.ordersCount - a.ordersCount;
  });

  return sorted.slice(0, limit).map((entry, idx) => {
    let favChannel: SalesChannel = 'WhatsApp';
    let maxCount = -1;
    for (const [ch, cnt] of entry.channelCounts.entries()) {
      if (cnt > maxCount) {
        maxCount = cnt;
        favChannel = ch;
      }
    }
    return {
      rank: idx + 1,
      buyerName: entry.buyerName,
      totalSpending: entry.totalSpending,
      paidAmount: entry.paidAmount,
      unpaidBalance: entry.unpaidBalance,
      ordersCount: entry.ordersCount,
      unitsBought: entry.unitsBought,
      favoriteChannel: favChannel,
      lastPurchaseDate: entry.lastPurchaseDate,
    };
  });
}

/**
 * Computes Best-Selling Items report ranked either by 'units' (unitsSold) or 'revenue' (totalRevenue).
 */
export function computeBestSellingItems(
  records: SaleRecord[],
  rankBy: 'units' | 'revenue' = 'units',
  limit = 10
): BestSellingItemReport[] {
  const itemMap = new Map<
    string,
    {
      item: string;
      unitsSold: number;
      totalRevenue: number;
      ordersCount: number;
      channelUnits: Map<SalesChannel, number>;
    }
  >();

  for (const r of records) {
    const key = r.item.trim().toLowerCase();
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    const existing = itemMap.get(key) || {
      item: r.item.trim(),
      unitsSold: 0,
      totalRevenue: 0,
      ordersCount: 0,
      channelUnits: new Map<SalesChannel, number>(),
    };

    existing.unitsSold += r.quantity;
    existing.totalRevenue += lineTotal;
    existing.ordersCount += 1;
    existing.channelUnits.set(
      r.channel,
      (existing.channelUnits.get(r.channel) || 0) + r.quantity
    );
    itemMap.set(key, existing);
  }

  const sorted = Array.from(itemMap.values()).sort((a, b) => {
    if (rankBy === 'units') {
      if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
      return b.totalRevenue - a.totalRevenue;
    }
    if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
    return b.unitsSold - a.unitsSold;
  });

  return sorted.slice(0, limit).map((entry, idx) => {
    let topChannel: SalesChannel = 'WhatsApp';
    let maxUnits = -1;
    for (const [ch, u] of entry.channelUnits.entries()) {
      if (u > maxUnits) {
        maxUnits = u;
        topChannel = ch;
      }
    }
    return {
      rank: idx + 1,
      item: entry.item,
      unitsSold: entry.unitsSold,
      totalRevenue: entry.totalRevenue,
      ordersCount: entry.ordersCount,
      avgUnitPrice: entry.unitsSold > 0 ? Math.round(entry.totalRevenue / entry.unitsSold) : 0,
      topChannel,
    };
  });
}

/**
 * Aggregates customer accounts with paid vs. unpaid balances so the business owner
 * can quickly identify outstanding receivables and settle invoices.
 */
export function computeCustomerAccounts(records: SaleRecord[]): CustomerAccountSummary[] {
  const map = new Map<string, CustomerAccountSummary>();

  for (const r of records) {
    const key = r.buyerName.trim().toLowerCase();
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    const existing = map.get(key) || {
      buyerName: r.buyerName.trim(),
      totalSpending: 0,
      paidAmount: 0,
      unpaidBalance: 0,
      totalOrders: 0,
      unpaidOrdersCount: 0,
      lastOrderDate: r.date,
      oldestUnpaidDate: null,
      channels: [],
      sales: [],
    };

    existing.totalSpending += lineTotal;
    existing.totalOrders += 1;
    if (r.paymentStatus === 'unpaid') {
      existing.unpaidBalance += lineTotal;
      existing.unpaidOrdersCount += 1;
      if (!existing.oldestUnpaidDate || r.date < existing.oldestUnpaidDate) {
        existing.oldestUnpaidDate = r.date;
      }
    } else {
      existing.paidAmount += lineTotal;
    }
    if (r.date > existing.lastOrderDate) {
      existing.lastOrderDate = r.date;
    }
    if (!existing.channels.includes(r.channel)) {
      existing.channels.push(r.channel);
    }
    existing.sales.push(r);
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => {
    // Prioritize accounts with unpaid balances first, then by total spending
    if (a.unpaidBalance > 0 && b.unpaidBalance === 0) return -1;
    if (b.unpaidBalance > 0 && a.unpaidBalance === 0) return 1;
    if (b.unpaidBalance !== a.unpaidBalance) return b.unpaidBalance - a.unpaidBalance;
    return b.totalSpending - a.totalSpending;
  });
}

/**
 * Validates a product input payload and returns an object of field errors (empty if valid).
 */
export function validateProductInput(input: ProductInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters.';
  }
  if (!input.category || input.category.trim().length < 2) {
    errors.category = 'Category must be at least 2 characters.';
  }
  if (!input.sku || input.sku.trim().length < 2) {
    errors.sku = 'SKU must be at least 2 characters.';
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
    errors.unitPrice = 'Default unit price must be greater than 0.';
  }
  if (!Number.isFinite(input.stock) || input.stock < 0) {
    errors.stock = 'Stock must be 0 or greater.';
  }
  return errors;
}

/**
 * Creates a normalized ProductItem.
 */
export function createProductItem(id: string, input: ProductInput): ProductItem {
  return {
    id,
    name: input.name.trim(),
    category: input.category.trim(),
    sku: input.sku.trim().toUpperCase(),
    unitPrice: Math.round(input.unitPrice),
    stock: Math.max(0, Math.round(input.stock)),
    notes: input.notes?.trim() || '',
  };
}

/**
 * Enriches product catalog items with live sales metrics (units sold, total revenue, orders count, last sold date).
 */
export function computeProductCatalogMetrics(
  products: ProductItem[],
  sales: SaleRecord[]
): ProductWithSalesMetrics[] {
  const salesByProduct = new Map<
    string,
    { unitsSold: number; totalRevenue: number; ordersCount: number; lastSoldDate: string | null }
  >();

  for (const r of sales) {
    const key = r.item.trim().toLowerCase();
    const lineTotal = calculateSaleTotal(r.quantity, r.unitPrice);
    const existing = salesByProduct.get(key) || {
      unitsSold: 0,
      totalRevenue: 0,
      ordersCount: 0,
      lastSoldDate: null,
    };
    existing.unitsSold += r.quantity;
    existing.totalRevenue += lineTotal;
    existing.ordersCount += 1;
    if (!existing.lastSoldDate || r.date > existing.lastSoldDate) {
      existing.lastSoldDate = r.date;
    }
    salesByProduct.set(key, existing);
  }

  return products.map((p) => {
    const key = p.name.trim().toLowerCase();
    const stats = salesByProduct.get(key);
    return {
      ...p,
      unitsSold: stats ? stats.unitsSold : 0,
      totalRevenue: stats ? stats.totalRevenue : 0,
      ordersCount: stats ? stats.ordersCount : 0,
      lastSoldDate: stats ? stats.lastSoldDate : null,
    };
  });
}

