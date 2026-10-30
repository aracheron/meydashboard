import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSaleTotal,
  computeBestSellingItems,
  computeChannelBreakdown,
  computeCustomerAccounts,
  computeKpiMetrics,
  computeSalesTrend,
  computeTopBuyers,
  computeWeeklyAndMonthlySnapshots,
  computeProductCatalogMetrics,
  createProductItem,
  createSaleRecord,
  filterSalesRecords,
  validateProductInput,
  validateSaleInput,
} from './salesLogic';
import { SaleRecord, SalesFilterState } from '../types/sales';

const SAMPLE_RECORDS: SaleRecord[] = [
  createSaleRecord('S-1', {
    date: '2026-10-29',
    buyerName: 'Alice Tan',
    item: 'Arabica Beans 250g',
    quantity: 4,
    unitPrice: 100000,
    channel: 'WhatsApp',
    paymentStatus: 'paid',
    notes: 'Fast delivery',
  }),
  createSaleRecord('S-2', {
    date: '2026-10-28',
    buyerName: 'Bob Santoso',
    item: 'Matcha Tin 100g',
    quantity: 2,
    unitPrice: 150000,
    channel: 'Shopee',
    paymentStatus: 'unpaid',
    notes: 'Due next week',
  }),
  createSaleRecord('S-3', {
    date: '2026-10-25',
    buyerName: 'Alice Tan',
    item: 'Matcha Tin 100g',
    quantity: 3,
    unitPrice: 150000,
    channel: 'Tokopedia',
    paymentStatus: 'paid',
  }),
  createSaleRecord('S-4', {
    date: '2026-10-10',
    buyerName: 'Charlie Wijaya',
    item: 'Espresso Blend 1kg',
    quantity: 5,
    unitPrice: 200000,
    channel: 'WhatsApp',
    paymentStatus: 'unpaid',
  }),
];

test('calculateSaleTotal computes automatic total accurately', () => {
  assert.equal(calculateSaleTotal(4, 95000), 380000);
  assert.equal(calculateSaleTotal(0, 95000), 0);
  assert.equal(calculateSaleTotal(-3, 95000), 0);
});

test('validateSaleInput catches missing or invalid fields', () => {
  const invalid = validateSaleInput({
    date: '',
    buyerName: 'A',
    item: '',
    quantity: 0,
    unitPrice: -50,
    channel: 'WhatsApp',
    paymentStatus: 'paid',
  });
  assert.ok(invalid.date);
  assert.ok(invalid.buyerName);
  assert.ok(invalid.item);
  assert.ok(invalid.quantity);
  assert.ok(invalid.unitPrice);

  const valid = validateSaleInput({
    date: '2026-10-29',
    buyerName: 'Siti Rahma',
    item: 'Kopi Gayo',
    quantity: 2,
    unitPrice: 95000,
    channel: 'Shopee',
    paymentStatus: 'paid',
  });
  assert.deepEqual(valid, {});
});

test('computeKpiMetrics aggregates revenue, orders, units, and paid/unpaid balances', () => {
  const kpi = computeKpiMetrics(SAMPLE_RECORDS);
  // S-1: 400k (paid), S-2: 300k (unpaid), S-3: 450k (paid), S-4: 1,000k (unpaid)
  assert.equal(kpi.totalRevenue, 2150000);
  assert.equal(kpi.totalOrders, 4);
  assert.equal(kpi.totalUnitsSold, 14);
  assert.equal(kpi.paidRevenue, 850000);
  assert.equal(kpi.unpaidRevenue, 1300000);
  assert.equal(kpi.unpaidOrdersCount, 2);
});

test('computeWeeklyAndMonthlySnapshots separates 7-day and 30-day totals accurately', () => {
  const snapshots = computeWeeklyAndMonthlySnapshots(SAMPLE_RECORDS, '2026-10-29');
  // S-1 (Oct 29), S-2 (Oct 28), S-3 (Oct 25) are within 7 days of Oct 29 (Oct 23..Oct 29)
  assert.equal(snapshots.weekly.current.totalRevenue, 1150000);
  assert.equal(snapshots.weekly.current.totalOrders, 3);
  assert.equal(snapshots.weekly.current.totalUnitsSold, 9);

  // All 4 records are within 30 days of Oct 29
  assert.equal(snapshots.monthly.current.totalRevenue, 2150000);
  assert.equal(snapshots.monthly.current.totalOrders, 4);
  assert.equal(snapshots.monthly.current.totalUnitsSold, 14);
});

test('filterSalesRecords filters by date preset, channel, buyer, item, and payment status', () => {
  const baseFilter: SalesFilterState = {
    searchQuery: '',
    channel: 'All',
    buyer: '',
    item: '',
    paymentStatus: 'all',
    datePreset: 'weekly',
    customStartDate: '',
    customEndDate: '',
  };

  const weeklyRecords = filterSalesRecords(SAMPLE_RECORDS, baseFilter, '2026-10-29');
  assert.equal(weeklyRecords.length, 3);

  const unpaidOnly = filterSalesRecords(
    SAMPLE_RECORDS,
    { ...baseFilter, datePreset: 'all', paymentStatus: 'unpaid' },
    '2026-10-29'
  );
  assert.equal(unpaidOnly.length, 2);

  const whatsappOnly = filterSalesRecords(
    SAMPLE_RECORDS,
    { ...baseFilter, datePreset: 'all', channel: 'WhatsApp' },
    '2026-10-29'
  );
  assert.equal(whatsappOnly.length, 2);
});

