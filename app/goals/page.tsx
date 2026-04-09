'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Goal { id: number; title: string; color: string; description: string | null }
interface Milestone { id: number; goal_id: number; text: string; completed: number }
interface Nudge { id: number; goal_id: number; label: string; time_of_day: string; goal_title: string; goal_color: string }

const ACCENT = '#60935D';
const PALETTE = ['#60935D', '#7aad77', '#4e7a4b', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#0d9488'];

function GoalInitial({ color, title, size = 44 }: { color: string; title: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27),
      background: `${color}18`, border: `1px solid ${color}35`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color, flexShrink: 0,
    }}>
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

function GoalForm({ initial, onSave, onCancel }: {
  initial?: Partial<Goal & { milestones: string[] }>;
  onSave: (data: { title: string; color: string; description: string; milestones: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [color, setColor] = useState(initial?.color ?? ACCENT);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [milestones, setMilestones] = useState<string[]>(initial?.milestones ?? ['']);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px' }}
    >
      {/* Live preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <GoalInitial color={color} title={title || 'G'} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: title ? 'var(--text-primary)' : 'var(--text-muted)' }}>{title || 'Goal title'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{description || 'Why this matters to you'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>TITLE</label>
        <input placeholder="e.g. Get Fit, Launch My Business" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>COLOR</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PALETTE.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 26, height: 26, borderRadius: '50%', background: c,
              border: color === c ? '2.5px solid var(--text-primary)' : '2.5px solid transparent',
              outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 1,
              cursor: 'pointer', transition: 'all 0.1s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>WHY THIS MATTERS</label>
        <textarea placeholder="In one sentence, why does this goal matter?" value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ resize: 'none' }} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
          MILESTONES <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11, textTransform: 'none', letterSpacing: 0 }}>— optional</span>
        </label>
        {milestones.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input placeholder={`Milestone ${i + 1}`} value={m} onChange={e => { const n = [...milestones]; n[i] = e.target.value; setMilestones(n); }} />
            {milestones.length > 1 && (
              <button onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, padding: '0 2px', lineHeight: 1 }}>&times;</button>
            )}
          </div>
        ))}
        <button onClick={() => setMilestones([...milestones, ''])} style={{ width: '100%', padding: '8px', borderRadius: 9, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add milestone
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button disabled={!title.trim()} onClick={() => title.trim() && onSave({ title: title.trim(), color, description, milestones: milestones.filter(m => m.trim()) })} style={{
          flex: 2, padding: '11px', borderRadius: 10, border: 'none',
          background: title.trim() ? color : 'var(--bg-elevated)',
          color: title.trim() ? '#fff' : 'var(--text-muted)',
          fontSize: 14, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all 0.2s',
        }}>Save Goal</button>
      </div>
    </motion.div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nudgeForm, setNudgeForm] = useState<{ goalId: number; label: string; time: string } | null>(null);

  const load = async () => {
    const [gr, nr] = await Promise.all([fetch('/api/grip/goals'), fetch('/api/grip/nudges')]);
    const { goals: g, milestones: ms } = await gr.json();
    const { nudges: n } = await nr.json();
    setGoals(g); setMilestones(ms); setNudges(n);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: { title: string; color: string; description: string; milestones: string[] }) => {
    await fetch('/api/grip/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false); load();
  };

  const handleEdit = async (data: { title: string; color: string; description: string; milestones: string[] }) => {
    if (!editGoal) return;
    await fetch(`/api/grip/goals/${editGoal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditGoal(null); load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal and all its data?')) return;
    await fetch(`/api/grip/goals/${id}`, { method: 'DELETE' });
    load();
  };

  const handleToggleMilestone = async (goalId: number, milestoneId: number, completed: boolean) => {
    await fetch(`/api/grip/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ milestoneId, completed }) });
    setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, completed: completed ? 1 : 0 } : m));
  };

  const handleAddNudge = async () => {
    if (!nudgeForm?.label.trim() || !nudgeForm.time) return;
    await fetch('/api/grip/nudges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal_id: nudgeForm.goalId, label: nudgeForm.label, time_of_day: nudgeForm.time }) });
    setNudgeForm(null); load();
  };

  const handleDeleteNudge = async (id: number) => {
    await fetch('/api/grip/nudges', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>
      <div style={{
        padding: '14px 16px 12px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Goals</span>
        <button onClick={() => { setShowForm(true); setEditGoal(null); }} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, padding: '7px 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ New Goal</button>
      </div>

      <div style={{ padding: '14px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {showForm && !editGoal && <GoalForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
        </AnimatePresence>

        {goals.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={ACCENT} strokeWidth="1.5" /><circle cx="12" cy="12" r="4" stroke={ACCENT} strokeWidth="1.5" /><circle cx="12" cy="12" r="1.5" fill={ACCENT} /></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No goals yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>Add your first goal to get started.</p>
          </div>
        )}

        {goals.map(goal => {
          const ms = milestones.filter(m => m.goal_id === goal.id);
          const done = ms.filter(m => m.completed).length;
          const expanded = expandedId === goal.id;
          const goalNudges = nudges.filter(n => n.goal_id === goal.id);

          return (
            <div key={goal.id}>
              <AnimatePresence>
                {editGoal?.id === goal.id && <GoalForm initial={{ ...goal, milestones: ms.map(m => m.text) }} onSave={handleEdit} onCancel={() => setEditGoal(null)} />}
              </AnimatePresence>

              {editGoal?.id !== goal.id && (
                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                  <button onClick={() => setExpandedId(expanded ? null : goal.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <GoalInitial color={goal.color} title={goal.title} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{goal.title}</div>
                      {goal.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.description}</div>}
                    </div>
                    {ms.length > 0 && <span style={{ fontSize: 12, color: goal.color, fontWeight: 600, flexShrink: 0 }}>{done}/{ms.length}</span>}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="2,4 7,10 12,4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)' }}>
                          {ms.length > 0 && (
                            <div style={{ marginTop: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>MILESTONES</div>
                              {ms.map(m => (
                                <button key={m.id} onClick={() => handleToggleMilestone(goal.id, m.id, !m.completed)} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer', textAlign: 'left' }}>
                                  <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${m.completed ? goal.color : 'var(--border)'}`, background: m.completed ? goal.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                    {!!m.completed && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><polyline points="1.5,4.5 3.5,6.5 7.5,2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                  </div>
                                  <span style={{ fontSize: 13, color: m.completed ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: m.completed ? 'line-through' : 'none' }}>{m.text}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 8 }}>NUDGES</div>
                            {goalNudges.map(n => (
                              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{n.label}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{n.time_of_day}</div>
                                </div>
                                <button onClick={() => handleDeleteNudge(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px' }}>&times;</button>
                              </div>
                            ))}
                            {nudgeForm?.goalId === goal.id ? (
                              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input placeholder="Nudge label (e.g. Gym time)" value={nudgeForm.label} onChange={e => setNudgeForm({ ...nudgeForm, label: e.target.value })} />
                                <input type="time" value={nudgeForm.time} onChange={e => setNudgeForm({ ...nudgeForm, time: e.target.value })} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => setNudgeForm(null)} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                                  <button onClick={handleAddNudge} style={{ flex: 2, padding: '9px', borderRadius: 9, border: 'none', background: goal.color, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Add</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setNudgeForm({ goalId: goal.id, label: '', time: '' })} style={{ width: '100%', padding: '8px', borderRadius: 9, marginTop: 8, border: '1px dashed var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                + Add nudge
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button onClick={() => { setEditGoal(goal); setExpandedId(null); }} style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                            <button onClick={() => handleDelete(goal.id)} style={{ padding: '9px 14px', borderRadius: 9, border: '1px solid #fecaca', background: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
