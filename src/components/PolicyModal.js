import React from 'react';

const POLICY_TEXT = `
## מדיניות פרטיות ותנאי שימוש

**תאריך כניסה לתוקף:** 15 בדצמבר 2025

### 1. קבלה והסכמה לתנאים
השימוש במשחק מותנה בהסכמתו המלאה של המשתמש לתנאים אלו.

### 2. כתב ויתור על אחריות (Disclaimer)
**4.1 ויתור מוחלט על אחריות:** המשתמש מצהיר כי הוא לוקח על עצמו אחריות מלאה ובלעדית לכל שימוש במשחק.
**4.2 הגבלת אחריות:** בעלי המשחק והאתר אינם אחראים בשום צורה לכל נזק, הפסד או פציעה שיגרמו כתוצאה מהשימוש במשחק.
**4.3 אחריות על תוכן:** המשתמש אחראי באופן מלא על התוכן והפרשנות במסגרת המשחק.

### 3. אישור מותנה
אישור מסמך זה מהווה תנאי הכרחי לשימוש במערכת.
`;

const PolicyModal = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <div style={modalStyles.header}>
                    <h2 style={modalStyles.title}>תנאי שימוש ופרטיות</h2>
                    <button onClick={onClose} style={modalStyles.closeButton}>✕</button>
                </div>
                <div style={modalStyles.content} dangerouslySetInnerHTML={{ __html: POLICY_TEXT.replace(/\n/g, '<br/>') }}></div>
                <div style={modalStyles.footer}>
                    <button onClick={onClose} style={modalStyles.acceptButton}>סגור וחזור לרישום</button>
                </div>
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modal: { backgroundColor: '#111', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 0 20px #D50000', direction: 'rtl', color: '#ccc' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '10px' },
    title: { margin: 0, color: '#D50000', fontSize: '1.2rem' },
    closeButton: { background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' },
    content: { flexGrow: 1, overflowY: 'auto', padding: '10px', lineHeight: '1.5', fontSize: '0.9rem' },
    footer: { borderTop: '1px solid #444', paddingTop: '10px', marginTop: '10px' },
    acceptButton: { width: '100%', padding: '12px', backgroundColor: '#D50000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default PolicyModal;