'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  instagram_username: string;
  profile_link?: string;
  image_url: string | null;
  sort_order: number;
}

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', role: '', instagram_username: '', profile_link: '', image_url: '', sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  async function load() {
    setLoading(true);
    const res = await fetch('/api/team');
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members || []);
    } else if (res.status === 401) {
      router.push('/admin/login');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingId(null);
    setFormData({ name: '', role: '', instagram_username: '', profile_link: '', image_url: '', sort_order: members.length + 1 });
    setErrorMsg('');
    setIsModalOpen(true);
  }

  function openEdit(m: TeamMember) {
    setEditingId(m.id);
    setFormData({ name: m.name, role: m.role, instagram_username: m.instagram_username, profile_link: m.profile_link || '', image_url: m.image_url || '', sort_order: m.sort_order });
    setErrorMsg('');
    setIsModalOpen(true);
  }

  async function save() {
    setErrorMsg('');
    if (!formData.name || !formData.role || !formData.instagram_username) {
      return setErrorMsg('Name, Role, and Instagram Username are required.');
    }
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/team/${editingId}` : '/api/admin/team';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      load();
    } else {
      const d = await res.json();
      setErrorMsg(d.error || 'Failed to save');
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    const res = await fetch(`/api/admin/team/${id}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert('Failed to delete.');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    
    const res = await fetch('/api/admin/team/upload', {
      method: 'POST',
      body: fd
    });
    
    if (res.ok) {
      const d = await res.json();
      setFormData(prev => ({ ...prev, image_url: d.url }));
    } else {
      alert('Upload failed');
    }
    setUploading(false);
  }

  return (
    <div className="page-content" style={{ background: 'var(--bg2)', minHeight: '100vh' }}>
      <div className="navbar" style={{ position: 'static', marginBottom: 32, background: 'var(--card)' }}>
        <div className="container nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon">👑</div>
            <span>Team<span style={{ color: 'var(--muted)' }}>Management</span></span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/admin/dashboard" className="btn btn-ghost btn-sm">Back to Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Members</h1>
          <button onClick={openAdd} className="btn btn-gold">+ Add Member</button>
        </div>

        <div className="card" style={{ padding: 24 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
          ) : members.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No team members found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tickets-table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Photo</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Instagram</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.image_url ? (
                        <img src={m.image_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>NA</div>
                      )}
                    </td>
                    <td><div style={{ fontWeight: 600 }}>{m.name}</div></td>
                    <td><div className="badge badge-premium">{m.role}</div></td>
                    <td style={{ color: 'var(--info)' }}>@{m.instagram_username}</td>
                    <td style={{ color: 'var(--muted)' }}>{m.sort_order}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(m)} className="btn btn-ghost btn-sm">Edit</button>
                        <button onClick={() => deleteMember(m.id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingId ? 'Edit Team Member' : 'Add Team Member'}</div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            {errorMsg && <div className="form-error" style={{ marginBottom: 16 }}>{errorMsg}</div>}
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Role</label>
              <input type="text" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} placeholder="Co-Founder" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Instagram Username</label>
              <input type="text" value={formData.instagram_username} onChange={e => setFormData(p => ({ ...p, instagram_username: e.target.value }))} placeholder="username (without @)" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Profile Link (URL)</label>
              <input type="text" value={formData.profile_link} onChange={e => setFormData(p => ({ ...p, profile_link: e.target.value }))} placeholder="https://instagram.com/xyz or any custom link" />
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Sort Order</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Profile Photo</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                {formData.image_url && <img src={formData.image_url} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />}
                <label className={`btn btn-outline btn-sm ${uploading ? 'disabled' : ''}`}>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <button onClick={save} className="btn btn-gold btn-full">Save Member</button>
          </div>
        </div>
      )}
    </div>
  );
}
