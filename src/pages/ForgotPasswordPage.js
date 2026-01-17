import React, { useState } from 'react';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('>> הצופן נשלח! בדוק את האימייל לאתחול.');
      setTimeout(() => navigate('/'), 6000); 
    } catch (err) {
      console.error(err);
      setError(">> שגיאה: כתובת אימייל לא נמצאה במערכת.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.scanline}></div>
      
      <div style={styles.matrixCard}>
        
        <h1 style={styles.glitchTitle} data-text="SYSTEM RECOVERY">SYSTEM RECOVERY</h1>
        <h2 style={styles.subTitle}>פרוטוקול שחזור סיסמה</h2>

        <p style={styles.text}>
          הזן את כתובת האימייל המקושרת לחשבון. <br/>
          המערכת תשלח קוד גישה חדש.
        </p>

        <form onSubmit={handleReset} style={styles.form}>
          <div style={styles.inputWrapper}>
            <span style={styles.prompt}>{`root@sys:~$`}</span>
            <input 
              type="email" 
              placeholder="Enter_Email_Address..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <span style={styles.cursor}>█</span>
          </div>

          {message && <div style={styles.successMessage}>{message}</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}

          {/* שימוש ב-className כדי להפעיל את האנימציה מה-CSS למטה */}
          <button type="submit" className="matrix-btn" style={styles.button} disabled={loading}>
            {loading ? 'PROCESSING...' : '[ EXECUTE RESET ]'}
          </button>
        </form>

        <div style={styles.footerLink} onClick={() => navigate('/')}>
          {`< חזרה למסך התחברות >`}
        </div>
      </div>
    </div>
  );
};

// --- CSS ואנימציות ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes glitch {
    0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
    20% { clip-path: inset(92% 0 1% 0); transform: translate(0px, 0px); }
    40% { clip-path: inset(43% 0 1% 0); transform: translate(-2px, -2px); }
    60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 2px); }
    80% { clip-path: inset(54% 0 7% 0); transform: translate(-1px, 1px); }
    100% { clip-path: inset(58% 0 43% 0); transform: translate(0); }
  }

  /* --- העיצוב החדש ללחצן עם ההילה האדומה --- */
  .matrix-btn {
    padding: 18px;
    background-color: #00FF41;
    color: #000;
    border: 1px solid #00FF41;
    font-size: 1.3rem;
    font-weight: bold;
    font-family: 'Share Tech Mono', monospace;
    cursor: pointer;
    letter-spacing: 2px;
    text-transform: uppercase;
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
    transition: all 0.3s ease-in-out;
    margin-top: 10px;
    width: 100%;
  }

  /* מצב Hover - כאן קורה הקסם האדום */
  .matrix-btn:hover {
    background-color: #000 !important;
    color: #FF0000 !important;
    border: 1px solid #FF0000 !important;
    box-shadow: 0 0 30px #FF0000, 0 0 60px #FF0000 !important; /* הילה אדומה כפולה וחזקה */
    text-shadow: 0 0 10px #FF0000;
    transform: scale(1.02); /* הגדלה קטנה */
  }
  
  .matrix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }
`;
document.head.appendChild(styleSheet);

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    backgroundImage: `
      linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '30px 30px',
    fontFamily: "'Share Tech Mono', monospace", 
    position: 'relative',
    overflow: 'hidden',
    color: '#00FF41', 
    direction: 'rtl'
  },

  scanline: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,255,65,0.1) 50%, rgba(0,255,65,0.1))',
    backgroundSize: '100% 4px',
    zIndex: 10,
    pointerEvents: 'none',
    animation: 'scanline 0.2s linear infinite', 
    opacity: 0.3
  },

  matrixCard: {
    backgroundColor: 'rgba(0, 10, 0, 0.9)',
    border: '1px solid #00FF41',
    boxShadow: '0 0 30px rgba(0, 255, 65, 0.2), inset 0 0 20px rgba(0, 255, 65, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 20
  },

  glitchTitle: {
    fontSize: '2.5rem',
    margin: 0,
    color: '#fff',
    textShadow: '2px 2px #00FF41',
    letterSpacing: '3px',
    position: 'relative',
    animation: 'glitch 3s infinite linear alternate-reverse',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold'
  },

  subTitle: {
    fontSize: '1.2rem',
    marginTop: '10px',
    color: '#00FF41',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    borderBottom: '1px dashed #00FF41',
    paddingBottom: '15px',
    display: 'inline-block',
    width: '100%'
  },

  text: {
    fontSize: '1rem',
    color: '#aaffaa',
    lineHeight: '1.6',
    marginBottom: '30px',
    marginTop: '20px'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#050505',
    border: '1px solid #00FF41',
    padding: '15px',
    boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)',
    direction: 'ltr' 
  },

  prompt: {
    color: '#00FF41',
    marginRight: '10px',
    fontWeight: 'bold',
    fontSize: '1rem'
  },

  input: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '1.1rem',
    outline: 'none',
    caretColor: 'transparent' 
  },

  cursor: {
    color: '#00FF41',
    animation: 'blink 1s step-end infinite',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  },

  // הכפתור מקבל את העיצוב שלו מה-Class למעלה, כאן רק שאריות לגיבוי
  button: {},

  footerLink: {
    marginTop: '30px',
    color: '#00FF41',
    cursor: 'pointer',
    fontSize: '1rem',
    textDecoration: 'underline',
    opacity: 0.8,
    transition: 'opacity 0.2s'
  },

  successMessage: {
    color: '#00FF41',
    border: '1px solid #00FF41',
    padding: '15px',
    fontSize: '1rem',
    backgroundColor: 'rgba(0, 255, 65, 0.1)'
  },

  errorMessage: {
    color: '#ff3333',
    border: '1px solid #ff3333',
    padding: '15px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 51, 51, 0.1)',
    textShadow: '0 0 5px red'
  }
};

export default ForgotPasswordPage;