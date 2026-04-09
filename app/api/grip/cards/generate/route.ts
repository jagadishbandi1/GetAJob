import { getDb } from '@/lib/grip-db';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST() {
  const db = getDb();

  const goals = db.prepare('SELECT * FROM goals').all() as { id: number; title: string; description: string | null }[];
  if (!goals.length) {
    return Response.json({ error: 'No goals found. Add a goal first.' }, { status: 400 });
  }

  const goalList = goals.map(g => `- ${g.title}${g.description ? `: ${g.description}` : ''}`).join('\n');
  const goalTitles = goals.map(g => g.title);

  const systemPrompt = `You are a content engine for a personal development app. The user has the following goals:
${goalList}

Generate 12 short content cards. Each card must be tagged to one of the user's exact goal titles listed above.

Card types to rotate between: tip, fact, reframe, resource, challenge

Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {
    "goal_tag": "exact goal title from list",
    "card_type": "tip | fact | reframe | resource | challenge",
    "title": "short punchy headline under 10 words",
    "body": "2-4 sentences. Conversational, direct, no fluff, no em-dashes."
  }
]`;

  let cards: { goal_tag: string; card_type: string; title: string; body: string }[] = [];

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: systemPrompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const parsed = JSON.parse(cleaned);

    // Filter to only valid goal tags
    cards = parsed.filter((c: { goal_tag: string }) => goalTitles.includes(c.goal_tag));
  } catch (err) {
    console.error('Claude API error:', err);
    return Response.json({ error: 'Failed to generate content' }, { status: 500 });
  }

  const insert = db.prepare(
    'INSERT INTO content_cards (goal_tag, card_type, title, body) VALUES (?, ?, ?, ?)'
  );

  const insertMany = db.transaction(() => {
    for (const card of cards) {
      insert.run(card.goal_tag, card.card_type, card.title, card.body);
    }
  });
  insertMany();

  return Response.json({ generated: cards.length });
}
