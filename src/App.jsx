import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardLayout from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import VitalsPage from './pages/VitalsPage';
import AddVitalsPage from './pages/AddVitalsPage';
import VitalsChartPage from './pages/VitalsChartPage';
import AIRiskPage from './pages/AIRiskPage';
import BreathingPage from './pages/BreathingPage';
import HealthGoalsPage from './pages/HealthGoalsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import DoctorPage from './pages/DoctorPage';
import DoctorHomePage from './pages/DoctorHomePage';
import PatientsPage from './pages/PatientsPage';
import AlertsPage from './pages/AlertsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import ShareVitalsPage from './pages/ShareVitalsPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import HistoryPage from './pages/HistoryPage';

const ModulePlaceholder = ({ title }) => (
  <div style={{ padding: '40px', textAlign: 'center', animation: 'fadeInUp 0.4s ease' }}>
    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h2>
    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 32px' }}>
      We're currently building out this feature to provide you with the best clinical management experience. stay tuned!
    </p>
    <div style={{ display: 'inline-block', padding: '16px 32px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-strong)' }}>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>Coming Soon</p>
    </div>
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-secondary)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(0,102,204,0.15)', borderTopColor: '#0066CC', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

import React, { useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Load accent color globally on startup
    const savedAccent = localStorage.getItem('accentColor');
    if (savedAccent && savedAccent !== 'blue') {
      document.documentElement.setAttribute('data-accent', savedAccent);
    } else {
      document.documentElement.removeAttribute('data-accent');
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Dashboard with nested routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={user?.role === 'doctor' ? <DoctorHomePage /> : <HomePage />} />
            <Route path="vitals" element={<VitalsPage />} />
            <Route path="share-vitals" element={<ShareVitalsPage />} />
            <Route path="add-vitals" element={<AddVitalsPage />} />
            <Route path="charts" element={<VitalsChartPage />} />
            <Route path="ai-risk" element={<AIRiskPage />} />
            <Route path="breathing" element={<BreathingPage />} />
            <Route path="goals" element={<HealthGoalsPage />} />
            <Route path="doctor" element={<DoctorPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary >
  );
}

export default App;
