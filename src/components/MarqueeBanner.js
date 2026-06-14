import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './MarqueeBanner.css';

export default function MarqueeBanner() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'marquee_banner'), snap => {
      if (snap.exists()) setData(snap.data());
    }, () => {});
    return () => unsub();
  }, []);

  if (!data?.active || !data?.items?.length) return null;

  // Ignore Firestore speed value — hardcode a fast speed
  // 5s = very fast, increase number to slow down
  const speed = 5;

  return (
    <div
      className="marquee-banner"
      style={{ background: data.bgColor || '#fff', color: data.textColor || '#1a1a1a' }}
    >
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {[...data.items, ...data.items, ...data.items].map((item, i) => (
          <span key={i} className="marquee-item">
            <span className="marquee-dash">—</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}