'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ──────────────────────────────────────────── */
interface Rule { id: number; trigger_keyword: string; response: string }
interface Account { id: number; platform: string; email: string }
interface Application {
  id: number; job_url: string; company: string; job_title: string;
  location: string; compensation: string; status: string; log: string;
  applied_at: string; source?: string;
}
interface TrainingExample {
  id: number; question_text: string; answer_given: string; job_url: string; created_at: string
}
interface Document { id: number; name: string; file_type: string; preview: string; created_at: string }
interface Profile {
  full_name: string; email: string; phone: string; location: string;
  linkedin: string; website: string; resume_text: string; free_context: string;
  resume_file_name: string; gmail_token?: string;
}
interface Health { ai: boolean; database: boolean; playwright: boolean; gmail: boolean }

const defaultProfile: Profile = {
  full_name: '', email: '', phone: '', location: '',
  linkedin: '', website: '', resume_text: '', free_context: '', resume_file_name: '',
};

/* ─── Status config ──────────────────────────────────── */
const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  running:      { bg: 'rgba(245,158,11,0.13)',  color: '#f59e0b',  label: 'Running'      },
  done:         { bg: 'rgba(96,147,93,0.15)',   color: '#7aad77',  label: 'Applied'      },
  failed:       { bg: 'rgba(239,68,68,0.13)',   color: '#f87171',  label: 'Failed'       },
  pending:      { bg: 'rgba(255,255,255,0.07)', color: '#666677',  label: 'Pending'      },
  interviewing: { bg: 'rgba(99,179,237,0.13)',  color: '#63b3ed',  label: 'Interviewing' },
  offer:        { bg: 'rgba(96,147,93,0.2)',    color: '#7aad77',  label: '🎉 Offer'     },
  rejected:     { bg: 'rgba(239,68,68,0.13)',   color: '#f87171',  label: 'Rejected'     },
};

const NEXT_STATUSES: Record<string, string[]> = {
  done:         ['interviewing', 'rejected'],
  interviewing: ['offer', 'rejected'],
};

/* ─── Animations ─────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ─── Logo SVG ───────────────────────────────────────── */
function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="8" fill="#60935D" />
      <path d="M7.5 11 L15 16 L7.5 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11 L23.5 16 L16 21" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
    </svg>
  );
}

/* ─── Curtain word animation ─────────────────────────── */
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

/* ─── Glass card ─────────────────────────────────────── */
function GlassCard({ children, style, padding = '22px 28px', onClick }: {
  children: React.ReactNode; style?: React.CSSProperties;
  padding?: string | number; onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--glow-x', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    ref.current.style.setProperty('--glow-y', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
  };
  return (
    <div ref={ref} className="glass" onMouseMove={onMove} onClick={onClick}
      style={{ padding, cursor: onClick ? 'pointer' : undefined, ...style }}>
      {children}
    </div>
  );
}

/* ─── Skeleton loader ────────────────────────────────── */
function Skeleton({ width = '100%', height = 18, radius = 6, style }: {
  width?: string | number; height?: number; radius?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite',
      ...style,
    }} />
  );
}

