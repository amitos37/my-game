import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const MobileGamePage = () => {
  const navigate = useNavigate();
  const publicUrl = process.env.PUBLIC_URL;
  
  const [viewState, setViewState] = useState('welcome');
  const [tasks, setTasks] = useState([]); 
  const [availableTasks, setAvailableTasks] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const [displayedText, setDisplayedText] = useState("");
  const [displayedFooter, setDisplayedFooter] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [footerIndex, setFooterIndex] = useState(0);
  const [isMainDone, setIsMainDone] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);

  const categoryOrder = ['סקרנות', 'תשוקה', 'משחק מקדים', 'נועז במיוחד', 'שאלה חוצפנית', 'תוספת קרירה'];

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

  const mainText = `משחק תשוקתי, מסקרן, סקסי ושובב במיוחד.
אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.
שחקו משחק קלפים כמו פוקר, 21 יניב וכו'.
מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב.
משם השמיים הם הגבול.
תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף קלף כל אחד בתורו ולבצע. נשמע כיף לא?!

קלפי סקרנות יגלו לנו דרכים חדשות של עונג, מגע ושיח.
קלפי תשוקה יתנו לנו רמז למשחק המקדים הסקסי שתכף יגיע.
קלפי המשחק המקדים ישלחו אותנו לשחק אחד עם השניה הכי קרוב שיש.
הקלפים הנועזים במיוחד יראו לנו שאין גבולות.
תמצאו במשחק גם קלפי שאלות שיחשפו קצת juice.
וגם כמה קלפים שיקררו את האווירה (לא באמת).

הכי חשוב שתהנו, שתפתחו את הראש ושתעופו על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.`;

  useEffect(() => {
    if (viewState === 'instructions' && !isMainDone) {
      if (currentIndex < mainText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + mainText[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, 10); // מהירות הקלדה מעט מהירה יותר לנייד
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

  const handleCardClick = () => {
    if (isExiting) return;
    if (!isCardOpen) setIsCardOpen(true);
    else { 
        setIsExiting(true); 
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
                <button className="action-btn-neon" onClick={() => setViewState('instructions')}>התקדמו להוראות</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen - מתוקן לרספונסיביות מלאה */}
      {viewState === 'instructions' && (
        <div className="center-box">
            <div className="glass-panel instruction-flex fade-in">
                <h2 className="panel-title">הוראות המשחק</h2>
                
                {/* אזור הטקסט עם גלילה פנימית */}
                <div className="typewriter-area mobile-scroll-area">
                    <div className="main-instructions-box">{displayedText}</div>
                    <div className="footer-centered-line">{displayedFooter}</div>
                </div>

                {/* אזור הכפתור - תמיד בתחתית הלוח */}
                <div className="button-footer">
                  {isTypingDone && (
                    <button className="action-btn-neon-large" onClick={() => setViewState('category-selection')}>
                      המשיכו עוד קצת
                    </button>
                  )}
                </div>
            </div>
        </div>
      )}

      {/* 3. Category Selection */}
      {viewState === 'category-selection' && (
        <div className="center-box">
          <div className="selection-panel neon-border fade-in">
            <h2 className="panel-title">בחרו קטגוריות</h2>
            <div className="selection-layout">
              <div className="thermo-section">
                <div className="glass-pipe">
                  <div className="mercury-fill" style={{ height: getThermoHeight() }}>
                    <div className="shine-line"></div>
                  </div>
                </div>
                <div className="bead-track">
                  {categories.map((cat, i) => (
                    <div key={cat.id} className={`bead dot-lvl-${i} ${selectedCats.includes(cat.id) ? 'active' : ''}`}>
                      <div className="bead-reflection"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cats-section">
                <div className="full-row header-row" onClick={toggleAll}>
                  <div className={`check-circle ${selectedCats.length === categories.length ? 'filled' : ''}`}></div>
                  <span className="cat-label">בחרו הכל</span>
                </div>
                <div className="cats-list luxury-scroll">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`full-row ${selectedCats.includes(cat.id) ? 'selected' : ''}`} onClick={() => toggleCategory(cat.id)}>
                      <div className={`check-circle ${selectedCats.includes(cat.id) ? 'filled' : ''}`}></div>
                      <span className="cat-label">{cat.name}</span>
                    </div>
                  ))}
                </div>
                {selectedCats.length > 0 && <button className="start-btn-neon" onClick={handleStartGame}>התחילו</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Play */}
      {viewState === 'game-play' && currentCard && (
        <div className="center-box">
          <div className="card-scene" onClick={handleCardClick}>
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
        
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; -webkit-tap-highlight-color: transparent; }
        
        /* שימוש ב-dvh למניעת בעיות גובה בדפדפנים בנייד */
        .game-wrapper { position: fixed; inset: 0; width: 100%; height: 100dvh; overflow: hidden; }
        
        .red-theme { background: #000; }
        .gray-theme { background: #050505; } 
        .fixed-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; opacity: 0.7; }
        
        .top-nav { position: fixed; top: 15px; right: 15px; z-index: 100; }
        .back-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; cursor: pointer; }
        
        .center-box { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px; }
        
        /* Hero Screen - מותאם לנייד */
        .hero-main { font-size: 3.5rem; font-weight: 800 !important; line-height: 1.1; margin-bottom: 15px; text-align: center; color: #fff; }
        @media (max-width: 400px) { .hero-main { font-size: 2.8rem; } }
        .hero-subline { font-size: 1.1rem; margin: 3px 0; opacity: 0.8; text-align: center; color: #fff; }
        .action-btn-neon { padding: 18px 40px; font-size: 1.3rem; margin-top: 30px; background: rgba(255,255,255,0.05); border: 1px solid #fff; color: #fff; border-radius: 30px; box-shadow: 0 0 15px rgba(255,255,255,0.2); }

        /* Instructions Screen - תיקון הגלילה והכפתור */
        .glass-panel { 
            width: 100%; 
            max-width: 450px; 
            max-height: 85dvh; /* הגבלת גובה הלוח */
            background: rgba(10, 10, 10, 0.85); 
            backdrop-filter: blur(15px); 
            padding: 20px; 
            border-radius: 25px; 
            border: 1px solid rgba(255,255,255,0.15); 
            display: flex; 
            flex-direction: column; 
            direction: rtl; 
        }
        
        .mobile-scroll-area { 
            flex: 1; 
            overflow-y: auto; 
            margin-bottom: 15px; 
            padding-left: 10px; /* רווח לסקרולר */
        }
        
        .typewriter-area { color: #fff; font-size: 1rem; line-height: 1.6; text-align: right; white-space: pre-wrap; }
        .footer-centered-line { text-align: center; margin-top: 20px; font-size: 1.2rem; font-weight: 700 !important; color: #ff0000; }
        .button-footer { width: 100%; flex-shrink: 0; }
        .action-btn-neon-large { width: 100%; padding: 16px; font-size: 1.2rem; background: #fff; color: #000; border: none; border-radius: 20px; font-weight: 700 !important; }

        /* Category Selection - מותאם למסכים קטנים */
        .selection-panel { width: 100%; max-width: 450px; background: rgba(15, 15, 15, 0.98); padding: 20px; border-radius: 25px; border: 1px solid #fff; direction: rtl; }
        .selection-layout { display: flex; gap: 15px; height: 60dvh; direction: ltr; }
        .thermo-section { width: 35px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding-top: 20px; }
        .glass-pipe { width: 12px; background: rgba(255,255,255,0.1); position: absolute; top: 20px; bottom: 20px; border-radius: 10px; }
        .bead-track { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 5px 0; }
        .bead { width: 16px; height: 16px; border-radius: 50%; background: #333; border: 1px solid rgba(255,255,255,0.3); }
        .bead.active.dot-lvl-0 { background: #007bff; box-shadow: 0 0 10px #007bff; }
        .bead.active.dot-lvl-5 { background: #ff0000; box-shadow: 0 0 10px #ff0000; }

        .cats-section { flex: 1; direction: rtl; display: flex; flex-direction: column; overflow: hidden; }
        .cats-list { flex: 1; overflow-y: auto; padding-right: 5px; }
        .full-row { padding: 12px 15px; background: #1a1a1a; border-radius: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
        .check-circle { width: 18px; height: 18px; border: 2px solid #fff; border-radius: 50%; }
        .check-circle.filled { background: #fff; }
        .cat-label { color: #fff; font-size: 1rem; }
        .start-btn-neon { width: 100%; padding: 15px; font-size: 1.2rem; background: #fff; color: #000; border-radius: 20px; margin-top: 10px; border: none; font-weight: 700 !important; }

        /* Game Play - קלפים רספונסיביים */
        .card-scene { width: 85vw; max-width: 320px; height: 60dvh; perspective: 1500px; }
        .card-text { color: #fff; font-size: 1.3rem; font-weight: 800 !important; line-height: 1.3; }
        .reshuffle-btn { margin-top: 20px; padding: 12px 30px; font-size: 1.1rem; background: rgba(255,255,255,0.1); border: 1px solid #fff; color: #fff; border-radius: 25px; }

        /* אנימציות */
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .deal-in { animation: dealIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .throw-out { animation: throwOut 0.4s ease-in forwards; }
        @keyframes dealIn { from { transform: scale(0.5) rotate(-10deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes throwOut { to { transform: translateX(100vw) rotate(20deg); opacity: 0; } }

        .luxury-scroll::-webkit-scrollbar { width: 3px; }
        .luxury-scroll::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MobileGamePage;