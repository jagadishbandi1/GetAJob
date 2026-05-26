'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ─────────────────────────────────────────── */
interface Rule { id: number; trigger_keyword: string; response: string }
interface Account { id: number; platform: string; email: string }
interface Application {
  id: number; job_url: string; company: string; job_title: string;
  location: string; compensation: string; status: string; log: string; applied_at: string
}
interface TrainingExample {
  id: number; question_text: string; answer_given: string; job_url: string; created_at: string
}
interface Document { id: number; name: string; file_type: string; preview: string; created_at: string }
interface Profile {
  full_name: string; email: string; phone: string; location: string;
  linkedin: string; website: string; resume_text: string; free_context: string; resume_file_name: string;
}

const defaultProfile: Profile = {
  full_name: '', email: '', phone: '', location: '',
  linkedin: '', website: '', resume_text: '', free_context: '', resume_file_name: '',
};

/* ─── Status styles ─────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  running: { bg: 'rgba(245,158,11,0.13)', color: '#f59e0b' },
  done:    { bg: 'rgba(96,147,93,0.15)',  color: '#7aad77' },
  failed:  { bg: 'rgba(239,68,68,0.13)',  color: '#f87171' },
  pending: { bg: 'rgba(255,255,255,0.07)', color: '#666677' },
};

/* ─── Animation variants ────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── Curtain word reveal ───────────────────────────── */
function CurtainWord({ word, delay = 0, style }: {
  word: string; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', lineHeight: 1.0 }}>
      <motion.span
        initial={{ y: '110%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
        style={{ display: 'inline-block', ...style }}
      >
        {word}
      </motion.span>
    </span>
  );
}

/* ─── Glass card with cursor glow ───────────────────── */
function GlassCard({ children, style, padding = '24px 28px', onClick }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: string | number;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--glow-x', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    ref.current.style.setProperty('--glow-y', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
  };

  return (
    <div
      ref={ref}
      className="glass"
      onMouseMove={handleMouseMove}
      onClick={onClick}
      style={{ padding, cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {children}
    </div>
  );
}

/* ─── Shared style helpers ──────────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '11px 24px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'opacity 0.2s, transform 0.15s',
  whiteSpace: 'nowrap' as const,
};

const btnGhost: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '9px 18px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 500,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'background 0.2s',
  whiteSpace: 'nowrap' as const,
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  fontFamily: "'Space Grotesk', inherit",
};

/* ─── Page ──────────────────────────────────────────── */
export default function Home() {
  const [section, setSection] = useState<'home' | 'tracker' | 'knowledge' | 'training' | 'accounts'>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [jobUrl, setJobUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [appId, setAppId] = useState<number | null>(null);
  const [appLog, setAppLog] = useState('');
  const [appStatus, setAppStatus] = useState('');

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState({ trigger_keyword: '', response: '' });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({ platform: '', email: '', password: '' });

  const [applications, setApplications] = useState<Application[]>([]);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [showFailedApps, setShowFailedApps] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docUploading, setDocUploading] = useState(false);

  const [training, setTraining] = useState<TrainingExample[]>([]);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!appId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/applications?id=${appId}`);
      const d = await res.json();
      if (d) {
        setAppLog(d.log || '');
        setAppStatus(d.status || '');
        if (d.status === 'done' || d.status === 'failed') {
          clearInterval(iv);
          setApplying(false);
          fetchApplications();
        }
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [appId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerOpen(false);
    };
    if (drawerOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAll = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchApplications(), fetchTraining(), fetchDocuments()]);
  }, []); // intentionally empty — stable on mount only

  async function fetchProfile() {
    const res = await fetch('/api/profile');
    const d = await res.json();
    if (d.profile) setProfile({ ...defaultProfile, ...d.profile });
    setRules(d.rules || []);
    setAccounts(d.accounts || []);
  }

  async function fetchApplications() {
    const res = await fetch('/api/applications');
    setApplications(await res.json() || []);
  }

  async function fetchTraining() {
    const res = await fetch('/api/training');
    setTraining(await res.json() || []);
  }

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    setDocuments(await res.json() || []);
  }

  async function handleApply() {
    if (!jobUrl.trim()) return;
    setApplying(true); setAppLog(''); setAppStatus('running');
    const res = await fetch('/api/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobUrl }),
    });
    const d = await res.json();
    setAppId(d.appId);
  }

  async function saveProfile() {
    setSavingProfile(true); setProfileSaved(false);
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'profile', ...profile }),
    });
    setSavingProfile(false); setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function uploadResume(file: File) {
    setResumeUploading(true);
    try {
      const fd = new FormData();
      fd.append('type', 'resume'); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.ok) await fetchProfile();
    } finally {
      setResumeUploading(false);
    }
  }

  async function uploadDocument(file: File) {
    setDocUploading(true);
    const fd = new FormData();
    fd.append('type', 'document'); fd.append('file', file);
    await fetch('/api/upload', { method: 'POST', body: fd });
    setDocUploading(false);
    fetchDocuments();
  }

  async function deleteDocument(id: number) {
    await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
    fetchDocuments();
  }

  async function addRule() {
    if (!newRule.trigger_keyword || !newRule.response) return;
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rule', ...newRule }),
    });
    setNewRule({ trigger_keyword: '', response: '' });
    fetchProfile();
  }

  async function deleteRule(id: number) {
    await fetch(`/api/profile?type=rule&id=${id}`, { method: 'DELETE' });
    fetchProfile();
  }

  async function addAccount() {
    if (!newAccount.platform || !newAccount.email || !newAccount.password) return;
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'account', ...newAccount }),
    });
    setNewAccount({ platform: '', email: '', password: '' });
    fetchProfile();
  }

  async function deleteAccount(id: number) {
    await fetch(`/api/profile?type=account&id=${id}`, { method: 'DELETE' });
    fetchProfile();
  }

  async function deleteApplication(id: number) {
    await fetch(`/api/applications?id=${id}`, { method: 'DELETE' });
    fetchApplications();
  }

  async function deleteTraining(id?: number) {
    await fetch(id ? `/api/training?id=${id}` : '/api/training', { method: 'DELETE' });
    fetchTraining();
  }

  const drawerItems = [
    { key: 'tracker'  as const, label: 'Tracker',  icon: '◉' },
    { key: 'accounts' as const, label: 'Accounts', icon: '⬡' },
    { key: 'training' as const, label: 'Training', icon: '◈' },
  ];

  /* ─── NAV ─────────────────────────────────────────── */
  const Nav = () => (
    <div style={{
      position: 'fixed', top: 20, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none', padding: '0 16px',
    }}>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '5px 6px',
          borderRadius: 999,
          background: 'rgba(12, 20, 16, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(28px) saturate(2)',
          WebkitBackdropFilter: 'blur(28px) saturate(2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setSection('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 999,
            background: section === 'home' ? 'rgba(255,255,255,0.08)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: section === 'home' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: 13,
            transition: 'all 0.2s',
          }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 11, fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            fontStyle: 'italic',
            boxShadow: '0 0 10px rgba(96,147,93,0.5)',
          }}>G</span>
          <span>GetAJobFaster</span>
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

        {(['knowledge'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{
            padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: section === s ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: section === s ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500, fontSize: 13,
            transition: 'all 0.2s',
            textTransform: 'capitalize',
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

        {/* Hamburger */}
        <div style={{ position: 'relative' }} ref={drawerRef}>
          <button
            onClick={() => setDrawerOpen(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: drawerOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'background 0.2s',
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.span key={i}
                animate={i === 1
                  ? { opacity: drawerOpen ? 0 : 1, scaleX: drawerOpen ? 0 : 1 }
                  : { rotate: drawerOpen ? (i === 0 ? 45 : -45) : 0, y: drawerOpen ? (i === 0 ? 6 : -6) : 0 }
                }
                style={{ display: 'block', width: 14, height: 1.5, background: 'var(--text-secondary)', transformOrigin: 'center', borderRadius: 1 }}
              />
            ))}
          </button>

          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute', right: 0, top: 46, width: 168,
                  borderRadius: 16,
                  background: 'rgba(12, 20, 16, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  overflow: 'hidden',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                }}
              >
                {drawerItems.map(item => (
                  <button key={item.key}
                    onClick={() => { setSection(item.key); setDrawerOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 18px',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
                      background: section === item.key ? 'var(--accent-bg)' : 'transparent',
                      color: section === item.key ? 'var(--accent)' : 'var(--text-secondary)',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: section === item.key ? 600 : 400,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </div>
  );

  /* ─── BACKGROUND ──────────────────────────────────── */
  const Background = () => (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#08090d' }}>
      {/* Subtle ambient orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-5%',
        width: '50%', height: '60%',
        background: 'radial-gradient(ellipse, rgba(96,147,93,0.06) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: '-5%',
        width: '45%', height: '55%',
        background: 'radial-gradient(ellipse, rgba(80,100,200,0.05) 0%, transparent 65%)',
      }} />
      {/* Dot grid */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 80%)',
      }} />
    </div>
  );

  /* ─── SECTION HEADER ─────────────────────────────── */
  const SectionHeader = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 52 }}>
      <div className="eyebrow" style={{ marginBottom: 18 }}>{eyebrow}</div>
      <h2 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 'clamp(30px, 5vw, 50px)',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.08,
        marginBottom: sub ? 14 : 0,
        color: 'var(--text-primary)',
      }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 400, lineHeight: 1.6 }}>{sub}</p>}
    </motion.div>
  );

  /* ─── APP CARD (Tracker) ─────────────────────────── */
  const AppCard = ({ app }: { app: Application }) => {
    const urlDomain = (() => { try { return new URL(app.job_url).hostname.replace('www.', ''); } catch { return app.job_url; } })();
    const meta = [app.company, app.location, app.compensation].filter(Boolean).join('  ·  ');
    const badge = STATUS_STYLE[app.status] || STATUS_STYLE.pending;
    const isExpanded = expandedApp === app.id;

    return (
      <motion.div variants={fadeUp} style={{ marginBottom: 10 }}>
        <GlassCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                fontSize: 14, fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
                color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {app.job_title || (app.status === 'running' ? 'Fetching details…' : urlDomain)}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta || urlDomain}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: badge.bg, color: badge.color,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '0.06em',
                ...(app.status === 'running' ? { boxShadow: `0 0 8px ${badge.color}55` } : {}),
              }}>{app.status}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.applied_at?.slice(0, 10)}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteApplication(app.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15, padding: '0 2px', lineHeight: 1, transition: 'color 0.2s' }}
                title="Delete"
              >✕</button>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block' }}
              >▼</motion.span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)' }}
              >
                <div style={{ padding: '10px 22px 4px' }}>
                  <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    ↗ {app.job_url}
                  </a>
                </div>
                {app.log && (
                  <pre style={{ padding: '8px 22px 18px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', lineHeight: 1.65 }}>
                    {app.log}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    );
  };

  /* ─────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>
      <Background />
      <Nav />

      {/* ─── HOME ─────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {section === 'home' && (
          <motion.section
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'relative', zIndex: 1,
              minHeight: '100vh',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', padding: '96px 24px 120px',
            }}
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="eyebrow"
              style={{ marginBottom: 28 }}
            >
              Side Project
            </motion.div>

            {/* Hero */}
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(58px, 12vw, 118px)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              marginBottom: 32,
              userSelect: 'none',
            }}>
              <div style={{ color: 'var(--text-primary)' }}>
                <CurtainWord word="Get" delay={0.25} />
                {' '}
                <CurtainWord word="A" delay={0.33} />
                {' '}
                <CurtainWord word="Job" delay={0.41} />
              </div>
              <div style={{ color: 'var(--accent)' }}>
                <CurtainWord word="Faster." delay={0.52} />
              </div>
            </div>

            {/* Body copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 480, lineHeight: 1.75, marginBottom: 10 }}
            >
              I was so bored of copy-pasting my resume into the same 47 fields on every job site
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.75, marginBottom: 52 }}
            >
              — so I built this instead.{' '}
              <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                If you&apos;re a recruiter: there&apos;s a solid chance the application that reached you came from this exact software. Respect the hustle.
              </span>
            </motion.p>

            {/* Input row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              style={{ width: '100%', maxWidth: 580 }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{
                    ...inputStyle, flex: 1, padding: '14px 20px', borderRadius: 16, fontSize: 14,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                  placeholder="Paste a job URL and press Apply…"
                  value={jobUrl}
                  onChange={e => setJobUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !applying && handleApply()}
                />
                <button
                  onClick={handleApply}
                  disabled={applying || !jobUrl.trim()}
                  style={{
                    ...btnPrimary,
                    borderRadius: 16, padding: '14px 28px',
                    opacity: applying || !jobUrl.trim() ? 0.4 : 1,
                    cursor: applying || !jobUrl.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: applying || !jobUrl.trim() ? 'none' : '0 0 20px rgba(96,147,93,0.35)',
                  }}
                >
                  {applying ? 'Running…' : 'Apply Now'}
                </button>
              </div>

              <AnimatePresence>
                {(appLog || appStatus) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    style={{ marginTop: 16 }}
                  >
                    <GlassCard padding="16px 20px">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        {appStatus && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                            background: (STATUS_STYLE[appStatus] || STATUS_STYLE.pending).bg,
                            color: (STATUS_STYLE[appStatus] || STATUS_STYLE.pending).color,
                            fontFamily: "'Space Grotesk', sans-serif",
                            letterSpacing: '0.06em',
                          }}>{appStatus}</span>
                        )}
                      </div>
                      <pre style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', lineHeight: 1.65, textAlign: 'left' }}>
                        {appLog || 'Starting…'}
                      </pre>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              style={{ marginTop: 96, display: 'flex', gap: 64, justifyContent: 'center' }}
            >
              {[
                { label: 'Applications', value: applications.length },
                { label: 'Documents', value: documents.length },
                { label: 'Training examples', value: training.length },
              ].map((s, i) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'var(--text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                    ...(i === 0 ? { color: 'var(--accent)', textShadow: '0 0 30px rgba(96,147,93,0.3)' } : {}),
                  }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ─── KNOWLEDGE ──────────────────────────────── */}
        {section === 'knowledge' && (
          <motion.section
            key="knowledge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 660, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader
                eyebrow="Master Knowledge"
                title="Everything Claude knows about you."
                sub="Your resume, docs, context, and rules. The more you give it, the better it fills."
              />

              {/* Resume */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 14 }}>Resume</p>
                  <input ref={resumeInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) uploadResume(e.target.files[0]); }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => resumeInputRef.current?.click()} disabled={resumeUploading} style={btnGhost}>
                      {resumeUploading ? '↑ Uploading…' : '↑ Upload Resume'}
                    </button>
                    {profile.resume_file_name && (
                      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: '0 0 6px var(--accent)' }} />
                        {profile.resume_file_name}
                      </span>
                    )}
                  </div>
                  {profile.resume_text && (
                    <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {profile.resume_text}
                    </p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Personal Info */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 18 }}>Personal Info</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {(['full_name', 'email', 'phone', 'location', 'linkedin', 'website'] as const).map(field => (
                      <div key={field}>
                        <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
                          {field.replace('_', ' ')}
                        </label>
                        <input style={inputStyle} value={profile[field] || ''}
                          onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Free Context */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>Free Context</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Tell Claude anything — preferences, things to avoid, tone, constraints.</p>
                  <textarea
                    style={{ ...inputStyle, height: 112, resize: 'none' }}
                    value={profile.free_context || ''}
                    onChange={e => setProfile(p => ({ ...p, free_context: e.target.value }))}
                    placeholder="e.g. Remote only. 2 weeks notice. Don't mention my gap year unless asked…"
                  />
                </GlassCard>
              </motion.div>

              {/* Save */}
              <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  style={{
                    ...btnPrimary,
                    opacity: savingProfile ? 0.5 : 1,
                    boxShadow: savingProfile ? 'none' : '0 0 20px rgba(96,147,93,0.3)',
                  }}
                >
                  {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
                <AnimatePresence>
                  {profileSaved && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}
                    >✓ Saved</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Documents */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>Reference Documents</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Cover letters, portfolios, certifications</p>
                    </div>
                    <input ref={docInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) uploadDocument(e.target.files[0]); }} />
                    <button onClick={() => docInputRef.current?.click()} disabled={docUploading} style={{ ...btnGhost, fontSize: 12, padding: '8px 16px' }}>
                      {docUploading ? '↑ …' : '+ Add'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documents.length === 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No documents yet.</p>
                    )}
                    {documents.map(doc => (
                      <div key={doc.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                        borderRadius: 12, padding: '12px 16px',
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.preview}</p>
                        </div>
                        <button onClick={() => deleteDocument(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, marginLeft: 14, transition: 'color 0.2s' }}>remove</button>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Rules */}
              <motion.div variants={fadeUp}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>Answer Rules</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Override how Claude answers specific question types.</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder='Keyword (e.g. "salary")'
                      value={newRule.trigger_keyword}
                      onChange={e => setNewRule(r => ({ ...r, trigger_keyword: e.target.value }))} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder='Answer (e.g. "$130k")'
                      value={newRule.response}
                      onChange={e => setNewRule(r => ({ ...r, response: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addRule()} />
                    <button onClick={addRule} style={{ ...btnPrimary, padding: '10px 20px', borderRadius: 12 }}>Add</button>
                  </div>
                  <AnimatePresence>
                    {rules.map(rule => (
                      <motion.div key={rule.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                          borderRadius: 12, padding: '10px 14px', marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, background: 'var(--accent-bg)',
                            color: 'var(--accent)', border: '1px solid var(--accent-border)',
                            padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em',
                          }}>{rule.trigger_keyword}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.response}</span>
                        </div>
                        <button onClick={() => deleteRule(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, marginLeft: 12 }}>remove</button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            </motion.div>
          </motion.section>
        )}

        {/* ─── TRACKER ─────────────────────────────────── */}
        {section === 'tracker' && (
          <motion.section
            key="tracker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 740, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader
                eyebrow="Applications"
                title="Job Tracker"
                sub="Every application, in one place."
              />

              {/* Gmail notice */}
              <motion.div variants={fadeUp} style={{
                marginBottom: 24,
                padding: '14px 20px',
                background: 'var(--amber-bg)',
                border: '1px solid var(--amber-border)',
                borderRadius: 16,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ color: 'var(--amber)', fontSize: 14, marginTop: 1 }}>⚠</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', fontFamily: "'Space Grotesk', sans-serif" }}>Gmail sync coming soon</p>
                  <p style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)', marginTop: 2 }}>Connect Gmail to automatically pull job applications, status updates, and interview invites.</p>
                </div>
              </motion.div>

              {(() => {
                const activeApps = applications.filter(a => a.status !== 'failed');
                const failedApps = applications.filter(a => a.status === 'failed');

                return (
                  <>
                    <motion.div variants={stagger}>
                      {activeApps.length === 0 && failedApps.length === 0 && (
                        <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '80px 0' }}>
                          <p style={{ fontSize: 40, marginBottom: 16 }}>📭</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No applications yet. Paste a job URL on the home screen.</p>
                        </motion.div>
                      )}
                      {activeApps.map(app => <AppCard key={app.id} app={app} />)}
                    </motion.div>

                    {failedApps.length > 0 && (
                      <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                        <button
                          onClick={() => setShowFailedApps(v => !v)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '13px 20px', borderRadius: 16,
                            border: '1px solid var(--red-border)',
                            background: 'var(--red-bg)',
                            color: 'var(--red)', cursor: 'pointer',
                            fontSize: 13, fontWeight: 700,
                            fontFamily: "'Space Grotesk', sans-serif",
                            letterSpacing: '0.02em',
                            transition: 'background 0.2s',
                          }}
                        >
                          <span>{failedApps.length} failed attempt{failedApps.length !== 1 ? 's' : ''}</span>
                          <motion.span animate={{ rotate: showFailedApps ? 180 : 0 }} style={{ fontSize: 9, display: 'block' }}>▼</motion.span>
                        </button>
                        <AnimatePresence>
                          {showFailedApps && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ paddingTop: 10 }}>
                                {failedApps.map(app => <AppCard key={app.id} app={app} />)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.section>
        )}

        {/* ─── ACCOUNTS ─────────────────────────────────── */}
        {section === 'accounts' && (
          <motion.section
            key="accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 660, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader
                eyebrow="Credentials"
                title="Platform Accounts"
                sub="The autofiller uses these to log in automatically."
              />

              <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif", marginBottom: 14 }}>Add Account</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input style={inputStyle} placeholder="Platform" value={newAccount.platform} onChange={e => setNewAccount(a => ({ ...a, platform: e.target.value }))} />
                    <input style={inputStyle} placeholder="Email" value={newAccount.email} onChange={e => setNewAccount(a => ({ ...a, email: e.target.value }))} />
                    <input type="password" style={inputStyle} placeholder="Password" value={newAccount.password} onChange={e => setNewAccount(a => ({ ...a, password: e.target.value }))} />
                    <button onClick={addAccount} style={{ ...btnPrimary, borderRadius: 12, padding: '10px 20px' }}>Add</button>
                  </div>
                </GlassCard>
              </motion.div>

              <AnimatePresence>
                {accounts.map(acc => (
                  <motion.div key={acc.id} variants={fadeUp}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }}
                    style={{ marginBottom: 10 }}
                  >
                    <GlassCard padding="14px 20px">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: 'var(--accent-bg)', color: 'var(--accent)',
                            border: '1px solid var(--accent-border)',
                            padding: '2px 8px', borderRadius: 6,
                            fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.06em',
                          }}>{acc.platform}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{acc.email}</span>
                        </div>
                        <button onClick={() => deleteAccount(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>remove</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        )}

        {/* ─── TRAINING ─────────────────────────────────── */}
        {section === 'training' && (
          <motion.section
            key="training"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 740, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader
                eyebrow="Memory"
                title="Training Data"
                sub="Claude remembers every answer it gives. The more it applies, the smarter it gets."
              />

              {training.length > 0 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                  <button
                    onClick={() => deleteTraining()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--red)', letterSpacing: '0.02em', transition: 'opacity 0.2s' }}
                  >
                    Clear all training data
                  </button>
                </motion.div>
              )}

              <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {training.length === 0 && (
                  <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '80px 0' }}>
                    <p style={{ fontSize: 40, marginBottom: 16 }}>◈</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No training data yet. Run your first application to start building it.</p>
                  </motion.div>
                )}
                {training.map(ex => (
                  <motion.div key={ex.id} variants={fadeUp}>
                    <GlassCard padding="14px 20px">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.03em' }}>{ex.question_text}</p>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{ex.answer_given}</p>
                          {ex.job_url && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.job_url}</p>}
                        </div>
                        <button onClick={() => deleteTraining(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0, lineHeight: 1, transition: 'color 0.2s' }}>×</button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
