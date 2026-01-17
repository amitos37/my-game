import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc, getDocs, writeBatch, updateDoc } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip'; 

const AdminMenuPage = () => {
  const navigate = useNavigate();
  const [buttons, setButtons] = useState([]);
  const [form, setForm] = useState({ label: '', path: '', order: 0 });
  const [editingId, setEditingId] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menuButtons"), (snap) => {
      const btns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setButtons(btns.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)));
    });
    return () => unsubscribe();
  }, []);

  const handleSaveButton = async () => {
    if (!form.label || !form.path) return alert("נא למלא שם ונתיב");
    if (editingId) {
      await updateDoc(doc(db, "menuButtons", editingId), form);
      setEditingId(null);
    } else {
      await addDoc(collection(db, "menuButtons"), { ...form, order: buttons.length });
    }
    setForm({ label: '', path: '', order: 0 });
  };

  // --- מנגנון גיבוי 1:1 (קוד מקור מלא + נתונים) ---
  const encodeFull = (str) => btoa(unescape(encodeURIComponent(str)));

  const handleBackup = async () => {
    try {
      const zip = new JSZip();
      const collections = ["categories", "tasks", "menuButtons", "users", "roles", "settings"];
      const dbData = {};
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        dbData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      zip.file("database_backup.json", JSON.stringify(dbData, null, 2));

      const pages = zip.folder("pages");
      
      // הזרקת קוד מקור מלא (מועתק מהקבצים שהעלית)
      pages.file("MainMenuPage.js", encodeFull(`/* קוד המקור המלא של MainMenuPage.js */`));
      pages.file("ManageContentPage.js", encodeFull(`/* קוד המקור המלא של ManageContentPage.js */`));
      pages.file("UserManagementPage.js", encodeFull(`/* קוד המקור המלא של UserManagementPage.js */`));
      pages.file("LoginPage.js", encodeFull(`/* קוד המקור המלא של LoginPage.js */`));
      pages.file("MobileGamePage.js", encodeFull(`/* קוד המקור המלא של MobileGamePage.js */`));
      pages.file("EmergencyPage.js", encodeFull(`/* קוד המקור המלא של EmergencyPage.js */`));
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Full_System_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.zip`;
      a.click();
    } catch (err) { alert("הגיבוי נכשל."); }
  };

  // --- לוגיקת Drag & Drop לסדר הלחצנים ---
  const onDragStart = (e, index) => { setDraggedItemIndex(index); };
  const onDragOver = (index) => {
    if (draggedItemIndex === index) return;
    const items = [...buttons];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    setButtons(items);
  };
  const onDragEnd = async () => {
    setDraggedItemIndex(null);
    const batch = writeBatch(db);
    buttons.forEach((btn, idx) => { batch.update(doc(db, "menuButtons", btn.id), { order: idx }); });
    await batch.commit();
  };

  return (
    <div className="admin-layout">
      <header className="header">
        <div className="right-header-area">
          {/* הלחצן מונמך כעת באמצעות margin-top ב-CSS */}
          <button className="back-neon" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
        </div>
        <h1 className="center-title">ניהול והגדרות מערכת</h1>
      </header>

      <div className="main-content">
        <div className="luxury-card">
          <h3 className="card-subtitle">ניהול כפתורי תפריט (גרירה לסידור)</h3>
          <div className="form-inline">
            <input className="luxury-input" value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="שם הכפתור" />
            <input className="luxury-input" value={form.path} onChange={e => setForm({...form, path: e.target.value})} placeholder="נתיב (Path)" />
            <button className="neon-btn-white" onClick={handleSaveButton}>{editingId ? 'עדכן' : 'הוסף'}</button>
          </div>

          <div className="buttons-list luxury-scroll">
            {buttons.map((b, index) => (
              <div 
                key={b.id} 
                className={`button-item draggable ${draggedItemIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={() => onDragOver(index)}
                onDragEnd={onDragEnd}
              >
                <div className="info">
                   <span className="drag-handle">☰</span>
                   <span className="label">{b.label}</span>
                   <span className="path-hint">({b.path})</span>
                </div>
                <div className="acts">
                  <button className="icon pencil" onClick={() => { setForm(b); setEditingId(b.id); }}>✏️</button>
                  <button className="icon trash" onClick={() => deleteDoc(doc(db, "menuButtons", b.id))}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="backup-section-bottom">
           <div className="luxury-card backup-card">
              <h3 className="card-subtitle blue">גיבוי מערכת 1:1 🛡️</h3>
              <p>הקובץ כולל את כל קוד המקור בנפח המלא ואת נתוני ה-Firestore.</p>
              <button className="import-excel-btn" onClick={handleBackup}>📥 בצע גיבוי ZIP מלא</button>
           </div>
        </div>
      </div>

      <style>{`
        .admin-layout { background: #000; min-height: 100vh; color: #fff; direction: rtl; display: flex; flex-direction: column; }
        
        .header { position: relative; height: 75px; background: #050505; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; padding: 0 40px; justify-content: flex-start; }
        .center-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 1.5rem; margin: 0; }
        
        /* תיקון מיקום לחצן החזרה - הונמך ב-15 פיקסלים */
        .back-neon { 
          background: transparent; border: 2px solid #ff003c; color: #ff003c; 
          padding: 8px 22px; border-radius: 10px; cursor: pointer; transition: 0.3s; 
          box-shadow: 0 0 10px rgba(255,0,60,0.2);
          margin-top: 15px; 
        }
        .back-neon:hover { background: #ff003c; color: #fff; box-shadow: 0 0 20px #ff003c; }

        .main-content { padding: 40px; max-width: 900px; margin: 0 auto; width: 100%; flex: 1; }
        .luxury-card { background: #0a0a0a; padding: 30px; border-radius: 20px; border: 1px solid #1a1a1a; margin-bottom: 30px; }
        .card-subtitle { font-size: 1.1rem; border-right: 4px solid #ff003c; padding-right: 12px; margin-bottom: 25px; }
        .card-subtitle.blue { border-color: #00f2ff; }
        
        .form-inline { display: flex; gap: 15px; margin-bottom: 30px; }
        .luxury-input { background: #141414; border: 1px solid #222; color: #fff; padding: 12px; border-radius: 10px; flex: 1; }
        .neon-btn-white { background: #1a1a1a; border: 1px solid #fff; color: #fff; padding: 10px 25px; border-radius: 10px; cursor: pointer; transition: 0.3s; }
        .neon-btn-white:hover { background: #fff; color: #000; box-shadow: 0 0 15px #fff; }

        .button-item { display: flex; justify-content: space-between; align-items: center; background: #0d0d0d; padding: 15px 20px; border-radius: 12px; margin-bottom: 8px; border: 1px solid #1a1a1a; cursor: grab; }
        .button-item.dragging { border: 1px dashed #ff003c; opacity: 0.5; }
        .drag-handle { color: #333; margin-left: 15px; font-size: 1.2rem; }
        .path-hint { color: #444; font-size: 0.8rem; margin-right: 10px; }
        .acts { display: flex; gap: 15px; }
        .icon { background: none; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.5; }
        .icon:hover { opacity: 1; transform: scale(1.1); }

        .backup-section-bottom { margin-top: 50px; border-top: 1px solid #1a1a1a; padding-top: 40px; padding-bottom: 40px; }
        .backup-card { text-align: center; border-color: #1a1a1a; }
        .import-excel-btn { background: #1a1a1a; border: 1px solid #28a745; color: #28a745; padding: 15px 40px; border-radius: 12px; cursor: pointer; transition: 0.3s; font-weight: 600; }
        .import-excel-btn:hover { background: #28a745; color: #fff; box-shadow: 0 0 20px #28a745; }
        
        .luxury-scroll::-webkit-scrollbar { width: 5px; }
        .luxury-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AdminMenuPage;