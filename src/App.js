import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ייבוא כל הדפים מהתיקייה pages
import LoginPage from './pages/LoginPage';
import MainMenuPage from './pages/MainMenuPage';
import AdminMenuPage from './pages/AdminMenuPage';
import ManageContentPage from './pages/ManageContentPage';
import UserManagementPage from './pages/UserManagementPage';
import MobileGamePage from './pages/MobileGamePage';
import EmergencyPage from './pages/EmergencyPage';
import SettingsPage from './pages/SettingsPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <Router>
      <Routes>
        {/* הגדרת נתיבים לכל דפי המערכת */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/main-menu" element={<MainMenuPage />} />
        <Route path="/admin-menu" element={<AdminMenuPage />} />
        <Route path="/manage-content" element={<ManageContentPage />} />
        <Route path="/user-management" element={<UserManagementPage />} />
        <Route path="/mobile-game" element={<MobileGamePage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </Router>
  );
}

export default App;