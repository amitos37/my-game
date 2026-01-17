import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GamePage = () => {
  // --- States ---
  const [tasks, setTasks] = useState([]); 
  const [categories, setCategories] = useState({});
  const [availableTasks, setAvailableTasks] = useState([]); 
  
  const [gameStarted, setGameStarted] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTimerBar, setShowTimerBar] = useState(false);
  
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]); 
  const [deckSize, setDeckSize] = useState(0); 

  const activeTimerRef = useRef(null);
  const navigate = useNavigate();
  
  const allCategoryIds = Object.keys(categories);
  const isAllSelected = allCategoryIds.length > 0 && allCategoryIds.every(id => selectedCategoryIds.includes(id));

  // --- Helpers ---
  const getFilteredTasks = (currentSelectedIds) => {
    if (!tasks || currentSelectedIds.length === 0) return [];
    return tasks.filter(task => currentSelectedIds.includes(task.resolvedCategoryId));
  };

  const getImagePath = (imageName) => {
      if (!imageName || typeof imageName !== 'string') return null;
      const cleanName = imageName.trim();
      if (cleanName.length < 2 || cleanName.toLowerCase() === 'undefined') return null;
      if (cleanName.startsWith('http') || cleanName.startsWith('data:') || cleanName.startsWith('/')) return cleanName;
      return `/images/${cleanName}`;
  };

  // --- תיקון: הוספת frontImage לרשימת החיפוש ---
  const findImageField = (dataObj) => {
      if (!dataObj) return null;
      // הוספנו כאן את 'frontImage' ראשון כי זה השם שהאדמין שומר
      const keys = ['frontImage', 'designImage', 'image', 'img', 'background', 'backgroundImage', 'front', 'תמונה', 'רקע', 'עיצוב'];
      for (const key of keys) {
          const val = dataObj[key] || dataObj[key.toLowerCase()];
          if (val && typeof val === 'string' && val.length > 1) return val;
      }
      return null;
  };

  // --- Style Injection ---
  useEffect(() => {
    const existingStyle = document.getElementById('game-page-styles');
    if (existingStyle) existingStyle.remove();

    const styleSheet = document.createElement("style");
    styleSheet.id = 'game-page-styles'; 
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      @keyframes dealIn { from { transform: scale(0.5) translateY(100px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      @keyframes throwOut { to { transform: translate(150%, -50%) rotate(45deg); opacity: 0; } }
      
      @keyframes floatOnly { 
          0%, 100% { transform: translateY(0px); } 
          50% { transform: translateY(-15px); } 
      }

      .deal-in { animation: dealIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      .throw-out { animation: throwOut 0.5s ease-in forwards; }

      :root { 
          --box-w: 240px; 
          --box-h: 340px; 
          --box-d: 50px; 
      }
      
      .scene { 
        width: 300px; height: 400px; 
        perspective: 1200px; 
        display: flex; flex-direction: column; alignItems: center; justify-content: center; 
        cursor: pointer; 
        animation: floatOnly 4s ease-in-out infinite; 
      }
      
      .box { 
        width: var(--box-w); height: var(--box-h); 
        position: relative; 
        transform-style: preserve-3d; 
        transform: rotateX(10deg) rotateY(-20deg); 
        transition: transform 0.3s ease; 
      }
      
      .scene:hover .box { 
          transform: rotateX(10deg) rotateY(-20deg) scale(1.02); 
      }

      .face { 
          position: absolute; 
          background: rgba(20,20,20,0.95); 
          border: 2px solid #D50000; 
          box-sizing: border-box;
      }
      
      .front { width: var(--box-w); height: var(--box-h); transform: translateZ(25px); background: #000 url('/images/cover_card.png') center/cover no-repeat; }
      .back { width: var(--box-w); height: var(--box-h); transform: rotateY(180deg) translateZ(25px); }
      
      .right { width: var(--box-d); height: var(--box-h); left: 95px; transform: rotateY(90deg) translateZ(120px); }
      .left { width: var(--box-d); height: var(--box-h); left: 95px; transform: rotateY(-90deg) translateZ(120px); }
      
      .top { width: var(--box-w); height: var(--box-d); top: 145px; transform: rotateX(90deg) translateZ(170px); }
      .bottom { width: var(--box-w); height: var(--box-d); top: 145px; transform: rotateX(-90deg) translateZ(170px); }

      .card-scene { width: 320px; height: 480px; perspective: 1500px; cursor: pointer; }
      .active-card-wrapper { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; }
      .flip-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; }
      .flip-inner.flipped { transform: rotateY(180deg); }
      
      .flip-front, .flip-back { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 20px; overflow: hidden; background-color: #000; 
          box-shadow: 0 20px 50px rgba(0,0,0,0.8); border: 1px solid #333;
      }
      .flip-front { transform: rotateY(0deg); }
      .flip-back { transform: rotateY(180deg); }
      
      .timer-bar { position: absolute; bottom: 0; left: 0; height: 8px; background-color: #D50000; width: 0%; animation: timerFill linear forwards; }
      @keyframes timerFill { from { width: 0%; } to { width: 100%; } }

      .desktop-sec-btn {
          padding: 10px 30px; background: transparent; border: 1px solid #666; color: #888; 
          cursor: pointer; transition: 0.3s; border-radius: 30px; font-size: 1rem;
      }
      .desktop-sec-btn:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.1); }
      
      .category-item-pc:hover { background-color: #333 !important; }
    `;
    document.head.appendChild(styleSheet);

    return () => {
        const styleToRemove = document.getElementById('game-page-styles');
        if (styleToRemove) styleToRemove.remove();
    };
  }, []);

  // --- Load Data Logic ---
  useEffect(() => {
    const loadData = () => {
      try {
        const storedTasks = localStorage.getItem('gameTasks'); 
        const storedCats = localStorage.getItem('gameCategories');
        
        if (!storedTasks) {
            setLoading(false);
            alert("לא נמצאו נתונים (gameTasks). נא לטעון אקסל.");
            return;
        }

        const loadedTasks = JSON.parse(storedTasks);
        let loadedCategories = storedCats ? JSON.parse(storedCats) : [];

        let catMap = {};
        const catsArray = Array.isArray(loadedCategories) ? loadedCategories : Object.values(loadedCategories);
        const nameToIdMap = {};

        catsArray.forEach(c => {
            catMap[c.id] = { ...c, taskCount: 0 };
            if (c.name) nameToIdMap[c.name.trim()] = c.id;
        });

        const uniqueCats = [...new Set(loadedTasks.map(t => t.category || t.categoryId || 'כללי'))];
        uniqueCats.forEach((catName, idx) => {
             if (!nameToIdMap[catName] && !catMap[catName]) {
                 const id = `auto_cat_${idx}`;
                 catMap[id] = { id, name: catName, taskCount: 0 };
                 nameToIdMap[catName] = id;
             }
        });

        loadedTasks.forEach(task => {
            let catId = task.categoryId;
            if (!catMap[catId]) {
                if (task.category && nameToIdMap[task.category.trim()]) catId = nameToIdMap[task.category.trim()];
                else if (task.categoryId && nameToIdMap[task.categoryId.trim()]) catId = nameToIdMap[task.categoryId.trim()];
                else catId = Object.keys(catMap)[0];
            }
            task.resolvedCategoryId = catId; 
            if (catMap[catId]) catMap[catId].taskCount += 1;
        });
        
        const storedSettings = localStorage.getItem('gameConfig');
        if (storedSettings) setShowTimerBar(JSON.parse(storedSettings).timerEnabled === true);

        setCategories(catMap);
        setTasks(loadedTasks);
        setSelectedCategoryIds(Object.keys(catMap));
        setDeckSize(loadedTasks.length);
        
        setLoading(false);
        setTimeout(() => setShowCategorySelector(true), 100);

      } catch (error) { 
          console.error(error);
          setLoading(false);
      }
    };
    loadData();
    return () => { if (activeTimerRef.current) clearTimeout(activeTimerRef.current); };
  }, []);

  const handleExit = () => navigate('/admin-menu');
  const killTimer = () => { if (activeTimerRef.current) clearTimeout(activeTimerRef.current); };

  // --- Game Logic ---
  const toggleCategorySelection = (id) => {
    const newIds = id === 'all' 
        ? (isAllSelected ? [] : allCategoryIds)
        : (selectedCategoryIds.includes(id) ? selectedCategoryIds.filter(x => x !== id) : [...selectedCategoryIds, id]);
    setSelectedCategoryIds(newIds);
    setDeckSize(getFilteredTasks(newIds).length);
  };

  const handleStartGame = () => {
      const deck = getFilteredTasks(selectedCategoryIds);
      if (deck.length === 0) return alert("אין קלפים בקטגוריות שנבחרו");
      setAvailableTasks(deck);
      setShowCategorySelector(false);
      setGameStarted(false);
  };

  const handleBoxClick = () => {
      if (availableTasks.length > 0) {
          setGameStarted(true);
          drawNextCard(false, availableTasks);
      } else {
          setShowCategorySelector(true);
      }
  };

  const handleCardClick = () => {
      if (isExiting) return;
      killTimer();
      if (!isCardOpen) {
          setIsCardOpen(true);
          if (showTimerBar) activeTimerRef.current = setTimeout(() => setIsCardOpen(false), (currentCard?.duration || 15) * 1000);
      } else {
          setIsExiting(true);
          setTimeout(() => { drawNextCard(false); setIsExiting(false); }, 500);
      }
  };

  const handleShuffle = (e) => {
      e.stopPropagation();
      if(window.confirm("לערבב מחדש?")) {
          const deck = getFilteredTasks(selectedCategoryIds);
          setAvailableTasks(deck);
          setGameStarted(false);
          setShowCategorySelector(false);
          setIsCardOpen(false);
      }
  }

  const drawNextCard = (startOpen = false, deck = availableTasks) => {
      if (deck.length === 0) {
          alert("נגמרו הקלפים!");
          setGameStarted(false);
          setShowCategorySelector(true);
          return;
      }
      setIsCardOpen(startOpen);
      const idx = Math.floor(Math.random() * deck.length);
      const task = deck[idx];
      const newDeck = [...deck];
      newDeck.splice(idx, 1);
      setAvailableTasks(newDeck);

      const cat = categories[task.resolvedCategoryId] || {};
      
      let rawImg = findImageField(task) || findImageField(cat);
      const finalImg = getImagePath(rawImg);
      const backImg = getImagePath(cat.backImage) || finalImg;

      setCurrentCard({ 
          text: task.content, 
          image: finalImg, 
          backImage: backImg, 
          duration: Number(task.duration) || 15
      });
  };

  if (loading) return <div style={styles.centerText}>טוען...</div>;

  return (
    <div style={styles.container}>
      <button style={styles.exitBtn} onClick={handleExit}>יציאה</button>
      
      {/* תפריט */}
      {showCategorySelector && (
        <div style={styles.overlay}>
            <div style={styles.menu}>
                <h3>בחר קטגוריות למשחק</h3>
                <div style={styles.list}>
                    <div style={styles.row} onClick={() => toggleCategorySelection('all')}>
                        <input type="checkbox" checked={isAllSelected} readOnly style={styles.checkbox}/>
                        <span style={styles.categoryLabel}>הכל ({tasks.length})</span>
                    </div>
                    <hr style={{borderColor:'#444'}}/>
                    {Object.values(categories).map(cat => (
                        <div key={cat.id} style={styles.row} onClick={() => toggleCategorySelection(cat.id)}>
                            <input type="checkbox" checked={selectedCategoryIds.includes(cat.id)} readOnly style={styles.checkbox}/>
                            <span style={styles.categoryLabel}>{cat.name} ({cat.taskCount})</span>
                        </div>
                    ))}
                </div>
                <button style={styles.btn} onClick={handleStartGame}>שמור והמשך ({deckSize} קלפים)</button>
            </div>
        </div>
      )}

      <div style={styles.gameArea}>
        
        {/* קופסה תלת ממדית - ללא סיבוב */}
        {!gameStarted && !showCategorySelector && (
            <div className="scene" onClick={handleBoxClick}>
                <div className="box">
                    <div className="face front"></div>
                    <div className="face back"></div>
                    <div className="face right"></div>
                    <div className="face left"></div>
                    <div className="face top"></div>
                    <div className="face bottom"></div>
                </div>
                <div style={{marginTop: 60, color: '#888', fontSize: '1.2rem', textShadow: '0 2px 5px black'}}></div>
            </div>
        )}

        {/* קלף */}
        {gameStarted && currentCard && (
            <div className="card-scene" onClick={handleCardClick}>
                <div className={`active-card-wrapper ${isExiting ? 'throw-out' : 'deal-in'}`}>
                    <div className={`flip-inner ${isCardOpen ? 'flipped' : ''}`}>
                        <div className="flip-front">
                            {currentCard.backImage ? <img src={currentCard.backImage} alt="" style={styles.fullImage} /> : <div style={{...styles.fullImage, background:'#111'}}></div>}
                        </div>
                        <div className="flip-back" style={{
                            ...styles.fullImage,
                            backgroundImage: currentCard.image ? `url("${currentCard.image}")` : 'none',
                            backgroundColor: currentCard.image ? 'transparent' : '#000',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {currentCard.image && <div style={styles.overlayDark}></div>}
                            <div style={styles.textContainer}>
                                <span style={styles.cardText}>{currentCard.text}</span>
                            </div>
                            {showTimerBar && <div className="timer-bar" style={{animationDuration: `${currentCard.duration}s`}}></div>}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {gameStarted && <button style={styles.shuffleBtn} onClick={handleShuffle}>ערבוב</button>}
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', background: '#050505', color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  centerText: { textAlign: 'center', marginTop: '40vh', color: 'white' },
  exitBtn: { position: 'absolute', top: 20, right: 20, padding: '8px 15px', background: '#111', color: 'white', border: '1px solid #444', borderRadius: 5, cursor: 'pointer', zIndex: 100 },
  gameArea: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  shuffleBtn: { position: 'absolute', bottom: 30, padding: '10px 30px', background: 'transparent', border: '1px solid #666', color: '#888', borderRadius: 30, cursor: 'pointer', zIndex: 200 },
  
  fullImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' },
  overlayDark: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1, borderRadius: '20px' },
  
  textContainer: { width: '80%', textAlign: 'center', zIndex: 10, textShadow: '0 2px 10px rgba(0,0,0,0.9)' },
  cardText: { fontSize: '2rem', fontWeight: 'bold', lineHeight: 1.4, color: '#fff' },

  // תפריט
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  menu: { background: '#111', padding: 20, width: 400, borderRadius: 15, border: '1px solid #D50000', textAlign: 'right', display: 'flex', flexDirection: 'column' },
  list: { maxHeight: 300, overflowY: 'auto', margin: '15px 0' },
  row: { padding: 10, background: '#222', marginBottom: 5, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 },
  checkbox: { width: '20px', height: '20px', marginLeft: '10px', accentColor: '#D50000' },
  categoryLabel: { color: '#ccc', fontSize: '1rem' },
  btn: { width: '100%', padding: 15, background: '#D50000', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.2rem', cursor: 'pointer' }
};

export default GamePage;