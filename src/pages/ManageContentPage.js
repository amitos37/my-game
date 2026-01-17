import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ManageContentPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newTask, setNewTask] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [newCatName, setNewCatName] = useState('');
  const [catTimedEnabled, setCatTimedEnabled] = useState(false);
  const [catDuration, setCatDuration] = useState(30);
  const [catDesignImage, setCatDesignImage] = useState(''); 
  const [catBackImage, setCatBackImage] = useState('');    
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // Resize Logic
  const [formWidth, setFormWidth] = useState(380);
  const [formHeight, setFormHeight] = useState(550);
  const isResizing = useRef(false);

  // כיווץ תמונות למניעת שגיאת Payload
  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let width = img.width; let height = img.height;
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadProgress(50);
      const compressed = await compressImage(reader.result);
      if (type === 'front') setCatDesignImage(compressed);
      else setCatBackImage(compressed);
      setUploadProgress(100);
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); alert("התמונה עלתה בהצלחה!"); }, 500);
    };
    reader.readAsDataURL(file);
  };

  // יבוא אקסל
  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (data.length === 0) return;
      setIsUploading(true);
      const existingCatsSnap = await getDocs(collection(db, "categories"));
      const catMap = {};
      existingCatsSnap.forEach(doc => { catMap[doc.data().name.trim()] = doc.id; });
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const catName = (row.category || "").toString().trim();
        const content = (row.content || "").toString().trim();
        if (catName && content) {
          let catId = catMap[catName];
          if (!catId) {
            const newCatRef = await addDoc(collection(db, "categories"), { name: catName, isTimed: false, duration: 0 });
            catId = newCatRef.id; catMap[catName] = catId;
          }
          await addDoc(collection(db, "tasks"), { content, categoryId: catId, createdAt: new Date() });
        }
        setUploadProgress(Math.round(((i + 1) / data.length) * 100));
      }
      setIsUploading(false);
      alert("הייבוא הסתיים בהצלחה!");
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveTask = async () => {
    if (!newTask || !selectedCat) return alert("אנא הזן תוכן ובחר קטגוריה");
    if (editingTaskId) {
      await updateDoc(doc(db, "tasks", editingTaskId), { content: newTask, categoryId: selectedCat });
      setEditingTaskId(null);
    } else {
      await addDoc(collection(db, "tasks"), { content: newTask, categoryId: selectedCat, createdAt: new Date() });
    }
    setNewTask(''); setSelectedCat('');
  };

  const handleSaveCategory = async () => {
    if (!newCatName) return alert("הזן שם לקטגוריה");
    const catData = { 
      name: newCatName || "", 
      isTimed: catTimedEnabled ?? false, 
      duration: Number(catDuration) || 0,
      designImage: catDesignImage || "", 
      backImage: catBackImage || ""
    };
    if (editingCategoryId) await updateDoc(doc(db, "categories", editingCategoryId), catData);
    else await addDoc(collection(db, "categories"), catData);
    setNewCatName(''); setCatTimedEnabled(false); setCatDuration(30);
    setCatDesignImage(''); setCatBackImage(''); setEditingCategoryId(null);
  };

  const handleDeleteAll = async (collectionName) => {
    if (!window.confirm("למחוק הכל?")) return;
    const querySnapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  };

  const startResizing = useCallback((e) => {
    e.preventDefault(); isResizing.current = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
  }, []);

  const handleResizing = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX - 40; 
    const rect = document.querySelector('.form-side').getBoundingClientRect();
    const newHeight = e.clientY - rect.top;
    if (newWidth > 300 && newWidth < 900) setFormWidth(newWidth);
    if (newHeight > 300 && newHeight < 900) setFormHeight(newHeight);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
  }, []);

  useEffect(() => {
    onSnapshot(collection(db, "tasks"), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, "categories"), s => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  return (
    <div className="admin-layout">
      {isUploading && (
        <div className="upload-progress-overlay">
          <div className="progress-box">
            <h2 className="progress-title">מעבד נתונים...</h2>
            <div className="bar-container"><div className="bar-fill" style={{ width: `${uploadProgress}%` }}></div></div>
            <p className="progress-text">{uploadProgress}%</p>
          </div>
        </div>
      )}

      <header className="header">
        <div className="right-header-area">
          <button className="back-neon" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
        </div>
        <h1 className="center-title">ניהול תוכן וקלפים</h1>
      </header>

      <div className="tabs-row">
        <div className="pill">
          <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>ניהול משימות</button>
          <button className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>ניהול קטגוריות</button>
        </div>
      </div>

      <div className="main-grid" style={{ gridTemplateColumns: `${formWidth}px 1fr` }}>
        <div className="form-side" style={{ height: formHeight }}>
          <div className="luxury-card full-h">
            <h3 className="card-subtitle">{activeTab === 'tasks' ? (editingTaskId ? 'עדכון משימה' : 'משימה חדשה') : (editingCategoryId ? 'עדכון קטגוריה' : 'פרטי קטגוריה')}</h3>
            <div className="stack scrollable-form luxury-scroll">
              {activeTab === 'tasks' ? (
                <>
                  <textarea className="luxury-input task-area" value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="הקלד תוכן משימה כאן..." />
                  <select className="luxury-input" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                    <option value="">בחר קטגוריה למשימה...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="neon-btn-action" onClick={handleSaveTask}>{editingTaskId ? 'עדכן' : 'שמור משימה'}</button>
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                  <button className="import-excel-btn" onClick={handleImportClick}>📥 יבוא משימות</button>
                </>
              ) : (
                <>
                  <input className="luxury-input" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="שם הקטגוריה..." />
                  <div className="upload-grid card-style-previews">
                    <label className={`file-btn portrait-card ${catDesignImage ? 'loaded' : ''}`}>
                      {catDesignImage ? <img src={catDesignImage} className="preview-img-full" alt="F" /> : <span className="btn-text">📸 בחר חזית</span>}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'front')} hidden />
                    </label>
                    <label className={`file-btn portrait-card ${catBackImage ? 'loaded' : ''}`}>
                      {catBackImage ? <img src={catBackImage} className="preview-img-full" alt="B" /> : <span className="btn-text">🃏 בחר גב</span>}
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'back')} hidden />
                    </label>
                  </div>
                  <div className="timed-toggle-container">
                    <div className="timed-toggle-box">
                      <span className="toggle-label">משימות לפי זמן</span>
                      <label className="lamp-switch">
                        <input type="checkbox" checked={catTimedEnabled} onChange={(e) => setCatTimedEnabled(e.target.checked)} />
                        <span className="lamp-slider"></span>
                      </label>
                    </div>
                    {catTimedEnabled && <input type="number" className="luxury-input" value={catDuration} onChange={(e) => setCatDuration(e.target.value)} placeholder="שניות..." />}
                  </div>
                  <button className="neon-btn-action" onClick={handleSaveCategory}>{editingCategoryId ? 'עדכן' : 'שמור'}</button>
                </>
              )}
            </div>
            <div className="full-resize-handle" onMouseDown={startResizing}></div>
          </div>
        </div>

        <div className="list-side">
          <div className="list-container">
            <div className="thead-with-action">
               <h3 className="list-label">{activeTab === 'tasks' ? 'רשימת משימות' : 'רשימת קטגוריות'}</h3>
               <button className="delete-all-btn" onClick={() => handleDeleteAll(activeTab)}>🗑️ מחק הכל</button>
            </div>
            {/* מיכל הגלילה המשוחזר */}
            <div className="tbody-scroll luxury-scroll">
              {(activeTab === 'tasks' ? tasks : categories).map(item => (
                <div key={item.id} className="trow">
                  <div className="red-line"></div>
                  <div className="info-flex">
                      <span className="task-txt">{activeTab === 'tasks' ? item.content : item.name}</span>
                      {activeTab === 'categories' && (item.designImage || item.backImage) && (
                        <div className="mini-designs-preview">
                          {item.designImage && <img src={item.designImage} alt="F" className="mini-thumb" />}
                          {item.backImage && <img src={item.backImage} alt="B" className="mini-thumb" />}
                        </div>
                      )}
                  </div>
                  <div className="acts">
                    <button className="icon pencil" onClick={() => {
                        if (activeTab === 'tasks') { setEditingTaskId(item.id); setNewTask(item.content); setSelectedCat(item.categoryId); }
                        else { setEditingCategoryId(item.id); setNewCatName(item.name); setCatTimedEnabled(item.isTimed); setCatDuration(item.duration); setCatDesignImage(item.designImage); setCatBackImage(item.backImage); }
                    }}>✏️</button>
                    <button className="icon trash" onClick={() => deleteDoc(doc(db, activeTab, item.id))}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; font-weight: 400 !important; }
        .admin-layout { background: #000; height: 100vh; color: #fff; direction: rtl; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .header { height: 75px; background: #050505; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; padding: 0 40px; flex-shrink: 0; }
        .center-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 1.5rem; margin: 0; }
        
        .back-neon { background: transparent; border: 2px solid #ff003c; color: #ff003c; padding: 8px 22px; border-radius: 10px; cursor: pointer; transition: 0.3s; }
        .back-neon:hover { background: #ff003c; color: #fff; box-shadow: 0 0 20px #ff003c; }

        .tabs-row { display: flex; justify-content: center; margin: 20px 0; flex-shrink: 0; }
        .pill { display: flex; background: #111; padding: 4px; border-radius: 12px; border: 1px solid #222; }
        .pill button { background: transparent; border: none; color: #555; padding: 10px 25px; border-radius: 9px; cursor: pointer; }
        .pill button.active { background: #ff003c; color: #fff; }

        /* הגדרת גובה קבועה להפעלת גלילה */
        .main-grid { display: grid; gap: 30px; padding: 0 40px 30px 40px; flex: 1; min-height: 0; height: calc(100vh - 180px); }
        .form-side { height: 100%; min-height: 0; }
        .list-side { height: 100%; min-height: 0; display: flex; flex-direction: column; }
        
        .luxury-card { background: #0a0a0a; padding: 25px; border-radius: 20px; border: 1px solid #1a1a1a; display: flex; flex-direction: column; position: relative; height: 100%; }
        .scrollable-form { flex: 1; overflow-y: auto; padding-left: 5px; }

        .list-container { flex: 1; display: flex; flex-direction: column; background: #050505; border-radius: 20px; padding: 20px; border: 1px solid #111; overflow: hidden; }
        .tbody-scroll { flex: 1; overflow-y: auto; padding-left: 15px; }
        .thead-with-action { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1a1a1a; padding-bottom: 15px; margin-bottom: 30px; flex-shrink: 0; }

        .trow { position: relative; background: #0d0d0d; border-radius: 12px; margin-bottom: 10px; border: 1px solid #1a1a1a; display: flex; align-items: center; padding: 15px 25px; justify-content: space-between; }
        .red-line { position: absolute; right: 0; top: 0; width: 4px; height: 100%; background: #ff003c; border-radius: 0 12px 12px 0; }
        .info-flex { display: flex; align-items: center; flex: 1; justify-content: flex-start; gap: 15px; }
        .task-txt { color: #eee; line-height: 1.5; text-align: right; font-size: 1rem; flex: 1; direction: rtl; }

        .acts { display: flex; gap: 12px; flex-shrink: 0; margin-right: 20px; }
        .icon { background: none; border: none; cursor: pointer; font-size: 1.2rem; opacity: 0.3; transition: 0.2s; }
        .icon:hover { opacity: 1; transform: scale(1.1); }
        .icon.pencil { color: #00f2ff; }

        .luxury-input { width: 100%; background: #141414; border: 1px solid #222; color: #fff; padding: 14px; border-radius: 10px; margin-bottom: 12px; outline: none; }
        .neon-btn-action { width: 100%; background: #1a1a1a; border: 1px solid #fff; color: #fff; padding: 15px; border-radius: 12px; cursor: pointer; transition: 0.4s; }
        .neon-btn-action:hover { background: #fff; color: #000; box-shadow: 0 0 20px #fff; }
        
        .import-excel-btn { width: 100%; background: #1a1a1a; border: 1px solid #00ff41; color: #00ff41; padding: 14px; border-radius: 12px; cursor: pointer; margin-top: 10px; transition: 0.4s; }
        .import-excel-btn:hover { background: #00ff41; color: #000; box-shadow: 0 0 20px #00ff41; }
        
        .delete-all-btn { background: transparent; border: 1px solid #ff003c; color: #ff003c; padding: 8px 18px; border-radius: 10px; cursor: pointer; transition: 0.4s; }
        .delete-all-btn:hover { background: #ff003c; color: #fff; box-shadow: 0 0 15px #ff003c; }

        .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .portrait-card { height: 160px !important; }
        .file-btn { background: #141414; border: 1px dashed #333; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }
        .preview-img-full { width: 100%; height: 100%; object-fit: contain; }
        .mini-designs-preview { display: flex; gap: 4px; flex-shrink: 0; }
        .mini-thumb { width: 24px; height: 32px; border-radius: 4px; object-fit: cover; border: 1px solid #333; }

        .luxury-scroll::-webkit-scrollbar { width: 6px; }
        .luxury-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .full-resize-handle { position: absolute; bottom: 0; left: 0; width: 30px; height: 30px; cursor: sw-resize; background: linear-gradient(135deg, #ff003c 0%, transparent 50%); border-radius: 0 0 0 15px; opacity: 0.4; }
      `}</style>
    </div>
  );
};

export default ManageContentPage;