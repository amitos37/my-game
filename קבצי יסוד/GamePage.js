import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

const GamePage = () => {
  const [tasks, setTasks] = useState([]); 
  const [availableTasks, setAvailableTasks] = useState([]); 
  const [categories, setCategories] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTimerBar, setShowTimerBar] = useState(false);
  
  // --- Category Selection States ---
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]); 
  const [deckSize, setDeckSize] = useState(0); 

  const isTimerEnabledRef = useRef(false);
  const activeTimerRef = useRef(null);
  const navigate = useNavigate();
  
  const allCategoryIds = Object.keys(categories);
  const isAllSelected = allCategoryIds.length > 0 && allCategoryIds.every(id => selectedCategoryIds.includes(id));

  // --- פונקציית עזר לסינון מיידי ---
  const getFilteredTasks = (currentSelectedIds) => {
    if (!tasks || currentSelectedIds.length === 0) return [];
    return tasks.filter(task => currentSelectedIds.includes(task.categoryId));
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const catSnapshot = await getDocs(collection(db, "categories"));
        const catMap = {};
        catSnapshot.forEach(doc => { 
            const data = doc.data(); 
            catMap[doc.id] = { ...data, name: data.name, taskCount: 0 }; 
        });

        const taskSnapshot = await getDocs(collection(db, "tasks"));
        const loadedTasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        loadedTasks.forEach(task => {
            if (catMap[task.categoryId]) {
                catMap[task.categoryId].taskCount += 1;
            }
        });
        
        setCategories(catMap);
        setTasks(loadedTasks);
        
        const initialIds = Object.keys(catMap);
        setSelectedCategoryIds(initialIds); // ברירת מחדל: בחירת הכל
        setDeckSize(loadedTasks.length); // גודל ראשוני
        
        setLoading(false);
      } catch (error) { console.error("Error fetching data:", error); }
    };

    const unsubscribeSettings = onSnapshot(doc(db, "settings", "gameConfig"), (docSnap) => {
        if (docSnap.exists()) {
            const isEnabled = docSnap.data().timerEnabled === true;
            isTimerEnabledRef.current = isEnabled;
            setShowTimerBar(isEnabled);
        } else {
            isTimerEnabledRef.current = false;
            setShowTimerBar(false);
        }
    });

    fetchData();
    return () => { unsubscribeSettings(); if (activeTimerRef.current) clearTimeout(activeTimerRef.current); };
  }, []);

  const handleExit = () => navigate('/admin-menu');
  
  const killActiveTimer = () => { 
      if (activeTimerRef.current) { clearTimeout(activeTimerRef.current); activeTimerRef.current = null; } 
  };

  const toggleCategorySelection = (categoryId) => {
    let newSelectedIds;
    if (categoryId === 'all') {
        newSelectedIds = isAllSelected ? [] : allCategoryIds;
    } else {
        if (selectedCategoryIds.includes(categoryId)) {
            newSelectedIds = selectedCategoryIds.filter(id => id !== categoryId);
        } else {
            newSelectedIds = [...selectedCategoryIds, categoryId];
        }
    }
    
    setSelectedCategoryIds(newSelectedIds);
    const filtered = getFilteredTasks(newSelectedIds);
    setDeckSize(filtered.length); // עדכון גודל החפיסה לתצוגה
  };

  const handleShuffleDeck = (e) => {
    e?.stopPropagation();
    killActiveTimer();
    if (window.confirm("לערבב מחדש את החפיסה?")) {
        const filteredTasks = getFilteredTasks(selectedCategoryIds);
        
        if (filteredTasks.length === 0) {
            return alert("אין משימות בקטגוריות הנבחרות.");
        }
        
        setAvailableTasks(filteredTasks); // מעמיס את הקלפים שוב
        setCurrentCard(null); 
        setIsCardOpen(false);
        setGameStarted(false); // חוזר למצב קופסה
        setShowCategorySelector(false); 
        setDeckSize(filteredTasks.length); // מציג ספירה מלאה חדשה
    }
  };

  // --- תיקון קריטי: לוגיקת התחלת משחק ---
  const handleCategoryStartGame = () => {
    if (selectedCategoryIds.length === 0) {
        return alert("יש לבחור קטגוריה אחת לפחות, או את 'הכל'");
    }
    
    const newFilteredDeck = getFilteredTasks(selectedCategoryIds);

    if (newFilteredDeck.length === 0) {
        return alert("אין משימות בקטגוריות שנבחרו.");
    }

    // 1. שמירה של החפיסה המסוננת לשימוש
    setAvailableTasks(newFilteredDeck); 
    
    // 2. הפעלת המשחק
    setShowCategorySelector(false); 
    setGameStarted(true);          
    
    // 3. שליפה מיידית מתוך החפיסה החדשה (שנשמרה ב-State)
    drawNextCard(false, newFilteredDeck); 
  };
  
  // פותח את בורר הקטגוריות
  const handleBoxClick = () => {
      if (loading) return;
      if (tasks.length === 0) return alert("אין משימות במערכת. אנא הוסף משימות באזור הניהול.");
      
      const currentFiltered = getFilteredTasks(selectedCategoryIds);
      setDeckSize(currentFiltered.length);
      
      setShowCategorySelector(true);
  };

  const handleCardClick = () => {
      if (isExiting) return;
      killActiveTimer();
      
      if (!isCardOpen) {
          setIsCardOpen(true);
          if (isTimerEnabledRef.current) {
              activeTimerRef.current = setTimeout(() => {
                  if (isTimerEnabledRef.current) setIsCardOpen(false); 
              }, (currentCard?.duration || 15) * 1000);
          }
      } else {
          setIsExiting(true);
          setTimeout(() => { 
              drawNextCard(false); 
              setIsExiting(false); 
          }, 500);
      }
  };

  // --- לוגיקת שליפת קלף (מקבלת חפיסה אופציונלית) ---
  const drawNextCard = async (startOpen = false, initialDeck = availableTasks) => {
    
    // משתמשים בחפיסה החדשה אם הועברה
    let currentDeck = initialDeck.length > 0 ? initialDeck : availableTasks;
    
    if (currentDeck.length === 0) {
        alert("נגמרו הקלפים בחפיסה! אנא ערבב מחדש.");
        setGameStarted(false);
        setCurrentCard(null); 
        return;
    }

    setIsCardOpen(startOpen);
    
    const randomIndex = Math.floor(Math.random() * currentDeck.length);
    const selectedTask = currentDeck[randomIndex];
    
    const newDeck = [...currentDeck];
    newDeck.splice(randomIndex, 1);
    
    // מעדכנים את ה-State רק לאחר מכן
    setAvailableTasks(newDeck); 

    const matchingCategory = categories[selectedTask.categoryId];
    const categoryDesign = matchingCategory?.designImage ? `/images/${matchingCategory.designImage}` : null;
    const backDesign = matchingCategory?.backImage ? `/images/${matchingCategory.backImage}` : categoryDesign;
    let duration = selectedTask.duration ? Number(selectedTask.duration) : 15;
    
    setCurrentCard({ 
        text: selectedTask.content, 
        image: categoryDesign, 
        backImage: backDesign, 
        duration: duration 
    });
  };

  if (loading) return <div style={{color: 'white', textAlign: 'center', marginTop: '40vh'}}>טוען משחק...</div>;

  return (
    <div style={styles.container}>
      <button style={styles.exitButton} onClick={handleExit}>יציאה לתפריט</button>
      
      <div style={styles.gameArea}>
      
        {/* --- 1. Category Selector UI --- */}
        {showCategorySelector && !gameStarted && (
            <div style={styles.categorySelectorOverlay}>
                <div style={styles.categorySelectorBox}>
                    <h3 style={styles.selectorTitle}>בחר קטגוריות למשחק</h3>
                    {/* גלילה פנימית לרשימה */}
                    <div style={styles.categoryListContainer}> 
                        <div style={styles.categoryList}>
                            
                            {/* Option: ALL */}
                            <div style={styles.categoryItem} onClick={() => toggleCategorySelection('all')} className="category-item-pc">
                                <input 
                                    type="checkbox" 
                                    checked={isAllSelected}
                                    onChange={() => toggleCategorySelection('all')}
                                    style={styles.checkbox}
                                />
                                <span style={styles.categoryLabel}>הכל (סה"כ {tasks.length} משימות)</span>
                            </div>
                            <hr style={styles.hr} />

                            {/* Category List */}
                            {Object.entries(categories).map(([id, cat]) => (
                                <div key={id} style={styles.categoryItem} onClick={() => toggleCategorySelection(id)} className="category-item-pc">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedCategoryIds.includes(id)}
                                        onChange={() => toggleCategorySelection(id)}
                                        style={styles.checkbox}
                                    />
                                    <span style={styles.categoryLabel}>{cat.name} ({cat.taskCount} משימות)</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        style={styles.startButton} 
                        onClick={handleCategoryStartGame}
                        disabled={selectedCategoryIds.length === 0}
                    >
                        התחל משחק ({deckSize} קלפים נבחרו)
                    </button>
                    
                    <button 
                        style={styles.cancelButton} 
                        onClick={() => setShowCategorySelector(false)}
                    >
                        ביטול
                    </button>
                </div>
            </div>
        )}

        {/* 2. Box UI */}
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
            </div>
        )}

        {/* 3. Card UI */}
        {gameStarted && currentCard && (
            <div className="card-scene" onClick={handleCardClick}>
                <div className={`active-card-wrapper ${isExiting ? 'throw-out' : 'deal-in'}`}>
                    <div className={`flip-inner ${isCardOpen ? 'flipped' : ''}`}>
                        <div className="flip-front">
                            {currentCard.backImage ? (
                                <img src={currentCard.backImage} alt="" style={styles.fullImage} />
                            ) : (
                                <div style={{...styles.fullImage, background: '#111'}}></div>
                            )}
                        </div>
                        <div className="flip-back">
                            {currentCard.image && <img src={currentCard.image} alt="" style={styles.fullImage} />}
                            <div style={styles.textContainer}>
                                <span style={styles.cardText}>{currentCard.text}</span>
                            </div>
                            {showTimerBar && (
                                <div key={currentCard.text} className="timer-bar" style={{animationDuration: `${currentCard.duration}s`}}></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 4. Shuffle button */}
        {gameStarted && (
            <div style={{position: 'absolute', bottom: '30px', zIndex: 200}}>
                <button className="desktop-sec-btn" onClick={handleShuffleDeck}>🔄 ערבוב מחדש</button>
            </div>
        )}
      </div>
    </div>
  );
};

// CSS למחשב
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes dealIn { from { transform: scale(0.5) translateY(100px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
  @keyframes throwOut { to { transform: translate(150%, -50%) rotate(45deg); opacity: 0; } }
  @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

  .deal-in { animation: dealIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  .throw-out { animation: throwOut 0.5s ease-in forwards; }

  /* === 3D BOX (Desktop) === */
  :root { --w-d: 300px; --h-d: 420px; --d-d: 60px; }
  
  .scene { 
    width: var(--w-d); height: var(--h-d); perspective: 1500px; 
    display: flex; flex-direction: column; alignItems: center; cursor: pointer; 
    transition: transform 0.3s;
  }
  .scene:hover .box { transform: rotateY(-30deg) rotateX(10deg) scale(1.05); }
  
  .box { 
    width: 100%; height: 100%; position: relative; transform-style: preserve-3d; 
    transform: rotateY(-35deg) rotateX(15deg); transition: transform 0.5s ease; 
  }

  .face { position: absolute; box-sizing: border-box; background-color: #050505; border: 2px solid #silver; opacity: 1; }
  .front { width: var(--w-d); height: var(--h-d); transform: translateZ(30px); background: #000 url('/images/cover_card.png') center/80% no-repeat; border: 2px solid #444; }
  .back { width: var(--w-d); height: var(--h-d); transform: rotateY(180deg) translateZ(30px); background: #111; }
  .right { width: 60px; height: var(--h-d); left: 120px; transform: rotateY(90deg) translateZ(150px); background: #222; }
  .left { width: 60px; height: var(--h-d); left: 120px; transform: rotateY(-90deg) translateZ(150px); background: #222; }
  .top { width: var(--w-d); height: 60px; top: 180px; transform: rotateX(90deg) translateZ(210px); background: #333; }
  .bottom { width: var(--w-d); height: 60px; top: 180px; transform: rotateX(-90deg) translateZ(210px); background: #000; }

  /* Card Scene */
  .card-scene { width: 320px; height: 450px; perspective: 1500px; cursor: pointer; }
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
  
  /* NEW Category Selector Styles - Desktop */
  .category-item-pc:hover { background-color: #333 !important; }
`;
document.head.appendChild(styleSheet);

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#050505', overflow: 'hidden', position: 'relative' },
  exitButton: { position: 'absolute', top: '20px', right: '20px', padding: '8px 15px', backgroundColor: '#111', color: 'white', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer', zIndex: 100, transition: '0.3s' },
  gameArea: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', perspective: '1000px' },
  fullImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px' },
  textContainer: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', textAlign: 'center', zIndex: 10 },
  cardText: { color: '#ffffff', fontWeight: 'bold', fontSize: '2rem', textShadow: '0 4px 10px rgba(0,0,0,0.9)', direction: 'rtl', fontFamily: 'sans-serif' },
  
  // --- NEW CATEGORY STYLES (Desktop) ---
  categorySelectorOverlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 500, display: 'flex',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', 
  },
  categorySelectorBox: {
    backgroundColor: '#111', 
    padding: '20px', 
    borderRadius: '15px', 
    width: '400px', 
    maxHeight: '90vh', 
    display: 'flex', 
    flexDirection: 'column',
    boxShadow: '0 0 30px rgba(213, 0, 0, 0.4)',
    border: '1px solid #D50000', 
    direction: 'rtl',
    fontSize: '0.85rem', 
  },
  selectorTitle: { 
    color: '#fff', 
    textAlign: 'center', 
    marginBottom: '10px', 
    fontSize: '1.5rem', 
    borderBottom: '1px solid #333', 
    paddingBottom: '8px', 
    flexShrink: 0 
  },
  
  categoryListContainer: {
    flex: 1, 
    overflow: 'hidden', 
    marginBottom: '10px',
    minHeight: '0', 
  },
  
  categoryList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '5px', 
    minHeight: '0',
    overflow: 'hidden', 
  },
  categoryItem: {
    display: 'flex', alignItems: 'center', backgroundColor: '#222', 
    padding: '8px', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    transition: 'background-color 0.2s',
  },
  checkbox: { width: '20px', height: '20px', marginLeft: '10px', accentColor: '#D50000', flexShrink: 0 }, 
  categoryLabel: { color: '#ccc', fontSize: '1rem' }, 
  startButton: {
    width: '100%', 
    padding: '14px', 
    fontSize: '1.2rem', 
    fontWeight: 'bold',
    backgroundColor: '#D50000', 
    color: 'white', 
    border: 'none', 
    borderRadius: '8px',
    cursor: 'pointer', 
    marginTop: '15px', 
    flexShrink: 0
  },
  cancelButton: {
    width: '100%', 
    padding: '10px', 
    fontSize: '1rem', 
    backgroundColor: 'transparent',
    color: '#888', 
    border: '1px solid #333', 
    borderRadius: '8px', 
    cursor: 'pointer',
    marginTop: '10px', 
    flexShrink: 0
  },
  hr: { borderColor: '#333', margin: '3px 0' } 
};

export default GamePage;