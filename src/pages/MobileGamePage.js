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
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [wasAllSelectedByButton, setWasAllSelectedByButton] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // טעינת נתונים ומיון קטגוריות
  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const order = ['שאלה חוצפנית', 'סקרנות', 'תשוקה', 'משחק מקדים', 'נועז במיוחד', 'תוספת קרירה'];
        setCategories(fetchedCats.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)));
        
        const taskSnap = await getDocs(collection(db, "tasks"));
        setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error("Error loading data:", err); }
    };
    fetchData();
  }, []);

  const toggleCategory = (id) => {
    setWasAllSelectedByButton(false);
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedCats.length === categories.length) {
      setSelectedCats([]);
      setWasAllSelectedByButton(false);
    } else {
      setSelectedCats(categories.map(c => c.id));
      setWasAllSelectedByButton(true);
    }
  };

  // בדיקת אפקט קפוא גלובלי
  const coldCat = categories.find(c => c.name === 'תוספת קרירה');
  const isIceActive = viewState === 'category-selection' && coldCat && selectedCats.includes(coldCat.id) && !wasAllSelectedByButton;

  const thermo = (() => {
    const isAll = selectedCats.length === categories.length;
    if (isIceActive) return { height: '12%', type: 'ice' };
    if (isAll && wasAllSelectedByButton) return { height: '100%', type: 'full' };
    if (selectedCats.length === 0) return { height: '0%', type: 'none' };
    
    const lastIndex = Math.max(...selectedCats.map(id => categories.findIndex(c => c.id === id)));
    const catName = categories[lastIndex]?.name;
    const type = (catName === 'שאלה חוצפנית' && selectedCats.length === 1) ? 'blue' : 'red';
    return { height: `${((lastIndex + 1) / categories.length) * 100}%`, type };
  })();

  const handleStartGame = () => {
    const filtered = tasks.filter(t => selectedCats.includes(t.categoryId));
    if (filtered.length === 0) return alert("אין משימות בקטגוריות שנבחרו.");
    setAvailableTasks(filtered);
    setViewState('game-play');
    drawNextCard(filtered);
  };

  const drawNextCard = (currentDeck) => {
    const deckToUse = currentDeck || availableTasks;
    if (deckToUse.length === 0) return setViewState('category-selection');
    const randomIndex = Math.floor(Math.random() * deckToUse.length);
    const selectedTask = deckToUse[randomIndex];
    setAvailableTasks(deckToUse.filter((_, i) => i !== randomIndex));
    const cat = categories.find(c => c.id === selectedTask.categoryId);
    setCurrentCard({ text: selectedTask.content, image: cat?.designImage || null, backImage: cat?.backImage || `${publicUrl}/images/cover_card.png` });
    setIsCardOpen(false);
  };

  const handleCardClick = () => {
    if (isExiting) return;
    if (!isCardOpen) setIsCardOpen(true);
    else { setIsExiting(true); setTimeout(() => { drawNextCard(); setIsExiting(false); }, 500); }
  };

  return (
    <div className={`app-root-v19 ${viewState === 'game-play' ? 'theme-play' : 'theme-red'} ${isIceActive ? 'ice-active-global' : ''}`}>
      <div className="bg-layer-static">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="full-bg-img" />}</div>
      
      {/* שלג גלובלי */}
      {isIceActive && (
          <div className="snow-global-overlay">
              {[...Array(25)].map((_, i) => <div key={i} className="snowflake-particle">❄</div>)}
          </div>
      )}

      {/* Header - חזרה לתפריט בצד ימין למעלה */}
      <div className="nav-header-fixed">
          <button className="back-btn-ui-neon neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      <div className="viewport-stage-v19">
        
        {/* 1. Welcome Screen - תיקון פריסה */}
        {viewState === 'welcome' && (
          <div className="view-unit center-vh fade-in">
              <div className="hero-box-v19">
                <h1 className="hero-h1-v19">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="hero-subs-v19"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
              </div>
              <div className="footer-btn-unit">
                <button className="btn-action-neon neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
              </div>
          </div>
        )}

        {/* 2. Instructions Screen */}
        {viewState === 'instructions' && (
          <div className="view-unit top-anchored fade-in">
            <div className="card-box-robust">
              <h2 className="card-title-v19">הוראות המשחק</h2>
              <div className="instr-body-v19">
                <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                <div className="divider-v19">תמצאו במשחק...</div>
                <p>קלפי שאלות שיחשפו קצת juice.</p>
                <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                <div className="divider-v19"></div>
                <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                <div className="footer-msg-sexy">ייאלה סקסיים למיטה!</div>
              </div>
            </div>
            <div className="footer-btn-unit">
                <button className="btn-action-neon neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
          </div>
        )}

        {/* 3. Category Selection */}
        {viewState === 'category-selection' && (
          <div className="view-unit top-anchored fade-in">
            <div className="card-box-robust cats-frame-v19">
              <h2 className="card-title-v19">בחרו קטגוריות למשחק</h2>
              <div className="cats-grid-v19">
                <div className={`thermo-v19 ${isIceActive ? 'shaking-v19' : ''}`}>
                  <div className="glass-v19"><div className={`mercury-v19 fill-${thermo.type}`} style={{ height: thermo.height }}></div></div>
                  <div className="dots-v19">{categories.map(c => <div key={c.id} className={`dot-v19 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>)}</div>
                </div>
                <div className="list-v19">
                  <div className="row-v19 head-item" onClick={toggleAll}><div className={`radio-v19 ${selectedCats.length === categories.length ? 'on' : ''}`}></div><span>ביחרו הכל</span></div>
                  <div className="stack-v19">
                    {categories.map(cat => (
                      <div key={cat.id} className={`row-v19 ${selectedCats.includes(cat.id) ? 'active' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-glow-ui' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v19 ${selectedCats.includes(cat.id) ? 'on' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-dot-ui' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {selectedCats.length > 0 && (
                <div className="footer-btn-unit">
                    <button className="btn-action-neon neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                </div>
            )}
          </div>
        )}

        {/* 4. Game Play */}
        {viewState === 'game-play' && currentCard && (
          <div className="view-unit center-vh fade-in">
            <div className="play-scene-v19" onClick={handleCardClick}>
              <div key={currentCard.text} className={`card-wrap-v19 ${isExiting ? 'exit' : 'enter'}`}>
                <div className={`inner-card-v19 ${isCardOpen ? 'flipped' : ''}`}>
                  <div className="face front"><img src={currentCard.backImage} alt="" className="img-full-fit" /></div>
                  <div className="face back">
                    {currentCard.image && <img src={currentCard.image} alt="" className="img-full-fit" />}
                    <div className="card-text-overlay"><span>{currentCard.text}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-btn-unit">
              <button className="btn-action-neon neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        .app-root-v19 { position: fixed; inset: 0; width: 100%; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #000; transition: 0.8s; }
        .theme-red { background: #000; } .theme-play { background: #050505; }
        
        /* Global Ice Effect */
        .ice-active-global { filter: grayscale(0.85) brightness(0.9); background: #1a1a1a !important; }
        .bg-layer-static { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; }
        .full-bg-img { width: 100%; height: 100%; object-fit: cover; }

        /* Navigation - TOP RIGHT */
        .nav-header-fixed { height: 80px; display: flex; justify-content: flex-end; align-items: center; padding: 0 30px; flex-shrink: 0; z-index: 2000; }
        .back-btn-ui-neon { background: rgba(0,0,0,0.6); border: 1.5px solid rgba(255,255,255,0.4); color: #fff; padding: 10px 24px; border-radius: 30px; cursor: pointer; font-size: 0.95rem; transition: 0.3s; }
        
        /* Neon Effect */
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .viewport-stage-v19 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .view-unit { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
        .center-vh { justify-content: center; }
        .top-anchored { justify-content: flex-start; padding-top: 10px; }

        /* Buttons & Footer Spacing */
        .footer-btn-unit { margin-top: 40px; width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 30px; }
        .btn-action-neon { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: clamp(14px, 2.2vh, 20px) 65px; font-size: 1.35rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* Welcome Screen Fix */
        .hero-box-v19 { text-align: center; margin-bottom: 20px; }
        .hero-h1-v19 { color: #fff; font-size: clamp(3rem, 12vh, 5.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 15px; }
        .hero-subs-v19 { color: #fff; }
        .hero-subs-v19 p { font-size: 1.25rem; opacity: 0.8; margin: 6px 0; }

        /* Instructions - Desktop Mirror */
        .card-box-robust { 
            width: 95%; max-width: 580px; background: rgba(15, 15, 15, 0.95); 
            border: 1.2px solid rgba(255,255,255,0.3); border-radius: 35px; 
            padding: clamp(20px, 3.5vh, 40px); direction: rtl; display: flex; flex-direction: column; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); max-height: 65vh; overflow: hidden;
        }
        .card-title-v19 { color: #fff; text-align: center; font-size: clamp(1.6rem, 3.2vh, 2.2rem); margin-bottom: 1.5vh; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1vh; width: 100%; }
        .instr-body-v19 { color: #fff; text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; gap: 5px; }
        .instr-body-v19 p { font-size: clamp(0.75rem, 1.8vh, 1.05rem); line-height: 1.4; white-space: nowrap; width: 100%; }
        .divider-v19 { margin: 8px 0; font-weight: 700; font-size: 1.1rem; }
        .footer-msg-sexy { font-size: clamp(1.4rem, 3.2vh, 1.8rem); font-weight: 800; padding-top: 15px; color: #fff; }

        /* Categories Stability */
        .cats-frame-v19 { border: 1.2px solid #fff; border-radius: 25px; padding: 25px; max-height: calc(100dvh - 240px); }
        .cats-grid-v19 { display: flex; gap: 30px; direction: ltr; flex-grow: 1; overflow: hidden; }
        .thermo-v19 { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .glass-v19 { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 5px; bottom: 5px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-v19 { position: absolute; bottom: 0; width: 100%; transition: 0.8s; }
        .fill-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .fill-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .fill-ice { background: #fff; box-shadow: 0 0 25px #fff; }
        .fill-full { background: linear-gradient(to top, #007bff, #fff, #ff0000); }
        .dots-v19 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 12px 0; }
        .dot-v19 { width: 14px; height: 14px; border-radius: 50%; background: #222; border: 1.5px solid rgba(255,255,255,0.2); }
        .dot-v19.active { background: #fff; box-shadow: 0 0 8px #fff; }
        .list-v19 { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
        .row-v19 { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: #1a1a1a; border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; flex-shrink: 0; }
        .row-v19.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .radio-v19 { width: 18px; height: 18px; border: 2.2px solid #fff; border-radius: 50%; }
        .radio-v19.on { background: #fff; }
        .stack-v19 { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
        .ice-glow-ui { background: rgba(224, 242, 254, 0.4) !important; border: 1.2px solid #fff; box-shadow: 0 0 15px #fff; }
        .shaking-v19 { animation: shakeV19 0.1s infinite; }
        @keyframes shakeV19 { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }

        /* Snow */
        .snow-global-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
        .snowflake-particle { position: absolute; color: #fff; top: -30px; animation: snowFallStatic 5s linear infinite; opacity: 0.8; font-size: 20px; }
        @keyframes snowFallStatic { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110dvh) rotate(360deg); } }
        .snowflake-particle:nth-child(5n) { left: 10%; animation-delay: 0s; }
        .snowflake-particle:nth-child(5n+1) { left: 35%; animation-delay: 1.5s; }
        .snowflake-particle:nth-child(5n+2) { left: 60%; animation-delay: 3s; }
        .snowflake-particle:nth-child(5n+3) { left: 80%; animation-delay: 0.8s; }
        .snowflake-particle:nth-child(5n+4) { left: 95%; animation-delay: 4s; }

        /* Gameplay */
        .play-scene-v19 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; }
        .card-wrap-v19 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .inner-card-v19 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .inner-card-v19.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .face.back { transform: rotateY(180deg); }
        .img-full-fit { width: 100%; height: 100%; object-fit: cover; }
        .card-text-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .card-text-overlay span { color: #fff; font-size: 1.4rem; font-weight: 800; direction: rtl; display: block; }
        
        /* Animations */
        .enter { animation: cIn19 0.6s forwards; } @keyframes cIn19 { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .exit { animation: cOut19 0.5s ease-in forwards; } @keyframes cOut19 { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: fMain19 0.5s ease; } @keyframes fMain19 { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;