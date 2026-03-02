import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== passwordConfirm) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(email, password, displayName);
      navigate('/onboarding');
    } catch {
      // Error is already set in store
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-radial from-sage/5 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-lavender mb-2">Stillpoint</h1>
          <p className="text-offwhite/50 text-sm">Begin your practice</p>
        </div>

        <div className="bg-navy-light/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8 shadow-xl">
          <h2 className="text-lg font-semibold text-offwhite mb-6">Create your account</h2>

          {displayedError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-error/15 border border-error/25 rounded-xl p-3 mb-4"
            >
              <p className="text-error text-sm">{displayedError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm text-offwhite/70 mb-1.5">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-offwhite placeholder-offwhite/30 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-offwhite/70 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-offwhite placeholder-offwhite/30 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-offwhite/70 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-offwhite placeholder-offwhite/30 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm text-offwhite/70 mb-1.5">
                Confirm password
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full bg-navy-dark/50 border border-white/10 rounded-xl px-4 py-3 text-offwhite placeholder-offwhite/30 text-sm focus:outline-none focus:border-lavender/50 focus:ring-1 focus:ring-lavender/20 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-lavender text-navy font-semibold py-3 rounded-xl text-sm hover:bg-lavender-light transition-colors focus:outline-none focus:ring-2 focus:ring-lavender/50 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-navy/40 border-t-navy animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-offwhite/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-lavender hover:text-lavender-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
