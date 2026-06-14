import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './CountdownBanner.css';

export default function CountdownBanner() {
  const [data, setData] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'countdown_banner'), snap => {
      if (snap.exists()) setData(snap.data());
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!data?.endDate) return;

    const calc = () => {
      const end = new Date(data.endDate).getTime();
      const now = Date.now();
      const diff = Math.max(0, end - now);
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [data?.endDate]);

  if (!data?.active || dismissed) return null;

  const pad = n => String(n).padStart(2, '0');

  return (
    <div
      className="countdown-banner"
      style={{ background: data.bgColor || '#E85A2C', color: data.textColor || '#fff' }}
    >
      <div className="countdown-content">
        <span className="countdown-title">{data.title || 'Sale'}</span>
        <span className="countdown-label">ending in :</span>
        <div className="countdown-boxes">
          <div className="countdown-box">
            <span className="countdown-num">{pad(timeLeft.days)}</span>
            <span className="countdown-unit">days</span>
          </div>
          <span className="countdown-colon">:</span>
          <div className="countdown-box">
            <span className="countdown-num">{pad(timeLeft.hours)}</span>
            <span className="countdown-unit">hours</span>
          </div>
          <span className="countdown-colon">:</span>
          <div className="countdown-box">
            <span className="countdown-num">{pad(timeLeft.mins)}</span>
            <span className="countdown-unit">mins</span>
          </div>
          <span className="countdown-colon">:</span>
          <div className="countdown-box">
            <span className="countdown-num">{pad(timeLeft.secs)}</span>
            <span className="countdown-unit">secs</span>
          </div>
        </div>
      </div>
      <button className="countdown-close" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}
