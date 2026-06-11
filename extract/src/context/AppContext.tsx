import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audit, ClerkUser, DashboardView } from '../types';
import { generateCustomAudit, BASELINE_DEMO_AUDIT } from '../data/mockAudits';

interface AppContextType {
  user: ClerkUser | null;
  audits: Audit[];
  freeAuditsRemaining: number;
  currentView: DashboardView;
  setView: (view: DashboardView) => void;
  login: (firstName: string, email: string) => void;
  signup: (firstName: string, lastName: string, email: string) => void;
  logout: () => void;
  triggerAudit: (businessName: string, category: string, city: string) => Promise<{ success: boolean; audit?: Audit; error?: string }>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isUpgradeModalOpen: boolean;
  setUpgradeModalOpen: (open: boolean) => void;
  onboardingData: { businessName: string; category: string; city: string } | null;
  setOnboardingData: (data: { businessName: string; category: string; city: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClerkUser | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [freeAuditsRemaining, setFreeAuditsRemaining] = useState<number>(1);
  const [currentView, setView] = useState<DashboardView>('overview');
  
  // Modals
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<{ businessName: string; category: string; city: string } | null>(null);

  // Load state from localStorage on init
  useEffect(() => {
    const savedUser = localStorage.getItem('dhwani_user');
    const savedAudits = localStorage.getItem('dhwani_audits');
    const savedCount = localStorage.getItem('dhwani_free_count');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedAudits) {
      setAudits(JSON.parse(savedAudits));
    } else {
      // Seed with demo-acme-seo is nice
      setAudits([BASELINE_DEMO_AUDIT]);
    }
    if (savedCount !== null) {
      setFreeAuditsRemaining(Number(savedCount));
    }
  }, []);

  const login = (firstName: string, email: string) => {
    const mockUser: ClerkUser = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName: firstName || 'Explorer',
      lastName: 'User',
      avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(firstName || 'Explorer')}`,
    };
    setUser(mockUser);
    localStorage.setItem('dhwani_user', JSON.stringify(mockUser));
    setAuthModalOpen(false);

    // If there is pending onboarding data, convert it directly into their first audit!
    if (onboardingData) {
      const generated = generateCustomAudit(
        onboardingData.businessName,
        onboardingData.category,
        onboardingData.city
      );
      const updatedAudits = [generated];
      setAudits(updatedAudits);
      localStorage.setItem('dhwani_audits', JSON.stringify(updatedAudits));
      setFreeAuditsRemaining(0);
      localStorage.setItem('dhwani_free_count', '0');
      setOnboardingData(null);
      setView('overview');
    }
  };

  const signup = (firstName: string, lastName: string, email: string) => {
    const mockUser: ClerkUser = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName: firstName || 'Explorer',
      lastName: lastName || 'User',
      avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(firstName || 'Explorer')}`,
    };
    setUser(mockUser);
    localStorage.setItem('dhwani_user', JSON.stringify(mockUser));
    setAuthModalOpen(false);

    if (onboardingData) {
      const generated = generateCustomAudit(
        onboardingData.businessName,
        onboardingData.category,
        onboardingData.city
      );
      const updatedAudits = [generated];
      setAudits(updatedAudits);
      localStorage.setItem('dhwani_audits', JSON.stringify(updatedAudits));
      setFreeAuditsRemaining(0);
      localStorage.setItem('dhwani_free_count', '0');
      setOnboardingData(null);
      setView('overview');
    }
  };

  const logout = () => {
    setUser(null);
    setAudits([BASELINE_DEMO_AUDIT]);
    setFreeAuditsRemaining(1);
    localStorage.removeItem('dhwani_user');
    localStorage.removeItem('dhwani_audits');
    localStorage.removeItem('dhwani_free_count');
    setView('overview');
  };

  const triggerAudit = async (businessName: string, category: string, city: string): Promise<{ success: boolean; audit?: Audit; error?: string }> => {
    if (!user) {
      // Store pending design data so they can seamless convert
      setOnboardingData({ businessName, category, city });
      setAuthModalOpen(true);
      return { success: false, error: 'Auth required' };
    }

    if (freeAuditsRemaining <= 0) {
      setUpgradeModalOpen(true);
      return { success: false, error: 'Paywall triggered' };
    }

    const newAudit = generateCustomAudit(businessName, category, city);
    const updatedAudits = [newAudit, ...audits.filter(a => a.id !== 'demo-acme-seo')];
    setAudits(updatedAudits);
    localStorage.setItem('dhwani_audits', JSON.stringify(updatedAudits));

    const remaining = freeAuditsRemaining - 1;
    setFreeAuditsRemaining(remaining);
    localStorage.setItem('dhwani_free_count', String(remaining));

    return { success: true, audit: newAudit };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        audits,
        freeAuditsRemaining,
        currentView,
        setView,
        login,
        signup,
        logout,
        triggerAudit,
        isAuthModalOpen,
        setAuthModalOpen,
        isUpgradeModalOpen,
        setUpgradeModalOpen,
        onboardingData,
        setOnboardingData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
