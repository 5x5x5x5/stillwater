import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuthStore } from './stores/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/Toast';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import SessionDetailPage from './pages/SessionDetailPage';
import BreathingPage from './pages/BreathingPage';
import ProgressPage from './pages/ProgressPage';

function NamePrompt({ onSave }: { onSave: (name: string) => void }) {
  const [value, setValue] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (name) onSave(name);
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-4xl text-offwhite mb-2">Stillwater</h1>
        <p className="text-offwhite/50 text-sm mb-8">Find your calm.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-offwhite/40 uppercase tracking-widest mb-2">
              What should we call you?
            </label>
            <input
              id="name"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full bg-navy-light border border-white/10 rounded-xl px-4 py-3 text-offwhite placeholder-offwhite/30 focus:outline-none focus:ring-2 focus:ring-lavender/40 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full bg-lavender text-navy font-semibold rounded-xl py-3 text-sm hover:bg-lavender-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Begin
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const { isInitialized, displayName, initialize, setDisplayName } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-lavender border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!displayName) {
    return <NamePrompt onSave={setDisplayName} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/breathe" element={<BreathingPage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
  );
}
