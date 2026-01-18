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

  // בדיקת הפעלת אפקטים קפואים
  const coldCat = categories.find(c => c.name === 'תוספת קרירה');
  const isIceActive = viewState === 'category-selection' && coldCat && selectedCats.includes(coldCat.id) && !wasAllSelectedByButton;

  // --- רטט בנייד בזמן רעידה ---
  useEffect(() => {
    let interval;
    if (isIceActive && "vibrate" in navigator) {
      interval = setInterval(() => {
        navigator.vibrate([40, 20, 40]); 
      }, 600);
    } else {
      clearInterval(interval);
      if ("vibrate" in navigator) navigator.vibrate(0);
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
    <div className={`game-root-v22 ${viewState === 'game-play' ? 'theme-play' : 'theme-red'} ${isIceActive ? 'ice-mode-global' : ''}`}>
      <div className="global-bg-layer">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="bg-img-fit" />}</div>
      
      {/* אפקט אדים (Fog) על כל המסך */}
      {isIceActive && <div className="fog-overlay-v22 fade-in"></div>}

      {/* Navigation - Top Right */}
      <div className="nav-top-v22">
          <button className="btn-back-v22 neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      <div className="viewport-v22">
        
        {/* 1. Welcome Screen */}
        {viewState === 'welcome' && (
          <div className="unit-v22 center fade-in">
              <h1 className="h1-v22">לחשוף,<br/>לציית,<br/>לגעת.</h1>
              <div className="subs-v22"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
              <div className="footer-area-v22">
                <button className="btn-neon-v22 neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
              </div>
          </div>
        )}

        {/* 2. Instructions Screen - ללא קלף */}
        {viewState === 'instructions' && (
          <div className="unit-v22 top-anchored fade-in">
            <div className="instr-content-v22">
              <h2 className="header-v22">הוראות המשחק</h2>
              <div className="body-v22">
                <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                <div className="divider-v22">תמצאו במשחק...</div>
                <p>קלפי שאלות שיחשפו קצת juice.</p>
                <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                <div className="divider-v22"></div>
                <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                <div className="footer-msg-v22">ייאלה סקסיים למיטה!</div>
              </div>
            </div>
            <div className="footer-area-v22">
                <button className="btn-neon-v22 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
          </div>
        )}

        {/* 3. Category Selection - ללא קלף */}
        {viewState === 'category-selection' && (
          <div className="unit-v22 top-anchored fade-in">
            <div className="cats-wrapper-v22">
              <h2 className="header-v22">בחרו קטגוריות למשחק</h2>
              <div className="cats-layout-v22">
                <div className={`thermo-v22 ${isIceActive ? 'shaking-v22' : ''}`}>
                  <div className="glass-v22"><div className={`mercury-v22 fill-${thermo.type}`} style={{ height: thermo.height }}></div></div>
                  <div className="dots-v22">{categories.map(c => <div key={c.id} className={`dot-v22 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>)}</div>
                </div>
                <div className="list-v22">
                  <div className="row-v22 all" onClick={toggleAll}><div className={`radio-v22 ${selectedCats.length === categories.length ? 'on' : ''}`}></div><span>ביחרו הכל</span></div>
                  <div className="stack-v22">
                    {categories.map(cat => (
                      <div key={cat.id} className={`row-v22 ${selectedCats.includes(cat.id) ? 'active' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-glow' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v22 ${selectedCats.includes(cat.id) ? 'on' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-dot-v22' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {selectedCats.length > 0 && (
                <div className="footer-area-v22">
                    <button className="btn-neon-v22 neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                </div>
            )}
          </div>
        )}

        {/* 4. Game Play */}
        {viewState === 'game-play' && currentCard && (
          <div className="unit-v22 center fade-in">
            <div className="scene-v22" onClick={handleCardClick}>
              <div key={currentCard.text} className={`card-wrap-v22 ${isExiting ? 'exit' : 'enter'}`}>
                <div className={`card-inner-v22 ${isCardOpen ? 'flipped' : ''}`}>
                  <div className="face front-v22"><img src={currentCard.backImage} alt="" className="img-full-fit" /></div>
                  <div className="face back-v22">
                    {currentCard.image && <img src={currentCard.image} alt="" className="img-full-fit" />}
                    <div className="text-overlay-v22"><span>{currentCard.text}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-area-v22">
              <button className="btn-neon-v22 neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        /* --- Root --- */
        .game-root-v22 { position: fixed; inset: 0; width: 100%; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #000; transition: 0.8s; }
        .theme-red { background: #000; } .theme-play { background: #050505; }
        
        /* Global Ice Effect (Fog) */
        .ice-mode-global { background: #2c2c2c !important; }
        .fog-overlay-v22 { 
            position: absolute; inset: 0; z-index: 500; 
            background: rgba(255, 255, 255, 0.08); 
            backdrop-filter: blur(12px); /* אפקט האדים */
            pointer-events: none;
        }

        .global-bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; }
        .bg-img-fit { width: 100%; height: 100%; object-fit: cover; }

        /* Navigation */
        .nav-top-v22 { height: 80px; display: flex; justify-content: flex-end; align-items: center; padding: 0 25px; flex-shrink: 0; z-index: 2000; }
        .btn-back-v22 { background: rgba(0,0,0,0.6); border: 1.2px solid rgba(255,255,255,0.4); color: #fff; padding: 10px 22px; border-radius: 30px; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        
        /* Neon Effect */
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .viewport-v22 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .unit-v22 { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
        .center { justify-content: center; }
        .top-anchored { justify-content: flex-start; padding-top: 10px; }

        /* Buttons & Spacing */
        .footer-area-v22 { margin-top: auto; width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 30px; }
        .btn-neon-v22 { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: clamp(14px, 2.2vh, 19px) 60px; font-size: 1.35rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; z-index: 1000; }

        /* Instructions - No Box Fix */
        .instr-content-v22 { width: 95%; max-width: 600px; direction: rtl; text-align: center; color: #fff; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; text-shadow: 0 2px 10px rgba(0,0,0,0.7); }
        .header-v22 { font-size: clamp(2rem, 4.2vh, 2.6rem); margin-bottom: 20px; font-weight: 800; border-bottom: 1.5px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
        .body-v22 p { font-size: clamp(0.95rem, 1.95vh, 1.25rem); line-height: 1.5; margin: 4px 0; white-space: nowrap; }
        .divider-v22 { margin: 12px 0; font-weight: 800; font-size: 1.25rem; }
        .footer-msg-v22 { font-size: clamp(1.6rem, 3.8vh, 2.2rem); font-weight: 800; margin-top: 25px; }

        /* Categories - No Box Fix */
        .cats-wrapper-v22 { width: 95%; max-width: 600px; direction: rtl; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; z-index: 600; }
        .cats-layout-v22 { display: flex; gap: 35px; direction: ltr; flex-grow: 1; align-items: center; justify-content: center; overflow: hidden; padding: 20px 0; }
        
        .thermo-v22 { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; height: 350px; flex-shrink: 0; }
        .glass-v22 { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 0; bottom: 0; border-radius: 15px; border: 2.2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-v22 { position: absolute; bottom: 0; width: 100%; transition: 0.8s; }
        .fill-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .fill-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .fill-ice { background: #fff; box-shadow: 0 0 25px #fff; }
        .fill-full { background: linear-gradient(to top, #007bff, #fff, #ff0000); }
        .dots-v22 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 10px 0; }
        .dot-v22 { width: 14px; height: 14px; border-radius: 50%; background: #222; border: 1.5px solid rgba(255,255,255,0.2); }
        .dot-v22.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-v22 { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 10px; }
        .row-v22 { display: flex; align-items: center; gap: 12px; padding: clamp(12px, 1.9vh, 16px) 20px; background: rgba(25, 25, 25, 0.7); border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; flex-shrink: 0; }
        .row-v22.active { border: 1px solid rgba(255,255,255,0.3); background: rgba(40, 40, 40, 0.85); }
        .radio-v22 { width: 18px; height: 18px; border: 2.2px solid #fff; border-radius: 50%; }
        .radio-v22.on { background: #fff; }
        .stack-v22 { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .ice-glow { background: rgba(224, 242, 254, 0.4) !important; border: 1.5px solid #fff; box-shadow: 0 0 15px #fff; }
        .shaking-v22 { animation: shake22 0.1s infinite !important; }
        @keyframes shake22 { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }

        /* Welcome Screen */
        .h1-v22 { color: #fff; text-align: center; font-size: clamp(3.2rem, 12vh, 5.5rem); font-weight: 800; line-height: 1; margin-bottom: 20px; }
        .subs-v22 { text-align: center; color: #fff; }
        .subs-v22 p { font-size: 1.35rem; opacity: 0.85; margin: 8px 0; }

        /* Gameplay */
        .scene-v22 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; }
        .card-wrap-v22 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .card-inner-v22 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .card-inner-v22.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .face.back-v22 { transform: rotateY(180deg); }
        .img-full-fit { width: 100%; height: 100%; object-fit: cover; }
        .text-overlay-v22 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .text-overlay-v22 span { color: #fff; font-size: 1.5rem; font-weight: 800; direction: rtl; display: block; }
        
        .fade-in { animation: fadeIn22 0.5s ease; } @keyframes fadeIn22 { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;