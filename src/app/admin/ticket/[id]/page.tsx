'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message { id: number; sender: 'customer' | 'admin'; message_text: string | null; image_url: string | null; sent_at: string; }
interface TicketItem { name: string; qty: number; price: number; category?: string; targetLink?: string; commentsText?: string; }
interface Ticket { ticket_id: string; instagram_username: string; items: TicketItem[]; total_price: number; status: string; created_at: string; payment_method?: string; users: { name: string; email: string } | null; }

export default function AdminTicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
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
      if (td.error === 'Unauthorized') { router.push('/admin/login'); return; }
      if (td.ticket) { setTicket(td.ticket); setStatus(td.ticket.status); }
      setMessages(md.messages || []);
    }).finally(() => setLoading(false));
    
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id, router, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  async function updateStatus(newVal: string) {
    if (newVal === status) return;
    setStatus(newVal);
    await fetch(`/api/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newVal }),
    });
  }

  async function sendMessage(e?: React.FormEvent, imgUrl?: string) {
    if (e) e.preventDefault();
    if (!imgUrl && !text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_text: text.trim() || undefined, image_url: imgUrl, sender: 'admin' }),
    });
    if (res.ok) { const d = await res.json(); setMessages(m => [...m, d.message]); setText(''); }
    setSending(false);
  }

  async function uploadQR(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/upload/qr', { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok && d.url) await sendMessage(undefined, d.url);
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!ticket) return <div className="page-content" style={{ background: 'var(--bg2)', minHeight: '100vh' }}><div className="container" style={{ textAlign: 'center', paddingTop: 60 }}><div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: 12 }}>🎫</div><h3>Ticket not found</h3></div></div>;

  return (
    <div className="page-content" style={{ background: 'var(--bg2)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: 1000 }}>
        <Link href="/admin/dashboard" style={{ color: 'var(--muted)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, textDecoration: 'none' }}>← Back to Dashboard</Link>
        
        <div className="grid-2" style={{ gap: 24, alignItems: 'start', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr' }}>
          
          {/* Left col: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Poppins', fontSize: '1.25rem', fontWeight: 800 }}>#{ticket.ticket_id}</h2>
                <select 
                  value={status} 
                  onChange={e => updateStatus(e.target.value)}
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', background: 'var(--bg4)', borderColor: 'var(--gold)', color: 'var(--gold)', fontWeight: 600, borderRadius: 20 }}
                >
                  <option value="pending">🟡 Pending</option>
                  <option value="in_progress">🔵 In Progress</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">🚫 Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>Customer</div>
                  <div style={{ fontWeight: 600 }}>{ticket.users?.name || 'Unknown'} <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>({ticket.users?.email})</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 2 }}>Target Instagram Account</div>
                  <div style={{ color: 'var(--info)', fontWeight: 600, fontSize: '1.1rem' }}>@{ticket.instagram_username}</div>
                  <a href={`https://instagram.com/${ticket.instagram_username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', display: 'inline-block', marginTop: 4 }}>View Profile ↗</a>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Poppins', fontSize: '1rem', margin: 0 }}>🛒 Order summary</h3>
                {ticket.payment_method && (
                  <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: ticket.payment_method === 'crypto' ? 'rgba(39,174,96,0.15)' : 'rgba(212,175,55,0.15)', color: ticket.payment_method === 'crypto' ? '#27ae60' : 'var(--gold)', border: `1px solid ${ticket.payment_method === 'crypto' ? 'rgba(39,174,96,0.4)' : 'rgba(212,175,55,0.4)'}`, fontWeight: 600 }}>
                    {ticket.payment_method === 'crypto' ? '₮ Crypto (USDT BEP20)' : '🇮🇳 UPI'}
                  </span>
                )}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {ticket.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div>{item.name}</div>
                        {item.targetLink && (
                          <a href={item.targetLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--info)', wordBreak: 'break-all', display: 'block', marginTop: 3 }}>
                            🔗 {item.targetLink}
                          </a>
                        )}
                        {item.commentsText && (
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([item.commentsText!], { type: 'text/plain' });
                              const a = document.createElement('a');
                              a.href = URL.createObjectURL(blob);
                              a.download = `comments-${ticket.ticket_id}-${item.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
                              a.click();
                              URL.revokeObjectURL(a.href);
                            }}
                            style={{ marginTop: 5, fontSize: '0.72rem', padding: '2px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.12)', color: 'var(--gold)', border: '1px solid var(--gold)', cursor: 'pointer' }}
                          >
                            📥 Download Comments (.txt)
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--muted)' }}>{item.qty?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: 'var(--white)' }}>₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ padding: '12px 0 0', fontWeight: 700, color: 'var(--muted)' }}>Total</td>
                    <td style={{ padding: '12px 0 0', textAlign: 'right', fontFamily: 'Poppins', fontWeight: 800, color: 'var(--gold)', fontSize: '1.2rem' }}>₹{ticket.total_price}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right col: Chat */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
            <h3 style={{ fontFamily: 'Poppins', fontSize: '1rem', marginBottom: 16 }}>💬 Chat & Support</h3>
            
            <div ref={chatRef} className="chat-container" style={{ flex: 1, maxHeight: 'none', background: 'var(--bg)' }}>
              {messages.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 40 }}>No messages yet.</div>}
              {messages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.sender === 'admin' ? 'customer' : 'admin'}`}>
                  <div className="chat-sender">{msg.sender === 'admin' ? 'You (Admin)' : ticket.users?.name?.split(' ')[0] || 'Customer'}</div>
                  <div className="chat-bubble">
                    {msg.message_text && <div>{msg.message_text}</div>}
                    {msg.image_url && <img src={msg.image_url} alt="Image" style={{ maxWidth: 220, borderRadius: 10, marginTop: msg.message_text ? 8 : 0 }} />}
                  </div>
                  <div className="chat-time">{new Date(msg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input type="text" placeholder="Type message to customer..." value={text} onChange={e => setText(e.target.value)} />
                <button type="submit" className="btn btn-gold" disabled={sending || !text.trim()}>
                  {sending ? <span className="spinner" /> : 'Send'}
                </button>
              </form>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="file" accept="image/*" ref={fileRef} onChange={uploadQR} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm" disabled={uploading} style={{ width: '100%' }}>
                  {uploading ? 'Uploading...' : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><img src="/logo.png" alt="Logo" style={{ width: 18, height: 18, objectFit: 'contain' }} /> Upload Payment QR Code</span>}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
