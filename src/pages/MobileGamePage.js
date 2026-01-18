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

  return (
    <div className={`game-wrapper ${viewState === 'game-play' ? 'gray-theme' : 'red-theme'}`}>
      <div className="global-bg-layer">{(viewState !== 'game-play') && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="full-bg" />}</div>
      
      <div className="layout-header-fixed">
          <button className="ui-back-button neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      {/* 1. Welcome Screen */}
      {viewState === 'welcome' && (
        <div className="view-stage center-flex">
            <div className="welcome-box-v6 fade-in">
                <h1 className="hero-h1-v6">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="hero-p-group-v6"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
                <button className="ui-start-btn-v6 neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen - תיקון חיתוך צד שמאל */}
      {viewState === 'instructions' && (
        <div className="view-stage top-fixed-flex">
            <div className="instr-card-strict-v6 fade-in">
                <h2 className="instr-header-strict-v6">הוראות המשחק</h2>
                <div className="instr-body-strict-v6">
                    <div className="instr-section-v6">
                        <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                        <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                        <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                        <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                        <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                        <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                    </div>
                    <div className="instr-section-v6 centered gap-v6"><p>תמצאו במשחק...</p></div>
                    <div className="instr-section-v6">
                        <p>קלפי שאלות שיחשפו קצת juice.</p>
                        <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                        <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                        <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                        <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                    </div>
                    <div className="instr-section-v6 gap-v6">
                        <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                        <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                    </div>
                </div>
                <div className="instr-footer-sexy-v6">ייאלה סקסיים למיטה!</div>
            </div>
            <div className="instr-action-container-v6">
                <button className="ui-action-btn-v6 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
        </div>
      )}

      {/* 3. Category Selection - יציבות מלאה */}
      {viewState === 'category-selection' && (
        <div className={`view-stage top-fixed-flex ${thermo.type === 'ice' ? 'ice-active-bg' : ''}`}>
          {thermo.type === 'ice' && (
              <div className="global-snow-container">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="snow-p-v6" style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      fontSize: `${12 + Math.random() * 14}px`
                    }}>❄</div>
                  ))}
              </div>
          )}
          <div className="selection-panel-v6 neon-border fade-in">
            <h2 className="selection-header-v6">בחרו קטגוריות למשחק</h2>
            <div className="selection-grid-v6">
              <div className={`thermo-v6 ${thermo.type === 'ice' ? 'shaking-fx' : ''}`}>
                <div className="glass-v6">
                    <div className={`fill-v6 type-${thermo.type}`} style={{ height: thermo.height }}></div>
                    {thermo.type === 'ice' && <div className="mist-fx"></div>}
                </div>
                <div className="dots-v6">{categories.map((c, i) => (<div key={c.id} className={`dot-v6 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>))}</div>
              </div>
              <div className="list-col-v6">
                <div className="row-v6 header-v6" onClick={toggleAll}>
                  <div className={`radio-v6 ${selectedCats.length === categories.length ? 'on' : ''}`}></div>
                  <span>ביחרו הכל</span>
                </div>
                <div className="scroll-content-v6">
                  {categories.map((cat) => {
                    const isCold = cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton;
                    return (
                      <div key={cat.id} className={`row-v6 ${selectedCats.includes(cat.id) ? 'active' : ''} ${isCold ? 'ice-row-v6' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v6 ${selectedCats.includes(cat.id) ? 'on' : ''} ${isCold ? 'ice-dot-v6' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
                {selectedCats.length > 0 && (
                    <div className="start-btn-mount-v6">
                        <button className="ui-play-btn neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Game Play */}
      {viewState === 'game-play' && currentCard && (
        <div className="view-stage center-flex">
          <div className="game-card-scene-v6" onClick={handleCardClick}>
            <div key={currentCard.text} className={`game-card-v6 ${isExiting ? 'exit' : 'enter'}`}>
              <div className={`flip-box-v6 ${isCardOpen ? 'flipped' : ''}`}>
                <div className="face front"><img src={currentCard.backImage} alt="" className="img-v6" /></div>
                <div className="face back">
                  {currentCard.image && <img src={currentCard.image} alt="" className="img-v6" />}
                  <div className="txt-box-v6"><span>{currentCard.text}</span></div>
                </div>
              </div>
            </div>
          </div>
          <button className="ui-reshuffle-btn neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        .game-wrapper { position: fixed; inset: 0; width: 100%; height: 100dvh; overflow: hidden; background: #000; }
        .red-theme { background: #000; } .gray-theme { background: #050505; }
        .global-bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; }
        .full-bg { width: 100%; height: 100%; object-fit: cover; }
        
        .layout-header-fixed { position: fixed; top: 15px; right: 20px; z-index: 2000; }
        .ui-back-button { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; font-size: 0.9rem; }
        
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .view-stage { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 20px; }
        .center-flex { align-items: center; justify-content: center; }
        .top-fixed-flex { justify-content: flex-start; align-items: center; padding-top: 80px; gap: 15px; }

        /* Welcome */
        .hero-h1-v6 { color: #fff; text-align: center; font-size: clamp(3rem, 12vh, 5.5rem); font-weight: 800; line-height: 1; margin-bottom: 2vh; }
        .hero-p-group-v6 { text-align: center; color: #fff; margin-bottom: 5vh; }
        .ui-start-btn-v6 { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 18px 50px; font-size: 1.4rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* --- Instructions Fixed Fit --- */
        .instr-card-strict-v6 { 
            width: 95%; max-width: 580px; 
            background: rgba(15, 15, 15, 0.95); border: 1px solid rgba(255,255,255,0.3); 
            border-radius: 35px; padding: clamp(15px, 4vh, 35px); direction: rtl; 
            display: flex; flex-direction: column; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); 
            max-height: calc(100dvh - 210px); flex-shrink: 1; overflow: hidden;
        }
        .instr-header-strict-v6 { color: #fff; text-align: center; font-size: clamp(1.6rem, 3.5vh, 2.2rem); margin-bottom: 1.5vh; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 1vh; flex-shrink: 0; }
        .instr-body-strict-v6 { color: #fff; text-align: center; width: 100%; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-around; overflow: hidden; }
        
        .instr-section-v6 p { 
            line-height: 1.35; margin: 0; 
            font-size: clamp(0.7rem, 1.7vh, 1.05rem); /* גודל טקסט דינמי למניעת חיתוך */
            width: 100%; text-align: center;
        }
        .gap-v6 { margin-top: 1vh !important; }
        .instr-footer-sexy-v6 { font-size: clamp(1.3rem, 3vh, 1.7rem); font-weight: 800; color: #fff; text-align: center; padding-top: 1.5vh; flex-shrink: 0; }
        
        .instr-action-container-v6 { width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding: 5px 0; }
        .ui-action-btn-v6 { padding: clamp(12px, 1.8vh, 18px) 50px; font-size: 1.25rem; border-radius: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; font-weight: 700; transition: 0.3s; }

        /* --- Category Selection --- */
        .selection-panel-v6 { width: 95%; max-width: 580px; background: rgba(15, 15, 15, 0.95); padding: clamp(15px, 3vh, 30px); border-radius: 25px; border: 1px solid #fff; direction: rtl; z-index: 10; display: flex; flex-direction: column; box-shadow: 0 0 50px rgba(0,0,0,0.6); max-height: calc(100dvh - 170px); flex-shrink: 1; }
        .selection-header-v6 { color: #fff; text-align: center; font-size: clamp(1.4rem, 2.8vh, 1.9rem); margin-bottom: 15px; flex-shrink: 0; }
        .selection-grid-v6 { display: flex; gap: clamp(10px, 3.5vw, 30px); direction: ltr; align-items: stretch; overflow: hidden; flex-grow: 1; }
        
        .thermo-v6 { width: 40px; position: relative; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .glass-v6 { width: 16px; background: rgba(255,255,255,0.1); position: absolute; top: 5px; bottom: 5px; border-radius: 15px; border: 1.5px solid rgba(255,255,255,0.3); overflow: hidden; }
        .fill-v6 { position: absolute; bottom: 0; width: 100%; transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
        .type-full { background: linear-gradient(to top, #007bff 0%, #ffffff 50%, #ff0000 100%); }
        .type-red { background: #ff0000; box-shadow: 0 0 12px #ff0000; }
        .type-blue { background: #007bff; box-shadow: 0 0 12px #007bff; }
        .type-ice { background: #fff !important; box-shadow: 0 0 25px #fff; }
        
        .dots-v6 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 12px 0; }
        .dot-v6 { width: 13px; height: 13px; border-radius: 50%; background: #222; border: 1px solid rgba(255,255,255,0.1); }
        .dot-v6.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-col-v6 { flex: 1; direction: rtl; display: flex; flex-direction: column; overflow: hidden; }
        .row-v6 { display: flex; align-items: center; gap: 12px; padding: clamp(10px, 1.5vh, 14px) 18px; background: #1a1a1a; border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; width: 100%; flex-shrink: 0; margin-bottom: 6px; }
        .row-v6.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .radio-v6 { width: 18px; height: 18px; border: 2px solid #fff; border-radius: 50%; flex-shrink: 0; }
        .radio-v6.on { background: #fff; }
        .scroll-content-v6 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
        
        .start-btn-mount-v6 { margin-top: auto; padding-top: 12px; width: 100%; flex-shrink: 0; }
        .ui-play-btn { width: 100%; padding: clamp(12px, 1.8vh, 18px); border-radius: 35px; background: #333; border: 1px solid #fff; color: #fff; cursor: pointer; font-size: 1.25rem; font-weight: 700; transition: 0.3s; }

        /* Effects */
        .ice-active-bg { background: rgba(40, 40, 50, 0.7) !important; backdrop-filter: grayscale(0.8) blur(3px); }
        .global-snow-container { position: absolute; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
        .snow-p-v6 { position: absolute; color: #fff; top: -30px; animation: snowFall 5s linear infinite; opacity: 0.8; }
        @keyframes snowFall { 0% { transform: translateY(0); } 100% { transform: translateY(110dvh); } }
        .ice-row-v6 { background: rgba(224, 242, 254, 0.5) !important; border: 2px solid #fff !important; box-shadow: inset 0 0 20px rgba(255,255,255,0.7), 0 0 15px #fff; }
        .shaking-fx { animation: vShake 0.1s infinite !important; }
        @keyframes vShake { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }

        /* Gameplay */
        .game-card-scene-v6 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; position: relative; }
        .game-card-v6 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .flip-box-v6 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-box-v6.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .back { transform: rotateY(180deg); }
        .img-v6 { width: 100%; height: 100%; object-fit: cover; }
        .txt-box-v6 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .txt-box-v6 span { color: #fff; font-size: 1.4rem; font-weight: 800 !important; direction: rtl; display: block; }
        .ui-reshuffle-btn { margin-top: 25px; padding: 12px 40px; font-size: 1.3rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; transition: 0.3s; }
        
        .enter { animation: cEnter 0.6s forwards; } @keyframes cEnter { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .exit { animation: cOut 0.5s ease-in forwards; } @keyframes cOut { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: vIn 0.5s ease; } @keyframes vIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;