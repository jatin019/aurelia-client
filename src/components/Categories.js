import React, { useEffect, useState } from 'react';
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
const FALLBACK_FEAT1 = {
  title: 'Timeless Elegance',
  sub:   'Discover our collection of ethically sourced, handcrafted jewelry designed for the modern muse.',
  image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
};
const FALLBACK_FEAT2 = {
  title: 'The Bridal Edit',
  sub:   'Celebrate love with pieces crafted for the most precious moments of your life.',
  image: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=80',
};

export default function Categories() {
  const navigate = useNavigate();
  const [row1,  setRow1]  = useState(FALLBACK_ROW1);
  const [row2,  setRow2]  = useState(FALLBACK_ROW2);
  const [feat1, setFeat1] = useState(FALLBACK_FEAT1);
  const [feat2, setFeat2] = useState(FALLBACK_FEAT2);

  useEffect(() => {
  const u1 = onSnapshot(doc(db, 'site', 'categories_row1'), s => {
    if (s.exists() && s.data().items) {
      setRow1(s.data().items);
    }
  });

  const u2 = onSnapshot(doc(db, 'site', 'categories_row2'), s => {
    if (s.exists() && s.data().items) {
      setRow2(s.data().items);
    }
  });

  const u3 = onSnapshot(doc(db, 'site', 'feature_panel1'), s => {
    if (s.exists()) {
      setFeat1({ ...FALLBACK_FEAT1, ...s.data() });
    }
  });

  const u4 = onSnapshot(doc(db, 'site', 'feature_panel2'), s => {
    if (s.exists()) {
      setFeat2({ ...FALLBACK_FEAT2, ...s.data() });
    }
  });

  return () => {
    u1(); u2(); u3(); u4();
  };
}, []);

  const openVideo = (e) => {
    e.stopPropagation();
    document.getElementById('video-modal').classList.add('open');
  };

  return (
    <>
      {/* ── ROW 1 ── */}
      <section className="categories">
        <div className="cat-grid">
          {row1.slice(0, 2).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}

          <div className="cat-feature" onClick={() => navigate('/shop')}>
            <img src={feat1.image} alt="Feature 1" />
            <div className="cat-feature-overlay">
              <h2 className="cat-feature-title">{feat1.title}</h2>
              <p className="cat-feature-sub">{feat1.sub}</p>
              <button className="cat-video-btn" onClick={openVideo}>▶ &nbsp;PLAY VIDEO</button>
            </div>
          </div>

          {row1.slice(2, 4).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROW 2 ── */}
      <section className="categories cat-row2">
        <div className="cat-grid">
          {row2.slice(0, 2).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}

          <div className="cat-feature" onClick={() => navigate('/collections')}>
            <img src={feat2.image} alt="Feature 2" />
            <div className="cat-feature-overlay">
              <h2 className="cat-feature-title">{feat2.title}</h2>
              <p className="cat-feature-sub">{feat2.sub}</p>
              <button className="cat-video-btn" onClick={e => { e.stopPropagation(); navigate('/collections'); }}>
                EXPLORE →
              </button>
            </div>
          </div>

          {row2.slice(2, 4).map(c => (
            <div className="cat-item" key={c.id} onClick={() => navigate(`/shop?cat=${c.id}`)}>
              <img src={c.image} alt={c.label} />
              <div className="cat-overlay"><span className="cat-label">{c.label}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEO MODAL */}
      <div className="video-modal" id="video-modal"
        onClick={() => document.getElementById('video-modal').classList.remove('open')}>
        <div className="video-modal-inner" onClick={e => e.stopPropagation()}>
          <button className="video-close"
            onClick={() => document.getElementById('video-modal').classList.remove('open')}>✕</button>
          <iframe
            src="https://www.youtube.com/embed/0s8TFHovgYk?autoplay=1&mute=1"
            title="Aurelia Jewellery" frameBorder="0"
            allow="autoplay; fullscreen" allowFullScreen />
        </div>
      </div>
    </>
  );
}