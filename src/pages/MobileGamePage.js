import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig'; 
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const MobileGamePage = () => {
  const navigate = useNavigate();
  const publicUrl = process.env.PUBLIC_URL;
  
  const [viewState, setViewState] = useState('welcome');
  const [tasks, setTasks] = useState([]); 
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [wasAllSelectedByButton, setWasAllSelectedByButton] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        const fetchedCats = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const order = ['שאלה חוצפנית', 'סקרנות', 'תשוקה', 'משחק מקדים', 'נועז במיוחד', 'תוספת קרירה'];
        setCategories(fetchedCats.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)));
        const taskSnap = await getDocs(collection(db, "tasks"));
        setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error("Data error:", err); }
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

  const coldCat = categories.find(c => c.name === 'תוספת קרירה');
  const isIceActive = viewState === 'category-selection' && coldCat && selectedCats.includes(coldCat.id) && !wasAllSelectedByButton;

  useEffect(() => {
    let interval;
    if (isIceActive && "vibrate" in navigator) {
      interval = setInterval(() => { navigator.vibrate([60, 30, 60]); }, 700);
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
    if (filtered.length === 0) return alert("אין משימות.");
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
    <div className={`app-root-v32 ${isIceActive ? 'frozen-gray-v32' : ''} ${viewState === 'game-play' ? 'theme-play' : 'theme-red'}`}>
      
      {!isIceActive && viewState !== 'game-play' && <img src={`${publicUrl}/images/bg_red.png`} alt="" className="global-bg-img" />}
      
      {isIceActive && (
        <div className="snow-container-v32">
            <div className="snow-falls">
                {[...Array(45)].map((_, i) => (
                    <div key={i} className="snowflake-v32" style={{ 
                        left: `${Math.random() * 100}%`, 
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${2.5 + Math.random() * 3}s`,
                        fontSize: `${16 + Math.random() * 12}px`
                    }}>{i % 2 === 0 ? '❄' : '❅'}</div>
                ))}
            </div>
            <div className="snow-pile-accumulated"></div>
        </div>
      )}

      <div className="nav-top-right-v32">
          <button className="back-btn-ui-v32 neon-white-hover" onClick={() => navigate('/main-menu')}>חזרה לתפריט</button>
      </div>

      <div className="viewport-v32">
        
        {/* 1. Welcome */}
        {viewState === 'welcome' && (
          <div className="view-unit center-vh fade-in">
              <h1 className="hero-h1-v32">לחשוף,<br/>לציית,<br/>לגעת.</h1>
              <div className="hero-subs-v32"><p>משחק קלפים ללא גבולות</p><p>למבוגרים בלבד</p></div>
              <div className="footer-area-v32">
                <button className="btn-action-v32 neon-white-hover" onClick={() => setViewState('instructions')}>התקדמו להוראות המשחק</button>
              </div>
          </div>
        )}

        {/* 2. Instructions - No Box/Card */}
        {viewState === 'instructions' && (
          <div className="view-unit top-anchored fade-in">
            <div className="instr-content-v32">
              <h2 className="header-v32">הוראות המשחק</h2>
              <div className="body-v32">
                <p>משחק תושקתי, מסקרן, סקסי ושובב במיוחד .</p>
                <p>אנחנו מול הגבולות וגילויי המיניות הזוגית שלנו.</p>
                <p>שחקו משחק קלפים כמו פוקר, ,21 יניב וכו' .</p>
                <p>מי שמפסיד לוחץ על קלף וצריך לבצע את הכתוב .</p>
                <p>תוכלו לשחק במשחק כפי שהוא, פשוט לחשוף</p>
                <p>קלף כל אחד בתורו ולבצע. נשמע כיף לא ?!</p>
                <div className="divider-v32">תמצאו במשחק...</div>
                <p>קלפי שאלות שיחשפו קצת juice.</p>
                <p>קלפי סקרנות יגלו לכם דרכים חדשות של עונג, מגע ושיח .</p>
                <p>קלפי תשוקה יתנו לכם רמז למשחק המקדים הסקסי שתכף יגיע .</p>
                <p>קלפי המשחק המקדים ישלחו אתכם לשחק אחד עם השניה.</p>
                <p>הקלפים הנועזים במיוחד יראו לכם שאין גבולות .</p>
                <div className="divider-v32"></div>
                <p>הכי חשוב שתהנו, שתפתחו את הראש ושתעפו</p>
                <p>על עצמכם. ותגלו כמה גבולות נועדנו לפרוץ.</p>
                <div className="sexy-msg-v32">ייאלה סקסיים למיטה!</div>
              </div>
            </div>
            <div className="footer-area-v32">
                <button className="btn-action-v32 neon-white-hover" onClick={() => setViewState('category-selection')}>המשיכו עוד קצת</button>
            </div>
          </div>
        )}

        {/* 3. Category Selection - No Box/Card */}
        {viewState === 'category-selection' && (
          <div className="view-unit center-vh fade-in">
            <div className="cats-viewport-v32">
              <h2 className="header-v32">בחרו קטגוריות למשחק</h2>
              <div className="cats-grid-v32">
                <div className={`thermo-v32 ${isIceActive ? 'shaking-v32' : ''}`}>
                  <div className="glass-v32"><div className={`mercury-v32 fill-${thermo.type}`} style={{ height: thermo.height }}></div></div>
                  <div className="dots-v32">{categories.map(c => <div key={c.id} className={`dot-v32 ${selectedCats.includes(c.id) ? 'active' : ''}`}></div>)}</div>
                </div>
                <div className="list-v32">
                  <div className="row-v32 head" onClick={toggleAll}><div className={`radio-v32 ${selectedCats.length === categories.length ? 'checked' : ''}`}></div><span>ביחרו הכל</span></div>
                  <div className="stack-v32">
                    {categories.map(cat => (
                      <div key={cat.id} className={`row-v32 ${selectedCats.includes(cat.id) ? 'active' : ''} ${cat.name === 'תוספת קרירה' && selectedCats.includes(cat.id) && !wasAllSelectedByButton ? 'ice-row-glow' : ''}`} onClick={() => toggleCategory(cat.id)}>
                        <div className={`radio-v32 ${selectedCats.includes(cat.id) ? 'checked' : ''}`}></div>
                        <span>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {selectedCats.length > 0 && (
                <div className="footer-area-v32">
                    <button className="btn-action-v32 neon-white-hover" onClick={handleStartGame}>התחילו במשחק</button>
                </div>
            )}
          </div>
        )}

        {/* 4. Game Play */}
        {viewState === 'game-play' && currentCard && (
          <div className="view-unit center-vh fade-in">
            <div className="card-scene-v32" onClick={handleCardClick}>
              <div key={currentCard.text} className={`card-anim-v32 ${isExiting ? 'fly-out-v32' : 'enter-v32'}`}>
                <div className={`card-inner-v32 ${isCardOpen ? 'flipped' : ''}`}>
                  <div className="face front-v32"><img src={currentCard.backImage} alt="" className="img-fit" /></div>
                  <div className="face back-v32">
                    {currentCard.image && <img src={currentCard.image} alt="" className="img-fit" />}
                    <div className="card-text-v32"><span>{currentCard.text}</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="footer-area-v32">
              <button className="btn-action-v32 neon-white-hover" onClick={() => setViewState('category-selection')}>חיזרו לבחירה</button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Open Sans', sans-serif !important; margin: 0; padding: 0; }
        
        /* --- Architecture --- */
        .app-root-v32 { position: fixed; inset: 0; width: 100%; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; background: #000; transition: 0.8s; }
        .theme-red { background: #000; } .theme-play { background: #050505; }
        .global-bg-img { position: absolute; inset: 0; z-index: -1; opacity: 0.7; pointer-events: none; width: 100%; height: 100%; object-fit: cover; }

        /* --- ICE STATE --- */
        .frozen-gray-v32 { background: #1c242c !important; filter: grayscale(1) brightness(0.9); }
        .snow-container-v32 { position: fixed; inset: 0; z-index: 1500; pointer-events: none; }
        .snowflake-v32 { position: absolute; color: #fff; top: -50px; opacity: 0.9; animation: snowFallV32 linear infinite; text-shadow: 0 0 10px rgba(255,255,255,0.7); }
        @keyframes snowFallV32 { 
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translateY(100dvh) rotate(360deg); opacity: 0; } 
        }
        .snow-pile-accumulated { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to top, rgba(255,255,255,0.4), transparent); filter: blur(15px); z-index: 1501; }

        /* Navigation */
        .nav-top-right-v32 { height: 80px; display: flex; justify-content: flex-end; align-items: center; padding: 0 25px; flex-shrink: 0; z-index: 2000; }
        .back-btn-ui-v32 { background: rgba(0,0,0,0.6); border: 1.2px solid rgba(255,255,255,0.4); color: #fff; padding: 10px 22px; border-radius: 30px; cursor: pointer; transition: 0.3s; font-size: 0.9rem; }
        .neon-white-hover:hover { box-shadow: 0 0 25px #fff !important; border-color: #fff !important; background: rgba(255,255,255,0.15) !important; color: #fff !important; }

        .viewport-v32 { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .view-unit { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 10px 20px; }
        .center-vh { justify-content: center; }
        .top-anchored { justify-content: flex-start; padding-top: 5px; }

        /* Buttons & Spacing */
        .footer-area-v32 { margin-top: auto; width: 100%; display: flex; justify-content: center; flex-shrink: 0; padding-bottom: 35px; z-index: 1600; }
        .btn-action-v32 { background: rgba(255,255,255,0.05); color: #fff; border: 1.5px solid rgba(255,255,255,0.4); padding: clamp(14px, 2.2vh, 19px) 60px; font-size: 1.35rem; font-weight: 700; border-radius: 40px; cursor: pointer; transition: 0.3s; }

        /* Instructions - NO BOX */
        .instr-content-v32 { width: 95%; max-width: 600px; direction: rtl; text-align: center; color: #fff; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; text-shadow: 0 2px 10px rgba(0,0,0,1); }
        .header-v32 { font-size: clamp(2rem, 4.2vh, 2.5rem); margin-bottom: 20px; font-weight: 800; border-bottom: 1.5px solid rgba(255,255,255,0.2); padding-bottom: 10px; width: 100%; }
        .body-v32 p { font-size: clamp(0.85rem, 1.85vh, 1.15rem); line-height: 1.45; margin: 4px 0; white-space: nowrap; }
        .divider-v32 { margin: 12px 0; font-weight: 800; font-size: 1.2rem; }
        .sexy-msg-v32 { font-size: clamp(1.6rem, 3.8vh, 2.2rem); font-weight: 800; margin-top: 20px; }

        /* Categories - NO BOX */
        .cats-viewport-v32 { width: 95%; max-width: 600px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; z-index: 1600; }
        .cats-grid-v32 { display: flex; gap: 35px; direction: ltr; width: 100%; align-items: center; justify-content: center; padding: 20px 0; }
        .thermo-v32 { width: 45px; position: relative; display: flex; flex-direction: column; align-items: center; height: 360px; flex-shrink: 0; }
        .shaking-v32 { animation: extremeShakeV32 0.1s infinite !important; }
        @keyframes extremeShakeV32 { 0% { transform: translate(1.5px, 1.5px); } 50% { transform: translate(-1.5px, -1.5px); } }

        .glass-v32 { width: 18px; background: rgba(255,255,255,0.1); position: absolute; top: 0; bottom: 0; border-radius: 15px; border: 2.2px solid rgba(255,255,255,0.3); overflow: hidden; }
        .mercury-v32 { position: absolute; bottom: 0; width: 100%; transition: 0.8s; }
        .fill-red { background: #ff0000; box-shadow: 0 0 15px #ff0000; }
        .fill-blue { background: #007bff; box-shadow: 0 0 15px #007bff; }
        .fill-ice { background: #fff; box-shadow: 0 0 25px #fff; }
        .fill-full { background: linear-gradient(to top, #007bff, #fff, #ff0000); }
        .dots-v32 { display: flex; flex-direction: column; justify-content: space-between; height: 100%; z-index: 2; padding: 10px 0; }
        .dot-v32 { width: 14px; height: 14px; border-radius: 50%; background: #222; border: 1.5px solid rgba(255,255,255,0.25); }
        .dot-v32.active { background: #fff; box-shadow: 0 0 8px #fff; }

        .list-v32 { flex: 1; direction: rtl; display: flex; flex-direction: column; gap: 10px; max-width: 320px; text-shadow: 0 2px 10px rgba(0,0,0,1); }
        .row-v32 { display: flex; align-items: center; gap: 12px; padding: clamp(12px, 2vh, 16px) 20px; background: rgba(25, 25, 25, 0.7); border-radius: 12px; cursor: pointer; color: #fff; transition: 0.2s; }
        .row-v32.active { border: 1.2px solid rgba(255,255,255,0.35); background: rgba(45, 45, 45, 0.85); }
        .radio-v32 { width: 18px; height: 18px; border: 2.2px solid #fff; border-radius: 50%; }
        .radio-v32.checked { background: #fff; }
        .stack-v32 { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .ice-row-glow { background: rgba(224, 242, 254, 0.4) !important; border: 1.2px solid #fff; box-shadow: 0 0 20px #fff; }

        /* Gameplay */
        .card-scene-v32 { width: 280px; height: 390px; perspective: 1200px; cursor: pointer; position: relative; }
        .card-anim-v32 { width: 100%; height: 100%; transform-style: preserve-3d; }
        .enter-v32 { animation: cardInV32 0.6s cubic-bezier(0.17, 0.67, 0.83, 0.67) forwards; }
        .fly-out-v32 { animation: cardFlyOutV32 0.5s ease-in forwards; }
        @keyframes cardInV32 { from { transform: scale(0) rotate(-5deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes cardFlyOutV32 { to { transform: translateX(150vw) rotate(25deg) scale(0.85); opacity: 0; } }

        .card-inner-v32 { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
        .card-inner-v32.flipped { transform: rotateY(180deg); }
        .face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 20px; overflow: hidden; background: #111; box-shadow: 0 10px 40px rgba(0,0,0,0.9); }
        .face.back-v32 { transform: rotateY(180deg); }
        .img-fit { width: 100%; height: 100%; object-fit: cover; }
        .card-text-v32 { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 85%; text-align: center; }
        .card-text-v32 span { color: #fff; font-size: 1.55rem; font-weight: 800; direction: rtl; display: block; }
        
        /* Welcome */
        .hero-h1-v32 { color: #fff; text-align: center; font-size: clamp(3.2rem, 12vh, 5.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
        .hero-subs-v32 { text-align: center; color: #fff; }
        .hero-subs-v32 p { font-size: 1.35rem; opacity: 0.85; margin: 8px 0; }

        .fade-in { animation: fInV32 0.6s ease; } @keyframes fInV32 { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MobileGamePage;