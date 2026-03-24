'use client';
import { useState } from 'react';
import { CATEGORIES, SERVICES, estimatePrice, CartItem } from '@/lib/services-data';

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
  const minQty = isCustomOrder
    ? (SERVICES.find(s => s.category === category)?.qty || 100)
    : service!.qty;

  const qty = Number(qtyStr) || 0;
  const estimated = estimatePrice(category, qty);

  function handleAdd() {
    const item: CartItem = {
      id: `custom-${Date.now()}`,
      serviceId: isCustomOrder ? `custom-${category}` : service!.serviceId,
      name: isCustomOrder ? `Custom: ${category}` : `Custom: ${service!.name}`,
      category,
      qty: Math.max(minQty, qty),
      price: isCustomOrder ? 0 : estimated,
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
              <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setQtyStr('100'); }}>
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
              min={minQty}
              step={10}
              value={qtyStr}
              onChange={e => setQtyStr(e.target.value)}
              onBlur={() => {
                const val = Number(qtyStr);
                if (val < minQty) setQtyStr(String(minQty));
              }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Minimum: {minQty.toLocaleString('en-IN')}</span>
          </div>

          <div className="price-estimate">
            <div>
              <div className="price-estimate-label">Estimated Price</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Based on nearest package tier</div>
            </div>
            <div className="price-estimate-value">₹{estimated.toLocaleString('en-IN')}</div>
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

          <button className="btn btn-gold btn-full" onClick={handleAdd}>
            Add Custom Order to Cart 🛒
          </button>
        </div>
      </div>
    </div>
  );
}
