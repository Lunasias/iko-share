import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import PageBackground from './components/PageBackground';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import CreateTrip from './pages/CreateTrip';
import MyTrips from './pages/MyTrips';
import Profile from './pages/Profile';
import Cars from './pages/Cars';
import Admin from './pages/Admin';
import GlassMockup from './pages/GlassMockup';

function RoutedMain() {
  const location = useLocation();

  return (
    <main className="flex-grow page-enter" key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/glass-mockup" element={<GlassMockup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/my-trips" element={<MyTrips />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <div className="site-shell min-h-screen flex flex-col justify-between selection:bg-[var(--accent)] selection:text-white">
          <PageBackground />
          <Navbar />
          <RoutedMain />
          <footer className="morning-footer border-t py-6 text-center text-xs">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>© 2026 Iko Share. สงวนลิขสิทธิ์ทุกประการ</div>
              <div className="flex gap-4">
                <span>ระบบคาร์พูลแชร์รถเดินทาง</span>
                <span>•</span>
                <span>Vercel + Neon Postgres</span>
              </div>
            </div>
          </footer>
        </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
