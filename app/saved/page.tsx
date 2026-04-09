'use client';

import { useState, useEffect } from 'react';

interface ContentCard {
  id: number;
  goal_tag: string;
  card_type: string;
  title: string;
  body: string;
  saved: number;
}

const ACCENT = '#60935D';

const CARD_TYPE_LABELS: Record<string, string> = {
  tip: 'TIP',
  fact: 'FACT',
  reframe: 'REFRAME',
  resource: 'RESOURCE',
  challenge: 'CHALLENGE',
};

export default function SavedPage() {
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch('/api/grip/cards?saved=true');
    const { cards: c } = await res.json();
    setCards(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnsave = async (id: number) => {
    await fetch(`/api/grip/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: false }),
    });
    setCards(prev => prev.filter(c => c.id !== id));
  };

  // Group by goal_tag
  const grouped: Record<string, ContentCard[]> = {};
  for (const card of cards) {
    if (!grouped[card.goal_tag]) grouped[card.goal_tag] = [];
    grouped[card.goal_tag].push(card);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 80 }}>
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.03em' }}>Saved</span>
      </div>

      <div style={{ padding: '14px', maxWidth: 480, margin: '0 auto' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a4a4a', fontSize: 13 }}>Loading...</div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `${ACCENT}14`, border: `1px solid ${ACCENT}28`,
              margin: '0 auto 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v17l-7-3.5L5 21V4z" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginBottom: 6 }}>Nothing saved yet</div>
            <p style={{ fontSize: 13, color: '#4a4a4a', lineHeight: 1.65 }}>
              Bookmark cards from the feed and they'll show up here.
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([goalTag, groupCards]) => (
            <div key={goalTag} style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#4a4a4a',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: '1px solid #1a1a1a',
              }}>
                {goalTag}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {groupCards.map(card => (
                  <div
                    key={card.id}
                    style={{ borderRadius: 14, padding: '16px', background: '#141414', border: '1px solid #242424' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                        color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`,
                        padding: '2px 7px', borderRadius: 5,
                      }}>
                        {CARD_TYPE_LABELS[card.card_type] ?? card.card_type.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleUnsave(card.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: ACCENT, padding: '2px 4px',
                        }}
                        aria-label="Remove from saved"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={ACCENT} stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round">
                          <path d="M5 4a2 2 0 012-2h10a2 2 0 012 2v17l-7-3.5L5 21V4z" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0', marginBottom: 6, lineHeight: 1.35 }}>
                      {card.title}
                    </div>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
