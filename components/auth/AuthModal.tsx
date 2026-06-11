'use client'

import { useState } from 'react'
import { useApp } from '@/lib/context/AppContext'
import { X, Shield, Lock, AlertCircle, Signal } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login, signup, onboardingData } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Fields state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please provide a valid email structure');
      return;
    }
    if (isSignUp && (!firstName || !lastName)) {
      setError('First and last names are required for Sign Up');
      return;
    }
    if (!isSignUp && !firstName) {
      setError('First name is required to personalize your workspace');
      return;
    }

    if (isSignUp) {
      signup(firstName, lastName, email);
    } else {
      login(firstName, email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="clerk-auth-modal">
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-6 md:p-8 overflow-hidden glow-border">
        {/* Subtle decorative background wave lines */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient opacity-10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-md transition-colors"
          aria-label="Close authentication modal"
          id="close-auth-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Branding Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-card border border-brand-border mb-3 text-brand-accent">
            <Signal className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-display font-medium text-brand-text">
            {isSignUp ? 'Create your Dhwani profile' : 'Sign in to Dhwani'}
          </h2>
          <p className="text-xs text-brand-muted mt-1 max-w-xs">
            {onboardingData 
              ? `Authenticate to generate the custom audit for "${onboardingData.businessName}"`
              : 'Analyze recommendation presence on GPT, Claude, and Gemini'}
          </p>
          
          <div className="flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 rounded-md px-2.5 py-0.5 mt-2.5 text-[10px] text-brand-accent font-mono">
            <Shield className="w-3 h-3" />
            <span>Securely verified by Clerk</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-red-200 text-xs text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSignUp ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">First name</label>
                <input
                  type="text"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-brand-bg px-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                  id="signup-firstname-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">Last name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-brand-bg px-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                  id="signup-lastname-input"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">First name</label>
              <input
                type="text"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-brand-bg px-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
                id="signin-firstname-input"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1.5">Email address</label>
            <input
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg px-3 py-2 text-sm text-brand-text border border-brand-border rounded-lg focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-sans"
              id="auth-email-input"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-accent text-brand-bg font-medium py-2.5 px-4 rounded-lg cursor-pointer select-none transition-all active:scale-[0.98]"
            id="auth-submit-btn"
          >
            <Lock className="w-4 h-4" />
            <span>{isSignUp ? 'Create secure account' : 'Access your dashboard'}</span>
          </button>
        </form>

        {/* Tab switcher */}
        <div className="mt-6 pt-5 border-t border-brand-border flex items-center justify-between text-xs">
          <span className="text-brand-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            onClick={() => {
              setError('');
              setIsSignUp(!isSignUp);
            }}
            className="text-brand-accent hover:underline focus:outline-none font-medium"
            id="toggle-signup-signin-btn"
          >
            {isSignUp ? 'Sign in instead' : 'Create an account'}
          </button>
        </div>

        {/* Meta compliance footnote */}
        <p className="mt-5 text-[10px] text-center text-brand-muted leading-relaxed">
          By continuing, you verify compliance with Dhwani's terms & privacy policies. Audits index LLM recommendations only.
        </p>
      </div>
    </div>
  );
}
