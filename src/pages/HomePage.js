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
      if (snap.empty) {
        // No Firebase products — keep defaults
        setBestSellers(defaultBS);
        setNewArrivals(defaultNA);
        return;
      }

      const firebaseProducts = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const firebaseBS = firebaseProducts.filter(p => p.section === 'bestSellers');
      const firebaseNA = firebaseProducts.filter(p => p.section === 'newArrivals');

      // ✅ MERGE: Firebase products first, then defaults that don't conflict
      const mergedBS = [
        ...firebaseBS,
        ...defaultBS.filter(d => !firebaseBS.some(f =>
          f.name.toLowerCase() === d.name.toLowerCase()
        ))
      ];

      const mergedNA = [
        ...firebaseNA,
        ...defaultNA.filter(d => !firebaseNA.some(f =>
          f.name.toLowerCase() === d.name.toLowerCase()
        ))
      ];

      setBestSellers(mergedBS);
      setNewArrivals(mergedNA);

    }, () => {});

    return () => unsub();
  }, []);

  return (
    <div className="page-wrapper">
      <Hero />
      <Categories />
      <ProductScroller title="Best Sellers" products={bestSellers} linkTo="/shop" />
      <ProductScroller title="New Arrivals" products={newArrivals} linkTo="/shop" />
      <Reviews />
    </div>
  );
}