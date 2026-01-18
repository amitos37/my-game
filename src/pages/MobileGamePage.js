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
  
  // Game Play States
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

  // לוגיקת המדחום
  const getThermoStyles = () => {
    const isAll = selectedCats.length === categories.length;
    const coldCat = categories.find(c => c.name === 'תוספת קרירה');
    const isColdSelected = coldCat && selectedCats.includes(coldCat.id);
    if (isAll && wasAllSelectedByButton) return { height: '100%', type: 'full' };
    if (isColdSelected && !wasAllSelectedByButton) return { height: '10%', type: 'ice' };
    if (selectedCats.length === 0) return { height: '0%', type: 'none' };
    const lastIndex = Math.max(...selectedCats.map(id => categories.findIndex(c => c.id === id)));
    const catName = categories[lastIndex]?.name;
    const type = (catName === 'שאלה חוצפנית' && selectedCats.length === 1) ? 'blue' : 'red';
    return { height: `${((lastIndex + 1) / categories.length) * 100}%`, type };
  };

  const thermo = getThermoStyles();

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
    else { 
        setIsExiting(true); 
        setTimeout(() => { drawNextCard(); setIsExiting(false); }, 500); 
    }
  };

  // יצירת פתיתי שלג דינמית כדי למנוע שגיאות CSS
  const snowflakeStyles = Array.from({ length: 25 }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const size = 14 + Math.random() * 18;
    return `.snowflake-particle:nth-child(${i + 1}) { left: ${left}%; animation-delay: ${delay}s; font-size: ${size}px; }`;
  }).join('\n');

  return (
    <div className={`game-wrapper ${viewState === 'game-play' ? 'gray-theme' : 'red-theme'}`}>
      <div className="global-bg-layer">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="full-bg" />}</div>
      <div className="top-navigation"><button className="back-to-menu-btn neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button></div>

      {/* 1. Welcome Screen */}
      {viewState === 'welcome' && (
        <div className="state-view-container">
            <div className="welcome-hero-box fade-in">
                <h1 className="hero-main-title">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="hero-subtext-group"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
                <button className="action-neon-btn neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen - ללא גלילה כלל */}
      {viewState === 'instructions' && (
        <div className="state-view-container instructions-outer">
            <div className="instr-card-container fade-in">
                <h2 className="instr-main-header">הוראות המשחק</h2>
                <div className="instr-content-box">
                    <div className="instr-p-static tight-line">
                        <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                        <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                        <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                        <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                        <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                        <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                    </div>
                    <div className="instr-p-static gap-y centered"><p>תמצאו במשחק...</p></div>
                    <div className="instr-p-static tight-line">
                        <p>קלפי שאלות שיחשפו קצת juice.</p>
                        <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                        <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                        <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                        <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                    </div>
                    <div className="instr-p-static gap-y tight-line">
                        <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                        <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                    </div>
                </div>
                <div className="instr-final-footer">ייאלה סקסיים למיטה!</div>
            </div>
            <div className="instr-button-wrapper">
                <button className="instr-action-btn neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
        </div>
      )}

      {/* 3. Category Selection */}
      {viewState === 'category-selection' && (
        <div className={`state-view-container ${thermo.type === 'ice' ? 'global-frost-active' : ''}`}>
          {thermo.type === 'ice' && <div className="global-snow-layer">{[...Array(25)].map((_, i) => <div key={i} className="snowflake-particle">❄</div>)}</div>}
          <div className="cats-selection-panel neon-border fade-in">
            <h2 className="cats-title-header">בחרו קטגוריות למשחק</h2>
            <div className="cats-main-grid">
              <div className={`thermo-v-widget ${thermo.type === 'ice' ? 'shaking-vibe' : ''}`}>
                <div className="glass-container">
                    <div className={`mercury-fill-bar color-mode-${thermo.type}`} style={{ height: thermo.height }}></div>
                    {thermo.type === 'ice' && <div className="ice-mist-effect"></div>}
                </div>
                <div className="bead-indicators">{categories.map((c, i) => (<div key={c.id} className={`bead-item ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>))}</div>
              </div>
              <div className="categories-list-container">
                <div className="cat-row-selection header-selection" onClick={toggleAll}>
                  <div className={`custom-radio ${selectedCats.length === categories.length ? 'selected' : ''}`}></div>
                  <span className="cat-label-txt">ביחרו הכל</span>
                </div>
                <div className="cats-scroll-viewport luxury-scroll">
                  {categories.map((cat) => {
                    const isIceRow = cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton;
                    return (
                      <div key={cat.id} className={`cat-row-selection ${selectedCats.includes(cat.id) ? 'active' : ''} ${isIceRow ? 'ice-row-frost' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`custom-radio ${selectedCats.includes(cat.id) ? 'selected' : ''} ${isIceRow ? 'ice-dot' : ''}`}></div>
                        <span className="cat-label-txt">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
                {selectedCats.length > 0 && <button className="start-game-neon-btn neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Play */}
      {viewState === 'game-play' && currentCard && (
        <div className="state-view-container">
          <div className="card-scene" onClick={handleCardClick}>
            <div key={currentCard.text} className={`active-card-wrapper ${isExiting ? 'throw-out' : 'deal-in'}`}>
              <div className={`flip-inner ${isCardOpen ? 'flipped' : ''}`}>
                <div className="flip-front"><img src={currentCard.backImage} alt="" className="img-fit" /></div>
                <div className="flip-back">
                  {currentCard.image && <img src={currentCard.image} alt="" className="img-fit" />}
                  <div className="card-text-container"><span className="card-text">{currentCard.text}</span></div>
                </div>
              </div>
            </div>
          </div>
          <button className="back-selection-btn neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; }
        .game-wrapper { position: fixed; inset: 0; width: 100%; height: 100vh; overflow: hidden; }
        .red-theme { background: #000; } .gray-theme { background: #050505; }
        .global-bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; }
        .full-bg { width: 100%; height: 100%; object-fit: cover; }
        .top-navigation { position: fixed; top: 20px; right: 20px; z-index: 100; }
        .back-to-menu-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; }
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .state-view-container { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }

        /* Welcome */
        .hero-main-title { color: #fff; text-align: center; font-size: 5.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 25px; }
        .hero-subtext-group { text-align: center; color: #fff; margin-bottom: 40px; }
        .hero-subtext-group p { font-size: 1.3rem; margin: 5px 0; opacity: 0.9; }
        .action-neon-btn { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 20px 60px; font-size: 1.5rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* --- Instructions - ללא גלילה --- */
        .instructions-outer { gap: 15px; overflow: hidden; height: 100%; }
        .instr-card-container { 
          width: 95%; max-width: 550px; 
          background: rgba(15, 15, 15, 0.92); border: 1px solid rgba(255,255,255,0.25); 
          border-radius: 30px; padding: 30px 45px; direction: rtl; display: flex; flex-direction: column; 
          box-shadow: 0 15px 50px rgba(0,0,0,0.6); overflow: hidden;
        }
        .instr-main-header { color: #fff; text-align: center; font-size: clamp(1.8rem, 4vh, 2.1rem); margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px; }
        .instr-content-box { color: #fff; text-align: center; overflow: hidden; width: 100%; }
        .instr-p-static.tight-line p { line-height: 1.35; margin: 0; font-size: clamp(0.9rem, 1.8vh, 1.05rem); }
        .instr-p-static.gap-y { margin-top: 1vh !important; }
        .instr-final-footer { font-size: clamp(1.4rem, 3vh, 1.6rem); font-weight: 800; color: #fff; text-align: center; padding-top: 10px; }
        .instr-button-wrapper { width: 100%; display: flex; justify-content: center; margin-top: 20px; }
        .instr-action-btn { padding: clamp(14px, 2vh, 18px) 60px; font-size: 1.4rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; }

        @media (max-width: 768px) { 
            .instr-card-container { padding: 25px; width: 95%; } 
            .hero-main-title { font-size: 3.5rem; }
            .instr-action-btn { padding: 12px 40px; font-size: 1.2rem; }
        }

        /* --- Category Selection & Ice --- */
        .cats-selection-panel { width: 95%; max-width: 550px; background: rgba(15, 15, 15, 0.95); padding: 35px; border-radius: 25px; border: 1px solid #fff; direction: rtl; z-index: 10; }
        .cats-title-header { color: #fff; text-align: center; font-size: 2rem; margin-bottom: 30px; }
        .cats-main-grid { display: flex; gap: 30px; height: 460px; direction: ltr; align-items: stretch; }
        .thermo-v-widget { width: 50px; position: relative; display: flex; flex-direction: column; align-items: center; }
        .shaking-vibe { animation: vibeAnim 0.1s infinite !important; }
        @keyframes vibeAnim { 0% { transform: translate(1px, 1px) rotate(0deg); } 50% { transform: translate(-1px, -1px) rotate(1deg); } 100% { transform: translate(1px, -1px) rotate(-1deg); } }
        .glass-container { width: 22px; background: rgba(255,255,255,0.1); position: absolute; top: 10px; bottom: 10px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-fill-bar { position: absolute; bottom: 0; width: 100%; transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .color-mode-full { background: linear-gradient(to top, #007bff 0%, #ffffff 50%, #ff0000 100%); }
        .color-mode-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .color-mode-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .color-mode-ice { background: #fff !important; box-shadow: 0 0 30px #fff; }
        
        .global-frost-active { background: rgba(40, 40, 50, 0.7) !important; backdrop-filter: grayscale(0.8) blur(3px); }
        .global-snow-layer { position: absolute; inset: 0; pointer-events: none; z-index: 99; overflow: hidden; }
        .snowflake-particle { position: absolute; color: #fff; top: -30px; animation: snowGravity 5s linear infinite; }
        @keyframes snowGravity { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110vh) rotate(360deg); } }
        ${snowflakeStyles}

        .ice-row-frost { background: rgba(224, 242, 254, 0.5) !important; border: 2px solid #fff !important; box-shadow: inset 0 0 25px rgba(255,255,255,0.7), 0 0 20px #fff; }
        .categories-list-container { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 12px; }
        .cat-row-selection { display: flex; align-items: center; gap: 18px; padding: 16px 22px; background: #1a1a1a; border-radius: 15px; cursor: pointer; color: #fff; transition: 0.3s; position: relative; }
        .cat-row-selection.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .custom-radio { width: 22px; height: 22px; border: 2px solid #fff; border-radius: 50%; flex-shrink: 0; }
        .custom-radio.selected { background: #fff; }
        .start-game-neon-btn { width: 100%; padding: 20px; margin-top: auto; border-radius: 35px; background: #333; border: 1px solid #fff; color: #fff; cursor: pointer; font-size: 1.4rem; font-weight: 700; }

        /* Gameplay */
        .card-scene { width: 300px; height: 420px; perspective: 1500px; cursor: pointer; position: relative; }
        .active-card-wrapper { width: 100%; height: 100%; transform-style: preserve-3d; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-front, .flip-back { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .flip-back { transform: rotateY(180deg); }
        .img-fit { width: 100%; height: 100%; object-fit: cover; }
        .card-text-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .card-text { color: #fff; font-size: 1.5rem; font-weight: 800 !important; direction: rtl; display: block; width: 100%; }
        .back-selection-btn { margin-top: 30px; padding: 15px 45px; font-size: 1.4rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; transition: 0.3s; }

        .deal-in { animation: dealEnter 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .throw-out { animation: dealExit 0.5s ease-in forwards; }
        @keyframes dealEnter { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes dealExit { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: viewIn 0.5s ease; } @keyframes viewIn { from { opacity: 0; } to { opacity: 1; } }
        .luxury-scroll::-webkit-scrollbar { width: 5px; } .luxury-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MobileGamePage;