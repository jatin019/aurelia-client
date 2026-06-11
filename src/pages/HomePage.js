import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import ProductScroller from '../components/ProductScroller';
import Reviews from '../components/Reviews';

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) {
        setBestSellers([]);
        setNewArrivals([]);
        return;
      }
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBestSellers(all.filter(p => p.section === 'bestSellers'));
      setNewArrivals(all.filter(p => p.section === 'newArrivals'));
    }, () => {});
    return () => unsub();
  }, []);

  return (
    <div className="page-wrapper home-page">
      <Hero />
      {newArrivals.length > 0 && (
        <ProductScroller title="New Arrivals" products={newArrivals} linkTo="/shop?section=newArrivals" />
      )}
      <Categories />
      {bestSellers.length > 0 && (
        <ProductScroller title="Best Sellers" products={bestSellers} linkTo="/shop?section=bestSellers" />
      )}
      <Reviews />
    </div>
  );
}
