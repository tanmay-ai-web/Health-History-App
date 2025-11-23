// client/src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Zaroori components jo hum agle step mein banayenge
import LoginRegisterPage from './pages/LoginRegisterPage'; 
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import './App.css'; 

// --- Protected Route Component ---
// Yeh component check karta hai ki user logged in hai aur role match karta hai
const ProtectedRoute = ({ element: Component, allowedRole, ...rest }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />; // Agar token nahi hai, toh Login page par bhej dega
  }
  
  if (allowedRole && role !== allowedRole) {
    // Agar role galat hai, toh uske default dashboard par bhej dega
    return <Navigate to={role === 'Doctor' ? "/doctor" : "/patient"} replace />;
  }
  
  // Agar sab theek hai, toh component render karega
  return <Component {...rest} />;
};

function App() {
  // Local Storage se initial state lena
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || null);

  // Login hone par state update karna
  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  // Logout function
  const handleLogout = () => {
    // Local Storage se saare data remove karna
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_identity');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <div className="App">
        {/* Header/Navigation Bar */}
        <header>
          <h1>🏥 Health History App (Hackathon MVP)</h1>
          {isLoggedIn && (
            <button onClick={handleLogout} style={{float: 'right', margin: '10px', padding: '8px 15px', cursor: 'pointer'}}>
              Logout ({userRole})
            </button>
          )}
        </header>

        <Routes>
          {/* 1. Default Route: Login/Register Page (Unprotected) */}
          <Route path="/" element={<LoginRegisterPage onLogin={handleLogin} />} />

          {/* 2. Dashboard Redirect: Login ke baad sahi dashboard par bhejta hai */}
          <Route path="/dashboard" element={
            isLoggedIn ? 
              (<Navigate to={userRole === 'Doctor' ? "/doctor" : "/patient"} replace />)
              : 
              (<Navigate to="/" replace />)
          } />

          {/* 3. Protected Doctor Route */}
          <Route path="/doctor" element={
            <ProtectedRoute element={DoctorDashboard} allowedRole="Doctor" />
          } />

          {/* 4. Protected Patient Route */}
          <Route path="/patient" element={
            <ProtectedRoute element={PatientDashboard} allowedRole="Patient" />
          } />

          {/* 5. Catch-all for 404 */}
          <Route path="*" element={<h1>404: Page Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;