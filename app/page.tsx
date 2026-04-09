'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Goal { id: number; title: string; color: string; description: string | null }
interface Milestone { id: number; goal_id: number; text: string; completed: number }
interface ContentCard { id: number; goal_tag: string; card_type: string; title: string; body: string; seen: number; saved: number }

type FeedItem =
  | { type: 'goal-reminder'; goal: Goal; milestones: Milestone[] }
  | { type: 'content'; card: ContentCard }
  | { type: 'nudge'; text: string; goalColor: string };

const ACCENT = '#60935D';
const CARD_TYPE_LABELS: Record<string, string> = { tip: 'TIP', fact: 'FACT', reframe: 'REFRAME', resource: 'RESOURCE', challenge: 'CHALLENGE' };
const SCORE_COLORS = ['#dc2626', '#d97706', '#ca8a04', '#60935D', '#3c5e39'];
const SCORE_LABELS = ['Rough', 'Meh', 'Okay', 'Good', 'Great'];

function GoalInitial({ color, title, size = 36 }: { color: string; title: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: `${color}18`, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0,
    }}>
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

function GoalReminderCard({ goal, milestones }: { goal: Goal; milestones: Milestone[] }) {
  const total = milestones.length;
  const done = milestones.filter(m => m.completed).length;
  const pct = total ? Math.round((done / total) * 100) : null;

  return (
    <div style={{
      borderRadius: 16, padding: '20px',
      background: `linear-gradient(145deg, ${goal.color}10 0%, var(--bg-card) 70%)`,
      border: `1px solid ${goal.color}28`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <GoalInitial color={goal.color} title={goal.title} />
        <div>
          <div style={{ fontSize: 10, color: goal.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1 }}>Goal</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{goal.title}</div>
        </div>
      </div>
      {goal.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 12 }}>{goal.description}</p>}
      {total > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontSize: 11, color: goal.color, fontWeight: 600 }}>{done}/{total} done</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: goal.color, borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {milestones.slice(0, 4).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${m.completed ? goal.color : 'var(--border)'}`,
                  background: m.completed ? goal.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!!m.completed && <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontSize: 13, color: m.completed ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: m.completed ? 'line-through' : 'none' }}>
                  {m.text}
                </span>
              </div>
            ))}
            {total > 4 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{total - 4} more</span>}
          </div>
        </>
      )}
    </div>
  );
}

function ContentCardView({ card, onSave }: { card: ContentCard; onSave: (id: number, saved: boolean) => void }) {
  const [saved, setSaved] = useState(!!card.saved);
  const label = CARD_TYPE_LABELS[card.card_type] ?? card.card_type.toUpperCase();
  const handleSave = () => { const next = !saved; setSaved(next); onSave(card.id, next); };

  return (
    <div style={{ borderRadius: 16, padding: '18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}28`, padding: '2px 7px', borderRadius: 5 }}>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{card.goal_tag}</span>
        </div>
        <button onClick={handleSave} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: saved ? ACCENT : 'var(--text-muted)', transition: 'color 0.15s' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? ACCENT : 'none'} stroke={saved ? ACCENT : 'currentColor'} strokeWidth="1.5" strokeLinejoin="round">
            <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v17l-7-3.5L5 21V4z" />
          </svg>
        </button>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 7, lineHeight: 1.35 }}>{card.title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{card.body}</p>
    </div>
  );
}

