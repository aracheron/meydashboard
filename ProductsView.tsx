import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Edit2,
  Layers,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ProductInput,
  ProductItem,
  ProductWithSalesMetrics,
} from '../types/sales';
import {
  formatCompactCurrency,
  formatCurrency,
  formatShortDate,
  validateProductInput,
} from '../utils/salesLogic';

interface ProductsViewProps {
  products: ProductWithSalesMetrics[];
  onSaveProduct: (input: ProductInput, existingId?: string) => void;
  onDeleteProduct: (id: string) => void;
  onQuickSellProduct: (product: ProductItem) => void;
}

const SECURITY_CATEGORY_ORDER = [
  'Magnetic & Electronic Locks',
  'Door Access',
  'Alarm System',
  'Power Supply',
  'Camera CCTV',
  'Auto Gate',
];

const CATEGORY_GROUP_CODE: Record<string, string> = {
  'Magnetic & Electronic Locks': 'EM-EL · Electronic & Magnetic Locks',
  'Door Access': 'EM-DA / EL-DA · Door Access Control',
  'Alarm System': 'EM-AL / EM-AS · Intrusion & Fire Alarm System',
  'Power Supply': 'EM-PS · Back-up DC Power Supply & Battery',
  'Camera CCTV': 'EM-SV / TD-CC · Surveillance Camera & DVR',
  'Auto Gate': 'EM-AG · Sliding & Barrier Auto Gate System',
};

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onQuickSellProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'revenue' | 'units' | 'price' | 'stock' | 'name'>('default');

  // Form state for adding / editing a product
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Magnetic & Electronic Locks');
  const [sku, setSku] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stock, setStock] = useState('25');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const existing = new Set<string>(products.map((p) => p.category));
    const ordered = SECURITY_CATEGORY_ORDER.filter((c) => existing.has(c));
    for (const c of Array.from(existing).sort()) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ['All', ...ordered];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    counts.set('All', products.length);
    for (const p of products) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (p.stock <= 0 || p.stock > 10)) return false;
      if (stockFilter === 'out_of_stock' && p.stock !== 0) return false;

      if (q) {
        const hay = `${p.sku} ${p.name} ${p.category} ${p.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'default') return list;

    return [...list].sort((a, b) => {
      if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
      if (sortBy === 'units') return b.unitsSold - a.unitsSold;
      if (sortBy === 'price') return b.unitPrice - a.unitPrice;
      if (sortBy === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Group filtered products by category so they are separated into clear sections
  const groupedSections = useMemo(() => {
    const map = new Map<string, ProductWithSalesMetrics[]>();
    for (const item of filteredProducts) {
      const group = map.get(item.category) || [];
      group.push(item);
      map.set(item.category, group);
    }

    const orderedKeys: string[] = [];
    for (const cat of SECURITY_CATEGORY_ORDER) {
      if (map.has(cat)) orderedKeys.push(cat);
    }
    for (const cat of map.keys()) {
      if (!orderedKeys.includes(cat)) orderedKeys.push(cat);
    }

    return orderedKeys.map((cat) => {
      const items = map.get(cat) || [];
      const totalStock = items.reduce((sum, i) => sum + i.stock, 0);
      const totalValue = items.reduce((sum, i) => sum + i.stock * i.unitPrice, 0);
      return {
        category: cat,
        groupLabel: CATEGORY_GROUP_CODE[cat] || cat,
        items,
        totalStock,
        totalValue,
      };
    });
  }, [filteredProducts]);

  // Summary KPIs
  const totalProducts = products.length;
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.stock, 0),
    [products]
  );
  const totalInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.stock * p.unitPrice, 0),
    [products]
  );
  const lowOrOutStockCount = useMemo(
    () => products.filter((p) => p.stock <= 10).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock === 0).length,
    [products]
  );
  const topProduct = useMemo(() => {
    if (products.length === 0) return null;
    return [...products].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  }, [products]);

  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setCategory(
      selectedCategory !== 'All' ? selectedCategory : 'Magnetic & Electronic Locks'
    );
    setSku(`EL-NEW-${String(products.length + 1).padStart(3, '0')}`);
    setUnitPrice('');
    setStock('25');
    setNotes('');
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (product: ProductItem) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setSku(product.sku);
    setUnitPrice(String(product.unitPrice));
    setStock(String(product.stock));
    setNotes(product.notes || '');
    setErrors({});
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProductInput = {
      name,
      category,
      sku,
      unitPrice: Number(unitPrice),
      stock: Number(stock),
      notes,
    };
    const validationErrors = validateProductInput(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSaveProduct(payload, editingProduct?.id);
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <section aria-label="Security Product Catalog and Stock Report" className="space-y-5">
      {/* Top Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">
                Security Catalog Items
              </span>
              <div className="text-2xl font-extrabold font-display tabular-nums text-slate-900 mt-1">
                {totalProducts} SKUs
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            <span className="font-bold text-slate-800 tabular-nums">
              {totalStockUnits.toLocaleString('id-ID')} units
            </span>{' '}
            on hand across {categories.length - 1} security groups
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">
                On-Hand Stock Value
              </span>
              <div className="text-2xl font-extrabold font-display tabular-nums text-slate-900 mt-1 whitespace-nowrap">
                {formatCompactCurrency(totalInventoryValue)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 tabular-nums">
            Full value: {formatCurrency(totalInventoryValue)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">
                Top Security Product
              </span>
              <div className="text-sm font-extrabold font-display text-slate-900 mt-1.5 line-clamp-1">
                {topProduct ? topProduct.sku : '—'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 tabular-nums truncate">
            {topProduct ? (
              <>
                <span className="font-bold text-emerald-600">
                  {formatCompactCurrency(topProduct.totalRevenue)}
                </span>{' '}
                · {topProduct.unitsSold}u sold
              </>
            ) : (
              'No sales recorded yet'
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-500">
                Stock Restock Watch
              </span>
              <div className="text-2xl font-extrabold font-display tabular-nums text-amber-600 mt-1">
                {lowOrOutStockCount} SKUs
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 tabular-nums">
            <span className="font-bold text-red-600">{outOfStockCount} out of stock</span> ·{' '}
            {lowOrOutStockCount - outOfStockCount} low stock (≤10u)
          </p>
        </div>
      </div>

      {/* Add / Edit Product Form Drawer Card */}
      {isFormOpen && (
        <div className="bg-white rounded-2xl border-2 border-slate-900/15 p-5 sm:p-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingProduct
                  ? `Edit Security Product (${editingProduct.sku})`
                  : 'Add New Security Product to Catalog'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Products added here are grouped by category and available when recording sales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              aria-label="Close product form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="product-sku-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Item Code / SKU
                </label>
                <input
                  id="product-sku-input"
                  type="text"
                  placeholder="e.g. elock-600L or EL-ST-100"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {errors.sku && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.sku}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="product-name-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Item Name & Description
                </label>
                <input
                  id="product-name-input"
                  type="text"
                  placeholder="e.g. elock-600L — 600 lbs EM Lock with LED (Monitored)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {errors.name && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="product-category-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Security Category
                </label>
                <input
                  id="product-category-input"
                  type="text"
                  list="product-categories-datalist"
                  placeholder="Magnetic & Electronic Locks"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <datalist id="product-categories-datalist">
                  {SECURITY_CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                {errors.category && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="product-price-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Default Unit Price (Rp)
                </label>
                <input
                  id="product-price-input"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="485000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs tabular-nums bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {errors.unitPrice && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.unitPrice}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="product-stock-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  On-Hand Stock (Units)
                </label>
                <input
                  id="product-stock-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="158"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs tabular-nums bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
                {errors.stock && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.stock}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="product-notes-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Group / Stock Notes (Optional)
              </label>
              <input
                id="product-notes-input"
                type="text"
                placeholder="e.g. Group: EM-EL · Dual voltage 12/24Vdc"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-b from-[#2C2C2E] to-[#141416] rounded-full shadow-sm hover:opacity-95 transition-all cursor-pointer"
              >
                {editingProduct ? 'Save Product Changes' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prominent Product Catalog Search & Category Dock */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Kyodensha Securindo Technology — Security Product Catalog
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Separated by security categories: Magnetic &amp; Electronic Locks, Door Access, Alarm System, Power Supply, Camera CCTV, and Auto Gate
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white text-xs font-bold shadow-[0_6px_16px_rgba(0,0,0,0.22)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Dedicated Prominent Search Bar for Product Catalog */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <label htmlFor="catalog-search-input" className="sr-only">
              Search Product Catalog
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="catalog-search-input"
              type="search"
              placeholder="Search catalog by item code (e.g. elock-600L, EL-ST-100, KY-150), description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-28 py-2.5 text-xs sm:text-sm font-medium bg-[#F4F5F7] border border-slate-200/90 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-bold text-slate-700 border border-slate-200/80 tabular-nums">
                {filteredProducts.length} / {products.length}
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear catalog search"
                  className="p-1 rounded-full bg-slate-200/80 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Stock Status Filter & Sort Select */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Filter by stock availability"
              className="inline-flex items-center gap-0.5 p-1 rounded-full bg-[#F4F5F7] border border-slate-200/80"
            >
              {(
                [
                  { id: 'all', label: 'All Stock' },
                  { id: 'in_stock', label: 'In Stock' },
                  { id: 'low_stock', label: 'Low (≤10)' },
                  { id: 'out_of_stock', label: 'Out (0)' },
                ] as const
              ).map((st) => {
                const active = stockFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStockFilter(st.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>

            <select
              aria-label="Sort products by"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'default'
                    | 'revenue'
                    | 'units'
                    | 'price'
                    | 'stock'
                    | 'name'
                )
              }
              className="px-3.5 py-2 text-xs font-bold bg-[#F4F5F7] border border-slate-200/80 rounded-full text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="default">Order: Stock Report Sequence</option>
              <option value="stock">Order: Highest Stock On Hand</option>
              <option value="price">Order: Unit Price (High–Low)</option>
              <option value="revenue">Order: Highest Sales Revenue</option>
              <option value="units">Order: Most Units Sold</option>
              <option value="name">Order: Item Code (A–Z)</option>
            </select>
          </div>
        </div>

        {/* Category Capsule Filter Pills */}
        <div
          role="group"
          aria-label="Filter products by security category"
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            const count = categoryCounts.get(cat) || 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white shadow-[0_4px_12px_rgba(0,0,0,0.22)]'
                    : 'bg-[#F4F5F7] text-[#1C1C1E] hover:bg-slate-200/80 border border-slate-200/70'
                }`}
              >
                <span>{cat === 'All' ? 'All Categories' : cat}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category-Separated Product Tables */}
      {groupedSections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-800">
            No security products match &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-slate-500">
            Try clearing your search query or switching back to All Categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStockFilter('all');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white text-xs font-bold cursor-pointer"
          >
            Reset Catalog Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedSections.map((section) => (
            <div
              key={section.category}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
            >
              {/* Category Group Section Header (Matches Stock Report Group Banner) */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-[#1C1C1E] to-[#2C2C2E] text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold font-display tracking-tight">
                      {section.category}
                    </h3>
                    <p className="text-[11px] text-white/70">
                      {section.groupLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-white/15 font-bold tabular-nums">
                    {section.items.length} {section.items.length === 1 ? 'Item' : 'Items'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 font-bold tabular-nums">
                    On Hand: {section.totalStock.toLocaleString('id-ID')}u
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/15 font-bold tabular-nums">
                    Value: {formatCompactCurrency(section.totalValue)}
                  </span>
                </div>
              </div>

              {/* Category Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 pl-5 pr-3 w-40">Item Code</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">On Hand Stock</th>
                      <th className="py-3 px-3 text-right">Sold</th>
                      <th className="py-3 px-3 text-right">Sales Revenue</th>
                      <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-xs">
                    {section.items.map((product) => {
                      const isLowStock = product.stock > 0 && product.stock <= 10;
                      const isOutOfStock = product.stock === 0;
                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 pl-5 pr-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {product.sku}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">
                              {product.name.includes(' — ')
                                ? product.name.split(' — ').slice(1).join(' — ')
                                : product.name}
                            </div>
                            {product.notes && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {product.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900 whitespace-nowrap">
                            {formatCurrency(product.unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums ${
                                isOutOfStock
                                  ? 'bg-red-50 text-red-700'
                                  : isLowStock
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {product.stock}u
                              {isOutOfStock
                                ? ' · Out'
                                : isLowStock
                                ? ' · Low'
                                : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                            <span className="font-bold text-slate-900">
                              {product.unitsSold}u
                            </span>
                            {product.ordersCount > 0 && (
                              <span className="text-slate-400 ml-1">
                                ({product.ordersCount}x)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-bold tabular-nums text-slate-900">
                              {formatCurrency(product.totalRevenue)}
                            </div>
                            {product.lastSoldDate && (
                              <div className="text-[11px] text-slate-400 tabular-nums">
                                Last: {formatShortDate(product.lastSoldDate)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onQuickSellProduct(product)}
                                title={`Record a new sale for ${product.sku}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-b from-[#2C2C2E] to-[#141416] text-white text-[11px] font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                              >
                                <ShoppingBag className="w-3 h-3" aria-hidden="true" />
                                <span>+ Sell</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditForm(product)}
                                aria-label={`Edit ${product.sku}`}
                                title="Edit product"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {confirmDeleteId === product.id ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteProduct(product.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Confirm
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  aria-label={`Delete ${product.sku}`}
                                  title="Delete product"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
