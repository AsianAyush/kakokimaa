'use client';
import { useState } from 'react';
import { CATEGORIES, SERVICES, CATEGORY_LIMITS, estimatePrice, CartItem } from '@/lib/services-data';

interface Props {
  service: { serviceId: string; name: string; category: string; qty: number; price: number } | null;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}

export default function CustomizeModal({ service, onClose, onAdd }: Props) {
  const isCustomOrder = !service;
  const [selectedCategory, setSelectedCategory] = useState(service?.category || CATEGORIES[0]);
  const [qtyStr, setQtyStr] = useState(String(service?.qty || 100));
  const [note, setNote] = useState('');

  const category = isCustomOrder ? selectedCategory : service!.category;
  const limits = CATEGORY_LIMITS[category] || { min: 1, max: 1000000 };

  const qty = Number(qtyStr) || 0;
  const isInRange = qty >= limits.min && qty <= limits.max && qty > 0;
  const estimated = isInRange ? estimatePrice(category, qty) : 0;

  let validationError = '';
  if (qtyStr !== '' && qty > 0) {
    if (qty < limits.min) validationError = `⚠️ Minimum order for ${category} is ${limits.min.toLocaleString('en-IN')}`;
    else if (qty > limits.max) validationError = `⚠️ Maximum order for ${category} is ${limits.max.toLocaleString('en-IN')}`;
  }

  function handleAdd() {
    if (!isInRange) return;
    const finalName = isCustomOrder ? `Custom: ${category}` : `Custom: ${service!.name}`;
    const item: CartItem = {
      id: `custom-${Date.now()}`,
      serviceId: isCustomOrder ? `custom-${category}` : service!.serviceId,
      name: category === 'Views' ? finalName.replace('Custom:', 'Custom Reel Views:') : finalName,
      category,
      qty,
      price: estimated,
      note: note || undefined,
      isCustom: true,
    };
    onAdd(item);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            {isCustomOrder ? '✨ Custom Order' : `Customize: ${service!.name}`}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {isCustomOrder && (
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setQtyStr(String(CATEGORY_LIMITS[e.target.value]?.min || 100)); }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {!isCustomOrder && (
            <div style={{ background: 'var(--bg4)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: '0.875rem', color: 'var(--muted)' }}>
              Service: <strong style={{ color: 'var(--white)' }}>{service!.category}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min={limits.min}
              max={limits.max}
              step={1}
              value={qtyStr}
              onChange={e => setQtyStr(e.target.value)}
              onBlur={() => {
                const val = Number(qtyStr);
                if (val < limits.min && val > 0) setQtyStr(String(limits.min));
              }}
              style={validationError ? { borderColor: 'var(--danger)' } : {}}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Minimum: {limits.min.toLocaleString('en-IN')} — Maximum: {limits.max.toLocaleString('en-IN')}
            </span>
            {validationError && (
              <span style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: 4, display: 'block' }}>{validationError}</span>
            )}
          </div>

          <div className="price-estimate">
            <div>
              <div className="price-estimate-label">Estimated Price</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Based on nearest package tier</div>
            </div>
            {isInRange
              ? <div className="price-estimate-value">₹{estimated.toLocaleString('en-IN')}</div>
              : <div style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>Enter a valid quantity to see price</div>
            }
          </div>

          <div className="form-group">
            <label className="form-label">Special Instructions <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
            <textarea
              rows={3}
              placeholder="Any specific requirements for your order..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button className="btn btn-gold btn-full" onClick={handleAdd} disabled={!isInRange}>
            Add Custom Order to Cart 🛒
          </button>
        </div>
      </div>
    </div>
  );
}