/* ─── Feature card ───────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <GlassCard padding="22px 24px" style={{ flex: '1 1 180px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, marginBottom: 14,
        background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent)',
      }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
    </GlassCard>
  );
}

/* ─── Shared styles ──────────────────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 12,
  padding: '11px 24px', fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 600, fontSize: 13, letterSpacing: '0.02em',
  cursor: 'pointer', transition: 'opacity 0.2s', whiteSpace: 'nowrap' as const,
};
const btnGhost: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '9px 18px', fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s',
  whiteSpace: 'nowrap' as const,
};
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10,
  padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14,
  outline: 'none', width: '100%', fontFamily: "'Space Grotesk', inherit",
};

/* ─────────────────────────────────────────────────────── */
export default function Home() {
  const [section, setSection] = useState<'home' | 'tracker' | 'knowledge' | 'training' | 'accounts'>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [jobUrl, setJobUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [appId, setAppId] = useState<number | null>(null);
  const [appLog, setAppLog] = useState('');
  const [appStatus, setAppStatus] = useState('');
  const [profileWarning, setProfileWarning] = useState(false);

  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState({ trigger_keyword: '', response: '' });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccount, setNewAccount] = useState({ platform: '', email: '', password: '' });

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);
  const [showFailedApps, setShowFailedApps] = useState(false);

  const [addingApp, setAddingApp] = useState(false);
  const [newApp, setNewApp] = useState({ job_url: '', company: '', job_title: '', location: '', compensation: '', status: 'done' });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [docUploading, setDocUploading] = useState(false);

  const [training, setTraining] = useState<TrainingExample[]>([]);
  const [loadingTraining, setLoadingTraining] = useState(true);

  const [health, setHealth] = useState<Health | null>(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailSyncResult, setGmailSyncResult] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAll = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchApplications(), fetchTraining(), fetchDocuments(), fetchHealth()]);
  }, []);

  useEffect(() => {
    fetchAll();
    // Check for Gmail OAuth callback result
    const params = new URLSearchParams(window.location.search);
    const gmail = params.get('gmail');
    if (gmail === 'connected') {
      setGmailConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchAll]);

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

  async function fetchHealth() {
    try {
      const res = await fetch('/api/health');
      const d = await res.json();
      setHealth(d);
    } catch { /* ignore */ }
  }

  async function fetchProfile() {
    const res = await fetch('/api/profile');
    const d = await res.json();
    if (d.profile) {
      setProfile({ ...defaultProfile, ...d.profile });
      setGmailConnected(!!d.profile.gmail_token);
    }
    setRules(d.rules || []);
    setAccounts(d.accounts || []);
  }

  async function fetchApplications() {
    setLoadingApps(true);
    const res = await fetch('/api/applications');
    setApplications(await res.json() || []);
    setLoadingApps(false);
  }

  async function fetchTraining() {
    setLoadingTraining(true);
    const res = await fetch('/api/training');
    setTraining(await res.json() || []);
    setLoadingTraining(false);
  }

  async function fetchDocuments() {
    const res = await fetch('/api/documents');
    setDocuments(await res.json() || []);
  }

  async function handleApply() {
    if (!jobUrl.trim()) return;
    // Profile completeness check
    const missing = !profile.full_name && !profile.resume_text;
    if (missing) { setProfileWarning(true); return; }
    setProfileWarning(false);
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
      await fetch('/api/upload', { method: 'POST', body: fd });
      await fetchProfile();
    } finally { setResumeUploading(false); }
  }

  async function uploadDocument(file: File) {
    setDocUploading(true);
    const fd = new FormData();
    fd.append('type', 'document'); fd.append('file', file);
    await fetch('/api/upload', { method: 'POST', body: fd });
    setDocUploading(false); fetchDocuments();
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
    setNewRule({ trigger_keyword: '', response: '' }); fetchProfile();
  }

  async function deleteRule(id: number) {
    await fetch(`/api/profile?type=rule&id=${id}`, { method: 'DELETE' }); fetchProfile();
  }

  async function addAccount() {
    if (!newAccount.platform || !newAccount.email || !newAccount.password) return;
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'account', ...newAccount }),
    });
    setNewAccount({ platform: '', email: '', password: '' }); fetchProfile();
  }

  async function deleteAccount(id: number) {
    await fetch(`/api/profile?type=account&id=${id}`, { method: 'DELETE' }); fetchProfile();
  }

  async function deleteApplication(id: number) {
    await fetch(`/api/applications?id=${id}`, { method: 'DELETE' });
    fetchApplications();
  }

  async function updateAppStatus(id: number, status: string) {
    await fetch('/api/applications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function addManualApp() {
    if (!newApp.job_url && !newApp.company) return;
    await fetch('/api/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp),
    });
    setNewApp({ job_url: '', company: '', job_title: '', location: '', compensation: '', status: 'done' });
    setAddingApp(false);
    fetchApplications();
  }

  async function deleteTraining(id?: number) {
    await fetch(id ? `/api/training?id=${id}` : '/api/training', { method: 'DELETE' });
    fetchTraining();
  }

  async function syncGmail() {
    setGmailSyncing(true); setGmailSyncResult(null);
    try {
      const res = await fetch('/api/gmail', { method: 'POST' });
      const d = await res.json();
      if (d.ok) {
        setGmailSyncResult(`Synced ${d.synced} application${d.synced !== 1 ? 's' : ''} from ${d.total} emails`);
        fetchApplications();
      } else {
        setGmailSyncResult(d.error || 'Sync failed');
      }
    } catch { setGmailSyncResult('Sync failed'); }
    setGmailSyncing(false);
  }

  const drawerItems = [
    { key: 'tracker'  as const, label: 'Tracker',  icon: '◉' },
    { key: 'accounts' as const, label: 'Accounts', icon: '⬡' },
    { key: 'training' as const, label: 'Training', icon: '◈' },
  ];

  /* ─── NAV ──────────────────────────────────────────── */
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
          pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 2,
          padding: '5px 6px', borderRadius: 999,
          background: 'rgba(8,9,13,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(28px) saturate(2)',
          WebkitBackdropFilter: 'blur(28px) saturate(2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <button onClick={() => setSection('home')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 999,
          background: section === 'home' ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: section === 'home' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13,
          transition: 'all 0.2s',
        }}>
          <LogoMark size={22} />
          <span>GetAJobFaster</span>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
            background: 'var(--accent-bg)', color: 'var(--accent)', letterSpacing: '0.05em',
          }}>BETA</span>
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

        <button onClick={() => setSection('knowledge')} style={{
          padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: section === 'knowledge' ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: section === 'knowledge' ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 13,
          transition: 'all 0.2s',
        }}>Knowledge</button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

        <div style={{ position: 'relative' }} ref={drawerRef}>
          <button onClick={() => setDrawerOpen(v => !v)} style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: drawerOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'background 0.2s',
          }}>
            {[0, 1, 2].map(i => (
              <motion.span key={i}
                animate={i === 1
                  ? { opacity: drawerOpen ? 0 : 1 }
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
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', right: 0, top: 46, width: 168,
                  borderRadius: 16, background: 'rgba(8,9,13,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                  overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
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

  /* ─── BACKGROUND ────────────────────────────────────── */
  const Background = () => (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#08090d' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-5%', width: '50%', height: '60%', background: 'radial-gradient(ellipse, rgba(96,147,93,0.06) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: '45%', height: '55%', background: 'radial-gradient(ellipse, rgba(80,100,200,0.04) 0%, transparent 65%)' }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 80%)',
      }} />
    </div>
  );

  /* ─── SECTION HEADER ────────────────────────────────── */
  const SectionHeader = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 52 }}>
      <div className="eyebrow" style={{ marginBottom: 18 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(30px, 5vw, 50px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: sub ? 14 : 0, color: 'var(--text-primary)' }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>{sub}</p>}
    </motion.div>
  );

  /* ─── APP CARD ──────────────────────────────────────── */
  const AppCard = ({ app }: { app: Application }) => {
    const urlDomain = (() => { try { return new URL(app.job_url).hostname.replace('www.', ''); } catch { return app.job_url || '—'; } })();
    const meta = [app.company, app.location, app.compensation].filter(Boolean).join('  ·  ');
    const badge = STATUS[app.status] || STATUS.pending;
    const isExpanded = expandedApp === app.id;
    const nextStatuses = NEXT_STATUSES[app.status] || [];

    return (
      <motion.div variants={fadeUp} style={{ marginBottom: 10 }}>
        <GlassCard padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
            onClick={() => setExpandedApp(isExpanded ? null : app.id)}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {app.job_title || (app.status === 'running' ? 'Fetching details…' : urlDomain)}
                </p>
                {app.source === 'gmail' && (
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,179,237,0.1)', color: '#63b3ed', fontWeight: 600, letterSpacing: '0.05em', flexShrink: 0 }}>GMAIL</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta || urlDomain}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: badge.bg, color: badge.color, letterSpacing: '0.05em' }}>
                {badge.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.applied_at?.slice(0, 10)}</span>
              <button onClick={e => { e.stopPropagation(); deleteApplication(app.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>✕</button>
              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block' }}>▼</motion.span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: 'hidden', borderTop: '1px solid var(--border-subtle)' }}
              >
                <div style={{ padding: '12px 22px' }}>
                  {app.job_url && (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 10 }}>
                      ↗ {app.job_url}
                    </a>
                  )}

                  {/* Status progression */}
                  {nextStatuses.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Move to:</span>
                      {nextStatuses.map(s => (
                        <button key={s} onClick={() => updateAppStatus(app.id, s)} style={{
                          padding: '4px 12px', borderRadius: 8, border: `1px solid ${STATUS[s]?.color}33`,
                          background: STATUS[s]?.bg, color: STATUS[s]?.color,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.03em',
                        }}>
                          {STATUS[s]?.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {app.log && (
                    <pre style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto', lineHeight: 1.65, paddingBottom: 6 }}>
                      {app.log}
                    </pre>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    );
  };

  /* ─── RENDER ────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <Background />
      <Nav />

      <AnimatePresence mode="wait">

        {/* ── HOME ──────────────────────────────────────── */}
        {section === 'home' && (
          <motion.section key="home"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '96px 24px 80px' }}
          >
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="eyebrow" style={{ marginBottom: 28 }}>
              Powered by Claude AI
            </motion.div>

            {/* Hero headline */}
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(58px, 12vw, 118px)', lineHeight: 0.96, letterSpacing: '-0.04em', marginBottom: 20, userSelect: 'none' }}>
              <div style={{ color: 'var(--text-primary)' }}>
                <CurtainWord word="Get" delay={0.25} />{' '}
                <CurtainWord word="A" delay={0.33} />{' '}
                <CurtainWord word="Job" delay={0.41} />
              </div>
              <div style={{ color: 'var(--accent)' }}>
                <CurtainWord word="Faster." delay={0.52} />
              </div>
            </div>

            {/* Tagline */}
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              style={{ fontSize: 17, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 16, letterSpacing: '-0.01em' }}>
              Apply smarter. Land faster.
            </motion.p>

            {/* Description */}
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 480, lineHeight: 1.75, marginBottom: 44 }}>
              Paste any job URL. Claude reads the posting, fills every field intelligently, extracts metadata, and logs the application — automatically.
            </motion.p>

            {/* Apply input */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              style={{ width: '100%', maxWidth: 580 }}>
              <AnimatePresence>
                {profileWarning && (
                  <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 12, padding: '10px 16px', background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 12, fontSize: 13, color: 'var(--amber)', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>⚠</span>
                    <span>Your profile is empty.{' '}
                      <button onClick={() => { setSection('knowledge'); setProfileWarning(false); }} style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}>
                        Add your resume first
                      </button>{' '}so Claude knows who to say you are.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  style={{ ...inputStyle, flex: 1, padding: '14px 20px', borderRadius: 16, fontSize: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Paste a job URL and press Apply…"
                  value={jobUrl}
                  onChange={e => { setJobUrl(e.target.value); setProfileWarning(false); }}
                  onKeyDown={e => e.key === 'Enter' && !applying && handleApply()}
                />
                <button onClick={handleApply} disabled={applying || !jobUrl.trim()} style={{
                  ...btnPrimary, borderRadius: 16, padding: '14px 28px',
                  opacity: applying || !jobUrl.trim() ? 0.4 : 1,
                  cursor: applying || !jobUrl.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: applying || !jobUrl.trim() ? 'none' : '0 0 20px rgba(96,147,93,0.3)',
                }}>
                  {applying ? 'Running…' : 'Apply Now →'}
                </button>
              </div>

              <AnimatePresence>
                {(appLog || appStatus) && (
                  <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ marginTop: 14 }}>
                    <GlassCard padding="16px 20px">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        {appStatus && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: (STATUS[appStatus] || STATUS.pending).bg, color: (STATUS[appStatus] || STATUS.pending).color, letterSpacing: '0.06em' }}>
                            {(STATUS[appStatus] || STATUS.pending).label}
                          </span>
                        )}
                        {appStatus === 'running' && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
                        )}
                      </div>
                      <pre style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', lineHeight: 1.65, textAlign: 'left' }}>
                        {appLog || 'Starting…'}
                      </pre>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Feature cards */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
              style={{ display: 'flex', gap: 14, marginTop: 56, width: '100%', maxWidth: 720, flexWrap: 'wrap' }}>
              <FeatureCard
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="1" width="14" height="16" rx="2"/><path d="M5 6h8M5 9h8M5 12h5"/><path d="M11.5 11.5l2 2 3-3" strokeWidth="1.6"/></svg>}
                title="AI Form Filling"
                desc="Claude reads the job posting context and fills every field — accurately, every time."
              />
              <FeatureCard
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="4"/><path d="M9 1v3M9 14v3M1 9h3M14 9h3"/><path d="M3.5 3.5l2 2M12.5 12.5l2 2M3.5 14.5l2-2M12.5 5.5l2-2"/></svg>}
                title="Adaptive Memory"
                desc="Learns from every application. Gets smarter, more consistent, and more accurate over time."
              />
              <FeatureCard
                icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 14L5 9l3.5 2.5L13 5l3 2"/><path d="M2 17h14"/></svg>}
                title="Smart Tracking"
                desc="Auto-extracts company, role, location, and pay. Track every application from applied to offer."
              />
            </motion.div>

            {/* System status ticker */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              style={{ marginTop: 48, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {health && [
                { label: 'Claude AI', active: health.ai },
                { label: 'Database', active: health.database },
                { label: 'Playwright', active: health.playwright },
                { label: 'Gmail', active: health.gmail || gmailConnected },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: s.active ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                    display: 'inline-block',
                    animation: s.active ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                    boxShadow: s.active ? '0 0 6px var(--accent)' : 'none',
                  }} />
                  <span style={{ fontSize: 11, color: s.active ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.04em' }}>{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}
              style={{ marginTop: 64, display: 'flex', gap: 64, justifyContent: 'center' }}>
              {[
                { label: 'Applications', value: applications.length },
                { label: 'Documents', value: documents.length },
                { label: 'Training examples', value: training.length },
              ].map((s, i) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', fontFamily: "'Space Grotesk', sans-serif", fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* ── KNOWLEDGE ─────────────────────────────────── */}
        {section === 'knowledge' && (
          <motion.section key="knowledge"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 660, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader eyebrow="Master Knowledge" title="Everything Claude knows about you." sub="Resume, docs, context, and custom rules. The more you give it, the better it fills." />

              {/* Resume */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Resume</p>
                  <input ref={resumeInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) uploadResume(e.target.files[0]); }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => resumeInputRef.current?.click()} disabled={resumeUploading} style={btnGhost}>
                      {resumeUploading ? '↑ Parsing…' : '↑ Upload Resume'}
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
                  {!profile.resume_file_name && (
                    <p style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Supports .txt, .md, .pdf — Claude auto-extracts your contact info.</p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Personal Info */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 18 }}>Personal Info</p>
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
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Free Context</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Tell Claude anything — preferences, things to avoid, tone, constraints.</p>
                  <textarea style={{ ...inputStyle, height: 112, resize: 'none' }}
                    value={profile.free_context || ''}
                    onChange={e => setProfile(p => ({ ...p, free_context: e.target.value }))}
                    placeholder="e.g. Remote only. 2 weeks notice. Salary range $120k–$140k. Don't mention gap year unless asked…" />
                </GlassCard>
              </motion.div>

              {/* Save */}
              <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <button onClick={saveProfile} disabled={savingProfile} style={{ ...btnPrimary, opacity: savingProfile ? 0.5 : 1, boxShadow: savingProfile ? 'none' : '0 0 20px rgba(96,147,93,0.3)' }}>
                  {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
                <AnimatePresence>
                  {profileSaved && (
                    <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>✓ Saved</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Documents */}
              <motion.div variants={fadeUp} style={{ marginBottom: 14 }}>
                <GlassCard padding="22px 28px">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Documents</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Cover letters, portfolios, certifications</p>
                    </div>
                    <input ref={docInputRef} type="file" accept=".txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files?.[0]) uploadDocument(e.target.files[0]); }} />
                    <button onClick={() => docInputRef.current?.click()} disabled={docUploading} style={{ ...btnGhost, fontSize: 12, padding: '8px 16px' }}>
                      {docUploading ? '↑ …' : '+ Add'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {documents.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No documents yet.</p>}
                    {documents.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 16px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.preview}</p>
                        </div>
                        <button onClick={() => deleteDocument(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, marginLeft: 14 }}>remove</button>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Rules */}
              <motion.div variants={fadeUp}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Answer Rules</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Override how Claude answers specific question types.</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder='Keyword (e.g. "salary")'
                      value={newRule.trigger_keyword} onChange={e => setNewRule(r => ({ ...r, trigger_keyword: e.target.value }))} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder='Response (e.g. "$130k")'
                      value={newRule.response} onChange={e => setNewRule(r => ({ ...r, response: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addRule()} />
                    <button onClick={addRule} style={{ ...btnPrimary, padding: '10px 20px', borderRadius: 12 }}>Add</button>
                  </div>
                  <AnimatePresence>
                    {rules.map(rule => (
                      <motion.div key={rule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{rule.trigger_keyword}</span>
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

        {/* ── TRACKER ───────────────────────────────────── */}
        {section === 'tracker' && (
          <motion.section key="tracker"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 740, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader eyebrow="Applications" title="Job Tracker" sub="Every application, tracked automatically." />

              {/* Gmail card */}
              <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
                <GlassCard padding="20px 24px">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: gmailConnected ? 'var(--accent-bg)' : 'rgba(255,255,255,0.05)', border: `1px solid ${gmailConnected ? 'var(--accent-border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        ✉
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          Gmail Sync
                          {gmailConnected && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>CONNECTED</span>}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {gmailConnected
                            ? 'Auto-imports application confirmations, status updates, and interview invites.'
                            : 'Connect to auto-import job emails and track application status updates.'}
                        </p>
                        {gmailSyncResult && <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>{gmailSyncResult}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {gmailConnected ? (
                        <button onClick={syncGmail} disabled={gmailSyncing} style={{ ...btnGhost, fontSize: 12, padding: '8px 16px' }}>
                          {gmailSyncing ? '↻ Syncing…' : '↻ Sync Now'}
                        </button>
                      ) : (
                        <a href="/api/auth/google" style={{
                          ...btnGhost, fontSize: 12, padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                          opacity: health?.gmail ? 1 : 0.5,
                          pointerEvents: health?.gmail ? 'auto' : 'none',
                        } as React.CSSProperties}>
                          <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.805.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                          Connect Gmail
                        </a>
                      )}
                    </div>
                  </div>
                  {!health?.gmail && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                      To enable: add <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>GOOGLE_CLIENT_ID</code> and <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>GOOGLE_CLIENT_SECRET</code> to your <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>.env.local</code>
                    </p>
                  )}
                </GlassCard>
              </motion.div>

              {/* Add manual app */}
              <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setAddingApp(v => !v)} style={{ ...btnGhost, fontSize: 12, padding: '8px 16px' }}>
                    {addingApp ? '✕ Cancel' : '+ Log Manually'}
                  </button>
                </div>
                <AnimatePresence>
                  {addingApp && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }} style={{ overflow: 'hidden', marginTop: 12 }}>
                      <GlassCard padding="20px 24px">
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 16 }}>Log Application Manually</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <input style={inputStyle} placeholder="Job URL (optional)" value={newApp.job_url} onChange={e => setNewApp(a => ({ ...a, job_url: e.target.value }))} />
                          <input style={inputStyle} placeholder="Company *" value={newApp.company} onChange={e => setNewApp(a => ({ ...a, company: e.target.value }))} />
                          <input style={inputStyle} placeholder="Role / Title" value={newApp.job_title} onChange={e => setNewApp(a => ({ ...a, job_title: e.target.value }))} />
                          <input style={inputStyle} placeholder="Location" value={newApp.location} onChange={e => setNewApp(a => ({ ...a, location: e.target.value }))} />
                          <input style={inputStyle} placeholder="Compensation" value={newApp.compensation} onChange={e => setNewApp(a => ({ ...a, compensation: e.target.value }))} />
                          <select style={inputStyle} value={newApp.status} onChange={e => setNewApp(a => ({ ...a, status: e.target.value }))}>
                            <option value="done">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="offer">Offer Received</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setAddingApp(false)} style={btnGhost}>Cancel</button>
                          <button onClick={addManualApp} disabled={!newApp.company && !newApp.job_url} style={{ ...btnPrimary, opacity: (!newApp.company && !newApp.job_url) ? 0.4 : 1 }}>Save Application</button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Application list */}
              {loadingApps ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map(i => (
                    <GlassCard key={i} padding="16px 22px">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <Skeleton height={14} width="55%" style={{ marginBottom: 8 }} />
                          <Skeleton height={11} width="35%" />
                        </div>
                        <Skeleton width={64} height={22} radius={999} />
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (() => {
                const activeApps = applications.filter(a => a.status !== 'failed');
                const failedApps = applications.filter(a => a.status === 'failed');
                return (
                  <>
                    <motion.div variants={stagger}>
                      {activeApps.length === 0 && failedApps.length === 0 && (
                        <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '80px 0' }}>
                          <p style={{ fontSize: 36, marginBottom: 16 }}>📭</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No applications yet. Paste a job URL on the home screen, or log one manually above.</p>
                        </motion.div>
                      )}
                      {activeApps.map(app => <AppCard key={app.id} app={app} />)}
                    </motion.div>

                    {failedApps.length > 0 && (
                      <motion.div variants={fadeUp} style={{ marginTop: 16 }}>
                        <button onClick={() => setShowFailedApps(v => !v)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '13px 20px', borderRadius: 16, border: '1px solid var(--red-border)',
                          background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer',
                          fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                          <span>{failedApps.length} failed attempt{failedApps.length !== 1 ? 's' : ''}</span>
                          <motion.span animate={{ rotate: showFailedApps ? 180 : 0 }} style={{ fontSize: 9, display: 'block' }}>▼</motion.span>
                        </button>
                        <AnimatePresence>
                          {showFailedApps && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
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

        {/* ── ACCOUNTS ──────────────────────────────────── */}
        {section === 'accounts' && (
          <motion.section key="accounts"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 660, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader eyebrow="Credentials" title="Platform Accounts" sub="Saved credentials the autofiller uses to log in automatically." />
              <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
                <GlassCard padding="22px 28px">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Add Account</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input style={inputStyle} placeholder="Platform (e.g. LinkedIn)" value={newAccount.platform} onChange={e => setNewAccount(a => ({ ...a, platform: e.target.value }))} />
                    <input style={inputStyle} placeholder="Email" value={newAccount.email} onChange={e => setNewAccount(a => ({ ...a, email: e.target.value }))} />
                    <input type="password" style={inputStyle} placeholder="Password" value={newAccount.password} onChange={e => setNewAccount(a => ({ ...a, password: e.target.value }))} />
                    <button onClick={addAccount} style={{ ...btnPrimary, borderRadius: 12, padding: '10px 20px' }}>Add</button>
                  </div>
                </GlassCard>
              </motion.div>
              <AnimatePresence>
                {accounts.map(acc => (
                  <motion.div key={acc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 16 }} style={{ marginBottom: 10 }}>
                    <GlassCard padding="14px 20px">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.06em' }}>{acc.platform}</span>
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

        {/* ── TRAINING ──────────────────────────────────── */}
        {section === 'training' && (
          <motion.section key="training"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45 }}
            style={{ position: 'relative', zIndex: 1, padding: '104px 24px 96px', maxWidth: 740, margin: '0 auto' }}
          >
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <SectionHeader eyebrow="Memory" title="Training Data" sub={`${training.length} answer${training.length !== 1 ? 's' : ''} remembered — Claude gets more consistent with every application.`} />
              {training.length > 0 && (
                <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
                  <button onClick={() => deleteTraining()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--red)' }}>Clear all training data</button>
                </motion.div>
              )}
              {loadingTraining ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3].map(i => (
                    <GlassCard key={i} padding="14px 20px">
                      <Skeleton height={11} width="40%" style={{ marginBottom: 8 }} />
                      <Skeleton height={14} width="70%" />
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {training.length === 0 && (
                    <motion.div variants={fadeUp} style={{ textAlign: 'center', padding: '80px 0' }}>
                      <p style={{ fontSize: 36, marginBottom: 16 }}>◈</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No training data yet. Run your first application to start building Claude&apos;s memory.</p>
                    </motion.div>
                  )}
                  {training.map(ex => (
                    <motion.div key={ex.id} variants={fadeUp}>
                      <GlassCard padding="14px 20px">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.03em' }}>{ex.question_text}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{ex.answer_given}</p>
                            {ex.job_url && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.job_url}</p>}
                          </div>
                          <button onClick={() => deleteTraining(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, flexShrink: 0, lineHeight: 1 }}>×</button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
