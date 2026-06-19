import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './CollectionsPage.css';

const DEFAULT_COLLECTIONS = [
  { id:'bestSellers', title:'Best Sellers',          subtitle:'Our most loved pieces by customers',        link:'/shop?section=bestSellers', tag:'POPULAR',   icon:'⭐', active:true },
  { id:'newArrivals', title:'New Arrivals',           subtitle:'Fresh additions to our collection',          link:'/shop?section=newArrivals', tag:'NEW',       icon:'✨', active:true },
  { id:'combo',       title:'Combo',                 subtitle:'Mix & match sets at special prices',         link:'/shop?section=combo',       tag:'COMBO',     icon:'🎁', active:true },
  { id:'under50k',    title:'Under ₹50,000',          subtitle:'Affordable elegance for every budget',       link:'/shop?maxPrice=50000',      tag:'BUDGET',    icon:'💎', active:true },
  { id:'50k-1l',      title:'₹50,000 – ₹1,00,000',   subtitle:'Beautiful pieces at great value',            link:'/shop?minPrice=50000&maxPrice=100000', tag:'VALUE', icon:'💍', active:true },
  { id:'1l-2.5l',     title:'₹1,00,000 – ₹2,50,000', subtitle:'Premium craftsmanship, mid-range prices',   link:'/shop?minPrice=100000&maxPrice=250000', tag:'MID-RANGE', icon:'👑', active:true },
  { id:'2.5l-5l',     title:'₹2,50,000 – ₹5,00,000', subtitle:'Luxury pieces for special occasions',       link:'/shop?minPrice=250000&maxPrice=500000', tag:'PREMIUM', icon:'🌟', active:true },
  { id:'above5l',     title:'₹5,00,000 & Above',      subtitle:'Exclusive high-end fine jewellery',          link:'/shop?minPrice=500000',     tag:'LUXURY',    icon:'♛', active:true },
  { id:'onSale',      title:'On Sale',                subtitle:'Grab the best deals — limited time offers', link:'/shop?sale=true',           tag:'SALE',      icon:'🏷', active:true },
];

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'collections_page'), snap => {
      if (snap.exists() && snap.data().items?.length) {
        setCollections(snap.data().items);
      }
    }, () => {});
    return () => unsub();
  }, []);

  const visibleCollections = collections.filter(c => c.active !== false);

  return (
    <div className="page-wrapper collections-page">
      <div className="collections-header">
        <h1 className="collections-title">Collections</h1>
        <p className="collections-sub">Shop by category and price range</p>
      </div>
      <div className="collections-grid">
        {visibleCollections.map(col => (
          <div className="col-card" key={col.id} onClick={() => navigate(col.link)}>
            <div className="col-card-icon">{col.icon}</div>
            <div className="col-card-info">
              <span className={`col-tag ${col.id === 'combo' ? 'col-tag-combo' : ''}`}>
                {col.tag}
              </span>
              <h3 className="col-card-title">{col.title}</h3>
              <p className="col-card-sub">{col.subtitle}</p>
              <span className="col-card-link">Explore →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
