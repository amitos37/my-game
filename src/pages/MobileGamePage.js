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

  // טעינת נתונים ומיון קטגוריות
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

  // --- לוגיקת המדחום הדינמית ---
  const getThermoStyles = () => {
    const isAll = selectedCats.length === categories.length;
    const coldCat = categories.find(c => c.name === 'תוספת קרירה');
    const isColdSelected = coldCat && selectedCats.includes(coldCat.id);

    if (isAll && wasAllSelectedByButton) return { height: '100%', type: 'full' };
    if (isColdSelected) return { height: '10%', type: 'ice' };
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

  return (
    <div className={`game-wrapper ${viewState === 'game-play' ? 'gray-theme' : 'red-theme'}`}>
      <div className="bg-layer">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="bg-img" />}</div>
      
      <div className="navigation-header">
          <button className="nav-btn-back neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      {/* 1. Welcome Screen - שוחזר לפי image_536c9c.png */}
      {viewState === 'welcome' && (
        <div className="view-container welcome-screen">
            <div className="welcome-content fade-in">
                <h1 className="welcome-title">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="welcome-subs"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
                <button className="welcome-action-btn neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen - נעול מורכז ומדויק */}
      {viewState === 'instructions' && (
        <div className="view-container instructions-screen">
            <div className="instr-card-box fade-in">
                <h2 className="instr-header">הוראות המשחק</h2>
                <div className="instr-text-content">
                    <div className="instr-para-block tight">
                        <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                        <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                        <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                        <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                        <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                        <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                    </div>
                    <div className="instr-para-block gap-v centered"><p>תמצאו במשחק...</p></div>
                    <div className="instr-para-block tight">
                        <p>קלפי שאלות שיחשפו קצת juice.</p>
                        <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                        <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                        <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                        <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                    </div>
                    <div className="instr-para-block gap-v tight">
                        <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                        <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                    </div>
                </div>
                <div className="instr-footer-msg">ייאלה סקסיים למיטה!</div>
            </div>
            <button className="instr-continue-btn neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
        </div>
      )}

      {/* 3. Category Selection - אפקטים של קרח ושלג */}
      {viewState === 'category-selection' && (
        <div className="view-container selection-screen">
          <div className="cats-panel-container neon-border fade-in">
            <h2 className="cats-view-title">בחרו קטגוריות למשחק</h2>
            <div className="cats-view-layout">
              <div className={`thermo-widget ${thermo.type === 'ice' ? 'shaking-ice' : ''}`}>
                <div className="thermo-tube-glass">
                    <div className={`thermo-mercury color-${thermo.type}`} style={{ height: thermo.height }}></div>
                    {thermo.type === 'ice' && <div className="ice-mist-overlay"></div>}
                </div>
                <div className="thermo-beads">
                  {categories.map((c, i) => (<div key={c.id} className={`bead-dot-item ${selectedCats.includes(c.id) ? 'lit' : ''}`}></div>))}
                </div>
              </div>
              <div className="cats-options-list">
                <div className="cat-selection-row header-selection" onClick={toggleAll}>
                  <div className={`cat-checkbox ${selectedCats.length === categories.length ? 'checked' : ''}`}></div>
                  <span className="cat-name-label">ביחרו הכל</span>
                </div>
                <div className="cat-scroll-area luxury-scroll">
                  {categories.map((cat) => {
                    const isIceRow = cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton;
                    return (
                      <div 
                        key={cat.id} 
                        className={`cat-selection-row ${selectedCats.includes(cat.id) ? 'active' : ''} ${isIceRow ? 'ice-row-effect' : ''}`} 
                        onClick={() => toggleCategory(cat.id)}
                      >
                        <div className={`cat-checkbox ${selectedCats.includes(cat.id) ? 'checked' : ''} ${isIceRow ? 'ice-check' : ''}`}></div>
                        <span className="cat-name-label">{cat.name}</span>
                        {isIceRow && (
                            <div className="falling-snow-layer">
                                {[...Array(10)].map((_, i) => <div key={i} className="ice-flake">❄</div>)}
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedCats.length > 0 && <button className="start-game-btn neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Play - שחזור קלפים מדויק מהקוד המקורי */}
      {viewState === 'game-play' && currentCard && (
        <div className="view-container gameplay-screen">
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
          <button className="reshuffle-btn neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; }
        .game-wrapper { position: fixed; inset: 0; width: 100%; height: 100vh; overflow: hidden; }
        .red-theme { background: #000; } .gray-theme { background: #050505; }
        .bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; }
        .bg-img { width: 100%; height: 100%; object-fit: cover; }
        .navigation-header { position: fixed; top: 20px; right: 20px; z-index: 100; }
        .nav-btn-back { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; }
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .view-container { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }

        /* Welcome */
        .welcome-title { color: #fff; text-align: center; font-size: 5.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 25px; }
        .welcome-subs { text-align: center; color: #fff; margin-bottom: 40px; }
        .welcome-subs p { font-size: 1.3rem; margin: 5px 0; opacity: 0.9; }
        .welcome-action-btn { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 20px 60px; font-size: 1.5rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* Instructions - נעול ומתוקן */
        .instr-card-box { width: 95%; max-width: 550px; max-height: 68vh; background: rgba(15, 15, 15, 0.92); border: 1px solid rgba(255,255,255,0.25); border-radius: 30px; padding: 25px 40px; direction: rtl; display: flex; flex-direction: column; box-shadow: 0 15px 50px rgba(0,0,0,0.6); flex-shrink: 0; }
        .instr-header { color: #fff; text-align: center; font-size: 2.1rem; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 8px; }
        .instr-text-content { color: #fff; text-align: center; overflow: hidden; }
        .instr-para-block.tight p { line-height: 1.25; margin: 0; font-size: 1.05rem; }
        .instr-para-block.gap-v { margin-top: 15px !important; }
        .instr-footer-msg { margin-top: 12px; font-size: 1.55rem; font-weight: 800; color: #fff; text-align: center; }
        .instr-continue-btn { margin-top: 30px; padding: 18px 50px; font-size: 1.4rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; flex-shrink: 0; }

        /* Selection Screen - מדחום ואפקט קרח */
        .cats-panel-container { width: 95%; max-width: 520px; background: rgba(15, 15, 15, 0.95); padding: 30px; border-radius: 25px; border: 1px solid #fff; direction: rtl; }
        .cats-view-title { color: #fff; text-align: center; font-size: 1.8rem; margin-bottom: 25px; }
        .cats-view-layout { display: flex; gap: 25px; height: 440px; direction: ltr; }
        .thermo-widget { width: 50px; position: relative; display: flex; flex-direction: column; align-items: center; }
        .thermo-tube-glass { width: 22px; background: rgba(255,255,255,0.1); position: absolute; top: 10px; bottom: 10px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .thermo-mercury { position: absolute; bottom: 0; width: 100%; transition: all 0.8s ease-in-out; }
        .color-full { background: linear-gradient(to top, #007bff 0%, #ffffff 50%, #ff0000 100%); }
        .color-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .color-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .color-ice { background: #fff !important; box-shadow: 0 0 30px #fff; }
        .thermo-beads { display: flex; flex-direction: column; justify-content: space-between; height: 420px; z-index: 2; padding: 10px 0; }
        .bead-dot-item { width: 16px; height: 16px; border-radius: 50%; background: #222; border: 1px solid rgba(255,255,255,0.1); }
        .bead-dot-item.lit { background: #fff; box-shadow: 0 0 10px #fff; }
        .shaking-ice { animation: vibrate 0.1s infinite; }
        @keyframes vibrate { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }
        .ice-mist-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.5); filter: blur(12px); animation: iceBreath 2.5s infinite; }
        @keyframes iceBreath { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; transform: translateY(-10px); } }
        .ice-row-effect { background: rgba(224, 242, 254, 0.5) !important; border: 2px solid #fff !important; box-shadow: inset 0 0 25px rgba(255,255,255,0.7), 0 0 20px #fff; position: relative; overflow: hidden; }
        .ice-check { background: #fff !important; box-shadow: 0 0 25px #fff; }
        .falling-snow-layer { position: absolute; inset: 0; pointer-events: none; }
        .ice-flake { position: absolute; color: #fff; font-size: 16px; top: -20px; animation: flakeFall 3s linear infinite; opacity: 0.9; }
        .ice-flake:nth-child(1) { left: 5%; animation-delay: 0s; } .ice-flake:nth-child(2) { left: 25%; animation-delay: 0.5s; } .ice-flake:nth-child(3) { left: 45%; animation-delay: 1s; } .ice-flake:nth-child(4) { left: 65%; animation-delay: 0.2s; } .ice-flake:nth-child(5) { left: 85%; animation-delay: 0.8s; } .ice-flake:nth-child(6) { left: 15%; animation-delay: 1.2s; } .ice-flake:nth-child(7) { left: 35%; animation-delay: 1.7s; } .ice-flake:nth-child(8) { left: 55%; animation-delay: 2.2s; } .ice-flake:nth-child(9) { left: 75%; animation-delay: 0.4s; } .ice-flake:nth-child(10) { left: 95%; animation-delay: 1.5s; }
        @keyframes flakeFall { to { transform: translateY(80px) rotate(360deg); opacity: 0; } }
        .cats-options-list { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 10px; }
        .cat-selection-row { display: flex; align-items: center; gap: 15px; padding: 14px 20px; background: #1a1a1a; border-radius: 15px; cursor: pointer; color: #fff; transition: 0.3s; }
        .cat-selection-row.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .cat-checkbox { width: 20px; height: 20px; border: 2px solid #fff; border-radius: 50%; }
        .cat-checkbox.checked { background: #fff; }
        .start-game-btn { width: 100%; padding: 18px; margin-top: auto; border-radius: 30px; background: #333; border: 1px solid #fff; color: #fff; cursor: pointer; font-size: 1.3rem; }

        /* --- Game Play - שחזור סופי מדויק --- */
        .card-scene { width: 300px; height: 420px; perspective: 1500px; cursor: pointer; position: relative; z-index: 5; }
        .active-card-wrapper { width: 100%; height: 100%; transform-style: preserve-3d; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-front, .flip-back { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .flip-back { transform: rotateY(180deg); }
        .full-img { width: 100%; height: 100%; object-fit: cover; }
        .card-text-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .card-text { color: #fff; font-size: 1.5rem; font-weight: 800 !important; direction: rtl; display: block; width: 100%; }
        .reshuffle-btn { margin-top: 30px; padding: 15px 45px; font-size: 1.4rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; transition: 0.3s; }

        .deal-in { animation: dealIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .throw-out { animation: throwOut 0.5s ease-in forwards; }
        @keyframes dealIn { from { transform: scale(0) rotate(-15deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes throwOut { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: viewFadeInEffect 0.5s ease; } @keyframes viewFadeInEffect { from { opacity: 0; } to { opacity: 1; } }
        .luxury-scroll::-webkit-scrollbar { width: 4px; } .luxury-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MobileGamePage;