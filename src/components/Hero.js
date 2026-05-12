import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './Hero.css';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=90',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=90',
  'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=1200&q=90',
];

const STATS = [
  { value: '30+',  label: 'Years of Craft'    },
  { value: '14k',  label: 'Happy Clients'     },
  { value: '100%', label: 'Ethically Sourced' },
];

export default function Hero() {
  const navigate = useNavigate();
  const [imgIdx,  setImgIdx]  = useState(0);
  const [mounted, setMounted] = useState(false);
  const [banner,  setBanner]  = useState(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setImgIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'sale_banner'), snap => {
      if (snap.exists()) setBanner(snap.data());
    }, () => {});
    return () => unsub();
  }, []);

  const showBanner = banner?.active && banner?.text;

  return (
    <section className={`hero ${mounted ? 'hero--mounted' : ''} ${showBanner ? 'hero--has-banner' : ''}`}>

      {/* ── SALE BANNER — pinned below navbar ── */}
      {showBanner && (
        <div
          className="hero-sale-banner"
          style={{ background: banner.bgColor || '#7B1C3E', color: banner.textColor || '#fff' }}
        >
          <span className="hsb-icon">🏷</span>
          <span className="hsb-text">{banner.text}</span>
          <button className="hsb-cta" onClick={() => navigate('/shop')}>SHOP NOW →</button>
        </div>
      )}

      {/* ── BACKGROUND SLIDESHOW ── */}
      <div className="hero-bg">
        {HERO_IMAGES.map((src, i) => (
          <div key={i} className={`hero-bg-slide ${i === imgIdx ? 'active' : ''}`}>
            <img src={src} alt="" />
          </div>
        ))}
        <div className="hero-bg-overlay" />
        <div className="hero-grain" />
      </div>

      {/* ── BODY: left content + absolutely positioned stats card ── */}
      <div className="hero-body">

        <div className="hero-side-label">
          <span>KANYAMAA COLLECTIONS FINE JEWELLERY — EST. 1994</span>
        </div>

        {/* LEFT — main copy */}
        <div className="hero-center">
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <span>NEW SEASON COLLECTION</span>
            <div className="eyebrow-line" />
          </div>

          <h1 className="hero-heading">
            <span className="hero-h-line hero-h-line--1">Where every</span>
            <span className="hero-h-line hero-h-line--2"><em>gem</em> holds</span>
            <span className="hero-h-line hero-h-line--3">a story.</span>
          </h1>

          <p className="hero-sub">
            Handcrafted for the moments that take your breath away.
            Ethically sourced, masterfully designed, forever yours.
          </p>

          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate('/shop')}>
              <span>SHOP COLLECTION</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="btn-ghost" onClick={() => navigate('/collections')}>THE GIFT GUIDE</button>
          </div>
        </div>

      </div>

      {/* ── STATS CARD — absolute, bottom-right corner ── */}
      <div className="hero-stats-card">
        {STATS.map((s, i) => (
          <div className="hero-stat-item" key={i}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="hero-bottom">
        <div className="hero-slide-indicators">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              className={`hero-indicator ${i === imgIdx ? 'active' : ''}`}
              onClick={() => setImgIdx(i)}
            />
          ))}
        </div>
        <div className="hero-scroll-hint">
          <div className="scroll-mouse"><div className="scroll-wheel" /></div>
          <span>SCROLL</span>
        </div>
      </div>

    </section>
  );
}