'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';



function InstagramProfilePic({ username, fallbackColor }: { username: string; fallbackColor: string }) {
  const [picUrl, setPicUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/instagram-search?q=${username}`)
      .then(r => r.json())
      .then(d => {
        const u = d.results?.find((x: any) => x.username.toLowerCase() === username.toLowerCase());
        if (u && u.profile_pic_url) {
          setPicUrl(u.profile_pic_url);
        }
      })
      .catch(() => {});
  }, [username]);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${username}&background=${fallbackColor}&color=fff&size=80`;

  return (
    <div style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 14, border: '3px solid var(--gold)', overflow: 'hidden', flexShrink: 0 }}>
      {picUrl ? (
        // Next.js config might not allow random remote domains for next/image, so we use regular img
        <img
          src={picUrl}
          alt={username}
          width={80}
          height={80}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { (e.target as HTMLImageElement).src = fallbackUrl; }}
        />
      ) : (
        <img
          src={fallbackUrl}
          alt={username}
          width={80}
          height={80}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

export default function ContactPage() {
  const [team, setTeam] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(d => {
        if (d.members && d.members.length > 0) {
          setTeam(d.members);
        } else {
          // Absolute fallback if db is empty during transitioning
          setTeam([
            { id: '1', name: 'AsianAyush', role: 'Founder & Owner', instagram_username: 'asianayush' },
            { id: '2', name: 'Zeroxxyfr', role: 'Co-Founder', instagram_username: 'zeroxxyfr' },
            { id: '3', name: 'Atonamus._', role: 'Manager', instagram_username: 'atonamus._' }
          ]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="page-content" style={{ minHeight: '100vh', padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div className="guest-banner" style={{ marginBottom: 40, justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Poppins', fontWeight: 800, textAlign: 'center', margin: 0 }}>Contact Us</h1>
        </div>

        <div className="card" style={{ padding: '40px' }}>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: 32, textAlign: 'center' }}>
            We'd love to hear from you! Whether you have questions, feedback, or business inquiries, feel free to reach out through any of the platforms below.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            <div style={{ background: 'var(--bg3)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💬</span> Join Our Community
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: '0.9rem' }}>
                Connect with us and get quick support on Discord.
              </p>
              <a href="https://discord.gg/NtUCvxFxzr" target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-full">
                Join Discord
              </a>
            </div>

            <div style={{ background: 'var(--bg3)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📸</span> Follow Us
              </h3>
              <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: '0.9rem' }}>
                Stay updated with our latest content and announcements.
              </p>
              <a href="https://www.instagram.com/fullfameservices/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-full">
                @fullfameservices
              </a>
            </div>
          </div>

          <div className="divider" style={{ margin: '40px 0' }} />

          <h2 style={{ fontSize: '1.5rem', marginBottom: 24, textAlign: 'center' }}>Leadership <span style={{ color: 'var(--gold)' }}>Team</span></h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {team.map((member) => (
              <a key={member.id} href={member.profile_link || `https://www.instagram.com/${member.instagram_username}/`} target="_blank" rel="noopener noreferrer" className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', background: 'var(--bg2)', textDecoration: 'none' }}>
                {member.image_url ? (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 14, border: '3px solid var(--gold)', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={member.image_url} alt={member.name} width={80} height={80} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <InstagramProfilePic username={member.instagram_username} fallbackColor="555555" />
                )}
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--white)', textAlign: 'center' }}>{member.name}</div>
                <div style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, textAlign: 'center' }}>{member.role}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>@{member.instagram_username}</div>
              </a>
            ))}
          </div>

          <div className="divider" style={{ margin: '40px 0' }} />

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>Business Inquiries</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto' }}>
              For collaborations, partnerships, or any professional queries, please reach out via our Discord or Instagram. We appreciate your interest and look forward to connecting with you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
