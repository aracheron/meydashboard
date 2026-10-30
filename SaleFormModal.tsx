import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  PaymentStatus,
  ProductItem,
  SaleInput,
  SaleRecord,
  SalesChannel,
} from '../types/sales';
import {
  SALES_CHANNELS,
  calculateSaleTotal,
  formatCurrency,
  validateSaleInput,
} from '../utils/salesLogic';

interface SaleFormModalProps {
  isOpen: boolean;
  editingSale: SaleRecord | null;
  prefillProduct?: ProductItem | null;
  products?: ProductItem[];
  defaultDate: string;
  existingRecords: SaleRecord[];
  onClose: () => void;
  onSave: (input: SaleInput, existingId?: string) => void;
}

export const SaleFormModal: React.FC<SaleFormModalProps> = ({
  isOpen,
  editingSale,
  prefillProduct = null,
  products = [],
  defaultDate,
  existingRecords,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(defaultDate);
  const [buyerName, setBuyerName] = useState('');
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [channel, setChannel] = useState<SalesChannel>('WhatsApp');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingSale) {
      setDate(editingSale.date);
      setBuyerName(editingSale.buyerName);
      setItem(editingSale.item);
      setQuantity(String(editingSale.quantity));
      setUnitPrice(String(editingSale.unitPrice));
      setChannel(editingSale.channel);
      setPaymentStatus(editingSale.paymentStatus);
      setNotes(editingSale.notes || '');
      setErrors({});
    } else if (isOpen) {
      setDate(defaultDate);
      setBuyerName('');
      setItem(prefillProduct ? prefillProduct.name : '');
      setQuantity('1');
      setUnitPrice(prefillProduct ? String(prefillProduct.unitPrice) : '');
      setChannel('WhatsApp');
      setPaymentStatus('paid');
      setNotes('');
      setErrors({});
    }
  }, [editingSale, prefillProduct, isOpen, defaultDate]);

  if (!isOpen) return null;

  // Build autocomplete suggestions and known item unit prices from Product List + existing sales
  const buyerSuggestions = Array.from(
    new Set(existingRecords.map((r) => r.buyerName))
  ).sort();

  const itemCatalog = new Map<string, number>();
  for (const p of products) {
    itemCatalog.set(p.name, p.unitPrice);
  }
  for (const r of existingRecords) {
    if (!itemCatalog.has(r.item)) {
      itemCatalog.set(r.item, r.unitPrice);
    }
  }
  const itemSuggestions = Array.from(itemCatalog.keys()).sort();

  const handleItemChange = (val: string) => {
    setItem(val);
    const knownPrice = itemCatalog.get(val.trim());
    if (knownPrice) {
      setUnitPrice(String(knownPrice));
    }
  };

  const parsedQty = Number(quantity);
  const parsedPrice = Number(unitPrice);
  const calculatedTotal = calculateSaleTotal(parsedQty, parsedPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SaleInput = {
      date,
      buyerName,
      item,
      quantity: parsedQty,
      unitPrice: parsedPrice,
      channel,
      paymentStatus,
      notes,
    };

    const validationErrors = validateSaleInput(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(payload, editingSale?.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]"
    >
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2
              id="sale-modal-title"
              className="text-base font-bold text-slate-900 font-display"
            >
              {editingSale ? `Edit Sale (${editingSale.id})` : 'Record New Sale'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total is calculated automatically from quantity and unit price
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {/* Row 1: Date & Sales Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sale-date-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Sale Date
              </label>
              <input
                id="sale-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
              {errors.date && (
                <p className="text-[11px] text-red-600 mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sale-channel-select"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Sales Channel
              </label>
              <select
                id="sale-channel-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB] cursor-pointer"
              >
                {SALES_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Buyer Name */}
          <div>
            <label
              htmlFor="sale-buyer-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Buyer Name
            </label>
            <input
              id="sale-buyer-input"
              type="text"
              list="existing-buyers-list"
              placeholder="e.g. Siti Rahmawati or Kafe Senja"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
            />
            <datalist id="existing-buyers-list">
              {buyerSuggestions.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            {errors.buyerName && (
              <p className="text-[11px] text-red-600 mt-1">{errors.buyerName}</p>
            )}
          </div>

          {/* Row 3: Quick Product List Picker + Item Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="sale-item-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Item / Product Sold
              </label>
              {products.length > 0 && (
                <select
                  aria-label="Quick select from Product List"
                  value={products.some((p) => p.name === item) ? item : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleItemChange(e.target.value);
                    }
                  }}
                  className="max-w-[260px] px-2.5 py-1 text-[11px] font-bold bg-slate-100 border border-slate-200 rounded-full text-slate-800 focus:outline-none cursor-pointer truncate"
                >
                  <option value="">Select from Security Catalog ({products.length})...</option>
                  {Array.from(new Set(products.map((p) => p.category))).map(
                    (cat) => (
                      <optgroup key={cat} label={cat}>
                        {products
                          .filter((p) => p.category === cat)
                          .map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.sku} — {formatCurrency(p.unitPrice)} ({p.stock}u)
                            </option>
                          ))}
                      </optgroup>
                    )
                  )}
                </select>
              )}
            </div>
            <input
              id="sale-item-input"
              type="text"
              list="existing-items-list"
              placeholder="e.g. elock-600L — 600 lbs EM Lock with LED (Monitored)"
              value={item}
              onChange={(e) => handleItemChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
            />
            <datalist id="existing-items-list">
              {itemSuggestions.map((it) => (
                <option key={it} value={it} />
              ))}
            </datalist>
            {errors.item && (
              <p className="text-[11px] text-red-600 mt-1">{errors.item}</p>
            )}
          </div>

          {/* Row 4: Quantity, Unit Price, and Auto-Calculated Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="sale-qty-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Quantity
              </label>
              <input
                id="sale-qty-input"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
              {errors.quantity && (
                <p className="text-[11px] text-red-600 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="sale-price-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Unit Price (Rp)
              </label>
              <input
                id="sale-price-input"
                type="number"
                min="0"
                step="500"
                placeholder="95000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
              />
              {errors.unitPrice && (
                <p className="text-[11px] text-red-600 mt-1">{errors.unitPrice}</p>
              )}
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">
                Calculated Total
              </span>
              <div
                data-testid="modal-calculated-total"
                className="w-full px-3 py-2 text-xs font-mono tabular-nums font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-900"
              >
                {formatCurrency(calculatedTotal)}
              </div>
            </div>
          </div>

          {/* Row 5: Payment Status (Paid vs Unpaid Customer Account) */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Payment Status
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  paymentStatus === 'paid'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Paid (Settled)
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  paymentStatus === 'unpaid'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Unpaid (Outstanding Balance)
              </button>
            </div>
          </div>

          {/* Row 6: Optional Notes */}
          <div>
            <label
              htmlFor="sale-notes-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Notes (Optional)
            </label>
            <input
              id="sale-notes-input"
              type="text"
              placeholder="e.g. Invoice #INV-210, courier details, or due date"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {editingSale ? 'Save Changes' : 'Save Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
