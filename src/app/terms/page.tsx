import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | FullFame Services',
  description: 'Terms of Service for FullFame Services',
};

export default function TermsPage() {
  return (
    <div className="page-content" style={{ minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="guest-banner" style={{ marginBottom: 40, justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Poppins', fontWeight: 800, textAlign: 'center', margin: 0 }}>Terms of Service</h1>
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '40px' }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--gold)' }}>1. Prepaid Orders Only</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              All services require full payment in advance. We do not accept post-payment orders under any circumstances.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--gold)' }}>2. Service Delivery Variation</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              In some cases, followers delivered may be slightly higher than the ordered quantity. This will automatically settle within a few days and stabilize.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--gold)' }}>3. No Refund Policy</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              Once the order is completed, no refunds will be issued. By placing an order, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--gold)' }}>4. Public Account Requirement</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              Your Instagram account must be public during the service period. Orders placed for private accounts may be delayed or not completed.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 12, color: 'var(--gold)' }}>5. Service Safety</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.6' }}>
              Our services are designed to be safe and secure. We use methods intended to minimize risk to your Instagram account.
            </p>
          </section>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link href="/" className="btn btn-outline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
