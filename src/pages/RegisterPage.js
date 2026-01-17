import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from 'react-router-dom';
import PolicyModal from '../components/PolicyModal'; 

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [isOver18, setIsOver18] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isOver18 || !privacyAccepted) {
        setError("חובה לאשר גיל 18 ואת תנאי השימוש.");
        return;
    }
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email, name: fullName, phone, idCard, role: 'user', createdAt: new Date(), termsAccepted: true
      });
      navigate('/game');
    } catch (err) {
      setError("שגיאה בהרשמה: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <PolicyModal isVisible={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div style={styles.card}>
        <h2 style={styles.title}>הרשמה</h2>
        <form onSubmit={handleRegister} style={styles.form}>
          <input style={styles.input} placeholder="שם מלא" value={fullName} onChange={e=>setFullName(e.target.value)} required />
          <input style={styles.input} placeholder="ת.ז." value={idCard} onChange={e=>setIdCard(e.target.value)} required />
          <input style={styles.input} placeholder="טלפון" value={phone} onChange={e=>setPhone(e.target.value)} required />
          <input style={styles.input} type="email" placeholder="אימייל" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="סיסמה" value={password} onChange={e=>setPassword(e.target.value)} required />

          <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}><input type="checkbox" checked={isOver18} onChange={e=>setIsOver18(e.target.checked)} /> אני מעל גיל 18</label>
              <label style={styles.checkboxLabel}>
                  <input type="checkbox" checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)} />
                  אני מאשר/ת את <span style={styles.policyLink} onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>התקנון</span>
              </label>
          </div>
          {error && <div style={styles.errorMessage}>{error}</div>}
          <button type="submit" style={styles.submitButton} disabled={loading}>{loading ? 'נרשם...' : 'הרשמה'}</button>
        </form>
        <Link to="/" style={styles.linkButton}>חזרה</Link>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000', color: 'white', padding: '20px', direction: 'rtl' },
  card: { backgroundColor: '#111', border: '1px solid #333', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { color: '#D50000', marginBottom: '20px', fontSize: '1.8rem', fontWeight: 'bold' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #555', backgroundColor: '#222', color: 'white', fontSize: '16px' },
  checkboxGroup: { textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' },
  checkboxLabel: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem', color: '#ccc' },
  policyLink: { color: '#D50000', textDecoration: 'underline', cursor: 'pointer', marginRight: '5px' },
  submitButton: { padding: '15px', backgroundColor: '#D50000', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  errorMessage: { color: '#ff4444', backgroundColor: 'rgba(255, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' },
  linkButton: { background: 'none', border: 'none', color: '#888', marginTop: '15px', cursor: 'pointer' }
};

export default RegisterPage;