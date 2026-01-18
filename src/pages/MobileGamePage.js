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

  const getThermoStyles = () => {
    const isAll = selectedCats.length === categories.length;
    const coldCat = categories.find(c => c.name === 'תוספת קרירה');
    const isColdSelected = coldCat && selectedCats.includes(coldCat.id);
    if (isAll && wasAllSelectedByButton) return { height: '100%', type: 'full' };
    if (isColdSelected && !wasAllSelectedByButton) return { height: '8%', type: 'ice' };
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

      {/* 2. Instructions Screen - ללא גלילה, מתחת ללחצן וללא חיתוך */}
      {viewState === 'instructions' && (
        <div className="state-view-container instructions-exact-layout">
            <div className="instr-card-exact-v2 fade-in">
                <h2 className="instr-header-v2">הוראות המשחק</h2>
                <div className="instr-body-v2">
                    <div className="instr-section tight-v">
                        <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                        <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                        <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                        <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                        <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                        <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                    </div>
                    <div className="instr-section centered gap-v2"><p>תמצאו במשחק...</p></div>
                    <div className="instr-section tight-v">
                        <p>קלפי שאלות שיחשפו קצת juice.</p>
                        <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                        <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                        <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                        <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                    </div>
                    <div className="instr-section tight-v gap-v2">
                        <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                        <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                    </div>
                </div>
                <div className="instr-footer-v2">ייאלה סקסיים למיטה!</div>
            </div>
            <div className="instr-btn-container-v2">
                <button className="instr-final-btn neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
        </div>
      )}

      {/* 3. Category Selection */}
      {viewState === 'category-selection' && (
        <div className={`state-view-container selection-view ${thermo.type === 'ice' ? 'global-frost-active' : ''}`}>
          {thermo.type === 'ice' && (
              <div className="global-snow-layer">
                  {[...Array(25)].map((_, i) => (
                      <div key={i} className="snowflake-particle" style={{
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 5}s`,
                          fontSize: `${14 + Math.random() * 18}px`
                      }}>❄</div>
                  ))}
              </div>
          )}
          <div className="cats-panel-box-global neon-border fade-in">
            <h2 className="cats-title-global">בחרו קטגוריות למשחק</h2>
            <div className="cats-layout-grid-global">
              <div className={`thermo-v-widget-global ${thermo.type === 'ice' ? 'shaking-global' : ''}`}>
                <div className="glass-tube-global">
                    <div className={`mercury-fill-global color-v-${thermo.type}`} style={{ height: thermo.height }}></div>
                    {thermo.type === 'ice' && <div className="ice-mist-global"></div>}
                </div>
                <div className="bead-indicators-global">{categories.map((c, i) => (<div key={c.id} className={`bead-global ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>))}</div>
              </div>
              <div className="cats-list-container-global">
                <div className="cat-row-global header-row" onClick={toggleAll}>
                  <div className={`custom-radio-global ${selectedCats.length === categories.length ? 'selected' : ''}`}></div>
                  <span className="cat-label-txt">ביחרו הכל</span>
                </div>
                <div className="cat-static-list-no-scroll">
                  {categories.map((cat) => {
                    const isIceRow = cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton;
                    return (
                      <div key={cat.id} className={`cat-row-global ${selectedCats.includes(cat.id) ? 'active' : ''} ${isIceRow ? 'ice-row-frost' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`custom-radio-global ${selectedCats.includes(cat.id) ? 'selected' : ''} ${isIceRow ? 'ice-dot' : ''}`}></div>
                        <span className="cat-label-txt">{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
                {selectedCats.length > 0 && (
                    <div className="start-btn-container-global">
                        <button className="start-btn-global neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                    </div>
                )}
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
          <button className="reshuffle-btn neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; }
        
        .game-wrapper { position: fixed; inset: 0; width: 100%; height: 100dvh; overflow: hidden; }
        .red-theme { background: #000; } .gray-theme { background: #050505; }
        .global-bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; }
        .full-bg { width: 100%; height: 100%; object-fit: cover; }
        .top-navigation { position: fixed; top: 20px; right: 20px; z-index: 1000; }
        .back-to-menu-btn { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; }
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.1) !important; }
        .state-view-container { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }

        .hero-main-title { color: #fff; text-align: center; font-size: clamp(3rem, 10vh, 5.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 2vh; }
        .hero-subtext-group { text-align: center; color: #fff; margin-bottom: 4vh; }
        .action-neon-btn { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 18px 60px; font-size: 1.4rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* --- Instructions - No Scroll & Fixed Layout --- */
        .instructions-exact-layout { 
            justify-content: flex-start; 
            padding-top: 90px; /* מבטיח שהקלף תמיד מתחת לכפתור "חזרה" */
            height: 100dvh; 
            gap: 2vh; 
        }
        .instr-card-exact-v2 { 
            width: 95%; max-width: 580px; 
            background: rgba(15, 15, 15, 0.92); border: 1px solid rgba(255,255,255,0.25); 
            border-radius: 35px; padding: clamp(20px, 3.5vh, 40px); direction: rtl; 
            display: flex; flex-direction: column; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.7); 
            flex-shrink: 1; /* מתכווץ כדי להתאים למסך */
            overflow: hidden;
        }
        .instr-header-v2 { color: #fff; text-align: center; font-size: clamp(1.8rem, 3.8vh, 2.2rem); margin-bottom: 1.5vh; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 1vh; flex-shrink: 0; }
        .instr-body-v2 { color: #fff; text-align: center; width: 100%; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-around; }
        .instr-section.tight-v p { line-height: 1.3; margin: 0; font-size: clamp(0.85rem, 1.7vh, 1.05rem); }
        .instr-section.gap-v2 { margin-top: 1.2vh !important; }
        .instr-footer-v2 { font-size: clamp(1.3rem, 3vh, 1.6rem); font-weight: 800; color: #fff; text-align: center; padding-top: 1vh; flex-shrink: 0; }
        .instr-btn-container-v2 { width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 15px; }
        .instr-final-btn { padding: clamp(12px, 1.8vh, 18px) 60px; font-size: 1.3rem; border-radius: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; font-weight: 700; }

        @media (max-width: 768px) { 
            .instructions-exact-layout { padding-top: 80px; }
            .instr-card-exact-v2 { padding: 25px 20px; width: 92%; } 
            .instr-final-btn { padding: 12px 40px; font-size: 1.1rem; }
        }

        /* --- Category Selection Styles --- */
        .cats-panel-box-global { width: 95%; max-width: 580px; background: rgba(15, 15, 15, 0.95); padding: 35px; border-radius: 25px; border: 1px solid #fff; direction: rtl; z-index: 10; display: flex; flex-direction: column; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
        .cats-title-global { color: #fff; text-align: center; font-size: clamp(1.6rem, 3.5vh, 2.2rem); margin-bottom: 25px; }
        .cats-layout-grid-global { display: flex; gap: clamp(15px, 4vw, 40px); direction: ltr; align-items: stretch; }
        .thermo-v-widget-global { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .shaking-global { animation: globalVibe 0.1s infinite !important; }
        @keyframes globalVibe { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }
        .glass-tube-global { width: 20px; background: rgba(255,255,255,0.1); position: absolute; top: 10px; bottom: 10px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-fill-global { position: absolute; bottom: 0; width: 100%; transition: all 0.8s ease-in-out; }
        .color-v-full { background: linear-gradient(to top, #007bff 0%, #ffffff 50%, #ff0000 100%); }
        .color-v-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .color-v-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .color-v-ice { background: #fff !important; box-shadow: 0 0 30px #fff; }
        .bead-indicators-global { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 15px 0; }
        .bead-global { width: 15px; height: 15px; border-radius: 50%; background: #222; border: 1px solid rgba(255,255,255,0.1); }
        .bead-global.active { background: #fff; box-shadow: 0 0 10px #fff; }
        .cats-list-container-global { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 12px; }
        .cat-row-global { display: flex; align-items: center; gap: 15px; padding: 15px 22px; background: #1a1a1a; border-radius: 15px; cursor: pointer; color: #fff; transition: 0.3s; width: 100%; }
        .cat-row-global.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .custom-radio-global { width: 22px; height: 22px; border: 2px solid #fff; border-radius: 50%; flex-shrink: 0; }
        .custom-radio-global.selected { background: #fff; }
        .cat-static-list-no-scroll { display: flex; flex-direction: column; gap: 10px; }
        .start-btn-container-global { margin-top: 25px; width: 100%; flex-shrink: 0; }
        .start-btn-global { width: 100%; padding: clamp(15px, 2.2vh, 20px); border-radius: 35px; background: #333; border: 1px solid #fff; color: #fff; cursor: pointer; font-size: 1.35rem; font-weight: 700; transition: 0.3s; }

        .global-frost-active { background: rgba(40, 40, 50, 0.7) !important; backdrop-filter: grayscale(0.8) blur(3px); }
        .global-snow-layer { position: absolute; inset: 0; pointer-events: none; z-index: 99; overflow: hidden; }
        .snowflake-particle { position: absolute; color: #fff; top: -30px; animation: snowFallGlobal 5s linear infinite; opacity: 0.8; }
        @keyframes snowFallGlobal { 0% { transform: translateY(0) rotate(0deg); } 100% { transform: translateY(110dvh) rotate(360deg); } }
        .ice-row-frost { background: rgba(224, 242, 254, 0.5) !important; border: 2px solid #fff !important; box-shadow: inset 0 0 25px rgba(255,255,255,0.7), 0 0 20px #fff; }

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
        .reshuffle-btn { margin-top: 30px; padding: 15px 45px; font-size: 1.4rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; transition: 0.3s; }
        .deal-in { animation: cardIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .throw-out { animation: cardOut 0.5s ease-in forwards; }
        @keyframes cardIn { from { transform: scale(0) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes cardOut { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: viewFade 0.5s ease; } @keyframes viewFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;