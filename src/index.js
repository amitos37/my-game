import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// --- חסימת זום אבסולוטית לכל האפליקציה ---

// 1. חסימת מחוות צביטה (Pinch) - בעיקר לאייפון
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});
document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// 2. חסימת זום בלחיצה כפולה (Double Tap)
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// 3. חסימת זום במקלדת+עכבר (Ctrl + Wheel)
document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// ------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);