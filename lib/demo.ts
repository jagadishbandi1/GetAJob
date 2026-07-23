// Demo-mode guard. On Vercel (prod) the app is a public showcase: the real
// autofiller can't run there anyway, so we never read or write real data.
// Reads return clearly-fake sample data and writes are no-ops. All real usage
// (with your actual resume + applications) happens locally, against the DB.
export const isDemo = (): boolean => !!process.env.VERCEL;

export const DEMO_PROFILE = {
  id: 1,
  full_name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '(415) 555-0182',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexrivera',
  website: 'alexrivera.dev',
  resume_text:
    'Product manager with 6 years building design-forward web apps. Led 0-to-1 launches, ran discovery, and shipped weekly with small teams.',
  free_context: 'open to remote. most excited about early-stage product work.',
  resume_file_name: 'alex_rivera_resume.pdf',
  gmail_connected: false,
};

export const DEMO_RULES = [
  { id: 1, trigger_keyword: 'salary', response: '$140k', created_at: '' },
  { id: 2, trigger_keyword: 'notice period', response: '2 weeks', created_at: '' },
];
