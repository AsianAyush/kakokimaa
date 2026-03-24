'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserInfo { id: number; name: string; email: string; }
interface Ticket {
  ticket_id: string;
  instagram_username: string;
  items: { name: string; qty: number; price: number }[];
  total_price: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  has_unread_user: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; emoji: string }> = {
    pending: { label: 'Pending', emoji: '🟡' },
    in_progress: { label: 'In Progress', emoji: '🔵' },
    completed: { label: 'Completed', emoji: '✅' },
  };
  const s = map[status] || { label: status, emoji: '⚪' };
  return <span className={`badge badge-${status}`}>{s.emoji} {s.label}</span>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json()),
    ]).then(([meData, ticketData]) => {
      if (meData.user) setUser(meData.user);
      if (ticketData.tickets) setTickets(ticketData.tickets);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-badge">⚡ Customer Portal</div>
          <h1 className="dashboard-name">Welcome back, <span>{user?.name?.split(' ')[0] || 'there'}</span>!</h1>
          <p style={{ color: 'var(--muted)', marginTop: 6 }}>{user?.email}</p>
        </div>

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
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="tickets-table" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Services</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.ticket_id} onClick={() => router.push(`/ticket/${t.ticket_id}`)} style={{ position: 'relative' }}>
                        <td className="ticket-id-cell">
                          #{t.ticket_id}
                          {t.has_unread_user && <span className="unread-dot" title="New message" />}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                          {(t.items as { name: string }[]).map((i: { name: string }) => i.name).join(', ').slice(0, 40)}{(t.items as { name: string }[]).length > 1 ? '...' : ''}
                        </td>
                        <td><strong style={{ color: 'var(--gold)', fontFamily: 'Poppins', fontWeight: 700 }}>₹{t.total_price}</strong></td>
                        <td><StatusBadge status={t.status} /></td>
                        <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
