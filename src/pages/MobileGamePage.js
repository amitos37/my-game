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
  const [wasAllSelectedByButton, setWasAllSelectedByButton] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // טעינת נתונים
  useEffect(() => {
    const fetchData = async () => {
      const catSnap = await getDocs(collection(db, "categories"));
      const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const order = ['שאלה חוצפנית', 'סקרנות', 'תשוקה', 'משחק מקדים', 'נועז במיוחד', 'תוספת קרירה'];
      setCategories(fetchedCats.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)));
      const taskSnap = await getDocs(collection(db, "tasks"));
      setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
  const coldCatId = categories.find(c => c.name === 'תוספת קרירה')?.id;
  const isIceActive = viewState === 'category-selection' && selectedCats.includes(coldCatId) && !wasAllSelectedByButton;

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
    <div className={`app-wrapper-final ${isIceActive ? 'global-ice-mode' : ''} ${viewState === 'game-play' ? 'theme-game' : 'theme-red'}`}>
      <div className="global-background">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="full-img" />}</div>
      
      {/* פתיתי שלג גלובליים */}
      {isIceActive && (
          <div className="snow-overlay-v20">
              {[...Array(20)].map((_, i) => <div key={i} className="snowflake-v20">❄</div>)}
          </div>
      )}

      {/* חזרה לתפריט - צד ימין למעלה */}
      <div className="top-nav-area">
          <button className="back-btn-neon neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      <div className="content-container-v20">
        
        {/* 1. Welcome Screen */}
        {viewState === 'welcome' && (
          <div className="view-unit center-vh fade-in">
              <h1 className="hero-title-v20">לחשוף,<br/>לציית,<br/>לגעת.</h1>
              <div className="hero-subs-v20"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
              <div className="footer-action-v20">
                <button className="btn-main-v20 neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
              </div>
          </div>
        )}

        {/* 2. Instructions Screen - ללא קלף למניעת חיתוך */}
        {viewState === 'instructions' && (
          <div className="view-unit top-anchored fade-in">
            <div className="instr-wrapper-v20">
              <h2 className="instr-h2-v20">הוראות המשחק</h2>
              <div className="instr-body-v20">
                <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                <div className="instr-divider-v20">תמצאו במשחק...</div>
                <p>קלפי שאלות שיחשפו קצת juice.</p>
                <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                <p className="extra-gap-v20">הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                <div className="instr-footer-sexy-v20">ייאלה סקסיים למיטה!</div>
              </div>
            </div>
            <div className="footer-action-v20">
                <button className="btn-main-v20 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
          </div>
        )}

        {/* 3. Category Selection */}
        {viewState === 'category-selection' && (
          <div className="view-unit top-anchored fade-in">
            <div className="cats-card-v20">
              <h2 className="cats-h2-v20">בחרו קטגוריות למשחק</h2>
              <div className="cats-grid-v20">
                <div className={`thermo-v20 ${isIceActive ? 'shaking-v20' : ''}`}>
                  <div className="glass-v20"><div className={`fill-v20 fill-${thermo.type}`} style={{ height: thermo.height }}></div></div>
                  <div className="dots-v20">{categories.map(c => <div key={c.id} className={`dot-v20 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>)}</div>
                </div>
                <div className="list-v20">
                  <div className="row-v20 all-btn" onClick={toggleAll}><div className={`radio-v20 ${selectedCats.length === categories.length ? 'on' : ''}`}></div><span>ביחרו הכל</span></div>
                  <div className="stack-v20">
                    {categories.map(cat => (
                      <div key={cat.id} className={`row-v20 ${selectedCats.includes(cat.id) ? 'active' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-row' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v20 ${selectedCats.includes(cat.id) ? 'on' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-dot' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {selectedCats.length > 0 && (
                <div className="footer-action-v20">
                    <button className="btn-main-v20 neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                </div>
            )}
          </div>
        )}

        {/* 4. Game Play */}
        {viewState === 'game-play' && currentCard && (
          <div className="view-unit center-vh fade-in">
            <div className="play-scene-v20" onClick={handleCardClick}>
              <div key={currentCard.text} className={`card-wrap-v20 ${isExiting ? 'exit' : 'enter'}`}>
                <div className={`card-inner-v20 ${isCardOpen ? 'flipped' : ''}`}>
                  <div className="face front-v20"><img src={currentCard.backImage} alt="" className="img-full" /></div>
                  <div className="face back-v20">
                    {currentCard.image && <img src={currentCard.image} alt="" className="img-full" />}
                    <div className="text-overlay-v20"><span>{currentCard.text}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-action-v20">
              <button className="btn-main-v20 neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        /* --- Root --- */
        .app-wrapper-final { position: fixed; inset: 0; width: 100%; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #000; transition: 0.8s; }
        .theme-red { background: #000; } .theme-game { background: #050505; }
        
        /* Global Ice Effect */
        .global-ice-mode { filter: grayscale(0.9) brightness(0.8); background: #1a1a1a !important; }
        .global-background { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; }
        .full-img { width: 100%; height: 100%; object-fit: cover; }

        /* Top Navigation */
        .top-nav-area { height: 80px; display: flex; justify-content: flex-end; align-items: center; padding: 0 25px; flex-shrink: 0; z-index: 2000; }
        .back-btn-neon { background: rgba(0,0,0,0.6); border: 1.5px solid rgba(255,255,255,0.4); color: #fff; padding: 10px 22px; border-radius: 30px; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        
        /* Neon Effect */
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .content-container-v20 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .view-unit { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
        .center-vh { justify-content: center; }
        .top-anchored { justify-content: flex-start; padding-top: 5px; }

        /* Action Buttons */
        .footer-action-v20 { margin-top: auto; width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 30px; }
        .btn-main-v20 { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: clamp(14px, 2vh, 20px) 60px; font-size: 1.35rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* Instructions - No Box Fix */
        .instr-wrapper-v20 { width: 95%; max-width: 600px; direction: rtl; text-align: center; color: #fff; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .instr-h2-v20 { font-size: clamp(2rem, 4.5vh, 2.6rem); margin-bottom: 20px; font-weight: 800; }
        .instr-body-v20 p { font-size: clamp(1rem, 1.95vh, 1.3rem); line-height: 1.5; margin: 4px 0; white-space: normal; }
        .instr-divider-v20 { margin: 15px 0; font-weight: 800; font-size: 1.3rem; }
        .instr-footer-sexy-v20 { font-size: clamp(1.6rem, 3.8vh, 2.2rem); font-weight: 800; margin-top: 25px; }
        .extra-gap-v20 { margin-top: 15px !important; }

        /* Category Selection */
        .cats-card-v20 { width: 95%; max-width: 580px; background: rgba(15, 15, 15, 0.95); border: 1.5px solid #fff; border-radius: 25px; padding: 25px; direction: rtl; display: flex; flex-direction: column; box-shadow: 0 0 50px rgba(0,0,0,0.6); max-height: 60dvh; flex-shrink: 1; }
        .cats-h2-v20 { color: #fff; text-align: center; font-size: clamp(1.6rem, 3.2vh, 2.2rem); margin-bottom: 20px; }
        .cats-grid-v20 { display: flex; gap: 30px; direction: ltr; flex-grow: 1; overflow: hidden; }
        
        .thermo-v20 { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .glass-v20 { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 5px; bottom: 5px; border-radius: 15px; border: 2.2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .fill-v20 { position: absolute; bottom: 0; width: 100%; transition: 0.8s ease-in-out; }
        .fill-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .fill-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .fill-ice { background: #fff !important; box-shadow: 0 0 25px #fff; }
        .fill-full { background: linear-gradient(to top, #007bff, #fff, #ff0000); }
        .dots-v20 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 12px 0; }
        .dot-v20 { width: 14px; height: 14px; border-radius: 50%; background: #222; border: 1.5px solid rgba(255,255,255,0.2); }
        .dot-v20.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-v20 { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
        .row-v20 { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: #1a1a1a; border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; flex-shrink: 0; }
        .row-v20.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .radio-v20 { width: 18px; height: 18px; border: 2.5px solid #fff; border-radius: 50%; }
        .radio-v20.on { background: #fff; }
        .stack-v20 { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
        .ice-row { background: rgba(224, 242, 254, 0.4) !important; border: 1.5px solid #fff; box-shadow: 0 0 15px #fff; }
        .shaking-v20 { animation: shakeV20 0.1s infinite; }
        @keyframes shakeV20 { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }

        /* Snow */
        .snow-overlay-v20 { position: absolute; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
        .snowflake-v20 { position: absolute; color: #fff; top: -30px; animation: snowFallStatic 5s linear infinite; opacity: 0.8; font-size: 20px; }
        @keyframes snowFallStatic { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110dvh) rotate(360deg); } }
        .snowflake-v20:nth-child(4n) { left: 15%; animation-delay: 0s; }
        .snowflake-v20:nth-child(4n+1) { left: 40%; animation-delay: 1.5s; }
        .snowflake-v20:nth-child(4n+2) { left: 65%; animation-delay: 3s; }
        .snowflake-v20:nth-child(4n+3) { left: 85%; animation-delay: 0.8s; }

        /* Welcome */
        .hero-title-v20 { color: #fff; text-align: center; font-size: clamp(3.2rem, 12vh, 5.5rem); font-weight: 800; line-height: 1; margin-bottom: 20px; }
        .hero-subs-v20 { text-align: center; color: #fff; }
        .hero-subs-v20 p { font-size: 1.35rem; opacity: 0.85; margin: 8px 0; }

        /* Gameplay */
        .play-scene-v20 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; position: relative; }
        .card-wrap-v20 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .card-inner-v20 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .card-inner-v20.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .face.back-v20 { transform: rotateY(180deg); }
        .text-overlay-v20 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .text-overlay-v20 span { color: #fff; font-size: 1.5rem; font-weight: 800; direction: rtl; display: block; }
        
        .enter { animation: cInFinal 0.6s forwards; }
        .exit { animation: cOutFinal 0.5s ease-in forwards; }
        @keyframes cInFinal { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes cOutFinal { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: fmain 0.5s ease; } @keyframes fmain { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;