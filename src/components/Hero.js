import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './Hero.css';

const DEFAULT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=90',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=90',
  'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=1200&q=90',
];

const DEFAULT_STATS = [
  { value: '30+',  label: 'Years of Craft'    },
  { value: '14k',  label: 'Happy Clients'     },
  { value: '100%', label: 'Ethically Sourced' },
];

const DEFAULT_HERO_CONTENT = {
  images: DEFAULT_HERO_IMAGES,
  eyebrow: 'NEW SEASON COLLECTION',
  headingLine1: 'Where every',
  headingLine2: 'gem holds',
  headingLine3: 'a story.',
  italicWord: 'gem',
  subtext: 'Handcrafted for the moments that take your breath away. Ethically sourced, masterfully designed, forever yours.',
  btnPrimaryText: 'SHOP COLLECTION',
  btnGhostText: 'THE GIFT GUIDE',
  sideLabel: 'KANYAMAA COLLECTIONS FINE JEWELLERY — EST. 1994',
  stats: DEFAULT_STATS,
};

export default function Hero() {
  const navigate = useNavigate();
  const [imgIdx,  setImgIdx]  = useState(0);
  const [mounted, setMounted] = useState(false);
  const [banner,  setBanner]  = useState(null);
  const [heroData, setHeroData] = useState(DEFAULT_HERO_CONTENT);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to hero section data from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'hero_section'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setHeroData(prev => ({
          ...prev,
          ...(data.images?.length && { images: data.images }),
          ...(data.eyebrow && { eyebrow: data.eyebrow }),
          ...(data.headingLine1 && { headingLine1: data.headingLine1 }),
          ...(data.headingLine2 && { headingLine2: data.headingLine2 }),
          ...(data.headingLine3 && { headingLine3: data.headingLine3 }),
          ...(data.italicWord && { italicWord: data.italicWord }),
          ...(data.subtext && { subtext: data.subtext }),
          ...(data.btnPrimaryText && { btnPrimaryText: data.btnPrimaryText }),
          ...(data.btnGhostText && { btnGhostText: data.btnGhostText }),
          ...(data.sideLabel && { sideLabel: data.sideLabel }),
          ...(data.stats?.length && { stats: data.stats }),
        }));
      }
    }, () => {});
    return () => unsub();
  }, []);

  // Image slideshow interval
  useEffect(() => {
    const t = setInterval(() => setImgIdx(i => (i + 1) % heroData.images.length), 5000);
    return () => clearInterval(t);
  }, [heroData.images.length]);

  // Listen to sale banner
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'sale_banner'), snap => {
      if (snap.exists()) setBanner(snap.data());
    }, () => {});
    return () => unsub();
  }, []);

  const showBanner = banner?.active && banner?.text;

  // Render heading line 2 with italic word
  const renderLine2 = () => {
    const line = heroData.headingLine2;
    const word = heroData.italicWord;
    if (word && line.includes(word)) {
      const parts = line.split(word);
      return <><em>{word}</em>{parts[1]}</>;
    }
    return <em>{line}</em>;
  };

  return (
    <section className={`hero ${mounted ? 'hero--mounted' : ''} ${showBanner ? 'hero--has-banner' : ''}`}>

      {/* SALE BANNER */}
      {showBanner && (
        <div
          className="hero-sale-banner"
          style={{ background: banner.bgColor || '#7B1C3E', color: banner.textColor || '#fff' }}
        >
          <span className="hsb-icon">🏷</span>
          <span className="hsb-text">{banner.text}</span>
          <button className="hsb-cta" onClick={() => navigate('/shop?sale=true')}>SHOP NOW →</button>
        </div>
      )}

      {/* BACKGROUND SLIDESHOW */}
      <div className="hero-bg">
        {heroData.images.map((src, i) => (
          <div key={i} className={`hero-bg-slide ${i === imgIdx ? 'active' : ''}`}>
            <img src={src} alt="" />
          </div>
        ))}
        <div className="hero-bg-overlay" />
        <div className="hero-grain" />
      </div>

      {/* BODY */}
      <div className="hero-body">
        <div className="hero-side-label">
          <span>{heroData.sideLabel}</span>
        </div>

        <div className="hero-center">
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <span>{heroData.eyebrow}</span>
            <div className="eyebrow-line" />
          </div>

          <h1 className="hero-heading">
            <span className="hero-h-line hero-h-line--1">{heroData.headingLine1}</span>
            <span className="hero-h-line hero-h-line--2">{renderLine2()}</span>
            <span className="hero-h-line hero-h-line--3">{heroData.headingLine3}</span>
          </h1>

          <p className="hero-sub">{heroData.subtext}</p>

          <div className="hero-btns">
            <button className="btn-primary" onClick={() => navigate('/shop')}>
              <span>{heroData.btnPrimaryText}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="btn-ghost" onClick={() => navigate('/collections')}>{heroData.btnGhostText}</button>
          </div>
        </div>
      </div>

      {/* STATS CARD */}
      <div className="hero-stats-card">
        {heroData.stats.map((s, i) => (
          <div className="hero-stat-item" key={i}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div className="hero-bottom">
        <div className="hero-slide-indicators">
          {heroData.images.map((_, i) => (
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