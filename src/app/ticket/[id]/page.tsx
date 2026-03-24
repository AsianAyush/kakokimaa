'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Message { id: number; sender: 'customer' | 'admin'; message_text: string | null; image_url: string | null; sent_at: string; }
interface Ticket { ticket_id: string; instagram_username: string; items: { name: string; qty: number; price: number }[]; total_price: number; status: string; created_at: string; users: { name: string; email: string } | null; }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { pending: '🟡 Pending', in_progress: '🔵 In Progress', completed: '✅ Completed' };
  return <span className={`badge badge-${status}`}>{map[status] || status}</span>;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const SEND_COOLDOWN_MS = 5000; // 5 seconds

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [spamError, setSpamError] = useState('');
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const lastSentRef = useRef<number>(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); };

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/tickets/${id}/messages`);
    if (res.ok) { const d = await res.json(); setMessages(d.messages || []); }
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/tickets/${id}`).then(r => r.json()),
      fetch(`/api/tickets/${id}/messages`).then(r => r.json()),
    ]).then(([td, md]) => {
      setTicket(td.ticket || null);
      setMessages(md.messages || []);
    }).finally(() => setLoading(false));
    // Poll every 5s
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Cooldown ticker
  function startCooldown() {
    lastSentRef.current = Date.now();
    setCooldown(5);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSentRef.current) / 1000);
      const remaining = Math.max(0, 5 - elapsed);
      setCooldown(remaining);
      if (remaining === 0 && cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
        setSpamError('');
      }
    }, 250);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;

    // Anti-spam check
    if (Date.now() - lastSentRef.current < SEND_COOLDOWN_MS) {
      setSpamError(`Please wait ${cooldown}s before sending another message.`);
      return;
    }
    setSpamError('');

    setSending(true);
    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_text: text.trim(), sender: 'customer' }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages(m => [...m, d.message]);
      setText('');
      startCooldown();
    }
    setSending(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check — 3MB limit
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 3MB.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    // Anti-spam check for uploads too
    if (Date.now() - lastSentRef.current < SEND_COOLDOWN_MS) {
      setUploadError(`Please wait ${cooldown}s before sending again.`);
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/qr', { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok && d.url) {
        const msgRes = await fetch(`/api/tickets/${id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: d.url, sender: 'customer' }),
        });
        if (msgRes.ok) {
          const md = await msgRes.json();
          setMessages(m => [...m, md.message]);
          startCooldown();
        }
      } else {
        setUploadError(d.error || 'Upload failed. Please try again.');
      }
    } catch {
      setUploadError('Upload failed. Please check your connection.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const isCompleted = ticket?.status === 'completed';
  const isSendDisabled = sending || !text.trim() || cooldown > 0 || isCompleted;

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;

  if (!ticket) return <div className="page-content"><div className="container"><div className="empty-state"><div className="empty-icon">🎫</div><div className="empty-title">Ticket not found</div><Link href="/dashboard" className="btn btn-gold btn-sm">Back to Dashboard</Link></div></div></div>;

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 760 }}>
        {/* Back + header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ color: 'var(--muted)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, textDecoration: 'none' }}>← Back to Dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: 'Poppins', fontSize: '1.4rem', fontWeight: 800 }}>#{ticket.ticket_id}</h1>
              <div style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 4 }}>@{ticket.instagram_username} · {new Date(ticket.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        {/* Order summary */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Poppins', fontSize: '1rem', marginBottom: 14 }}>🛍 Order Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              {(ticket.items as { name: string; qty: number; price: number }[]).map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 0' }}>{item.name}</td>
                  <td style={{ padding: '10px 0', color: 'var(--muted)' }}>{item.qty?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>₹{item.price}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ padding: '12px 0 0', fontWeight: 700 }}>Total</td>
                <td style={{ padding: '12px 0 0', textAlign: 'right', fontFamily: 'Poppins', fontWeight: 800, color: 'var(--gold)', fontSize: '1.1rem' }}>₹{ticket.total_price}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Instructions — only show when not completed */}
        {!isCompleted && (
          <div style={{ background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 16, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            💡 Once you receive the payment details from us, make the payment and send us the screenshot here. We&apos;ll process your order immediately after confirmation.
          </div>
        )}

        {/* Chat */}
        <div ref={chatRef} className="chat-container">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem', padding: '40px 0' }}>No messages yet.</div>
          ) : null}
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message ${msg.sender}`}>
              <div className="chat-sender">{msg.sender === 'admin' ? '⚡ FullFame Support' : (ticket.users?.name || 'You')}</div>
              <div className="chat-bubble">
                {msg.message_text && <div>{msg.message_text}</div>}
                {msg.image_url && (
                  <div>
                    <img src={msg.image_url} alt="Image" style={{ maxWidth: 220, borderRadius: 10, marginTop: msg.message_text ? 10 : 0 }} />
                  </div>
                )}
              </div>
              <div className="chat-time">{new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>

        {/* Ticket closed banner */}
        {isCompleted ? (
          <div style={{
            marginTop: 12,
            padding: '16px 20px',
            background: 'rgba(0,194,107,0.08)',
            border: '1px solid rgba(0,194,107,0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success)',
            fontSize: '0.9rem',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            ✅ This ticket is closed. Your order has been completed. Thank you for choosing FullFame!
          </div>
        ) : (
          /* Message input area */
          <div style={{ marginTop: 12 }}>
            {/* Upload + spam errors */}
            {(uploadError || spamError) && (
              <div className="form-error" style={{ marginBottom: 8 }}>⚠ {uploadError || spamError}</div>
            )}

            {/* Cooldown warning */}
            {cooldown > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                ⏱ You can send another message in {cooldown}s
              </div>
            )}

            <form onSubmit={sendMessage} className="chat-input-area">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                disabled={isCompleted}
              />
              {/* File upload button */}
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || cooldown > 0}
                title="Upload image (max 3MB)"
                style={{ padding: '12px 14px', flexShrink: 0 }}
              >
                {uploading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '📎'}
              </button>
              <button type="submit" className="btn btn-gold" disabled={isSendDisabled}>
                {sending ? <span className="spinner" /> : cooldown > 0 ? `${cooldown}s` : '→ Send'}
              </button>
            </form>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6, textAlign: 'right' }}>
              📎 Max 3MB · 1 message per 5 seconds
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
