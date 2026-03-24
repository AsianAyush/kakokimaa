'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Ticket {
  ticket_id: string;
  instagram_username: string;
  items: { name: string; qty: number; price: number }[];
  total_price: number;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  users: { name: string; email: string } | null;
}

interface Stats { total: number; pending: number; in_progress: number; completed: number; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: '🟡 Pending', in_progress: '🔵 In Progress', completed: '✅ Completed' };
  return <span className={`badge badge-${status}`}>{map[status] || status}</span>;
}

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/tickets?status=${filter}&search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const d = await res.json();
        setTickets(d.tickets || []);
        if (d.stats && filter === 'all' && search === '') setStats(d.stats);
      } else {
        if (res.status === 401) router.push('/admin/login');
      }
      setLoading(false);
    }
    const delay = setTimeout(load, 300); // debounce search
    return () => clearTimeout(delay);
  }, [filter, search, router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="page-content" style={{ background: 'var(--bg2)', minHeight: '100vh' }}>
      <div className="navbar" style={{ position: 'static', marginBottom: 32, background: 'var(--card)' }}>
        <div className="container nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon">👑</div>
            <span>Admin<span style={{ color: 'var(--muted)' }}>Portal</span></span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/admin/team" className="btn btn-outline btn-sm">Team</Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
          </div>
        </div>
      </div>

      <div className="container">
        {stats && (
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value pending">{stats.pending}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">In Progress</div>
              <div className="stat-value in_progress">{stats.in_progress}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value completed">{stats.completed}</div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div className="filter-tabs">
              {['all', 'pending', 'in_progress', 'completed'].map(f => (
                <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All Orders' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search ID, name, or @username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', maxWidth: 300 }}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading && tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No tickets found.</div>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Instagram</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.ticket_id} onClick={() => router.push(`/admin/ticket/${t.ticket_id}`)}>
                      <td className="ticket-id-cell">#{t.ticket_id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.users?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.users?.email}</div>
                      </td>
                      <td style={{ color: 'var(--info)' }}>@{t.instagram_username}</td>
                      <td><strong style={{ color: 'var(--gold)', fontFamily: 'Poppins', fontWeight: 700 }}>₹{t.total_price}</strong></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
