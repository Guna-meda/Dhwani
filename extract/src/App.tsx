import React from 'react';
import { AppProvider } from './context/AppContext';
import LandingPage from './components/landing/LandingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AuthModal from './components/auth/AuthModal';
import UpgradeModal from './components/ui/UpgradeModal';
import { useUser } from '@clerk/nextjs';

function AppContent() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return null;
  }

  return (
    <>
      {/* Dynamic Screen Routing */}
      {!isSignedIn ? (
        <LandingPage />
      ) : (
        <DashboardLayout />
      )}

      {/* Global Emulated Modals */}
      <AuthModal />
      <UpgradeModal />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
