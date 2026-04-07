import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { CartContext } from '../App';
import { allProducts } from '../data/products';
import './ProductDetailPage.css';

const BADGES = [
  { icon: '✦', label: 'Free Shipping',     sub: 'On orders over $500'     },
  { icon: '↩', label: 'Free Returns',      sub: '30-day return policy'    },
  { icon: '♛', label: 'Authenticity',      sub: 'Certified fine jewellery'},
  { icon: '⚑', label: 'Ethically Sourced', sub: '100% responsible gems'   },
];
const MATERIALS = ['18k Gold', 'Sterling Silver', 'Platinum', 'Rose Gold'];
const SIZES     = ['XS', 'S', 'M', 'L', 'XL'];

// Default tab content used when Firestore has nothing yet
const DEFAULT_CONTENT = {
  details:  (name) => `This exquisite ${name} is handcrafted by our master artisans using ethically sourced materials. Each piece is individually inspected and comes with a certificate of authenticity. Perfect as a statement piece or a timeless gift.`,
  care:     () => `Store in the provided velvet pouch away from moisture. Clean gently with a soft, lint-free cloth. Avoid contact with perfumes, lotions, and harsh chemicals to preserve the lustre of your jewellery.`,
  shipping: () => `Complimentary express shipping on all orders over $500. Orders typically ship within 1–2 business days. A tracking link will be emailed once dispatched. Free returns within 30 days of delivery.`,
};

