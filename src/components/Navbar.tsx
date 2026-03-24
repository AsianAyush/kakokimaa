'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UserInfo { name: string; email: string; role?: string; unreadCount?: number; }

export default function Navbar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [prevUnread, setPrevUnread] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const checkNotifications = useCallback((count: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted' && count > prevUnread) {
      new Notification('FullFame Services', {
        body: `You have ${count} unread message${count > 1 ? 's' : ''}!`,
        icon: '/logo.png'
      });
    }
    setPrevUnread(count);
  }, [prevUnread]);

  const fetchUser = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me');
      const d = r.ok ? await r.json() : null;
      if (d?.user) {
        setUser(d.user);
        if (d.user.unreadCount !== undefined) {
          checkNotifications(d.user.unreadCount);
        }
      } else {
        setUser(null);
      }
    } catch { /* ignore */ }
  }, [checkNotifications]);

  const refreshCart = useCallback(() => {
    try {
      const raw = localStorage.getItem('ff_cart');
      const items = raw ? JSON.parse(raw) : [];
      setCartCount(Array.isArray(items) ? items.length : 0);
    } catch { setCartCount(0); }
  }, []);

  useEffect(() => {
    fetchUser();
    refreshCart();

    const poll = setInterval(fetchUser, 10000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const onStorage = (e: StorageEvent) => { if (e.key === 'ff_cart') refreshCart(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('ff_cart_update', refreshCart);
    return () => {
      clearInterval(poll);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ff_cart_update', refreshCart);
    };
  }, [refreshCart, fetchUser]);

  useEffect(() => {
    refreshCart();
    fetchUser();
    setMenuOpen(false); // close drawer on route change
  }, [pathname, refreshCart, fetchUser]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  if (pathname.startsWith('/admin')) return null;

  const navLinks = (
    <>
      <Link href="/" className={`nav-link${pathname === '/' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Services</Link>
      <Link href="/contact" className={`nav-link${pathname === '/contact' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Contact</Link>
      <Link href="/terms" className={`nav-link${pathname === '/terms' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Terms</Link>
      <Link href="/cart" className="nav-cart-btn" onClick={() => setMenuOpen(false)}>
        🛒 Cart
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </Link>
      {user ? (
        <>
          <Link href="/dashboard" className={`nav-link${pathname === '/dashboard' ? ' active' : ''}`} style={{ position: 'relative' }} onClick={() => setMenuOpen(false)}>
            {user.role === 'admin' ? 'Admin Dashboard' : 'Your Orders'}
            {user.unreadCount ? <span className="cart-count" style={{ background: 'var(--danger)', color: 'white', right: -10 }}>{user.unreadCount}</span> : null}
          </Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
        </>
      ) : (
        <>
          <Link href="/login" className={`nav-link${pathname === '/login' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Login</Link>
          <Link href="/signup" className="btn btn-gold btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="navbar">
      <div className="container" style={{ width: '100%' }}>
        {/* Main row */}
        <div className="nav-inner">
          <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <span style={{ fontSize: '1.3rem' }}>FullFame<span style={{ color: 'var(--gold)' }}> Services</span></span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            {navLinks}
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`}>
          {navLinks}
        </div>
      </div>
    </nav>
  );
}
