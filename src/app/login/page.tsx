'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Suspense } from 'react';

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); setError(''); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push(redirect);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <div className="auth-logo">
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📸</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to your FullFame account</p>
      </div>
      <form onSubmit={submit} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" placeholder="you@email.com" required value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" placeholder="Your password" required value={form.password} onChange={e => update('password', e.target.value)} />
        </div>
        {error && <div className="form-error">⚠ {error}</div>}
        <button type="submit" className="btn btn-gold btn-full" disabled={loading}>
          {loading ? <><span className="spinner" /> Logging in...</> : 'Log In'}
        </button>
      </form>
      <div className="auth-footer">
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Suspense fallback={<div style={{ textAlign: 'center' }}><span className="spinner" /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