export default function ProductDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useContext(CartContext);

  const [product,  setProduct]  = useState(null);
  const [related,  setRelated]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Firestore-driven tab content
  const [tabContent, setTabContent] = useState({ details: '', care: '', shipping: '' });

  const [added,            setAdded]            = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [selectedSize,     setSelectedSize]     = useState(SIZES[2]);
  const [qty,              setQty]              = useState(1);
  const [activeTab,        setActiveTab]        = useState('details');

  /* ── Load product ── */
  useEffect(() => {
    setLoading(true);
    setAdded(false);
    setQty(1);
    setActiveTab('details');

    const staticProduct = allProducts.find(p => String(p.id) === String(id));
    if (staticProduct) {
      setProduct(staticProduct);
      setRelated(
        allProducts
          .filter(p => p.category === staticProduct.category && String(p.id) !== String(id))
          .slice(0, 4)
      );
      setLoading(false);
      return;
    }

    // Firebase fallback
    const fetchFromFirebase = async () => {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          const fbProduct = { id: snap.id, ...snap.data() };
          setProduct(fbProduct);
          try {
            const relSnap = await getDocs(
              query(collection(db, 'products'), where('category', '==', fbProduct.category))
            );
            const relList = relSnap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(p => p.id !== id)
              .slice(0, 4);
            const extra = relList.length < 4
              ? allProducts.filter(p => p.category === fbProduct.category).slice(0, 4 - relList.length)
              : [];
            setRelated([...relList, ...extra]);
          } catch {
            setRelated(allProducts.filter(p => p.category === id).slice(0, 4));
          }
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchFromFirebase();
  }, [id]);

  /* ── Live-listen to this product's description in Firestore ──
     Collection: productDescriptions
     Document ID: same as the product id (works for both numeric & Firebase string IDs)
     Fields: details (string), care (string), shipping (string)
  ── */
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'productDescriptions', String(id)),
      snap => {
        if (snap.exists()) {
          const data = snap.data();
          setTabContent({
            details:  data.details  || '',
            care:     data.care     || '',
            shipping: data.shipping || '',
          });
        } else {
          // No Firestore doc yet — clear so defaults kick in
          setTabContent({ details: '', care: '', shipping: '' });
        }
      },
      () => setTabContent({ details: '', care: '', shipping: '' })
    );
    return () => unsub();
  }, [id]);

  const getTabText = (tab) => {
    if (tabContent[tab]) return tabContent[tab];
    if (!product) return '';
    return tab === 'details' ? DEFAULT_CONTENT.details(product.name) : DEFAULT_CONTENT[tab]();
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-not-found">
        <h2>Product not found</h2>
        <button onClick={() => navigate('/shop')}>← Back to Shop</button>
      </div>
    );
  }

  return (
    <div className="pdp-wrapper">

      {/* ── BREADCRUMB ── */}
      <div className="pdp-breadcrumb">
        <button onClick={() => navigate('/')}>Home</button>
        <span>›</span>
        <button onClick={() => navigate('/shop')}>Shop</button>
        <span>›</span>
        <button onClick={() => navigate(`/shop?cat=${product.category}`)}>{product.category}</button>
        <span>›</span>
        <span className="pdp-bc-current">{product.name}</span>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="pdp-grid">

        {/* LEFT: IMAGE */}
        <div className="pdp-image-section">
          <div className="pdp-image-main">
            <img src={product.image} alt={product.name} />
            <div className="pdp-image-badge">{product.category}</div>
          </div>
          <div className="pdp-thumbs">
            {[product.image, product.image, product.image].map((src, i) => (
              <div key={i} className={`pdp-thumb ${i === 0 ? 'active' : ''}`}>
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="pdp-info">
          <div className="pdp-eyebrow">
            <span className="pdp-cat">{(product.category || '').toUpperCase()}</span>
            <div className="pdp-stars">★★★★★ <span>(124 reviews)</span></div>
          </div>

          <h1 className="pdp-name">{product.name}</h1>
          <p className="pdp-price">${(product.price || 0).toLocaleString()}</p>
          <p className="pdp-price-note">
            or 4 interest-free payments of ${Math.round((product.price || 0) / 4).toLocaleString()}
          </p>

          <div className="pdp-option-group">
            <p className="pdp-option-label">Material: <strong>{selectedMaterial}</strong></p>
            <div className="pdp-options">
              {MATERIALS.map(m => (
                <button key={m}
                  className={`pdp-option-btn ${selectedMaterial === m ? 'active' : ''}`}
                  onClick={() => setSelectedMaterial(m)}>{m}</button>
              ))}
            </div>
          </div>

          <div className="pdp-option-group">
            <p className="pdp-option-label">Size: <strong>{selectedSize}</strong></p>
            <div className="pdp-options">
              {SIZES.map(s => (
                <button key={s}
                  className={`pdp-size-btn ${selectedSize === s ? 'active' : ''}`}
                  onClick={() => setSelectedSize(s)}>{s}</button>
              ))}
            </div>
          </div>

          <div className="pdp-cart-row">
            <div className="pdp-qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)}>+</button>
            </div>
            <button className={`pdp-add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
              {added ? '✓ Added to Bag' : 'ADD TO BAG'}
            </button>
          </div>

          <button className="pdp-wishlist-btn">♡ &nbsp;Save to Wishlist</button>

          {/* ── TABS — content pulled live from Firestore ── */}
          <div className="pdp-tabs">
            {['details', 'care', 'shipping'].map(tab => (
              <button key={tab}
                className={`pdp-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="pdp-tab-content">
            <p>{getTabText(activeTab)}</p>
          </div>

          <div className="pdp-badges">
            {BADGES.map(b => (
              <div className="pdp-badge" key={b.label}>
                <span className="pdp-badge-icon">{b.icon}</span>
                <div>
                  <p className="pdp-badge-label">{b.label}</p>
                  <p className="pdp-badge-sub">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RELATED ── */}
      {related.length > 0 && (
        <div className="pdp-related">
          <div className="pdp-related-header">
            <h2>You May Also Love</h2>
            <button onClick={() => navigate(`/shop?cat=${product.category}`)}>View all →</button>
          </div>
          <div className="pdp-related-grid">
            {related.map(p => (
              <div key={p.id} className="pdp-related-card"
                onClick={() => navigate(`/product/${p.id}`)}>
                <div className="pdp-related-img">
                  <img src={p.image} alt={p.name} />
                </div>
                <p className="pdp-related-name">{p.name}</p>
                <p className="pdp-related-price">${(p.price || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}