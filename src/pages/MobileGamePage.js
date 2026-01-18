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

  // טעינת נתונים
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

  // בדיקת אפקטים קפואים
  const coldCat = categories.find(c => c.name === 'תוספת קרירה');
  const isIceActive = viewState === 'category-selection' && coldCat && selectedCats.includes(coldCat.id) && !wasAllSelectedByButton;

  // --- הוספת רטט בנייד ---
  useEffect(() => {
    let interval;
    if (isIceActive && "vibrate" in navigator) {
      // רטט בפולסים קצרים כל עוד האפקט פעיל
      interval = setInterval(() => {
        navigator.vibrate([50, 30, 50]); 
      }, 500);
    } else {
      clearInterval(interval);
      if ("vibrate" in navigator) navigator.vibrate(0); // הפסקת רטט
    }
    return () => clearInterval(interval);
  }, [isIceActive]);

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
    <div className={`game-outer-v21 ${viewState === 'game-play' ? 'theme-play' : 'theme-red'} ${isIceActive ? 'global-frost-v21' : ''}`}>
      <div className="bg-static-layer">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="full-bg-img" />}</div>
      
      {/* שלג גלובלי */}
      {isIceActive && (
          <div className="snow-overlay-v21">
              {[...Array(25)].map((_, i) => <div key={i} className="snowflake-v21">❄</div>)}
          </div>
      )}

      {/* Navigation - Top Right */}
      <div className="nav-header-v21">
          <button className="back-btn-v21 neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      <div className="content-stage-v21">
        
        {/* 1. Welcome Screen */}
        {viewState === 'welcome' && (
          <div className="view-unit center-vh fade-in">
              <h1 className="hero-h1-v21">לחשוף,<br/>לציית,<br/>לגעת.</h1>
              <div className="hero-subs-v21"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
              <div className="footer-action-v21">
                <button className="btn-main-v21 neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
              </div>
          </div>
        )}

        {/* 2. Instructions Screen - ללא קלף למניעת חיתוך */}
        {viewState === 'instructions' && (
          <div className="view-unit top-anchored fade-in">
            <div className="instr-content-v21">
              <h2 className="header-text-v21">הוראות המשחק</h2>
              <div className="body-text-v21">
                <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                <div className="divider-v21">תמצאו במשחק...</div>
                <p>קלפי שאלות שיחשפו קצת juice.</p>
                <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                <div className="divider-v21"></div>
                <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                <div className="footer-sexy-v21">ייאלה סקסיים למיטה!</div>
              </div>
            </div>
            <div className="footer-action-v21">
                <button className="btn-main-v21 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
          </div>
        )}

        {/* 3. Category Selection - ללא קלף למניעת חיתוך */}
        {viewState === 'category-selection' && (
          <div className="view-unit top-anchored fade-in">
            <div className="cats-content-v21">
              <h2 className="header-text-v21">בחרו קטגוריות למשחק</h2>
              <div className="cats-grid-v21">
                <div className={`thermo-v21 ${isIceActive ? 'shaking-v21' : ''}`}>
                  <div className="glass-v21"><div className={`mercury-v21 fill-${thermo.type}`} style={{ height: thermo.height }}></div></div>
                  <div className="dots-v21">{categories.map(c => <div key={c.id} className={`dot-v21 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>)}</div>
                </div>
                <div className="list-v21">
                  <div className="row-v21 all-btn" onClick={toggleAll}><div className={`radio-v21 ${selectedCats.length === categories.length ? 'on' : ''}`}></div><span>ביחרו הכל</span></div>
                  <div className="stack-v21">
                    {categories.map(cat => (
                      <div key={cat.id} className={`row-v21 ${selectedCats.includes(cat.id) ? 'active' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-glow' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v21 ${selectedCats.includes(cat.id) ? 'on' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-dot-v21' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {selectedCats.length > 0 && (
                <div className="footer-action-v21">
                    <button className="btn-main-v21 neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                </div>
            )}
          </div>
        )}

        {/* 4. Game Play */}
        {viewState === 'game-play' && currentCard && (
          <div className="view-unit center-vh fade-in">
            <div className="play-scene-v21" onClick={handleCardClick}>
              <div key={currentCard.text} className={`card-wrap-v21 ${isExiting ? 'exit' : 'enter'}`}>
                <div className={`inner-card-v21 ${isCardOpen ? 'flipped' : ''}`}>
                  <div className="face front-v21"><img src={currentCard.backImage} alt="" className="img-full-fit" /></div>
                  <div className="face back-v21">
                    {currentCard.image && <img src={currentCard.image} alt="" className="img-full-fit" />}
                    <div className="text-overlay-v21"><span>{currentCard.text}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-action-v21">
              <button className="btn-main-v21 neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        .game-outer-v21 { position: fixed; inset: 0; width: 100%; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #000; transition: background 0.8s, filter 0.8s; }
        .theme-red { background: #000; } .theme-play { background: #050505; }
        
        /* Global Ice Effect */
        .global-frost-v21 { filter: grayscale(0.9) brightness(0.85); background: #1a1a1a !important; }
        .bg-static-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; }
        .full-bg-img { width: 100%; height: 100%; object-fit: cover; }

        /* Navigation */
        .nav-header-v21 { height: 80px; display: flex; justify-content: flex-end; align-items: center; padding: 0 25px; flex-shrink: 0; z-index: 2000; }
        .back-btn-v21 { background: rgba(0,0,0,0.6); border: 1.2px solid rgba(255,255,255,0.4); color: #fff; padding: 10px 22px; border-radius: 30px; cursor: pointer; font-size: 0.95rem; transition: 0.3s; }
        
        /* Neon Effect */
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .content-stage-v21 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .view-unit { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
        .center-vh { justify-content: center; }
        .top-anchored { justify-content: flex-start; padding-top: 10px; }

        /* Buttons & Footer Spacing */
        .footer-action-v21 { margin-top: auto; width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 30px; }
        .btn-main-v21 { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: clamp(14px, 2.2vh, 20px) 60px; font-size: 1.35rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* Welcome */
        .hero-h1-v21 { color: #fff; text-align: center; font-size: clamp(3rem, 12vh, 5.5rem); font-weight: 800; line-height: 1; margin-bottom: 20px; }
        .hero-subs-v21 { text-align: center; color: #fff; }
        .hero-subs-v21 p { font-size: 1.25rem; opacity: 0.8; margin: 8px 0; }

        /* Instructions - No Box Mirror */
        .instr-content-v21 { width: 95%; max-width: 600px; direction: rtl; text-align: center; color: #fff; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
        .header-text-v21 { font-size: clamp(1.8rem, 3.8vh, 2.4rem); margin-bottom: 20px; font-weight: 800; border-bottom: 1.5px solid rgba(255,255,255,0.1); width: 100%; padding-bottom: 10px; }
        .body-text-v21 p { font-size: clamp(0.85rem, 1.85vh, 1.15rem); line-height: 1.45; margin: 4px 0; white-space: nowrap; }
        .divider-v21 { margin: 12px 0; font-weight: 800; font-size: 1.15rem; }
        .footer-sexy-v21 { font-size: clamp(1.4rem, 3.5vh, 2rem); font-weight: 800; margin-top: 15px; }

        /* Categories - No Box Mirror */
        .cats-content-v21 { width: 95%; max-width: 600px; direction: rtl; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
        .cats-grid-v21 { display: flex; gap: 35px; direction: ltr; flex-grow: 1; align-items: center; justify-content: center; overflow: hidden; padding: 20px 0; }
        
        .thermo-v21 { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; height: 350px; flex-shrink: 0; }
        .glass-v21 { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 0; bottom: 0; border-radius: 15px; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-v21 { position: absolute; bottom: 0; width: 100%; transition: 0.8s; }
        .fill-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .fill-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .fill-ice { background: #fff; box-shadow: 0 0 25px #fff; }
        .fill-full { background: linear-gradient(to top, #007bff, #fff, #ff0000); }
        .dots-v21 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 10px 0; }
        .dot-v21 { width: 14px; height: 14px; border-radius: 50%; background: #222; border: 1.5px solid rgba(255,255,255,0.2); }
        .dot-v21.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-v21 { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 10px; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
        .row-v21 { display: flex; align-items: center; gap: 12px; padding: clamp(10px, 1.8vh, 15px) 20px; background: rgba(25, 25, 25, 0.8); border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; flex-shrink: 0; }
        .row-v21.active { border: 1px solid rgba(255,255,255,0.3); background: rgba(40, 40, 40, 0.9); }
        .radio-v21 { width: 20px; height: 20px; border: 2.2px solid #fff; border-radius: 50%; }
        .radio-v21.on { background: #fff; }
        .stack-v21 { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .ice-glow { background: rgba(224, 242, 254, 0.4) !important; border: 1.2px solid #fff; box-shadow: 0 0 15px #fff; }
        .shaking-v21 { animation: vibeShakeV21 0.1s infinite; }
        @keyframes vibeShakeV21 { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }

        /* Global Snow */
        .snow-overlay-v21 { position: absolute; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
        .snowflake-v21 { position: absolute; color: #fff; top: -30px; animation: snowFallStatic 5s linear infinite; opacity: 0.8; font-size: 20px; }
        @keyframes snowFallStatic { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110dvh) rotate(360deg); } }
        .snowflake-v21:nth-child(5n) { left: 10%; animation-delay: 0s; }
        .snowflake-v21:nth-child(5n+1) { left: 35%; animation-delay: 1.5s; }
        .snowflake-v21:nth-child(5n+2) { left: 60%; animation-delay: 3s; }
        .snowflake-v21:nth-child(5n+3) { left: 80%; animation-delay: 0.8s; }
        .snowflake-v21:nth-child(5n+4) { left: 95%; animation-delay: 4s; }

        /* Gameplay */
        .play-scene-v21 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; }
        .card-wrap-v21 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .inner-card-v21 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .inner-card-v21.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .face.back-v21 { transform: rotateY(180deg); }
        .img-full-fit { width: 100%; height: 100%; object-fit: cover; }
        .text-overlay-v21 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .text-overlay-v21 span { color: #fff; font-size: 1.5rem; font-weight: 800; direction: rtl; display: block; }
        
        /* Animations */
        .enter { animation: cIn21 0.6s forwards; } @keyframes cIn21 { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .exit { animation: cOut21 0.5s ease-in forwards; } @keyframes cOut21 { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: fMain21 0.5s ease; } @keyframes fMain21 { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;