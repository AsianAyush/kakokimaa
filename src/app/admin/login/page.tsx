'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error || 'Login failed'); setLoading(false); return; }
    router.push('/admin/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="auth-card" style={{ maxWidth: 400 }}>
        <div className="auth-logo">
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
          <h1 className="auth-title">Admin Portal</h1>
          <p className="auth-subtitle">FullFame Services — Admin Access</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@fullfame.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Admin password" />
          </div>
          {error && <div className="form-error">⚠ {error}</div>}
          <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Logging in...</> : '🔐 Admin Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
