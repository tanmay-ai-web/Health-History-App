// client/src/pages/LoginRegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// API functions jo humne 'services/api.js' mein banaye the
import { loginUser, registerUser } from '../services/api';

function LoginRegisterPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true); // Login form dikhana by default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Patient'); // Register ke liye default role
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Navigation ke liye hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const data = await loginUser({ email, password });
        setMessage(`Login Successful! Welcome, ${data.role}.`);
        onLogin(data.role); // App.jsx mein state update karna
        navigate('/dashboard'); // Dashboard par redirect karna (App.jsx check karega ki kahan jaana hai)
      } else {
        // --- REGISTER LOGIC ---
        const data = await registerUser({ email, password, role });
        
        // Registration successful hone par user ko uska unique ID dikhana
        setMessage(`Registration Successful! Your Unique ID: ${data.id}. Please login now.`);
        
        // Form ko login mode par switch karna
        setIsLogin(true);
        // Email aur password fields ko clear kar dena
        setEmail(''); 
        setPassword('');
      }
    } catch (error) {
      // Error handling (agar server se 401, 409 jaisa error aaye)
      const errorMsg = error.response?.data?.msg || 'An unknown error occurred. Check server.';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
      <h2>{isLogin ? '🔑 User Login' : '📝 New User Registration'}</h2>
      
      {/* Login aur Register ke beech switch karne ka button */}
      <button 
        onClick={() => setIsLogin(!isLogin)}
        style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: 'none', cursor: 'pointer' }}
      >
        Switch to {isLogin ? 'Register' : 'Login'}
      </button>
      
      {/* Message display area */}
      <p style={{ color: message.startsWith('Error') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />

        {!isLogin && (
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            required
            style={{ padding: '10px' }}
          >
            <option value="Patient">Patient (View History)</option>
            <option value="Doctor">Doctor (Upload/View History)</option>
          </select>
        )}
        
        <button 
          type="submit"
          style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          {isLogin ? 'Log In' : 'Register Account'}
        </button>
      </form>
    </div>
  );
}

export default LoginRegisterPage;