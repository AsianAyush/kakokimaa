'use client';
import { useState, useEffect, useCallback } from 'react';
import { SERVICES, CATEGORIES, CATEGORY_ICONS, CATEGORY_DESCRIPTIONS, estimatePrice, CartItem } from '@/lib/services-data';
import CustomizeModal from '@/components/CustomizeModal';

function addToCart(item: CartItem) {
  try {
    const raw = localStorage.getItem('ff_cart');
    const cart: CartItem[] = raw ? JSON.parse(raw) : [];
    cart.push(item);
    localStorage.setItem('ff_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('ff_cart_update'));
  } catch { /* ignore */ }
}

export default function HomePage() {
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [customizeItem, setCustomizeItem] = useState<{ serviceId: string; name: string; category: string; qty: number; price: number } | null>(null);
  const [showCustomOrder, setShowCustomOrder] = useState(false);
  const [typedLine1, setTypedLine1] = useState(false);

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  function handleAddToCart(svcId: string) {
    const svc = SERVICES.find(s => s.id === svcId);
    if (!svc) return;
    const item: CartItem = {
      id: `${svc.id}-${Date.now()}`,
      serviceId: svc.id,
      name: svc.name,
      category: svc.category,
      qty: svc.qty,
      price: svc.price,
    };
    addToCart(item);
    showToast(`${svc.name} added to cart! 🛒`);
  }

  function handleCustomizeOpen(svcId: string) {
    const svc = SERVICES.find(s => s.id === svcId);
    if (!svc) return;
    setCustomizeItem({ serviceId: svc.id, name: svc.name, category: svc.category, qty: svc.qty, price: svc.price });
  }

  function handleCustomized(item: CartItem) {
    addToCart(item);
    setCustomizeItem(null);
    showToast(`Custom order added to cart! 🛒`);
  }

  function handleCustomOrder(item: CartItem) {
    addToCart(item);
    setShowCustomOrder(false);
    showToast(`Custom order added to cart! 🛒`);
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}><span>✓</span>{toast.msg}</div>
        </div>
      )}

      {/* Hero */}
      <section className="hero" style={{ position: 'relative' }}>
        <img src="/logo.png" alt="" className="hero-bg-logo" />
        <div className="container" style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="hero-badge">⚡ Premium Instagram Growth</div>
          <h1 className="hero-title hero-text-anim">
            <div className={`hero-typewriter-wrapper ${typedLine1 ? 'typewriter-ready' : ''}`}>
              <div className="typewriter-line1" onAnimationEnd={() => setTypedLine1(true)}>
                Grow Your <span className="gold">Fame</span>,
              </div>
              <div className="typewriter-line2">
                One Click at a Time
              </div>
            </div>
          </h1>
          <a href="#services" className="btn btn-gold btn-lg" style={{ marginTop: '50px' }}>Browse Services</a>
        </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="page-content">
        <div className="container">
          {CATEGORIES.map(cat => {
            const catServices = SERVICES.filter(s => s.category === cat);
            const isPremium = cat === 'Followers — Premium';
            const isBudget = cat === 'Followers — Non Premium';

            return (
              <div key={cat} className="category-section">
                <div className="category-header">
                  <div className="category-title">
                    <span className="category-icon">{CATEGORY_ICONS[cat]}</span>
                    {cat}
                    {isPremium && <span className="badge badge-premium">👑 Premium</span>}
                    {isBudget && <span className="badge badge-budget">💰 Budget Pick</span>}
                  </div>
                  <p className="category-desc">{CATEGORY_DESCRIPTIONS[cat]}</p>
                </div>

                <div className="service-grid">
                  {catServices.map((svc, index) => (
                    <div key={svc.id} className={`service-card${isPremium ? ' premium' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                      {isPremium && <div className="service-card-image-strip" />}
                      <div>
                        {isBudget && <span className="badge badge-budget" style={{ marginBottom: 8, display: 'inline-flex' }}>💰 Budget Pick</span>}
                        {isPremium && <span className="badge badge-premium" style={{ marginBottom: 8, display: 'inline-flex' }}>👑 Premium</span>}
                        <div className="service-name">{svc.name}</div>
                        <div className="service-qty">{svc.qtyLabel} {cat.includes('Views') ? 'Views' : cat.includes('Likes') ? 'Likes' : 'Followers'}</div>
                      </div>
                      <div className="service-price">
                        ₹{svc.price} <small>/ order</small>
                      </div>
                      <div className="service-actions">
                        <button
                          className="btn btn-gold btn-sm"
                          onClick={() => handleAddToCart(svc.id)}
                        >
                          + Add
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCustomizeOpen(svc.id)}
                        >
                          Customize
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom Order Card */}
          <div className="category-section">
            <div style={{ background: 'var(--card)', border: '1.5px dashed var(--border)', borderRadius: 'var(--radius)', padding: '36px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>✨</div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Custom Order</h3>
              <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: '0.9rem' }}>
                Need something specific? Build a custom package tailored to your exact needs.
              </p>
              <button className="btn btn-outline" onClick={() => setShowCustomOrder(true)}>
                Build Custom Order
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Customize Modal */}
      {customizeItem && (
        <CustomizeModal
          service={customizeItem}
          onClose={() => setCustomizeItem(null)}
          onAdd={handleCustomized}
        />
      )}

      {/* Custom Order Modal */}
      {showCustomOrder && (
        <CustomizeModal
          service={null}
          onClose={() => setShowCustomOrder(false)}
          onAdd={handleCustomOrder}
        />
      )}
    </>
  );
}
