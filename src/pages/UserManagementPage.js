import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useNavigate } from 'react-router-dom';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [menuButtons, setMenuButtons] = useState([]);
  const [userForm, setUserForm] = useState({ fullName: '', username: '', tz: '', email: '', phone: '', role: '', password: '', profileImg: '' });
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });
  const [editingUserId, setEditingUserId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // שליפת משתמשים עם מיון המציב את ה-admin בראש הרשימה
    onSnapshot(collection(db, "users"), s => {
      const allUsers = s.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = allUsers.sort((a, b) => a.username === 'admin' ? -1 : b.username === 'admin' ? 1 : 0);
      setUsers(sorted);
    });
    
    onSnapshot(collection(db, "roles"), s => setRoles(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(collection(db, "menuButtons"), s => setMenuButtons(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.order - b.order)));
  }, []);

  const handleImageUpload = (file) => {
    if (!file) return;
    const storageRef = ref(storage, `profiles/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed', 
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      null, 
      () => getDownloadURL(uploadTask.snapshot.ref).then(url => {
        setUserForm(prev => ({ ...prev, profileImg: url }));
        setUploadProgress(0);
      })
    );
  };

  const startCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 300, 300);
    canvasRef.current.toBlob((blob) => {
      handleImageUpload(blob);
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setShowCamera(false);
    }, 'image/jpeg');
  };

  const handleSaveUser = async () => {
    if (editingUserId) await updateDoc(doc(db, "users", editingUserId), userForm);
    else await addDoc(collection(db, "users"), userForm);
    setUserForm({ fullName: '', username: '', tz: '', email: '', phone: '', role: '', password: '', profileImg: '' });
    setEditingUserId(null);
  };

  const handleSaveRole = async () => {
    if (roleForm.id) await updateDoc(doc(db, "roles", roleForm.id), roleForm);
    else await addDoc(collection(db, "roles"), roleForm);
    setRoleForm({ name: '', permissions: [] });
  };

  return (
    <div className="admin-layout">
      <header className="header">
        {/* כפתור חזרה ממוקם כעת בצד ימין (RTL) */}
        <div className="right-header-area">
          <button className="back-neon" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
        </div>
        <h1 className="center-title">ניהול משתמשים והרשאות</h1>
      </header>

      <div className="tabs-row">
        <div className="pill">
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>משתמשים</button>
          <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>תפקידים והרשאות</button>
        </div>
      </div>

      <div className="main-grid">
        <div className="form-side">
          <div className="luxury-card">
            <h3 className="card-subtitle">{activeTab === 'users' ? 'פרטי משתמש' : 'עריכת תפקיד'}</h3>
            {activeTab === 'users' ? (
              <div className="stack">
                <input value={userForm.fullName} onChange={e => setUserForm({...userForm, fullName: e.target.value})} placeholder="שם מלא *" />
                <input value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="שם משתמש *" />
                <input value={userForm.password} type="password" onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="סיסמה *" />
                <input value={userForm.tz} onChange={e => setUserForm({...userForm, tz: e.target.value})} placeholder="תעודת זהות" />
                <input value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} placeholder="טלפון" />
                <input value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="אימייל" />
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                   <option value="">בחר תפקיד</option>
                   {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <div className="photo-ui">
                  <div className="avatar" style={{backgroundImage: `url(${userForm.profileImg})`}}>
                    {uploadProgress > 0 && <div className="prog-overlay">{uploadProgress}%</div>}
                  </div>
                  <div className="btns">
                    <label className="mini-btn">📁 העלה<input type="file" hidden onChange={e => handleImageUpload(e.target.files[0])} /></label>
                    <button className="mini-btn" onClick={startCamera}>📸 צילום</button>
                  </div>
                </div>
                <button className="neon-btn-white" onClick={handleSaveUser}>שמור משתמש</button>
              </div>
            ) : (
              <div className="stack">
                <input value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="שם התפקיד" />
                <div className="perms-box luxury-scroll">
                  <p className="perms-label">הרשאות גישה למסכי המערכת:</p>
                  {menuButtons.map(b => (
                    <label key={b.id} className="chk-line">
                      <input type="checkbox" checked={roleForm.permissions?.includes(b.id)} onChange={() => {
                        const p = roleForm.permissions?.includes(b.id) ? roleForm.permissions.filter(x => x !== b.id) : [...(roleForm.permissions || []), b.id];
                        setRoleForm({...roleForm, permissions: p});
                      }} /> <span>{b.label}</span>
                    </label>
                  ))}
                </div>
                <button className="neon-btn-white" onClick={handleSaveRole}>עדכן תפקיד</button>
              </div>
            )}
          </div>
        </div>

        <div className="list-side">
          {activeTab === 'users' ? (
            <div className="table">
              <div className="thead"><span>שם מלא</span><span>יוזר</span><span>ת.ז</span><span>טלפון</span><span>אימייל</span><span>תפקיד</span><span>פעולות</span></div>
              <div className="tbody luxury-scroll">
                {users.map(u => (
                  <div key={u.id} className="trow">
                    <div className="line"></div>
                    <span className="bold">{u.fullName}</span><span>{u.username}</span><span>{u.tz || '-'}</span><span>{u.phone || '-'}</span><span className="small truncate">{u.email || '-'}</span>
                    <span className="plain">{u.username === 'admin' ? 'מנהל מערכת' : u.role}</span>
                    <div className="acts">
                      {u.username !== 'admin' && <button className="icon trash" onClick={() => deleteDoc(doc(db, "users", u.id))}>🗑️</button>}
                      <button className="icon pencil" onClick={() => {setEditingUserId(u.id); setUserForm({...u});}}>✏️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="table">
              <div className="thead role-thead"><span>שם תפקיד</span><span>הרשאות מאושרות</span><span>פעולות</span></div>
              <div className="tbody luxury-scroll">
                {roles.map(r => (
                  <div key={r.id} className="trow role-row-aligned">
                    <div className="line"></div>
                    <span className="bold">{r.name}</span>
                    <span className="plain">{r.permissions?.length || 0} מסכים מורשים</span>
                    <div className="acts">
                      <button className="icon trash" onClick={() => deleteDoc(doc(db, "roles", r.id))}>🗑️</button>
                      <button className="icon pencil" onClick={() => setRoleForm(r)}>✏️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCamera && (
        <div className="cam-modal-overlay">
          <div className="cam-container">
            <video ref={videoRef} autoPlay playsInline width="300" height="300" />
            <canvas ref={canvasRef} style={{display:'none'}} width="300" height="300" />
            <div className="cam-btns-row">
              <button className="cam-action-btn capture" onClick={capturePhoto}>צלם</button>
              <button className="cam-action-btn cancel" onClick={() => {
                if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                setShowCamera(false);
              }}>סגור</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; font-weight: 400 !important; }
        .admin-layout { background: #000; min-height: 100vh; color: #fff; direction: rtl; display: flex; flex-direction: column; }
        
        /* Header */
        .header { position: relative; height: 75px; background: #050505; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; padding: 0 40px; justify-content: flex-start; }
        .right-header-area { z-index: 10; }
        .center-title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 1.5rem; margin: 0; }
        
        .back-neon { background: transparent; border: 2px solid #ff003c; color: #ff003c; padding: 8px 22px; border-radius: 10px; cursor: pointer; transition: 0.3s; box-shadow: 0 0 10px #ff003c; font-weight: 600 !important; }
        .back-neon:hover { background: #ff003c; color: #fff; }

        .tabs-row { display: flex; justify-content: center; margin: 25px 0; }
        .pill { display: flex; background: #111; padding: 4px; border-radius: 12px; border: 1px solid #222; }
        .pill button { background: transparent; border: none; color: #555; padding: 10px 25px; border-radius: 9px; cursor: pointer; font-weight: 600 !important; }
        .pill button.active { background: #ff003c; color: #fff; }

        .main-grid { display: grid; grid-template-columns: 350px 1fr; gap: 30px; padding: 0 40px; flex: 1; overflow: hidden; }
        .luxury-card { background: #0a0a0a; padding: 25px; border-radius: 20px; border: 1px solid #1a1a1a; }
        .card-subtitle { font-size: 1.1rem; border-right: 4px solid #ff003c; padding-right: 12px; margin-bottom: 20px; font-weight: 600 !important; }

        input, select { width: 100%; background: #141414; border: 1px solid #222; color: #fff; padding: 11px; border-radius: 10px; margin-bottom: 10px; }
        .neon-btn-white { width: 100%; background: #1a1a1a; border: 1px solid #fff; color: #fff; padding: 14px; border-radius: 12px; cursor: pointer; transition: 0.3s; font-weight: 600 !important; }
        .neon-btn-white:hover { background: #fff; color: #000; box-shadow: 0 0 20px #fff; }

        .list-side { display: flex; flex-direction: column; overflow: hidden; }
        .table { display: flex; flex-direction: column; height: 100%; }
        .thead { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1.5fr 1fr 80px; padding: 10px 20px; color: #444; font-size: 0.75rem; border-bottom: 1px solid #1a1a1a; }
        .role-thead { grid-template-columns: 1.5fr 1.5fr 80px; }
        .tbody { overflow-y: auto; padding-top: 10px; }
        .trow { position: relative; background: #0d0d0d; border-radius: 10px; margin-bottom: 6px; border: 1px solid #1a1a1a; display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr 1.5fr 1fr 80px; align-items: center; padding: 10px 20px; font-size: 0.85rem; }
        .role-row-aligned { grid-template-columns: 1.5fr 1.5fr 80px; }
        .line { position: absolute; right: 0; width: 4px; height: 100%; background: #ff003c; }
        .bold { font-weight: 600 !important; color: #eee; }
        .plain { color: #888; }

        .acts { display: flex; gap: 12px; justify-content: flex-end; }
        .icon { background: transparent !important; border: none !important; cursor: pointer; font-size: 1.2rem; padding: 0; opacity: 0.3; transition: 0.2s; outline: none; }
        .icon.trash { color: #555; }
        .icon.pencil { color: #00f2ff; opacity: 0.8; }
        .icon:hover { opacity: 1; transform: scale(1.1); }

        .photo-ui { border-top: 1px solid #1a1a1a; margin-top: 10px; padding: 15px 0; display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
        .avatar { width: 60px; height: 60px; border-radius: 50%; background: #111; background-size: cover; border: 1px solid #333; position: relative; overflow: hidden; }
        .prog-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #00ff41; }
        .mini-btn { background: #111; border: 1px solid #333; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; margin-bottom: 4px; display: block; text-align: center; }

        .perms-box { background: #141414; padding: 12px; border-radius: 12px; max-height: 250px; overflow-y: auto; margin-bottom: 15px; border: 1px solid #222; }
        .chk-line { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1a1a1a; cursor: pointer; font-size: 0.9rem; }
        .chk-line input { accent-color: #ff003c; width: 16px; height: 16px; }

        .cam-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .cam-container { background: #0a0a0a; padding: 20px; border-radius: 20px; border: 1px solid #ff003c; text-align: center; }
        .cam-container video { border-radius: 15px; margin-bottom: 15px; object-fit: cover; }
        .cam-btns-row { display: flex; gap: 15px; justify-content: center; }
        .cam-action-btn { padding: 10px 25px; border-radius: 10px; cursor: pointer; border: none; font-weight: 600; }
        .cam-action-btn.capture { background: #28a745; color: #fff; }
        .cam-action-btn.cancel { background: #444; color: #fff; }

        .luxury-scroll::-webkit-scrollbar { width: 5px; }
        .luxury-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default UserManagementPage;