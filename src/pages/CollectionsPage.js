import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Gift, Sparkles, Star } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './CollectionsPage.css';

const DEFAULT_COLLECTIONS = [
  { id: 'bestSellers', title: 'Best Sellers', subtitle: 'The pieces everyone keeps coming back for', link: '/shop?section=bestSellers', tag: 'Most loved', active: true },
  { id: 'newArrivals', title: 'New Arrivals', subtitle: 'Fresh finds, just added to the collection', link: '/shop?section=newArrivals', tag: 'Just in', active: true },
  { id: 'r99to199', title: '₹99 – ₹199', subtitle: 'Little luxuries, very lovely prices', link: '/shop?minPrice=99&maxPrice=199', tag: 'Sweet spot', active: true },
  { id: 'combo', title: 'Combo Sets', subtitle: 'More ways to style, more value in every set', link: '/shop?section=combo', tag: 'Better together', active: true },
  { id: 'under99', title: 'Under ₹99', subtitle: 'Everyday sparkle on a tiny budget', link: '/shop?maxPrice=99', tag: 'Budget edit', active: true },
  { id: 'r199to299', title: '₹199 – ₹299', subtitle: 'Easy favourites for every mood', link: '/shop?minPrice=199&maxPrice=299', tag: 'Everyday edit', active: true },
  { id: 'r299to399', title: '₹299 – ₹399', subtitle: 'Statement details with a refined finish', link: '/shop?minPrice=299&maxPrice=399', tag: 'Elevated', active: true },
  { id: 'above499', title: '₹499 & Above', subtitle: 'Special pieces made to stand out', link: '/shop?minPrice=499', tag: 'Premium edit', active: true },
  { id: 'onSale', title: 'The Sale Edit', subtitle: 'Beautiful picks at limited-time prices', link: '/shop?sale=true', tag: 'Now on sale', active: true },
];

const isValueCollection = item => {
  const text = `${item?.id || ''} ${item?.title || ''}`.toLowerCase();
  return text.includes('99') && text.includes('199');
};

function CollectionLink({ item, className, children }) {
  const navigate = useNavigate();
  const open = () => navigate(item.link);

  return (
    <article className={className} role="link" tabIndex="0" onClick={open} onKeyDown={event => event.key === 'Enter' && open()}>
      {children}
    </article>
  );
}

export default function CollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'collections_page'), snap => {
      if (snap.exists() && snap.data().items?.length) setCollections(snap.data().items);
    }, () => {});
    return () => unsub();
  }, []);

  const visible = collections.filter(item => item.active !== false);
  const bestSellers = visible.find(item => String(item.id).toLowerCase() === 'bestsellers') || visible[0];
  const newArrivals = visible.find(item => String(item.id).toLowerCase() === 'newarrivals') || visible[1];
  const valuePick = visible.find(isValueCollection) || visible[2];
  const featuredIds = new Set([bestSellers?.id, newArrivals?.id, valuePick?.id]);
  const remaining = visible.filter(item => !featuredIds.has(item.id));

  return (
    <main className="page-wrapper collections-page">
      <header className="collections-intro">
        <div className="collections-intro-index">01 — 09</div>
        <div className="collections-intro-copy">
          <span className="collections-kicker"><Sparkles size={13} /> Find your next favourite</span>
          <h1>Collections<br /><em>for every you.</em></h1>
          <p>Fresh drops, loved favourites, smart prices and better-together sets. Start with what feels right.</p>
          <button type="button" onClick={() => navigate('/shop')}>Shop everything <ArrowRight size={16} /></button>
        </div>
        <div className="collections-intro-side">
          <span>Jewellery edits</span>
          <strong>Everyday<br />to occasion</strong>
        </div>
      </header>

      <section className="collections-featured">
        <div className="collections-heading-row">
          <div><span>01</span><h2>Start with the favourites</h2></div>
          <p>Two edits, two moods. Discover what is new or see what everyone already loves.</p>
        </div>
        <div className="collections-featured-grid">
          {bestSellers && (
            <CollectionLink item={bestSellers} className="collection-major collection-major-dark">
              <div className="collection-major-top"><span>{bestSellers.tag}</span><Star size={22} strokeWidth={1.4} /></div>
              <div>
                <span className="collection-number">01</span>
                <h3>{bestSellers.title}</h3>
                <p>{bestSellers.subtitle}</p>
              </div>
              <span className="collection-explore">Explore collection <ArrowUpRight size={17} /></span>
            </CollectionLink>
          )}
          {newArrivals && (
            <CollectionLink item={newArrivals} className="collection-major collection-major-pink">
              <div className="collection-major-top"><span>{newArrivals.tag}</span><Sparkles size={22} strokeWidth={1.4} /></div>
              <div>
                <span className="collection-number">02</span>
                <h3>{newArrivals.title}</h3>
                <p>{newArrivals.subtitle}</p>
              </div>
              <span className="collection-explore">See what is new <ArrowUpRight size={17} /></span>
            </CollectionLink>
          )}
        </div>
      </section>

      {valuePick && (
        <section className="collections-value" onClick={() => navigate(valuePick.link)} role="link" tabIndex="0" onKeyDown={event => event.key === 'Enter' && navigate(valuePick.link)}>
          <div className="collections-value-label">Best value</div>
          <div className="collections-value-price"><span>From</span><strong>₹99</strong></div>
          <div className="collections-value-copy">
            <span>{valuePick.tag}</span>
            <h2>Good style.<br />Very good prices.</h2>
            <p>Easy-to-love pieces from ₹99 to ₹199, chosen for everyday plans and spontaneous treats.</p>
          </div>
          <div className="collections-value-action"><ArrowRight size={24} /><span>Shop ₹99 — ₹199</span></div>
        </section>
      )}

      <section className="collections-directory">
        <div className="collections-heading-row">
          <div><span>02</span><h2>Shop your way</h2></div>
          <p>Browse by price, pick up a combo, or find something special in the sale.</p>
        </div>
        <div className="collections-list">
          {remaining.map((item, index) => {
            const isCombo = String(item.id).toLowerCase().includes('combo');
            return (
              <CollectionLink item={item} className={`collection-row ${isCombo ? 'collection-row-combo' : ''}`} key={item.id}>
                <span className="collection-row-index">{String(index + 3).padStart(2, '0')}</span>
                <span className="collection-row-tag">{item.tag}</span>
                <div className="collection-row-copy">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                </div>
                {isCombo && <Gift size={19} strokeWidth={1.4} />}
                <ArrowUpRight className="collection-row-arrow" size={21} />
              </CollectionLink>
            );
          })}
        </div>
      </section>
    </main>
  );
}