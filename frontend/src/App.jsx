import React, { Suspense, lazy, useState } from 'react';
import { useTheme } from './context/ThemeContext';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import PageBackground from './components/PageBackground';
import CarLoader from './components/CarLoader';
import CookieConsent from './components/CookieConsent';
import TermsModal from './components/TermsModal';

// Dynamic code-splitting: loads page bundles on-demand to speed up initial site rendering
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Trips = lazy(() => import('./pages/Trips'));
const TripDetail = lazy(() => import('./pages/TripDetail'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const Profile = lazy(() => import('./pages/Profile'));
const Cars = lazy(() => import('./pages/Cars'));
const Admin = lazy(() => import('./pages/Admin'));
const GlassMockup = lazy(() => import('./pages/GlassMockup'));
const ForgotPasswordChat = lazy(() => import('./pages/ForgotPasswordChat'));

function AppFooter({ onOpenTerms }) {
  const { t, language } = useTheme();
  const isTh = language === 'th';

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('open-cookie-settings'));
  };

  return (
    <footer className="morning-footer border-t py-6 text-center text-xs">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>{t('footerCopyright')}</div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => onOpenTerms('terms')}
            className="hover:text-emerald-700 hover:underline cursor-pointer"
          >
            {isTh ? 'ข้อกำหนดการใช้งาน' : 'Terms of Service'}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onOpenTerms('pdpa')}
            className="hover:text-emerald-700 hover:underline cursor-pointer"
          >
            {isTh ? 'นโยบายความเป็นส่วนตัว (PDPA)' : 'Privacy Policy'}
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={handleOpenCookieSettings}
            className="hover:text-emerald-700 hover:underline cursor-pointer"
          >
            {isTh ? 'การตั้งค่าคุกกี้' : 'Cookie Settings'}
          </button>
        </div>
      </div>
    </footer>
  );
}

function RoutedMain() {
  const location = useLocation();

  return (
    <main className={`flex-grow page-enter ${location.pathname === '/' ? 'home-main' : ''}`} key={location.pathname}>
      <Suspense fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <CarLoader text="กำลังโหลดหน้าเว็บ..." />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/glass-mockup" element={<GlassMockup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPasswordChat />} />
          <Route path="/register" element={<Register />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route path="/create-trip" element={<CreateTrip />} />
          <Route path="/my-trips" element={<MyTrips />} />
          <Route path="/my_trips" element={<MyTrips />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </main>
  );
}

export default function App() {
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState('terms');

  const handleOpenTerms = (tab = 'terms') => {
    setTermsTab(tab);
    setTermsModalOpen(true);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <div className="site-shell min-h-screen flex flex-col justify-between selection:bg-[var(--accent)] selection:text-white">
          <PageBackground />
          <Navbar />
          <RoutedMain />
          <AppFooter onOpenTerms={handleOpenTerms} />
          <CookieConsent onOpenTerms={() => handleOpenTerms('cookie')} />
          <TermsModal
            isOpen={termsModalOpen}
            onClose={() => setTermsModalOpen(false)}
            initialTab={termsTab}
          />
        </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
