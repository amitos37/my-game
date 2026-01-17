import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, writeBatch } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const EmergencyPage = () => {
  const navigate = useNavigate();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleJsonRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsRestoring(true);
        const data = JSON.parse(evt.target.result);
        
        for (const [colName, docs] of Object.entries(data)) {
          const batch = writeBatch(db);
          docs.forEach(item => {
            const { id, ...rest } = item;
            batch.set(doc(db, colName, id), rest);
          });
          await batch.commit();
        }

        setIsRestoring(false);
        alert("שחזור הנתונים הושלם בהצלחה!");
        navigate('/');
      } catch (err) {
        console.error(err);
        setIsRestoring(false);
        alert("שגיאה בפורמט הקובץ");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="emergency-page">
      <div className="luxury-card">
        <h2 className="title">מערכת שחזור נתונים מהירה</h2>
        <p className="desc">העלה את קובץ הגיבוי (JSON) שנוצר במסך הניהול כדי לשחזר את כל המידע באופן מיידי.</p>
        
        <label className="restore-btn">
          📂 בחר קובץ גיבוי לשחזור
          <input type="file" hidden accept=".json" onChange={handleJsonRestore} />
        </label>
        
        {isRestoring && <div className="loader">משחזר נתונים ל-Firestore... נא לא לסגור את הדף.</div>}
      </div>
      
      <style>{`
        .emergency-page { background: #000; min-height: 100vh; display: flex; align-items: center; justify-content: center; direction: rtl; color: #fff; }
        .luxury-card { background: #0a0a0a; padding: 50px; border-radius: 30px; border: 1px solid #ff003c; width: 500px; text-align: center; }
        .title { color: #fff; margin-bottom: 15px; }
        .desc { color: #888; font-size: 0.9rem; margin-bottom: 40px; }
        .restore-btn { background: #1a1a1a; border: 1px solid #fff; color: #fff; padding: 15px 30px; border-radius: 15px; cursor: pointer; display: block; transition: 0.3s; }
        .restore-btn:hover { background: #fff; color: #000; box-shadow: 0 0 30px #fff; }
        .loader { margin-top: 30px; color: #00ff41; }
      `}</style>
    </div>
  );
};

export default EmergencyPage;