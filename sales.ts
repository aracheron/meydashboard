export type SalesChannel =
  | 'WhatsApp'
  | 'Shopee'
  | 'Tokopedia'
  | 'Offline Store';

export type PaymentStatus = 'paid' | 'unpaid';

export type DateRangePreset = 'weekly' | 'monthly' | 'custom' | 'all';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  stock: number;
  notes?: string;
}

export interface ProductInput {
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  stock: number;
  notes?: string;
}

export interface ProductWithSalesMetrics extends ProductItem {
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
  lastSoldDate: string | null;
}

export interface SaleRecord {
  id: string;
  date: string; // YYYY-MM-DD
  buyerName: string;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number; // Calculated automatically as quantity * unitPrice
  channel: SalesChannel;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface SaleInput {
  date: string;
  buyerName: string;
  item: string;
  quantity: number;
  unitPrice: number;
  channel: SalesChannel;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface SalesFilterState {
  searchQuery: string;
  channel: SalesChannel | 'All';
  buyer: string;
  item: string;
  paymentStatus: PaymentStatus | 'all';
  datePreset: DateRangePreset;
  customStartDate: string;
  customEndDate: string;
}

export interface KpiMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  unpaidOrdersCount: number;
  collectionRate: number; // 0 to 100
}

export interface PeriodComparisonMetrics {
  current: KpiMetrics;
  previousRevenue: number;
  revenueChangePct: number | null;
  previousOrders: number;
  ordersChangePct: number | null;
  previousUnits: number;
  unitsChangePct: number | null;
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "24 Oct"
  revenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  orders: number;
  units: number;
}

export interface ChannelBreakdownItem {
  channel: SalesChannel;
  revenue: number;
  orders: number;
  units: number;
  sharePct: number;
  paidRevenue: number;
  unpaidRevenue: number;
}

export interface TopBuyerReportItem {
  rank: number;
  buyerName: string;
  totalSpending: number;
  paidAmount: number;
  unpaidBalance: number;
  ordersCount: number;
  unitsBought: number;
  favoriteChannel: SalesChannel;
  lastPurchaseDate: string;
}

export interface BestSellingItemReport {
  rank: number;
  item: string;
  unitsSold: number;
  totalRevenue: number;
  ordersCount: number;
  avgUnitPrice: number;
  topChannel: SalesChannel;
}

export interface CustomerAccountSummary {
  buyerName: string;
  totalSpending: number;
  paidAmount: number;
  unpaidBalance: number;
  totalOrders: number;
  unpaidOrdersCount: number;
  lastOrderDate: string;
  oldestUnpaidDate: string | null;
  channels: SalesChannel[];
  sales: SaleRecord[];
}
