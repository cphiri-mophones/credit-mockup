import { SitepingInbox } from '@siteping/dashboard';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, TextField } from '../components/ui';
import { FEEDBACK_PROJECT } from '../components/Feedback';

type Session = 'checking' | 'signed-out' | 'signed-in';

export function Admin() {
  const [session, setSession] = useState<Session>('checking');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin-session')
      .then((r) => r.json())
      .then((d: { admin: boolean }) => setSession(d.admin ? 'signed-in' : 'signed-out'))
      .catch(() => setSession('signed-out'));
  }, []);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const r = await fetch('/api/admin-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
    if (!r.ok) {
      setError('That key is not right.');
      return;
    }
    setKey('');
    setSession('signed-in');
  };

  const signOut = async () => {
    await fetch('/api/admin-session', { method: 'DELETE' });
    setSession('signed-out');
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 font-sans text-gray-900">
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Design comments</h1>
          <span className="text-sm text-gray-600">Triage the comments reviewers pinned on the credit review mockup</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#/queue" className="text-sm font-semibold text-indigo-700">
            Back to the mockup
          </a>
          {session === 'signed-in' && (
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          )}
        </div>
      </header>
      {session === 'signed-in' && (
        <div className="min-h-0 flex-1">
          <SitepingInbox
            projects={FEEDBACK_PROJECT}
            endpoint="/api/siteping"
            siteUrl={window.location.origin}
            author={{ name: 'MoPhones team' }}
            accentColor="#4338ca"
            theme="light"
            className="h-full"
          />
        </div>
      )}
      {session === 'signed-out' && (
        <form onSubmit={signIn} className="mx-auto mt-16 flex w-full max-w-md flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[17px] font-bold">Sign in as admin</h2>
            <p className="text-sm text-gray-600">Use the SITEPING_API_KEY from the Vercel project. You stay signed in on this browser for 30 days.</p>
          </div>
          <TextField label="Admin key" type="password" required value={key} onChange={setKey} error={error || undefined} />
          <Button type="submit" disabled={key === ''}>
            Sign in
          </Button>
        </form>
      )}
    </div>
  );
}
