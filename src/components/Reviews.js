import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import './Reviews.css';

// Fallback reviews shown until Firebase loads
const FALLBACK_REVIEWS = [
  {
    id: 'r1', stars: 5,
    text: '"The quality of the diamond ring is absolutely breathtaking. It surpassed all my expectations and the customer service was impeccable. Truly a memorable experience."',
    name: 'Sarah Jenkins', location: 'New York, NY',
  },
  {
    id: 'r2', stars: 5,
    text: '"I purchased a pearl necklace for my wedding day. It\'s delicate, elegant, and I received so many compliments. I will treasure it forever as a family heirloom."',
    name: 'Emily Chen', location: 'Los Angeles, CA',
  },
  {
    id: 'r3', stars: 5,
    text: '"Their stackable rings are my new everyday essential. The craftsmanship is flawless and they hold up beautifully even with daily wear. Highly recommend!"',
    name: 'Jessica Taylor', location: 'London, UK',
  },
];

export default function Reviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to 'reviews' collection, ordered by a 'order' field (or createdAt)
    const q = query(collection(db, 'reviews'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q,
      snap => {
        if (!snap.empty) {
          setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        // if empty, fallbacks stay
        setLoading(false);
      },
      () => setLoading(false) // on error, fallbacks stay
    );
    return () => unsub();
  }, []);

  return (
    <section className="reviews">
      <div className="reviews-header">
        <h2 className="reviews-title">Loved by our muses</h2>
        <p className="reviews-sub">
          Discover why thousands choose Aurelia for their most special and unforgettable moments.
        </p>
      </div>

      {loading ? (
        <div className="reviews-loading">
          {[1,2,3].map(i => <div key={i} className="review-skeleton" />)}
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map(r => (
            <div className="review-card" key={r.id}>
              <div className="review-top">
                <div className="stars">{'★'.repeat(Math.min(r.stars || 5, 5))}</div>
                <span className="review-quote">"</span>
              </div>
              <p className="review-text">{r.text}</p>
              <div className="review-author">
                <p className="review-name">{r.name}</p>
                <p className="review-loc">{r.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}