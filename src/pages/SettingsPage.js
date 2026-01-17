import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [menuButtons, setMenuButtons] = useState([]);
  const [newBtnLabel, setNewBtnLabel] = useState('');
  const [newBtnPath, setNewBtnPath] = useState('');
  const [newBtnOrder, setNewBtnOrder] = useState('');
  const [editingBtn, setEditingBtn] = useState(null);
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menuButtons"), (snap) => {
      const btns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuButtons(btns.sort((a, b) => Number(a.order) - Number(b.order)));
    });
    return () => unsub();
  }, []);

  const handleSaveButton = async () => {
    if (!newBtnLabel || !newBtnPath) return;
    const btnData = { label: newBtnLabel, path: newBtnPath, order: Number(newBtnOrder) || 0 };
    if (editingBtn) {
      await updateDoc(doc(db, "menuButtons", editingBtn.id), btnData);
      setEditingBtn(null);
    } else {
      await addDoc(collection(db, "menuButtons"), btnData);
    }
    setNewBtnLabel(''); setNewBtnPath(''); setNewBtnOrder('');
  };

  const handleSuperBackup = async () => {
    setBackupStatus('מכין גיבוי כולל של כלל המערכת...');
    try {
      const collections = ["categories", "tasks", "menuButtons"];
      const backup = {};
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        backup[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `SYSTEM_SUPER_BACKUP_${new Date().toLocaleDateString()}.json`);
      downloadAnchor.click();
      setBackupStatus('הגיבוי נשמר בהצלחה! 🛡️');
    } catch (e) { setBackupStatus('שגיאה בגיבוי'); }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file || !window.confirm("זהירות! שחזור ימחק הכל ויחזיר את המצב לגיבוי. להמשיך?")) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = JSON.parse(evt.target.result);
      for (const colName in data) {
        const snap = await getDocs(collection(db, colName));
        const delBatch = writeBatch(db);
        snap.forEach(d => delBatch.delete(doc(db, colName, d.id)));
        await delBatch.commit();
        const insBatch = writeBatch(db);
        data[colName].forEach(item => {
          const { id, ...rest } = item;
          insBatch.set(doc(collection(db, colName)), rest);
        });
        await insBatch.commit();
      }
      alert("המערכת שוחזרה במלואה!");
      window.location.reload();
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1 className="title-centered-white">הגדרות מערכת</h1>
        <button className="back-btn-outline" onClick={() => navigate('/admin-menu')}>חזרה לתפריט</button>
      </div>

      <div className="settings-content">
        <div className="column-form">
          <div className="glass-card">
            <h3 className="sub-title">ניהול לחצני תפריט</h3>
            <input value={newBtnLabel} onChange={e => setNewBtnLabel(e.target.value)} placeholder="שם הלחצן" />
            <input value={newBtnPath} onChange={e => setNewBtnPath(e.target.value)} placeholder="נתיב (למשל: /manage-content)" />
            <input type="number" value={newBtnOrder} onChange={e => setNewBtnOrder(e.target.value)} placeholder="סדר (1, 2, 3...)" />
            <button className="outline-btn-red" onClick={handleSaveButton}>{editingBtn ? 'עדכן לחצן' : 'הוסף לתפריט'}</button>
          </div>

          <div className="glass-card backup-zone">
            <h3 className="sub-title">גיבוי ושחזור על</h3>
            <button className="full-green-btn" onClick={handleSuperBackup}>בצע גיבוי מערכת כולל 🛡️</button>
            <p className="status-msg">{backupStatus}</p>
            <label className="restore-link">שחזר מערכת מקובץ גיבוי 📂<input type="file" hidden onChange={handleRestore} /></label>
          </div>
        </div>

        <div className="column-list">
          <h3 className="sub-title">סדר הלחצנים הנוכחי</h3>
          <div className="items-list">
            {menuButtons.map(btn => (
              <div key={btn.id} className="item-row fade-in">
                <div className="accent-line"></div>
                <div className="row-info">
                   <span className="order-pill">#{btn.order}</span>
                   <p className="label-txt">{btn.label}</p>
                   <small className="path-txt">{btn.path}</small>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" onClick={() => deleteDoc(doc(db, "menuButtons", btn.id))}>🗑️</button>
                  <button className="icon-btn" onClick={() => { setEditingBtn(btn); setNewBtnLabel(btn.label); setNewBtnPath(btn.path); setNewBtnOrder(btn.order); }}>✏️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; font-weight: 400 !important; }
        .settings-container { background: #000; min-height: 100vh; color: #fff; direction: rtl; }
        
        .settings-header { position: relative; height: 80px; display: flex; align-items: center; padding: 0 40px; background: #050505; border-bottom: 1px solid #1a1a1a; justify-content: flex-end; }
        .title-centered-white { position: absolute; left: 50%; transform: translateX(-50%); color: #fff; font-size: 1.6rem; margin: 0; }
        .back-btn-outline { background: transparent; border: 2px solid #ff003c; color: #ff003c; padding: 8px 22px; border-radius: 10px; cursor: pointer; }

        .settings-content { display: grid; grid-template-columns: 1fr 1.6fr; gap: 40px; padding: 40px; }
        .glass-card { background: #0a0a0a; padding: 30px; border-radius: 20px; border: 1px solid #1a1a1a; margin-bottom: 30px; }
        .sub-title { border-right: 4px solid #ff003c; padding-right: 12px; margin-bottom: 25px; font-size: 1.2rem; }
        input { width: 100%; background: #141414; border: 1px solid #222; color: #fff; padding: 14px; border-radius: 12px; margin-bottom: 15px; }
        
        .outline-btn-red { width: 100%; background: transparent; border: 2px solid #ff003c; color: #ff003c; padding: 14px; border-radius: 10px; cursor: pointer; font-size: 1rem; }
        .full-green-btn { width: 100%; background: #28a745; color: #fff; border: none; padding: 16px; border-radius: 12px; font-size: 1.1rem; cursor: pointer; transition: 0.3s; }
        
        .item-row { position: relative; background: #0d0d0d; border-radius: 14px; margin-bottom: 10px; border: 1px solid #1a1a1a; overflow: hidden; display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; }
        .accent-line { position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: #ff003c; }
        .order-pill { font-size: 0.7rem; color: #ff003c; background: rgba(255,0,60,0.1); padding: 2px 8px; border-radius: 5px; }
        .label-txt { margin: 5px 0 0; font-size: 1.1rem; }
        .path-txt { color: #555; font-size: 0.8rem; }
        .icon-btn { background: none; border: none; color: #fff; opacity: 0.3; font-size: 1.2rem; cursor: pointer; }
        .restore-link { display: block; margin-top: 20px; color: #00f2ff; text-decoration: underline; cursor: pointer; text-align: center; font-size: 0.9rem; }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SettingsPage;