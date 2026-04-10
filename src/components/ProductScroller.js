import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import './ProductScroller.css';

export default function ProductScroller({ title, products, linkTo }) {
  const windowRef   = useRef(null);
  const animRef     = useRef(null);
  const pausedRef   = useRef(false);
  const dragging    = useRef(false);
  const dragStartX  = useRef(0);
  const dragScrollX = useRef(0);
  const navigate    = useNavigate();

  // Triple the products so infinite scroll has headroom in both directions
  const display = useMemo(() => {
    if (!products.length) return [];
    return [...products, ...products, ...products];
  }, [products]);

  /* ── AUTO-SCROLL via scrollLeft ── */
  useEffect(() => {
    const win = windowRef.current;
    if (!win || !products.length) return;

    // Give the DOM a frame to measure scrollWidth
    const startRaf = requestAnimationFrame(() => {
      // Start in the middle third
      const third = win.scrollWidth / 3;
      win.scrollLeft = third;

      const SPEED = 0.55; // px per frame

      const step = () => {
        if (!pausedRef.current && !dragging.current) {
          win.scrollLeft += SPEED;
          // When we've scrolled into the last third, jump back to first third
          if (win.scrollLeft >= (win.scrollWidth / 3) * 2) {
            win.scrollLeft = win.scrollWidth / 3;
          }
        }
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(startRaf);
      cancelAnimationFrame(animRef.current);
    };
  }, [products]);

  /* ── MOUSE DRAG ── */
  const onMouseDown = e => {
    dragging.current = true;
    dragStartX.current = e.pageX;
    dragScrollX.current = windowRef.current.scrollLeft;
    windowRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };
  const onMouseMove = e => {
    if (!dragging.current) return;
    windowRef.current.scrollLeft = dragScrollX.current - (e.pageX - dragStartX.current);
  };
  const onMouseUp = () => {
    dragging.current = false;
    if (windowRef.current) windowRef.current.style.cursor = 'grab';
  };

  if (!products.length) return null;

  return (
    <section className="scroller-section">
      <div className="scroller-header">
        <h2 className="section-title">{title}</h2>
        <button className="view-all-link" onClick={() => navigate(linkTo)}>
          View all &nbsp;→
        </button>
      </div>

      <div
        ref={windowRef}
        className="scroller-window"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; onMouseUp(); }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <div className="scroller-track">
          {display.map((p, i) => (
            <div
              className="scroller-item"
              key={`${p.id}-${i}`}
              onClick={() => { if (!dragging.current) navigate(`/product/${p.id}`); }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}