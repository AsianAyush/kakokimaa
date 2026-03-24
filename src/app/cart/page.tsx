'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CartItem } from '@/lib/services-data';

interface UserInfo { name: string; email: string; }
interface IgProfile { username: string; full_name: string; profile_pic_url: string; is_verified: boolean; }

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [instagram, setInstagram] = useState('');
  const [likesLink, setLikesLink] = useState('');
  const [viewsLink, setViewsLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Instagram search state
  const [igResults, setIgResults] = useState<IgProfile[]>([]);
  const [igSearching, setIgSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const loadCart = useCallback(() => {
    try {
      const raw = localStorage.getItem('ff_cart');
      setCart(raw ? JSON.parse(raw) : []);
    } catch { setCart([]); }
  }, []);

  useEffect(() => {
    loadCart();
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, [loadCart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Live Instagram search
  function handleIgInput(val: string) {
    setInstagram(val);
    const clean = val.trim().replace('@', '');
    if (!clean) { setIgResults([]); setShowDropdown(false); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setIgSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/instagram-search?q=${encodeURIComponent(clean)}`);
        if (res.ok) {
          const d = await res.json();
          setIgResults(d.results || []);
          setShowDropdown((d.results || []).length > 0);
        }
      } catch { /* ignore */ }
      setIgSearching(false);
    }, 400);
  }

  function selectProfile(username: string) {
    setInstagram(username);
    setShowDropdown(false);
    setIgResults([]);
  }

  function removeItem(id: string) {
    const newCart = cart.filter(i => i.id !== id);
    setCart(newCart);
    localStorage.setItem('ff_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('ff_cart_update'));
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);
  const hasLikes = cart.some(i => i.category === 'Likes');
  const hasViews = cart.some(i => i.category === 'Views');

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push(`/login?redirect=/cart`); return; }
    if (!instagram.trim()) { setError('Please enter your Instagram username'); return; }
    if (cart.length === 0) { setError('Your cart is empty'); return; }
    if (hasLikes && !likesLink.trim()) { setError('Please enter a Reel/Post link for your Likes order'); return; }
    if (hasViews && !viewsLink.trim()) { setError('Please enter a Reel/Post link for your Views order'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagram_username: instagram.trim().replace('@', ''),
          items: cart,
          total_price: total,
          likes_link: likesLink.trim() || undefined,
          views_link: viewsLink.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to place order'); return; }
      // Clear cart
      localStorage.setItem('ff_cart', '[]');
      window.dispatchEvent(new Event('ff_cart_update'));
      setCart([]);
      setSuccess(data.ticket_id);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ marginBottom: 12 }}>Order Placed!</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 8 }}>Your Ticket ID is</p>
          <div style={{ fontFamily: 'Poppins', fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>#{success}</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.6 }}>
            Visit your dashboard to track your order and chat with us.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard" className="btn btn-gold btn-full">Go to Dashboard</Link>
            <Link href="/" className="btn btn-ghost btn-full">Browse More</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 860 }}>
        <h1 className="section-title" style={{ marginBottom: 28 }}>Your <span>Cart</span></h1>

        {/* Guest banner */}
        {!user && (
          <div className="guest-banner">
            <p><span>⚠ Please log in</span> to place your order. Your cart items will be saved.</p>
            <Link href="/login?redirect=/cart" className="btn btn-gold btn-sm">Log In</Link>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <div className="empty-title">Your cart is empty</div>
              <div className="empty-sub">Add some services to get started</div>
              <Link href="/" className="btn btn-gold btn-sm" style={{ marginTop: 8 }}>Browse Services</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {/* Cart items */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th style={{ width: 48 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--white)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.category}{item.note ? ` · ${item.note}` : ''}</div>
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{item.qty.toLocaleString('en-IN')}</td>
                      <td><strong style={{ color: 'var(--gold)', fontFamily: 'Poppins', fontWeight: 700 }}>₹{item.price}</strong></td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)} style={{ padding: '6px 10px' }}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order form + total */}
            <form onSubmit={checkout}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Instagram username with live search */}
                <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
                  <label className="form-label">Instagram Username <span style={{ color: 'var(--gold)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="@yourusername"
                      value={instagram}
                      onChange={e => handleIgInput(e.target.value)}
                      onFocus={() => igResults.length > 0 && setShowDropdown(true)}
                      autoComplete="off"
                      required
                    />
                    {igSearching && (
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
                        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      </span>
                    )}
                  </div>

                  {/* Search results dropdown */}
                  {showDropdown && igResults.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 50,
                      background: 'var(--bg3)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow)',
                      overflow: 'hidden',
                      marginTop: 4,
                    }}>
                      {igResults.map(profile => (
                        <button
                          key={profile.username}
                          type="button"
                          onClick={() => selectProfile(profile.username)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <img
                            src={profile.profile_pic_url}
                            alt={profile.username}
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.username}&background=222&color=fff&size=40`; }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              {profile.username}
                              {profile.is_verified && <span style={{ color: 'var(--info)', fontSize: '0.75rem' }}>✓</span>}
                            </div>
                            {profile.full_name && <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{profile.full_name}</div>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {hasLikes && (
                  <div className="form-group">
                    <label className="form-label">Reel/Post Link for Likes <span style={{ color: 'var(--gold)' }}>*</span></label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/p/..."
                      value={likesLink}
                      onChange={e => setLikesLink(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Reminder: We need this link to deliver your likes!</span>
                  </div>
                )}

                {hasViews && (
                  <div className="form-group">
                    <label className="form-label">Reel/Post Link for Views <span style={{ color: 'var(--gold)' }}>*</span></label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/reel/..."
                      value={viewsLink}
                      onChange={e => setViewsLink(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Reminder: We need this link to deliver your views!</span>
                  </div>
                )}

                <div className="divider" style={{ margin: '4px 0' }} />

                <div className="cart-total">
                  <span className="cart-total-label">Order Total</span>
                  <span className="cart-total-value">₹{total.toLocaleString('en-IN')}</span>
                </div>

                {error && <div className="form-error">⚠ {error}</div>}

                <button type="submit" className="btn btn-gold btn-full btn-lg" disabled={loading}>
                  {loading ? <><span className="spinner" /> Placing Order...</> : '✓ Place Order & Get Support Ticket'}
                </button>

                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
                  💬 After ordering, we&apos;ll send payment details via your support ticket.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
