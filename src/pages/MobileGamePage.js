import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const MobileGamePage = () => {
  const navigate = useNavigate();
  const publicUrl = process.env.PUBLIC_URL;
  
  // --- States ---
  const [viewState, setViewState] = useState('welcome');
  const [tasks, setTasks] = useState([]); 
  const [availableTasks, setAvailableTasks] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  
  // Game Play States
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Typewriter States
  const [displayedText, setDisplayedText] = useState("");
  const [displayedFooter, setDisplayedFooter] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [footerIndex, setFooterIndex] = useState(0);
  const [isMainDone, setIsMainDone] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);

  const categoryOrder = ['סקרנות', 'תשוקה', 'משחק מקדים', 'נועז במיוחד', 'שאלה חוצפנית', 'תוספת קרירה'];

  // טעינת נתונים
  useEffect(() => {
    const fetchData = async () => {
      const catSnap = await getDocs(collection(db, "categories"));
      const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(fetchedCats.sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name)));

      const taskSnap = await getDocs(collection(db, "tasks"));
      setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const mainText = `משחק תושקתי, מסקרן, סקסי ושובב במיוחד .
אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.
שחקו משחק קלפים כמו פוקר ,21 יניב וכו'
מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .
משם השמיים הם הגבול.
תוכלו לשחק במשחק כפי שהוא ,פשוט לחשוף
קלף כל אחד בתורו ולבצע .נשמע כיף לא ?!

קלפי סקרנות יגלו לנו דרכים חדשות של עונג, מגע
ושיח .
קלפי תשוקה יתנו לנו רמז למשחק המקדים
הסקסי שתכף יגיע .
קלפי המשחק המקדים ישלחו אותנו לשחק אחד
עם השניה הכי קרוב שיש.
הקלפים הנועזים במיוחד יראו לנו שאין גבולות.
תמצאו במשחק גם קלפי שאלות שיחשפו קצת
.juice
וגם כמה קלפים שיקררו את האווירה (לא באמת).

הכי חשוב שתהנו, שתפתחו את הראש ושתעפו
על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.`;

  useEffect(() => {
    if (viewState === 'instructions' && !isMainDone) {
      if (currentIndex < mainText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + mainText[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 15);
        return () => clearTimeout(timeout);
      } else setIsMainDone(true);
    }
  }, [viewState, currentIndex, isMainDone]);

  useEffect(() => {
    if (isMainDone && !isTypingDone) {
      if (footerIndex < `ייאלה סקסיים למיטה!`.length) {
        const timeout = setTimeout(() => {
          setDisplayedFooter(prev => prev + `ייאלה סקסיים למיטה!`[footerIndex]);
          setFooterIndex(prev => prev + 1);
        }, 30);
        return () => clearTimeout(timeout);
      } else setIsTypingDone(true);
    }
  }, [isMainDone, footerIndex, isTypingDone]);

  // לוגיקת משחק
  const handleStartGame = () => {
    const filtered = tasks.filter(t => selectedCats.includes(t.categoryId));
    if (filtered.length === 0) return alert("אין משימות בקטגוריות שנבחרו.");
    setAvailableTasks(filtered);
    setViewState('game-play');
    drawNextCard(filtered);
  };

  const drawNextCard = (currentDeck) => {
    const deckToUse = currentDeck || availableTasks;
    if (deckToUse.length === 0) { 
        setShowEndModal(true); 
        return; 
    }
    const randomIndex = Math.floor(Math.random() * deckToUse.length);
    const selectedTask = deckToUse[randomIndex];
    setAvailableTasks(deckToUse.filter((_, i) => i !== randomIndex));
    const cat = categories.find(c => c.id === selectedTask.categoryId);
    
    setCurrentCard({
      text: selectedTask.content,
      image: cat?.designImage || null,
      backImage: cat?.backImage || `${publicUrl}/images/cover_card.png`
    });
    setIsCardOpen(false);
  };

  // תיקון לוגיקת האנימציה בעת לחיצה
  const handleCardClick = () => {
    if (isExiting) return;
    if (!isCardOpen) setIsCardOpen(true);
    else { 
        setIsExiting(true); 
        // המתנה לסיום אנימציית הזריקה (500ms) לפני טעינת הקלף הבא
        setTimeout(() => { 
            drawNextCard(); 
            setIsExiting(false); 
        }, 500); 
    }
  };

  const toggleCategory = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const toggleAll = () => setSelectedCats(selectedCats.length === categories.length ? [] : categories.map(c => c.id));
  const getThermoHeight = () => {
    if (selectedCats.length === 0) return '0%';
    const lastIndex = Math.max(...selectedCats.map(id => categories.findIndex(c => c.id === id)));
    return `${((lastIndex + 1) / categories.length) * 100}%`;
  };

  return (
    <div className={`game-wrapper ${viewState === 'game-play' ? 'gray-theme' : 'red-theme'}`}>
      {(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="fixed-bg" />}
      
      {showEndModal && (
        <div className="end-modal-overlay fade-in">
            <div className="end-modal-box">
                <h2 className="end-modal-title">הקלפים הסתיימו</h2>
                <button className="reshuffle-btn-large" onClick={() => { setShowEndModal(false); setViewState('category-selection'); }}>חיזרו לבחירה</button>
            </div>
        </div>
      )}

      <div className="top-nav">
          <button className="back-btn" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      {/* 1. Welcome Screen */}
      {viewState === 'welcome' && (
        <div className="center-box">
            <div className="hero-content fade-in">
                <h1 className="hero-main">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="hero-subtext-container">
                    <p className="hero-subline">משחק קלפים ללא גבולות</p>
                    <p className="hero-subline">למבוגרים בלבד</p>
                </div>
                <button className="action-btn-neon" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen */}
      {viewState === 'instructions' && (
        <div className="center-box scroll-y">
            <div className="glass-panel fade-in">
                <h2 className="panel-title">הוראות המשחק</h2>
                <div className="typewriter-area">
                    <div className="main-instructions-box">{displayedText}</div>
                    <div className="footer-centered-line">{displayedFooter}</div>
                </div>
                {isTypingDone && <button className="action-btn-neon-large" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>}
            </div>
        </div>
      )}

      {/* 3. Category Selection */}
      {viewState === 'category-selection' && (
        <div className="center-box">
          <div className="selection-panel neon-border fade-in">
            <h2 className="panel-title">בחרו קטגוריות למשחק</h2>
            <div className="selection-layout">
              <div className="thermo-section">
                <div className="glass-pipe"><div className="mercury-fill" style={{ height: getThermoHeight() }}><div className="shine-line"></div></div></div>
                <div className="bead-track">
                  {categories.map((cat, i) => (
                    <div key={cat.id} className={`bead dot-lvl-${i} ${selectedCats.includes(cat.id) ? 'active' : ''}`}><div className="bead-reflection"></div></div>
                  ))}
                </div>
              </div>
              <div className="cats-section">
                <div className="full-row header-row" onClick={toggleAll}>
                  <div className={`check-circle ${selectedCats.length === categories.length ? 'filled' : ''}`}></div>
                  <span className="cat-label">ביחרו הכל</span>
                </div>
                <div className="cats-list luxury-scroll">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`full-row ${selectedCats.includes(cat.id) ? 'selected' : ''}`} onClick={() => toggleCategory(cat.id)}>
                      <div className={`check-circle ${selectedCats.includes(cat.id) ? 'filled' : ''}`}></div>
                      <span className="cat-label">{cat.name}</span>
                    </div>
                  ))}
                </div>
                {selectedCats.length > 0 && <button className="start-btn-neon" onClick={handleStartGame}>התחילו במשחק</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Play */}
      {viewState === 'game-play' && currentCard && (
        <div className="center-box">
          <div className="card-scene" onClick={handleCardClick}>
            {/* שימוש ב-key כדי להכריח את האנימציה לרוץ מחדש בכל קלף */}
            <div key={currentCard.text} className={`active-card-wrapper ${isExiting ? 'throw-out' : 'deal-in'}`}>
              <div className={`flip-inner ${isCardOpen ? 'flipped' : ''}`}>
                <div className="flip-front"><img src={currentCard.backImage} alt="" className="full-img" /></div>
                <div className="flip-back">
                  {currentCard.image && <img src={currentCard.image} alt="" className="full-img" />}
                  <div className="card-text-container"><span className="card-text">{currentCard.text}</span></div>
                </div>
              </div>
            </div>
          </div>
          <button className="reshuffle-btn" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; }
        .game-wrapper { position: fixed; inset: 0; overflow: hidden; }
        .red-theme { background: #000; }
        .gray-theme { background: #050505; } 
        .fixed-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; opacity: 0.7; }
        .top-nav { position: fixed; top: 20px; right: 20px; z-index: 100; }
        .back-btn { background: rgba(0,0,0,0.5); border: 1px solid #fff; color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; transition: 0.3s; font-weight: 400 !important; }
        .back-btn:hover { background: #fff; color: #000; }
        .center-box { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
        
        .end-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; }
        .end-modal-box { text-align: center; padding: 40px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); }
        .end-modal-title { color: #fff; font-size: 2.2rem; font-weight: 400 !important; margin-bottom: 40px; }

        /* Welcome & Neon Buttons Style */
        .hero-content { text-align: center; color: #fff; }
        .hero-main { font-size: 5.5rem; font-weight: 800 !important; line-height: 1.1; margin-bottom: 20px; letter-spacing: -2px; }
        .hero-subline { font-size: 1.3rem; margin: 5px 0; opacity: 0.9; }
        
        .action-btn-neon, .action-btn-neon-large, .start-btn-neon, .reshuffle-btn, .reshuffle-btn-large { 
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; 
          border-radius: 35px; cursor: pointer; transition: 0.3s; font-weight: 400 !important; font-family: 'Open Sans' !important;
        }
        .action-btn-neon { padding: 22px 60px; font-size: 1.6rem; margin-top: 40px; }
        .action-btn-neon-large { width: 100%; padding: 22px; font-size: 1.4rem; }
        .start-btn-neon { width: 100%; padding: 18px; font-size: 1.4rem; background: #333; margin-top: 5px; }
        .reshuffle-btn { margin-top: 30px; padding: 15px 45px; font-size: 1.4rem; }
        .reshuffle-btn-large { padding: 18px 50px; font-size: 1.5rem; }
        .action-btn-neon:hover, .action-btn-neon-large:hover, .start-btn-neon:hover, .reshuffle-btn:hover, .reshuffle-btn-large:hover { 
          box-shadow: 0 0 30px #fff; background: rgba(255,255,255,0.1); border-color: #fff;
        }

        /* Card Animation Styles */
        .card-scene { width: 300px; height: 420px; perspective: 1500px; cursor: pointer; }
        .active-card-wrapper { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-front, .flip-back { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .flip-back { transform: rotateY(180deg); background: #111; }
        .full-img { width: 100%; height: 100%; object-fit: cover; }
        .card-text-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .card-text { color: #fff; font-size: 1.5rem; font-weight: 800 !important; direction: rtl; }

        /* אנימציות כניסה ויציאה */
        .deal-in { animation: dealIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .throw-out { animation: throwOut 0.5s ease-in forwards; }
        @keyframes dealIn { from { transform: scale(0) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes throwOut { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }

        /* Common Layouts */
        .glass-panel { width: 95%; max-width: 500px; background: rgba(10, 10, 10, 0.7); backdrop-filter: blur(10px); padding: 30px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); direction: rtl; }
        .panel-title { color: #fff; text-align: center; margin-bottom: 25px; font-size: 1.5rem; }
        .typewriter-area { color: #fff; font-size: 1rem; line-height: 1.7; text-align: right; white-space: pre-wrap; margin-bottom: 25px; }
        .footer-centered-line { text-align: center; margin-top: 30px; font-size: 1.3rem; font-weight: 700 !important; display: block; }
        
        .selection-panel { width: 95%; max-width: 520px; background: rgba(15, 15, 15, 0.95); padding: 30px; border-radius: 25px; border: 1px solid #fff; box-shadow: 0 0 25px rgba(255, 255, 255, 0.4); direction: rtl; }
        .selection-layout { display: flex; gap: 25px; align-items: stretch; direction: ltr; }
        .thermo-section { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 105px; }
        .glass-pipe { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 110px; bottom: 45px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); }
        .mercury-fill { width: 100%; background: linear-gradient(to bottom, #007bff 0%, #ffffff 50%, #ff0000 100%); position: absolute; bottom: 0; transition: 0.6s; }
        .bead-track { display: flex; flex-direction: column; justify-content: space-between; height: 355px; z-index: 2; }
        .bead { width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.15), rgba(0,0,0,0.5)); border: 1px solid rgba(255,255,255,0.2); }
        .bead.active.dot-lvl-0 { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .bead.active.dot-lvl-5 { background: #ff0000; box-shadow: 0 0 20px #ff0000; }

        .cats-section { flex: 1; direction: rtl; display: flex; flex-direction: column; }
        .full-row { width: 100%; display: flex; align-items: center; gap: 15px; padding: 18px 20px; background: #1a1a1a; border-radius: 15px; border: 1px solid transparent; cursor: pointer; transition: 0.3s; margin-bottom: 10px; }
        .check-circle { width: 22px; height: 22px; border: 2px solid #fff; border-radius: 50%; flex-shrink: 0; }
        .check-circle.filled { background: #fff; box-shadow: 0 0 10px #fff; }
        .cat-label { color: #fff; font-size: 1.1rem; }

        .fade-in { animation: fadeIn 0.6s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
        .luxury-scroll::-webkit-scrollbar { width: 4px; }
        .luxury-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MobileGamePage;