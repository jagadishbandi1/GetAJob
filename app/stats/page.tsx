'use client';

import { useState, useEffect } from 'react';

interface CheckIn { id: number; score: number; note: string | null; date: string }
interface Goal { id: number; title: string; color: string }
interface Milestone { id: number; goal_id: number; text: string; completed: number }

const ACCENT = '#60935D';
const SCORE_COLORS = ['#dc2626', '#d97706', '#ca8a04', '#60935D', '#3c5e39'];
const SCORE_LABELS = ['Rough', 'Meh', 'Okay', 'Good', 'Great'];

function GoalInitial({ color, title, size = 36 }: { color: string; title: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0 }}>
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

export default function StatsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [streak, setStreak] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch('/api/grip/checkins'), fetch('/api/grip/streak'), fetch('/api/grip/goals')])
      .then(([chr, sr, gr]) => Promise.all([chr.json(), sr.json(), gr.json()]))
      .then(([{ checkIns: ci }, { streak: s }, { goals: g, milestones: ms }]) => {
        setCheckIns(ci); setStreak(s); setGoals(g); setMilestones(ms); setLoading(false);
      });
  }, []);

  const last7 = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Yest' : d.toLocaleDateString('en', { weekday: 'short' });
      days.push({ date: dateStr, label, checkIn: checkIns.find(c => c.date === dateStr) ?? null });
    }
    return days;
  })();

  const avgScore = checkIns.length ? (checkIns.reduce((s, c) => s + c.score, 0) / checkIns.length).toFixed(1) : null;

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</span></div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Stats</span>
      </div>

      <div style={{ padding: '14px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Top metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>STREAK</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: streak > 0 ? '#d97706' : 'var(--border)', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{streak === 1 ? 'day' : 'days'}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>AVG SCORE</div>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: avgScore ? SCORE_COLORS[Math.round(parseFloat(avgScore)) - 1] : 'var(--border)' }}>{avgScore ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{checkIns.length} check-ins</div>
          </div>
        </div>

        {/* 7-day chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 14 }}>LAST 7 DAYS</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
            {last7.map(({ date, label, checkIn }) => {
              const barH = checkIn ? (checkIn.score / 5) * 56 + 8 : 4;
              const barColor = checkIn ? SCORE_COLORS[checkIn.score - 1] : 'var(--border)';
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', borderRadius: 4, height: barH, background: barColor, transition: 'height 0.3s', opacity: checkIn ? 1 : 0.35 }} />
                  <div style={{ fontSize: 9, fontWeight: isToday ? 700 : 400, color: isToday ? ACCENT : 'var(--text-muted)', textAlign: 'center' }}>{label}</div>
                </div>
              );
            })}
          </div>
          {checkIns.length === 0 && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Check in daily to see your trend</div>}
        </div>

        {/* Goals progress */}
        {goals.length > 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 14 }}>GOALS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {goals.map(goal => {
                const ms = milestones.filter(m => m.goal_id === goal.id);
                const done = ms.filter(m => m.completed).length;
                const pct = ms.length ? Math.round((done / ms.length) * 100) : null;
                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <GoalInitial color={goal.color} title={goal.title} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</div>
                        {ms.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{done}/{ms.length} milestones</div>}
                      </div>
                      {pct !== null && <span style={{ fontSize: 13, fontWeight: 700, color: goal.color }}>{pct}%</span>}
                    </div>
                    {ms.length > 0 && (
                      <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: goal.color, borderRadius: 99 }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent notes */}
        {checkIns.some(c => c.note) && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>RECENT NOTES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checkIns.filter(c => c.note).slice(0, 5).map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: `${SCORE_COLORS[c.score - 1]}14`, border: `1px solid ${SCORE_COLORS[c.score - 1]}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: SCORE_COLORS[c.score - 1] }}>
                    {c.score}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{new Date(c.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && checkIns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Nothing to show yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>Add goals and check in daily to see your stats here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
