import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import './ProductScroller.css';

export default function ProductScroller({ title, products, linkTo }) {
  const trackRef  = useRef(null);
  const animRef   = useRef(null);
  const posRef    = useRef(0);
  const pausedRef = useRef(false);
  const navigate  = useNavigate();

  const shouldLoop = products.length >= 4;

  const displayProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (!shouldLoop) return products;
    return [...products, ...products];
  }, [products, shouldLoop]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || products.length === 0) return;

    if (!shouldLoop) {
      track.style.transform = 'translateX(0px)';
      return;
    }

    posRef.current = 0;
    track.style.transform = 'translateX(0px)';

    const raf = requestAnimationFrame(() => {
      const totalWidth = track.scrollWidth / 2;
      const animate = () => {
        if (!pausedRef.current) {
          posRef.current += 0.55;
          if (totalWidth > 0 && posRef.current >= totalWidth) posRef.current = 0;
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(raf);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [products, shouldLoop]);

  return (
    <section className="scroller-section">
      <div className="scroller-header">
        <h2 className="section-title">{title}</h2>
        <button className="view-all-link" onClick={() => navigate(linkTo)}>
          View all Collection &nbsp;→
        </button>
      </div>
      <div
        className="scroller-window"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        <div className="scroller-track" ref={trackRef}>
          {displayProducts.map((p, i) => (
            <div
              className="scroller-item"
              key={`${p.id}-${i}`}
              onClick={() => navigate(`/product/${p.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}