function NudgeCardView({ text, goalColor, onAction }: { text: string; goalColor: string; onAction: (a: 'done' | 'skip') => void }) {
  const [acted, setActed] = useState<'done' | 'skip' | null>(null);
  if (acted) return (
    <div style={{ borderRadius: 14, padding: '14px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{acted === 'done' ? 'Checked in' : 'Skipped'}</span>
    </div>
  );
  return (
    <div style={{ borderRadius: 14, padding: '16px 18px', background: `${goalColor}08`, border: `1px solid ${goalColor}22` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#d97706', marginBottom: 5 }}>NUDGE</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{text}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setActed('done'); onAction('done'); }} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: goalColor, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
        <button onClick={() => { setActed('skip'); onAction('skip'); }} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Skip</button>
      </div>
    </div>
  );
}

function CheckInModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (score: number, note: string) => void }) {
  const [score, setScore] = useState<number | null>(null);
  const [note, setNote] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.3)' }} onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: 'var(--bg)', borderTop: '1px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}
      >
        <div style={{ width: 36, height: 3, background: 'var(--border)', borderRadius: 99, margin: '0 auto 22px' }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Daily Check-In</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>How was today?</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 22 }}>
          {SCORE_COLORS.map((color, i) => (
            <button key={i} onClick={() => setScore(i + 1)} style={{
              width: 52, height: 52, borderRadius: 12,
              background: score === i + 1 ? `${color}12` : 'var(--bg-elevated)',
              border: `1.5px solid ${score === i + 1 ? color : 'var(--border)'}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 8, color: score === i + 1 ? color : 'var(--text-muted)', letterSpacing: '0.03em', fontWeight: 600 }}>{SCORE_LABELS[i].toUpperCase()}</span>
            </button>
          ))}
        </div>
        <textarea placeholder="Anything to note? (optional)" value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ marginBottom: 14, resize: 'none' }} />
        <button disabled={!score} onClick={() => score && onSubmit(score, note)} style={{
          width: '100%', padding: '13px', borderRadius: 11, border: 'none',
          background: score ? ACCENT : 'var(--bg-elevated)', color: score ? '#fff' : 'var(--text-muted)',
          fontWeight: 700, fontSize: 15, cursor: score ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s',
        }}>Log it</button>
      </motion.div>
    </div>
  );
}

export default function FeedPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const storiesRef = useRef<HTMLDivElement>(null);

  const buildFeed = useCallback((gl: Goal[], ml: Milestone[], cl: ContentCard[], filter: string | null) => {
    const fc = filter ? cl.filter(c => c.goal_tag === filter) : cl;
    const fg = filter ? gl.filter(g => g.title === filter) : gl;
    const items: FeedItem[] = [];
    let ci = 0, gi = 0;
    while (ci < fc.length || gi < fg.length) {
      if (gi < fg.length && ci % 4 === 0) {
        const g = fg[gi % fg.length];
        items.push({ type: 'goal-reminder', goal: g, milestones: ml.filter(m => m.goal_id === g.id) });
        gi++;
      }
      for (let i = 0; i < 3 && ci < fc.length; i++) items.push({ type: 'content', card: fc[ci++] });
    }
    if (fg.length) {
      [3, 9].forEach(pos => {
        if (pos < items.length) {
          const g = fg[Math.floor(Math.random() * fg.length)];
          items.splice(pos, 0, { type: 'nudge', text: `Check in on "${g.title}"`, goalColor: g.color });
        }
      });
    }
    setFeedItems(items);
  }, []);

  const load = useCallback(async () => {
    const [gr, cr, chr, sr] = await Promise.all([
      fetch('/api/grip/goals'), fetch('/api/grip/cards'),
      fetch('/api/grip/checkins'), fetch('/api/grip/streak'),
    ]);
    const { goals: g, milestones: ms } = await gr.json();
    const { cards: c } = await cr.json();
    const { todayCheckIn } = await chr.json();
    const { streak: s } = await sr.json();
    setGoals(g); setMilestones(ms); setCards(c); setStreak(s); setTodayCheckedIn(!!todayCheckIn);
    buildFeed(g, ms, c, activeGoal);
  }, [activeGoal, buildFeed]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { buildFeed(goals, milestones, cards, activeGoal); }, [activeGoal, goals, milestones, cards, buildFeed]);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch('/api/grip/cards/generate', { method: 'POST' });
    await load();
    setGenerating(false);
  };

  const handleSave = async (cardId: number, saved: boolean) => {
    await fetch(`/api/grip/cards/${cardId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ saved }) });
  };

  const handleCheckInSubmit = async (score: number, note: string) => {
    await fetch('/api/grip/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score, note }) });
    setShowCheckIn(false); setTodayCheckedIn(true);
    const { streak: s } = await (await fetch('/api/grip/streak')).json();
    setStreak(s);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)', padding: '12px 16px 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>GRIP</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {streak > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706', background: '#d9770610', border: '1px solid #d9770625', padding: '3px 9px', borderRadius: 99 }}>
                {streak} day streak
              </span>
            )}
            <button onClick={() => setShowCheckIn(true)} style={{
              background: todayCheckedIn ? 'var(--bg-elevated)' : ACCENT,
              color: todayCheckedIn ? 'var(--text-muted)' : '#fff',
              border: todayCheckedIn ? '1px solid var(--border)' : 'none',
              borderRadius: 9, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{todayCheckedIn ? 'Checked in' : 'Check In'}</button>
          </div>
        </div>
        {goals.length > 0 && (
          <div ref={storiesRef} style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }} className="scrollbar-hide">
            <button onClick={() => setActiveGoal(null)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 99,
              border: `1px solid ${activeGoal === null ? ACCENT : 'var(--border)'}`,
              background: activeGoal === null ? `${ACCENT}10` : 'transparent',
              color: activeGoal === null ? ACCENT : 'var(--text-muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>All</button>
            {goals.map(goal => (
              <button key={goal.id} onClick={() => setActiveGoal(activeGoal === goal.title ? null : goal.title)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 99,
                border: `1px solid ${activeGoal === goal.title ? goal.color : 'var(--border)'}`,
                background: activeGoal === goal.title ? `${goal.color}10` : 'transparent',
                color: activeGoal === goal.title ? goal.color : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: goal.color, display: 'inline-block' }} />
                {goal.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, margin: '0 auto' }}>
        {goals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={ACCENT} strokeWidth="1.5" /><circle cx="12" cy="12" r="4" stroke={ACCENT} strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" fill={ACCENT} /></svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No goals yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>Set your first goal to start filling your feed with content that actually matters.</p>
            <a href="/goals" style={{ display: 'inline-block', background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '11px 22px', textDecoration: 'none' }}>Add a Goal</a>
          </div>
        ) : feedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Feed is empty</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 24 }}>Generate your first batch of content cards.</p>
            <button onClick={handleGenerate} disabled={generating} style={{ background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '11px 22px', border: 'none', cursor: generating ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {generating ? 'Generating...' : 'Generate Feed'}
            </button>
          </div>
        ) : (
          <>
            {feedItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.22 }}>
                {item.type === 'goal-reminder' && <GoalReminderCard goal={item.goal} milestones={item.milestones} />}
                {item.type === 'content' && <ContentCardView card={item.card} onSave={handleSave} />}
                {item.type === 'nudge' && <NudgeCardView text={item.text} goalColor={item.goalColor} onAction={() => {}} />}
              </motion.div>
            ))}
            <button onClick={handleGenerate} disabled={generating} style={{
              width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
              background: 'var(--bg-elevated)', color: generating ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: generating ? 'wait' : 'pointer', fontFamily: 'inherit', marginTop: 4,
            }}>{generating ? 'Generating...' : 'Refresh Feed'}</button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showCheckIn && <CheckInModal onClose={() => setShowCheckIn(false)} onSubmit={handleCheckInSubmit} />}
      </AnimatePresence>
    </div>
  );
}
