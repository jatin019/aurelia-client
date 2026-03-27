import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">

      {/* LEFT — stacked images */}
      <div className="hero-images">
        <div className="hero-arch">
          <img src="https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=500&q=80" alt="Bridal couple" />
          <div className="hero-badge">
            <span className="badge-heart">♥</span>
            <div>
              <p className="badge-title">THE BRIDAL EDIT</p>
              <p className="badge-sub">Discover forever</p>
            </div>
          </div>
        </div>

        <div className="hero-box-img">
          <img src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=300&q=80" alt="Gold studs" />
        </div>

        <div className="hero-hand-img">
          <img src="https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=300&q=80" alt="Ring on hand" />
        </div>
      </div>

      {/* RIGHT — text */}
      <div className="hero-content">
        <h1 className="hero-heading">
          For the moments<br />
          <em>that take your</em> breath<br />
          away.
        </h1>
        <p className="hero-sub">
          Whether it's a promise, an anniversary, or just because.
          Celebrate your unique love story with exceptionally crafted
          pieces designed to be cherished for generations.
        </p>
        <div className="hero-btns">
          <button className="btn-dark"    onClick={() => navigate('/shop')}>SHOP ENGAGEMENT</button>
          <button className="btn-outline" onClick={() => navigate('/collections')}>THE GIFT GUIDE</button>
        </div>
      </div>

    </section>
  );
}