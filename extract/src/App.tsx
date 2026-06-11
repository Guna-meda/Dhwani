import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './components/landing/LandingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AuthModal from './components/auth/AuthModal';
import UpgradeModal from './components/ui/UpgradeModal';

function AppContent() {
  const { user } = useApp();

  return (
    <>
      {/* Dynamic Screen Routing */}
      {!user ? (
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
