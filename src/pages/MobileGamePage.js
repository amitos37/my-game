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
      
      {/* Header ניווט קבוע */}
      <div className="layout-header-fixed">
          <button className="ui-back-button neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      {/* 1. Welcome Screen */}
      {viewState === 'welcome' && (
        <div className="view-stage center-flex">
            <div className="welcome-box fade-in">
                <h1 className="hero-h1-v5">לחשוף,<br/>לציית,<br/>לגעת.</h1>
                <div className="hero-p-group"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
                <button className="ui-start-btn neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
            </div>
        </div>
      )}

      {/* 2. Instructions Screen */}
      {viewState === 'instructions' && (
        <div className="view-stage top-fixed-flex">
            <div className="instr-card-strict fade-in">
                <h2 className="instr-header-strict">הוראות המשחק</h2>
                <div className="instr-body-strict">
                    <div className="instr-section-v5 tight">
                        <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                        <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                        <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                        <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                        <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                        <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                    </div>
                    <div className="instr-section-v5 centered gap-small"><p>תמצאו במשחק...</p></div>
                    <div className="instr-section-v5 tight">
                        <p>קלפי שאלות שיחשפו קצת juice.</p>
                        <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                        <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                        <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                        <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                    </div>
                    <div className="instr-section-v5 tight gap-small">
                        <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                        <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                    </div>
                </div>
                <div className="instr-footer-msg-v5">ייאלה סקסיים למיטה!</div>
            </div>
            <div className="instr-action-container-v5">
                <button className="ui-action-btn-v5 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
        </div>
      )}

      {/* 3. Category Selection - יציב עם לחצן ניאון */}
      {viewState === 'category-selection' && (
        <div className={`view-stage top-fixed-flex ${thermo.type === 'ice' ? 'ice-active-bg' : ''}`}>
          {thermo.type === 'ice' && (
              <div className="global-snow-container">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="snow-p" style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      fontSize: `${12 + Math.random() * 14}px`
                    }}>❄</div>
                  ))}
              </div>
          )}
          <div className="selection-panel-strict neon-border fade-in">
            <h2 className="selection-header-v5">בחרו קטגוריות למשחק</h2>
            <div className="selection-grid-v5">
              <div className={`thermo-v5 ${thermo.type === 'ice' ? 'shaking-fx' : ''}`}>
                <div className="glass-v5">
                    <div className={`fill-v5 type-${thermo.type}`} style={{ height: thermo.height }}></div>
                    {thermo.type === 'ice' && <div className="mist-fx"></div>}
                </div>
                <div className="dots-v5">{categories.map((c, i) => (<div key={c.id} className={`dot-item ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>))}</div>
              </div>
              <div className="list-col-v5">
                <div className="row-v5 header-v5" onClick={toggleAll}>
                  <div className={`radio-v5 ${selectedCats.length === categories.length ? 'on' : ''}`}></div>
                  <span>ביחרו הכל</span>
                </div>
                <div className="scroll-content-v5">
                  {categories.map((cat) => {
                    const isCold = cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton;
                    return (
                      <div key={cat.id} className={`row-v5 ${selectedCats.includes(cat.id) ? 'active' : ''} ${isCold ? 'ice-row-v5' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v5 ${selectedCats.includes(cat.id) ? 'on' : ''} ${isCold ? 'ice-dot-v5' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
                {/* לחצן "התחילו במשחק" עם אפקט ניאון */}
                {selectedCats.length > 0 && (
                    <div className="start-btn-mount-v5">
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
          <div className="game-card-scene-v5" onClick={handleCardClick}>
            <div key={currentCard.text} className={`game-card-v5 ${isExiting ? 'exit' : 'enter'}`}>
              <div className={`flip-box-v5 ${isCardOpen ? 'flipped' : ''}`}>
                <div className="face front"><img src={currentCard.backImage} alt="" className="img-v5" /></div>
                <div className="face back">
                  {currentCard.image && <img src={currentCard.image} alt="" className="img-v5" />}
                  <div className="txt-box-v5"><span>{currentCard.text}</span></div>
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
        .global-bg-layer { position: absolute; inset: 0; z-index: -1; opacity: 0.7; }
        .full-bg { width: 100%; height: 100%; object-fit: cover; }
        
        /* Navigation */
        .layout-header-fixed { position: fixed; top: 15px; right: 20px; z-index: 2000; }
        .ui-back-button { background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.4); color: #fff; padding: 8px 20px; border-radius: 30px; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        
        /* --- Neon White Effect --- */
        .neon-white-hover:hover { 
            box-shadow: 0 0 25px #fff !important; 
            border-color: #fff !important; 
            background: rgba(255,255,255,0.15) !important; 
            color: #fff !important; 
        }

        .view-stage { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 20px; }
        .center-flex { align-items: center; justify-content: center; }
        .top-fixed-flex { justify-content: flex-start; align-items: center; padding-top: 85px; gap: 15px; }

        /* Welcome */
        .hero-h1-v5 { color: #fff; text-align: center; font-size: clamp(3rem, 12vh, 5.5rem); font-weight: 800; line-height: 1; margin-bottom: 2vh; }
        .hero-p-group { text-align: center; color: #fff; margin-bottom: 5vh; }
        .ui-start-btn { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 18px 50px; font-size: 1.4rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* --- Instructions --- */
        .instr-card-strict { 
            width: 95%; max-width: 580px; 
            background: rgba(15, 15, 15, 0.95); border: 1px solid rgba(255,255,255,0.3); 
            border-radius: 35px; padding: clamp(15px, 4vh, 35px); direction: rtl; 
            display: flex; flex-direction: column; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); 
            max-height: calc(100dvh - 210px); flex-shrink: 1; overflow: hidden;
        }
        .instr-header-strict { color: #fff; text-align: center; font-size: clamp(1.6rem, 3.5vh, 2.2rem); margin-bottom: 1.5vh; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 1vh; flex-shrink: 0; }
        .instr-body-strict { color: #fff; text-align: center; width: 100%; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-around; }
        .instr-section-v5.tight p { line-height: 1.35; margin: 0; font-size: clamp(0.8rem, 1.75vh, 1.05rem); white-space: nowrap; }
        .gap-small { margin-top: 1.2vh !important; }
        .instr-footer-msg-v5 { font-size: clamp(1.3rem, 3vh, 1.7rem); font-weight: 800; color: #fff; text-align: center; padding-top: 1.5vh; flex-shrink: 0; }
        .instr-action-container-v5 { width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-top: 10px; }
        .ui-action-btn-v5 { padding: clamp(12px, 1.8vh, 18px) 50px; font-size: 1.25rem; border-radius: 40px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; font-weight: 700; transition: 0.3s; }

        /* --- Category Selection Final --- */
        .selection-panel-strict { 
            width: 95%; max-width: 580px; 
            background: rgba(15, 15, 15, 0.95); padding: clamp(15px, 3vh, 30px); 
            border-radius: 25px; border: 1px solid #fff; 
            direction: rtl; z-index: 10; display: flex; flex-direction: column; 
            box-shadow: 0 0 50px rgba(0,0,0,0.6); 
            max-height: calc(100dvh - 170px); flex-shrink: 1;
        }
        .selection-header-v5 { color: #fff; text-align: center; font-size: clamp(1.4rem, 2.8vh, 1.9rem); margin-bottom: 15px; flex-shrink: 0; }
        .selection-grid-v5 { display: flex; gap: clamp(10px, 3.5vw, 30px); direction: ltr; align-items: stretch; overflow: hidden; flex-grow: 1; }
        
        .thermo-v5 { width: 40px; position: relative; display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .glass-v5 { width: 16px; background: rgba(255,255,255,0.1); position: absolute; top: 5px; bottom: 5px; border-radius: 15px; border: 1.5px solid rgba(255,255,255,0.3); overflow: hidden; }
        .fill-v5 { position: absolute; bottom: 0; width: 100%; transition: all 0.7s ease-in-out; }
        .type-full { background: linear-gradient(to top, #007bff 0%, #ffffff 50%, #ff0000 100%); }
        .type-red { background: #ff0000; box-shadow: 0 0 12px #ff0000; }
        .type-blue { background: #007bff; box-shadow: 0 0 12px #007bff; }
        .type-ice { background: #fff !important; box-shadow: 0 0 25px #fff; }
        .shaking-fx { animation: vShake 0.1s infinite !important; }
        @keyframes vShake { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -1px); } }
        
        .dots-v5 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 12px 0; }
        .dot-item { width: 13px; height: 13px; border-radius: 50%; background: #222; border: 1px solid rgba(255,255,255,0.1); }
        .dot-item.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-col-v5 { flex: 1; direction: rtl; display: flex; flex-direction: column; overflow: hidden; }
        .row-v5 { display: flex; align-items: center; gap: 12px; padding: clamp(10px, 1.5vh, 14px) 18px; background: #1a1a1a; border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; width: 100%; flex-shrink: 0; margin-bottom: 6px; }
        .row-v5.active { background: #222; border: 1px solid rgba(255,255,255,0.3); }
        .radio-v5 { width: 18px; height: 18px; border: 2px solid #fff; border-radius: 50%; flex-shrink: 0; }
        .radio-v5.on { background: #fff; }
        .scroll-content-v5 { flex-grow: 1; display: flex; flex-direction: column; overflow-y: hidden; }
        
        .start-btn-mount-v5 { margin-top: auto; padding-top: 15px; width: 100%; flex-shrink: 0; }
        .ui-play-btn { width: 100%; padding: clamp(14px, 2vh, 18px); border-radius: 35px; background: #333; border: 1px solid #fff; color: #fff; cursor: pointer; font-size: 1.35rem; font-weight: 700; transition: 0.3s; }

        /* Ice active */
        .ice-active-bg { background: rgba(40, 40, 50, 0.7) !important; backdrop-filter: grayscale(0.8) blur(3px); }
        .global-snow-container { position: absolute; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden; }
        .snow-p { position: absolute; color: #fff; top: -30px; animation: snowFall 5s linear infinite; opacity: 0.8; }
        @keyframes snowFall { 0% { transform: translateY(0); } 100% { transform: translateY(110dvh); } }
        .ice-row-v5 { background: rgba(224, 242, 254, 0.5) !important; border: 2px solid #fff !important; box-shadow: inset 0 0 20px rgba(255,255,255,0.7), 0 0 15px #fff; }

        /* Gameplay */
        .game-card-scene-v5 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; position: relative; }
        .game-card-v5 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .flip-box-v5 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .flip-box-v5.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
        .back { transform: rotateY(180deg); }
        .img-v5 { width: 100%; height: 100%; object-fit: cover; }
        .txt-box-v5 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .txt-box-v5 span { color: #fff; font-size: 1.4rem; font-weight: 800 !important; direction: rtl; display: block; }
        .ui-reshuffle-btn { margin-top: 30px; padding: 12px 45px; font-size: 1.3rem; border-radius: 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.4); color: #fff; cursor: pointer; transition: 0.3s; }
        
        .enter { animation: cEnter 0.6s forwards; } @keyframes cEnter { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .exit { animation: cExit 0.5s ease-in forwards; } @keyframes cExit { to { transform: translateX(120vw) rotate(30deg) scale(0.8); opacity: 0; } }
        .fade-in { animation: vFadeIn 0.5s ease; } @keyframes vFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;