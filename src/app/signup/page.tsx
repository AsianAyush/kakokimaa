'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      router.push('/dashboard');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📸</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join FullFame Services today</p>
        </div>
        
        <form onSubmit={submitDetails} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" placeholder="Unique username" required value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" placeholder="you@email.com" required value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" placeholder="Min. 6 characters" required value={form.password} onChange={e => update('password', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" placeholder="Re-enter password" required value={form.confirm} onChange={e => update('confirm', e.target.value)} />
          </div>
          {error && <div className="form-error">⚠ {error}</div>}
          <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
