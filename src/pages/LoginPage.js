import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", password));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userData = snap.docs[0].data();
      localStorage.setItem('loggedUser', JSON.stringify(userData));
      navigate('/main-menu');
    } else {
      alert('פרטי התחברות שגויים');
    }
  };

  return (
    <div className="login-page">
      <form className="luxury-card login-box" onSubmit={handleLogin}>
        <h1 className="white-title">כניסה למערכת</h1>
        <input value={username} onChange={e => setUsername(e.target.value)} placeholder="שם משתמש" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="סיסמה" required />
        <button type="submit" className="standard-btn">התחבר</button>
      </form>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; font-weight: 400 !important; }
        
        .login-page { 
          background: #000; 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          direction: rtl; 
        }

        /* חלונית עם מסגרת ניאון אדומה */
        .luxury-card { 
          background: #0a0a0a; 
          padding: 40px; 
          border-radius: 20px; 
          border: 2px solid #ff0000; 
          width: 350px; 
          text-align: center; 
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.6), inset 0 0 10px rgba(255, 0, 0, 0.2);
        }

        .white-title { color: #fff; margin-bottom: 30px; font-size: 1.8rem; }
        
        input { 
          width: 100%; 
          background: #141414; 
          border: 1px solid #222; 
          color: #fff; 
          padding: 14px; 
          border-radius: 12px; 
          margin-bottom: 15px; 
          outline: none;
          transition: 0.3s;
        }
        
        input:focus {
          border-color: #ff0000;
          box-shadow: 0 0 8px rgba(255, 0, 0, 0.3);
        }

        .standard-btn { 
          width: 100%; 
          background: #1a1a1a; 
          border: 1px solid #fff; 
          color: #fff; 
          padding: 14px; 
          border-radius: 12px; 
          cursor: pointer; 
          transition: 0.4s; 
          font-size: 1.1rem;
        }
        
        .standard-btn:hover { 
          background: #fff; 
          color: #000; 
          box-shadow: 0 0 20px #fff; 
        }
      `}</style>
    </div>
  );
};

export default LoginPage;