import React from 'react';
import './PageSkeleton.css';

const Bars = ({ count = 3 }) => (
  <div className="page-skeleton-bars">
    {Array.from({ length: count }, (_, index) => <span key={index} />)}
  </div>
);

export default function PageSkeleton({ variant = 'content' }) {
  if (variant === 'home') {
    return (
      <main className="page-skeleton page-skeleton-home" aria-label="Loading page" aria-busy="true">
        <div className="page-skeleton-hero"><Bars count={2} /><span className="page-skeleton-button" /></div>
        <section className="page-skeleton-section"><Bars count={2} /><div className="page-skeleton-product-row">{[1, 2, 3, 4].map(i => <div className="page-skeleton-product" key={i} />)}</div></section>
        <section className="page-skeleton-section"><Bars count={1} /><div className="page-skeleton-category-row">{[1, 2, 3, 4].map(i => <div key={i} />)}</div></section>
      </main>
    );
  }

  if (variant === 'shop') {
    return (
      <main className="page-skeleton page-skeleton-shop" aria-label="Loading products" aria-busy="true">
        <div className="page-skeleton-shop-header"><Bars count={2} /></div>
        <div className="page-skeleton-pills">{[1, 2, 3, 4, 5].map(i => <span key={i} />)}</div>
        <div className="page-skeleton-grid">{Array.from({ length: 8 }, (_, i) => <div className="page-skeleton-product" key={i} />)}</div>
      </main>
    );
  }

  return (
    <main className="page-skeleton page-skeleton-content" aria-label="Loading page" aria-busy="true">
      <div className="page-skeleton-content-header"><Bars count={2} /></div>
      <div className="page-skeleton-content-grid">{[1, 2, 3].map(i => <div key={i}><Bars count={3} /></div>)}</div>
    </main>
  );
}