test('computeTopBuyers ranks buyers by total spending and tracks unpaid balances', () => {
  const topBuyers = computeTopBuyers(SAMPLE_RECORDS, 10);
  assert.equal(topBuyers.length, 3);
  assert.equal(topBuyers[0].buyerName, 'Charlie Wijaya');
  assert.equal(topBuyers[0].totalSpending, 1000000);
  assert.equal(topBuyers[0].unpaidBalance, 1000000);

  assert.equal(topBuyers[1].buyerName, 'Alice Tan');
  assert.equal(topBuyers[1].totalSpending, 850000);
  assert.equal(topBuyers[1].unpaidBalance, 0);
});

test('computeBestSellingItems ranks items by units sold and by revenue', () => {
  const byUnits = computeBestSellingItems(SAMPLE_RECORDS, 'units');
  // Matcha Tin: 2 + 3 = 5 units (750k), Espresso Blend: 5 units (1,000k), Arabica: 4 units (400k)
  assert.equal(byUnits[0].item, 'Espresso Blend 1kg');
  assert.equal(byUnits[0].unitsSold, 5);
  assert.equal(byUnits[1].item, 'Matcha Tin 100g');
  assert.equal(byUnits[1].unitsSold, 5);

  const byRevenue = computeBestSellingItems(SAMPLE_RECORDS, 'revenue');
  assert.equal(byRevenue[0].item, 'Espresso Blend 1kg');
  assert.equal(byRevenue[0].totalRevenue, 1000000);
  assert.equal(byRevenue[1].item, 'Matcha Tin 100g');
  assert.equal(byRevenue[1].totalRevenue, 750000);
});

test('computeChannelBreakdown and computeCustomerAccounts aggregate accurately', () => {
  const channels = computeChannelBreakdown(SAMPLE_RECORDS);
  assert.equal(channels[0].channel, 'WhatsApp');
  assert.equal(channels[0].revenue, 1400000);

  const accounts = computeCustomerAccounts(SAMPLE_RECORDS);
  // Unpaid accounts sorted first
  assert.equal(accounts[0].buyerName, 'Charlie Wijaya');
  assert.equal(accounts[0].unpaidBalance, 1000000);
  assert.equal(accounts[1].buyerName, 'Bob Santoso');
  assert.equal(accounts[1].unpaidBalance, 300000);
  assert.equal(accounts[2].buyerName, 'Alice Tan');
  assert.equal(accounts[2].unpaidBalance, 0);
});

test('computeSalesTrend produces contiguous daily points for weekly range', () => {
  const trend = computeSalesTrend(SAMPLE_RECORDS, 'weekly', '2026-10-29');
  assert.equal(trend.length, 7);
  assert.equal(trend[6].date, '2026-10-29');
  assert.equal(trend[6].revenue, 400000);
});

test('SALES_CHANNELS only includes WhatsApp, Shopee, Tokopedia, and Offline Store', async () => {
  const { SALES_CHANNELS } = await import('./salesLogic');
  assert.deepEqual(SALES_CHANNELS, [
    'WhatsApp',
    'Shopee',
    'Tokopedia',
    'Offline Store',
  ]);
});

test('validateProductInput and computeProductCatalogMetrics enrich products with live sales stats', () => {
  const invalidErrors = validateProductInput({
    name: 'A',
    category: '',
    sku: 'X',
    unitPrice: 0,
    stock: -2,
  });
  assert.ok(invalidErrors.name);
  assert.ok(invalidErrors.category);
  assert.ok(invalidErrors.sku);
  assert.ok(invalidErrors.unitPrice);
  assert.ok(invalidErrors.stock);

  const prod1 = createProductItem('PROD-1', {
    name: 'Arabica Beans 250g',
    category: 'Coffee Beans',
    sku: 'mey-01',
    unitPrice: 100000,
    stock: 25,
  });
  const prod2 = createProductItem('PROD-2', {
    name: 'Unsold Mug',
    category: 'Merch',
    sku: 'mey-02',
    unitPrice: 80000,
    stock: 10,
  });

  const enriched = computeProductCatalogMetrics([prod1, prod2], SAMPLE_RECORDS);
  assert.equal(enriched[0].sku, 'MEY-01');
  assert.equal(enriched[0].unitsSold, 4);
  assert.equal(enriched[0].totalRevenue, 400000);
  assert.equal(enriched[0].ordersCount, 1);
  assert.equal(enriched[0].lastSoldDate, '2026-10-29');

  assert.equal(enriched[1].unitsSold, 0);
  assert.equal(enriched[1].totalRevenue, 0);
  assert.equal(enriched[1].ordersCount, 0);
  assert.equal(enriched[1].lastSoldDate, null);
});

