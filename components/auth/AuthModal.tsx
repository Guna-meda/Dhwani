'use client'

import { useApp } from '@/lib/context/AppContext'
import { X, Shield, Signal } from 'lucide-react'
import { SignIn, SignUp, useAuth } from '@clerk/nextjs'

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
  } = useApp()
  const { isSignedIn } = useAuth()

  // Never mount <SignIn>/<SignUp> while a session already exists. Clerk
  // refuses to render them in that case and force-navigates via its own
  // afterSignIn redirect — which is what was bouncing people back out.
  // AppContext also closes the modal once isSignedIn flips true, but that
  // happens in an effect, and effects on this component (a descendant of
  // AppProvider) run before AppProvider's own effect does. So on the exact
  // render where isSignedIn first becomes true, isAuthModalOpen can still
  // be true for one paint — checking isSignedIn here directly, in the same
  // render pass, closes that gap instead of racing it.
  if (!isAuthModalOpen || isSignedIn) return null

  const isSignUp = authModalView === 'signUp'

  const clerkAppearance = {
    elements: {
      rootBox: 'w-full',
      card: 'shadow-none border-0 bg-transparent w-full',
      headerTitle: 'text-brand-text font-display',
      headerSubtitle: 'text-brand-muted',
      socialButtonsBlockButton: 'border-brand-border bg-brand-card text-brand-text hover:bg-brand-surface',
      formButtonPrimary: 'bg-brand-primary text-brand-bg hover:bg-brand-accent',
      formFieldInput: 'bg-brand-bg border-brand-border text-brand-text placeholder:text-brand-muted',
      footerActionLink: 'text-brand-accent hover:text-brand-accent',
    },
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      id="clerk-auth-modal"
    >
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-6 md:p-8 overflow-hidden glow-border">
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial-gradient opacity-10 pointer-events-none" />

        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-brand-muted hover:text-brand-text hover:bg-brand-card rounded-md transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-card border border-brand-border mb-3 text-brand-accent">
            <Signal className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl font-display font-medium text-brand-text">
            {isSignUp ? 'Create your Dhwani profile' : 'Sign in to Dhwani'}
          </h2>

          <p className="text-xs text-brand-muted mt-1 max-w-xs">
            Analyze recommendation presence on GPT, Claude, and Gemini
          </p>

          <div className="flex items-center gap-1 bg-brand-primary/10 border border-brand-primary/20 rounded-md px-2.5 py-0.5 mt-2.5 text-[10px] text-brand-accent font-mono">
            <Shield className="w-3 h-3" />
            <span>Securely verified by Clerk</span>
          </div>
        </div>

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp
              routing="hash"
              appearance={clerkAppearance}
            />
          ) : (
            <SignIn
              routing="hash"
              appearance={clerkAppearance}
            />
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between text-xs">
          <span className="text-brand-muted">
            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account?"}
          </span>

          <button
            onClick={() => setAuthModalView(isSignUp ? 'signIn' : 'signUp')}
            className="text-brand-accent hover:underline font-medium"
          >
            {isSignUp ? 'Sign in instead' : 'Create an account'}
          </button>
        </div>

        <p className="mt-5 text-[10px] text-center text-brand-muted leading-relaxed">
          By continuing, you verify compliance with Dhwani's terms & privacy
          policies. Audits index LLM recommendations only.
        </p>
      </div>
    </div>
  )
}