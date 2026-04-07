import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './Categories.css';

const FALLBACK_ROW1 = [
  { id: 'rings',     label: 'Rings',     image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80' },
  { id: 'necklaces', label: 'Necklaces', image: 'https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=600&q=80' },
  { id: 'earrings',  label: 'Earrings',  image: 'https://images.unsplash.com/photo-1573408301185-9519f94815b9?w=600&q=80' },
  { id: 'bracelets', label: 'Bracelets', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80' },
];
const FALLBACK_ROW2 = [
  { id: 'watches',  label: 'Watches',  image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80' },
  { id: 'anklets',  label: 'Anklets',  image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80' },
  { id: 'charms',   label: 'Charms',   image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&q=80' },
  { id: 'pendants', label: 'Pendants', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80' },
];

// Carousel images for the feature panels
const CAROUSEL_1 = [
  { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80', caption: 'Timeless Elegance', sub: 'Ethically sourced, handcrafted for the modern muse' },
  { src: 'https://images.unsplash.com/photo-1588444650733-d0f65bc89f36?w=800&q=80', caption: 'Artisan Crafted', sub: 'Every piece tells a story of mastery' },
  { src: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80', caption: 'Pure Gold', sub: 'Refined luxury for the discerning few' },
  { src: 'https://images.unsplash.com/photo-1630438993803-3e62feba5278?w=800&q=80', caption: 'Fine Stones', sub: 'Rare gems, extraordinary beauty' },
];

const CAROUSEL_2 = [
  { src: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80', caption: 'The Bridal Edit', sub: 'Celebrate love with pieces crafted for your forever moment' },
  { src: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80', caption: 'Emerald Dreams', sub: 'Vintage-inspired, timelessly elegant' },
  { src: 'https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=800&q=80', caption: 'Bridal Glow', sub: 'Shine on your most precious day' },
  { src: 'https://images.unsplash.com/photo-1612366677601-5b9b0cb85f68?w=800&q=80', caption: 'Forever Yours', sub: 'Heirlooms crafted to be cherished for generations' },
];

function ImageCarousel({ slides, onExplore, exploreLabel }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 400);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
        return (prev + 1) % slides.length;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  return (
    <div className="carousel-feature">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`carousel-slide ${i === current ? 'active' : ''} ${animating && i === current ? 'fade-out' : ''}`}
        >
          <img src={slide.src} alt={slide.caption} />
        </div>
      ))}
      <div className="carousel-overlay">
        <div className="carousel-text">
          <h2 className="carousel-title">{slides[current].caption}</h2>
          <p className="carousel-sub">{slides[current].sub}</p>
          <button className="carousel-cta" onClick={onExplore}>{exploreLabel}</button>
        </div>
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
      {/* Progress bar */}
      <div className="carousel-progress">
        <div className="carousel-progress-bar" key={current} />
      </div>
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  const [row1, setRow1] = useState(FALLBACK_ROW1);
  const [row2, setRow2] = useState(FALLBACK_ROW2);

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'site', 'categories_row1'), s => {
      if (s.exists() && s.data().items) setRow1(s.data().items);
    });
    const u2 = onSnapshot(doc(db, 'site', 'categories_row2'), s => {
      if (s.exists() && s.data().items) setRow2(s.data().items);
    });
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="categories-wrapper">

      {/* ── SECTION DIVIDER ── */}
      <div className="section-divider">
        <div className="divider-line" />
        <span className="divider-label">OUR COLLECTIONS</span>
        <div className="divider-line" />
      </div>

      {/* ── ROW 1 ── */}
      <section className="categories">
        <div className="cat-grid">
          {row1.slice(0, 2).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}

          <ImageCarousel
            slides={CAROUSEL_1}
            onExplore={() => navigate('/shop')}
            exploreLabel="EXPLORE ALL →"
          />

          {row1.slice(2, 4).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BETWEEN ROWS DIVIDER ── */}
      <div className="row-gap">
        <div className="row-gap-inner">
          <div className="gap-ornament">✦</div>
          <p className="gap-text">Discover more of what we love</p>
          <div className="gap-ornament">✦</div>
        </div>
      </div>

      {/* ── ROW 2 ── */}
      <section className="categories cat-row2">
        <div className="cat-grid">
          {row2.slice(0, 2).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}

          <ImageCarousel
            slides={CAROUSEL_2}
            onExplore={() => navigate('/collections')}
            exploreLabel="THE BRIDAL EDIT →"
          />

          {row2.slice(2, 4).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}