import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import ProductScroller from '../components/ProductScroller';
import Reviews from '../components/Reviews';
import CountdownBanner from '../components/CountdownBanner';
import MarqueeBanner from '../components/MarqueeBanner';
import Navbar from '../components/Navbar';
import './HomePage.css';

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) { setBestSellers([]); setNewArrivals([]); return; }
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const byId = (arr) => {
        const seen = new Set(); const out = [];
        for (const p of arr) { if (seen.has(p.id)) continue; seen.add(p.id); out.push(p); }
        return out;
      };
      setBestSellers(byId(all.filter(p => p.section === 'bestSellers')));
      setNewArrivals(byId(all.filter(p => p.section === 'newArrivals')));
    }, () => {});
    return () => unsub();
  }, []);

  return (
    <div className="home-page">

      {/*
        ✅ CORRECT ORDER — all in normal document flow:
        1. CountdownBanner  (orange timer)
        2. Navbar           (sticky — locks to top after countdown scrolls away)
        3. MarqueeBanner    (scrolling text, right below navbar)
        4. Hero + content
      */}

      <CountdownBanner />
      <Navbar />
      <MarqueeBanner />

      <Hero />

      {newArrivals.length > 0 && (
        <ProductScroller
          title="New Arrivals"
          products={newArrivals}
          linkTo="/shop?section=newArrivals"
        />
      )}

      <Categories />

      {bestSellers.length > 0 && (
        <ProductScroller
          title="Best Sellers"
          products={bestSellers}
          linkTo="/shop?section=bestSellers"
        />
      )}

      <Reviews />
    </div>
  );
}