'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface UserInfo { id: number; name: string; email: string; }
interface Ticket {
  ticket_id: string;
  instagram_username: string;
  items: { name: string; qty: number; price: number }[];
  total_price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  has_unread_user: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; emoji: string }> = {
    pending: { label: 'Pending', emoji: '🟡' },
    in_progress: { label: 'In Progress', emoji: '🔵' },
    completed: { label: 'Completed', emoji: '✅' },
    cancelled: { label: 'Cancelled', emoji: '🚫' },
  };
  const s = map[status] || { label: status, emoji: '⚪' };
  return <span className={`badge badge-${status}`}>{s.emoji} {s.label}</span>;
}

function NotificationBanner({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
      border: '1px solid rgba(212,175,55,0.3)',
      borderRadius: 12,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      marginBottom: 20,
    }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
        🔔 Enable notifications to get instant updates on your orders.
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          id="btn-enable-notifications"
          className="btn btn-gold btn-sm"
          onClick={onEnable}
        >
          Enable Notifications
        </button>
        <button
          id="btn-dismiss-notifications"
          className="btn btn-ghost btn-sm"
          onClick={onDismiss}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const router = useRouter();
  const { permission, showBanner, subscribe, dismissBanner } = usePushNotifications();

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json()),
    ]).then(([meData, ticketData]) => {
      if (meData.user) setUser(meData.user);
      else router.push('/login');
      if (ticketData.tickets) setTickets(ticketData.tickets);
    }).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function cancelOrder(ticketId: string) {
    if (!confirm(`Cancel order #${ticketId}? This cannot be undone.`)) return;
    setCancelling(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        setTickets(prev => prev.map(t => t.ticket_id === ticketId ? { ...t, status: 'cancelled' } : t));
        showToast('Order cancelled successfully.');
      } else {
        showToast(d.error || 'Failed to cancel order.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}><span>{toast.type === 'success' ? '✓' : '✕'}</span>{toast.msg}</div>
        </div>
      )}

      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-badge">⚡ Customer Portal</div>
          <h1 className="dashboard-name">Welcome back, <span>{user?.name?.split(' ')[0] || 'there'}</span>!</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>{user?.email}</p>
        </div>

        {/* Notification Banner */}
        {showBanner && (
          <NotificationBanner onEnable={subscribe} onDismiss={dismissBanner} />
        )}

        {/* Notification blocked note */}
        {permission === 'denied' && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: '0.85rem',
            color: 'var(--muted)',
            marginBottom: 20,
          }}>
            🔕 Notifications are blocked. Enable them in your browser settings to get order updates.
          </div>
        )}

        <div className="grid-2" style={{ gap: 32, alignItems: 'flex-start' }}>
          {/* Profile card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontFamily: 'Poppins', marginBottom: 4 }}>👤 Profile</h3>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>Full Name</div>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>Email</div>
              <div style={{ fontWeight: 600 }}>{user?.email}</div>
            </div>
            <div className="divider" />
            <h4 style={{ fontFamily: 'Poppins', fontSize: '0.95rem' }}>Change Password</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="password" placeholder="Current password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
              <input type="password" placeholder="New password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
              <input type="password" placeholder="Confirm new password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
              {pwMsg && <div style={{ fontSize: '0.85rem', color: pwMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)' }}>{pwMsg}</div>}
              <button
                className="btn btn-outline btn-sm"
                onClick={async () => {
                  if (pwForm.newPw !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
                  const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
                  });
                  const d = await res.json();
                  setPwMsg(res.ok ? '✓ Password updated!' : ('⚠ ' + d.error));
                  if (res.ok) setPwForm({ current: '', newPw: '', confirm: '' });
                }}
              >
                Update Password
              </button>
            </div>
          </div>

          {/* Orders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: 'Poppins' }}>📋 My Orders</h3>
              <Link href="/" className="btn btn-gold btn-sm">+ New Order</Link>
            </div>

            {tickets.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No orders yet</div>
                  <div className="empty-sub">Browse our services and place your first order!</div>
                  <Link href="/" className="btn btn-gold btn-sm" style={{ marginTop: 8 }}>Browse Services</Link>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop: table view */}
                <div className="card orders-table-wrap" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="tickets-table" style={{ minWidth: 580 }}>
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Services</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.ticket_id} style={{ position: 'relative' }}>
                          <td className="ticket-id-cell" style={{ cursor: 'pointer' }} onClick={() => router.push(`/ticket/${t.ticket_id}`)}>
                            #{t.ticket_id}
                            {t.has_unread_user && <span className="unread-dot" title="New message" />}
                          </td>
                          <td style={{ color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => router.push(`/ticket/${t.ticket_id}`)}>
                            {(t.items as { name: string }[]).map(i => i.name).join(', ').slice(0, 38)}{t.items.length > 1 ? '…' : ''}
                          </td>
                          <td onClick={() => router.push(`/ticket/${t.ticket_id}`)} style={{ cursor: 'pointer' }}><strong style={{ color: 'var(--gold)', fontFamily: 'Poppins', fontWeight: 700 }}>₹{t.total_price}</strong></td>
                          <td onClick={() => router.push(`/ticket/${t.ticket_id}`)} style={{ cursor: 'pointer' }}><StatusBadge status={t.status} /></td>
                          <td style={{ color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => router.push(`/ticket/${t.ticket_id}`)}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                          <td>
                            {t.status === 'pending' && (
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={cancelling === t.ticket_id}
                                onClick={() => cancelOrder(t.ticket_id)}
                                style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}
                              >
                                {cancelling === t.ticket_id ? '…' : '🚫 Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: card view */}
                <div className="orders-card-list">
                  {tickets.map(t => (
                    <div key={t.ticket_id} className="order-card">
                      <div className="order-card-header">
                        <span className="order-card-id" style={{ position: 'relative' }}>
                          #{t.ticket_id}
                          {t.has_unread_user && <span className="unread-dot" title="New message" style={{ left: -12 }} />}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="order-card-row">
                        <span className="order-card-label">Services</span>
                        <span className="order-card-value" style={{ fontSize: '0.8rem', maxWidth: '60%', textAlign: 'right' }}>
                          {(t.items as { name: string }[]).map(i => i.name).join(', ').slice(0, 40)}{t.items.length > 1 ? '…' : ''}
                        </span>
                      </div>
                      <div className="order-card-row">
                        <span className="order-card-label">Total</span>
                        <span style={{ fontFamily: 'Poppins', fontWeight: 700, color: 'var(--gold)' }}>₹{t.total_price}</span>
                      </div>
                      <div className="order-card-row">
                        <span className="order-card-label">Date</span>
                        <span className="order-card-value">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => router.push(`/ticket/${t.ticket_id}`)}
                        >
                          View Details
                        </button>
                        {t.status === 'pending' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={cancelling === t.ticket_id}
                            onClick={() => cancelOrder(t.ticket_id)}
                            style={{ flex: 1 }}
                          >
                            {cancelling === t.ticket_id ? 'Cancelling…' : '🚫 Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
