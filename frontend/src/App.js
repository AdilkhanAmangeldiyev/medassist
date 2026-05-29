import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DoctorsPage from './pages/DoctorsPage';
import DoctorDetailPage from './pages/DoctorDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AiPage from './pages/AiPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', background: '#F8FFFE', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            <Route path="/appointments" element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
            <Route path="/ai"      element={<PrivateRoute><AiPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute role="patient"><ProfilePage /></PrivateRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
