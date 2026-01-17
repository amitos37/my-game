import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const MainMenuPage = () => {
  const navigate = useNavigate();
  const [buttons, setButtons] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('loggedUser'));
    if (!userData) return navigate('/');
    setUser(userData);

    const loadMenu = async () => {
      const allBtnsSnap = await getDocs(collection(db, "menuButtons"));
      const allBtns = allBtnsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (userData.username === 'admin') {
        setButtons(allBtns.sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0)));
      } else {
        const roleSnap = await getDocs(query(collection(db, "roles"), where("name", "==", userData.role)));
        if (!roleSnap.empty) {
          const perms = roleSnap.docs[0]?.data()?.permissions || [];
          setButtons(allBtns.filter(b => perms.includes(b.id)).sort((a,b) => (Number(a.order) || 0) - (Number(b.order) || 0)));
        }
      }
    };
    loadMenu();
  }, [navigate]);

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(" ");
    return parts.length === 1 ? parts[0].substring(0, 2) : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="menu-page">
      <header className="header">
        {/* תמונת המשתמש נשארת למעלה בצד ימין */}
        <div className="profile-circle">
          {user?.profileImg ? (
            <img src={user.profileImg} alt="פרופיל" className="profile-img" />
          ) : (
            <span className="initials">{getInitials(user?.fullName)}</span>
          )}
        </div>
        <h1 className="header-title">תפריט ראשי</h1>
      </header>

      <div className="menu-content-container">
        {/* השלום והשם המלא מעל הלחצנים */}
        <div className="user-welcome-above-stack">
          שלום, {user?.fullName}
        </div>

        <div className="stack">
          {/* הכפתורים שמוגדרים ב-AdminMenuPage יופיעו כאן */}
          {buttons.map(b => (
            <button key={b.id} className="standard-btn" onClick={() => navigate(b.path)}>{b.label}</button>
          ))}
          
          <button className="logout-btn" onClick={() => { localStorage.removeItem('loggedUser'); navigate('/'); }}>
            <span className="power-icon">⏻</span> התנתקו
          </button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap');
        
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; font-weight: 400 !important; }
        
        .menu-page { background: #000; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; direction: rtl; }
        
        .header { 
          position: fixed; top: 0; left: 0; right: 0; height: 75px; 
          background: #050505; border-bottom: 1px solid #1a1a1a; 
          display: flex; align-items: center; padding: 0 40px; 
          justify-content: flex-start; z-index: 100;
        }
        
        .header-title { 
          position: absolute; left: 50%; transform: translateX(-50%); 
          color: #fff; font-size: 1.4rem; margin: 0; 
        }

        .profile-circle { 
          width: 48px; height: 48px; border-radius: 50%; 
          background: #1a1a1a; border: 2px solid #ff003c; 
          display: flex; align-items: center; justify-content: center; 
          overflow: hidden; box-shadow: 0 0 10px rgba(255, 0, 60, 0.3);
        }
        
        .profile-img { width: 100%; height: 100%; object-fit: cover; }
        .initials { color: #fff; font-size: 1.1rem; font-weight: 600 !important; }

        .menu-content-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 40px;
        }

        /* עיצוב ברכת השלום מעל הלחצנים */
        .user-welcome-above-stack {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 25px;
          text-align: center;
        }

        .stack { display: flex; flex-direction: column; gap: 18px; width: 380px; }
        
        .standard-btn { 
          background: #1a1a1a; border: 1px solid #fff; color: #fff; 
          padding: 18px; border-radius: 15px; cursor: pointer; transition: 0.4s; font-size: 1.15rem; 
        }
        .standard-btn:hover { background: #fff; color: #000; box-shadow: 0 0 30px #fff; transform: translateY(-3px); }
        
        .logout-btn { 
          margin-top: 35px; background: #1a1a1a; border: 1px solid #ff003c; 
          color: rgba(255, 0, 60, 0.8); padding: 16px; border-radius: 12px; cursor: pointer; transition: 0.4s; 
          font-size: 1.05rem; display: flex; align-items: center; justify-content: center; gap: 12px;
        }
        .logout-btn:hover { background: #ff003c; color: #fff; box-shadow: 0 0 25px #ff003c; }
        
        .power-icon { font-size: 1.2rem; }
      `}</style>
    </div>
  );
};

export default MainMenuPage;