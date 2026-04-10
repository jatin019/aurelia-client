import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import ProductScroller from '../components/ProductScroller';
import Reviews from '../components/Reviews';
import { bestSellers as defaultBS, newArrivals as defaultNA } from '../data/products';

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState(defaultBS);
  const [newArrivals, setNewArrivals] = useState(defaultNA);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) { setBestSellers(defaultBS); setNewArrivals(defaultNA); return; }
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const firebaseBS = all.filter(p => p.section === 'bestSellers');
      const firebaseNA = all.filter(p => p.section === 'newArrivals');
      const mergedBS = [
        ...firebaseBS,
        ...defaultBS.filter(d => !firebaseBS.some(f => f.name?.toLowerCase() === d.name?.toLowerCase()))
      ];
      const mergedNA = [
        ...firebaseNA,
        ...defaultNA.filter(d => !firebaseNA.some(f => f.name?.toLowerCase() === d.name?.toLowerCase()))
      ];
      setBestSellers(mergedBS);
      setNewArrivals(mergedNA);
    }, () => {});
    return () => unsub();
  }, []);

  return (
    /* home-page removes top padding so hero fills entire screen from top */
    <div className="page-wrapper home-page">
      {/* 1. Full-screen hero */}
      <Hero />

      {/* 2. Full-screen categories (fills viewport on scroll) */}
      <Categories />

      {/* 3. Best Sellers scroller */}
      <ProductScroller title="Best Sellers" products={bestSellers} linkTo="/shop" />

      {/* 4. New Arrivals scroller */}
      <ProductScroller title="New Arrivals" products={newArrivals} linkTo="/shop" />

      {/* 5. Reviews */}
      <Reviews />
    </div>
  );
}