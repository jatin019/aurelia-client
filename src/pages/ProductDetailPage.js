import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import { allProducts, getEffectivePrice, getDiscountPercent } from '../data/products';
import { Heart } from 'lucide-react';
import './ProductDetailPage.css';

const BADGES = [
  { icon:'✦', label:'Free Shipping',     sub:'On orders over $500'      },
  { icon:'↩', label:'Free Returns',      sub:'30-day return policy'     },
  { icon:'♛', label:'Authenticity',      sub:'Certified fine jewellery' },
  { icon:'⚑', label:'Ethically Sourced', sub:'100% responsible gems'    },
];
const MATERIALS = ['18k Gold', 'Sterling Silver', 'Platinum', 'Rose Gold'];
const SIZES     = ['XS', 'S', 'M', 'L', 'XL'];
const DEFAULT_CONTENT = {
  details:  (name) => `This exquisite ${name} is handcrafted by our master artisans using ethically sourced materials. Each piece comes with a certificate of authenticity.`,
  care:     () => `Store in the provided velvet pouch. Clean with a soft cloth. Avoid contact with perfumes and harsh chemicals.`,
  shipping: () => `Complimentary express shipping on orders over $500. Ships within 1–2 business days. Free returns within 30 days.`,
};

export default function ProductDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, inWishlist } = useContext(WishlistContext);

  const [product,          setProduct]          = useState(null);
  const [related,          setRelated]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [tabContent,       setTabContent]       = useState({ details:'', care:'', shipping:'' });
  const [added,            setAdded]            = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [selectedSize,     setSelectedSize]     = useState(SIZES[2]);
  const [qty,              setQty]              = useState(1);
  const [activeTab,        setActiveTab]        = useState('details');
  const [activeMediaIdx,   setActiveMediaIdx]   = useState(0);
  const [wishlisted,       setWishlisted]       = useState(false);

  // Check wishlist state
  useEffect(() => { if (product) setWishlisted(inWishlist(product.id)); }, [product, inWishlist]);

  useEffect(() => {
    setLoading(true); setAdded(false); setQty(1); setActiveTab('details'); setActiveMediaIdx(0);
    const staticProduct = allProducts.find(p => String(p.id) === String(id));
    if (staticProduct) {
      setProduct(staticProduct);
      setRelated(allProducts.filter(p => p.category === staticProduct.category && String(p.id) !== String(id)).slice(0,4));
      setLoading(false);
      return;
    }
    const fetchFB = async () => {
      try {
        const snap = await getDoc(doc(db,'products',id));
        if (snap.exists()) {
          const fbp = { id:snap.id, ...snap.data() };
          setProduct(fbp);
          try {
            const relSnap = await getDocs(query(collection(db,'products'), where('category','==',fbp.category)));
            setRelated(relSnap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.id!==id).slice(0,4));
          } catch {}
        } else setProduct(null);
      } catch { setProduct(null); }
      finally { setLoading(false); }
    };
    fetchFB();
  }, [id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db,'productDescriptions',String(id)), snap => {
      if (snap.exists()) { const d=snap.data(); setTabContent({ details:d.details||'', care:d.care||'', shipping:d.shipping||'' }); }
      else setTabContent({ details:'', care:'', shipping:'' });
    }, () => setTabContent({ details:'', care:'', shipping:'' }));
    return () => unsub();
  }, [id]);

  const getTabText = (tab) => tabContent[tab] || (product ? (tab==='details' ? DEFAULT_CONTENT.details(product.name) : DEFAULT_CONTENT[tab]()) : '');

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    setWishlisted(w => !w);
  };

  if (loading) return <div className="pdp-loading"><div className="pdp-spinner" /></div>;
  if (!product) return <div className="pdp-not-found"><h2>Product not found</h2><button onClick={() => navigate('/shop')}>← Back to Shop</button></div>;

  const images        = product.images?.length ? product.images : [product.image].filter(Boolean);
  const hasVideo      = Boolean(product.video);
  const effectivePrice = getEffectivePrice(product);
  const discountPct    = getDiscountPercent(product);
  const isOnSale       = discountPct > 0;
  const activeIsVideo  = hasVideo && activeMediaIdx === images.length;

  return (
    <div className="pdp-wrapper">
      <div className="pdp-breadcrumb">
        <button onClick={() => navigate('/')}>Home</button><span>›</span>
        <button onClick={() => navigate('/shop')}>Shop</button><span>›</span>
        <button onClick={() => navigate(`/shop?cat=${product.category}`)}>{product.category}</button><span>›</span>
        <span className="pdp-bc-current">{product.name}</span>
      </div>

      <div className="pdp-grid">
        {/* IMAGE */}
        <div className="pdp-image-section">
          <div className="pdp-image-main">
            {isOnSale && <div className="pdp-sale-badge">-{discountPct}% OFF</div>}
            <div className="pdp-image-badge">{product.category}</div>
            {activeIsVideo
              ? <video src={product.video} controls autoPlay muted loop playsInline style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : <img src={images[activeMediaIdx] || images[0]} alt={product.name} />
            }
          </div>
          <div className="pdp-thumbs">
            {images.map((src, i) => (
              <div key={i} className={`pdp-thumb ${activeMediaIdx===i&&!activeIsVideo?'active':''}`} onClick={() => setActiveMediaIdx(i)}>
                <img src={src} alt="" />
              </div>
            ))}
            {hasVideo && (
              <div className={`pdp-thumb pdp-thumb-video ${activeIsVideo?'active':''}`} onClick={() => setActiveMediaIdx(images.length)}>
                <span className="pdp-thumb-play">▶</span>
              </div>
            )}
          </div>
        </div>

        {/* INFO */}
        <div className="pdp-info">
          <div className="pdp-eyebrow">
            <span className="pdp-cat">{(product.category||'').toUpperCase()}</span>
            <div className="pdp-stars">★★★★★ <span>(124 reviews)</span></div>
          </div>

          <h1 className="pdp-name">{product.name}</h1>

          <div className="pdp-price-row">
            <p className="pdp-price">${effectivePrice.toLocaleString()}</p>
            {isOnSale && <><p className="pdp-original-price">${product.price.toLocaleString()}</p><span className="pdp-sale-tag">-{discountPct}% OFF</span></>}
          </div>
          <p className="pdp-price-note">or 4 interest-free payments of ${Math.round(effectivePrice/4).toLocaleString()}</p>

          <div className="pdp-option-group">
            <p className="pdp-option-label">Material: <strong>{selectedMaterial}</strong></p>
            <div className="pdp-options">
              {MATERIALS.map(m => <button key={m} className={`pdp-option-btn ${selectedMaterial===m?'active':''}`} onClick={() => setSelectedMaterial(m)}>{m}</button>)}
            </div>
          </div>

          <div className="pdp-option-group">
            <p className="pdp-option-label">Size: <strong>{selectedSize}</strong></p>
            <div className="pdp-options">
              {SIZES.map(s => <button key={s} className={`pdp-size-btn ${selectedSize===s?'active':''}`} onClick={() => setSelectedSize(s)}>{s}</button>)}
            </div>
          </div>

          <div className="pdp-cart-row">
            <div className="pdp-qty">
              <button onClick={() => setQty(q => Math.max(1,q-1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q+1)}>+</button>
            </div>
            <button className={`pdp-add-btn ${added?'added':''}`} onClick={handleAdd}>
              {added ? '✓ Added to Bag' : 'ADD TO BAG'}
            </button>
          </div>

          {/* Wishlist button */}
          <button className={`pdp-wishlist-btn ${wishlisted?'wishlisted':''}`} onClick={handleWishlist}>
            <Heart size={15} fill={wishlisted ? '#e05c7a' : 'none'} color={wishlisted ? '#e05c7a' : 'currentColor'} />
            {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>

          <div className="pdp-tabs">
            {['details','care','shipping'].map(tab => (
              <button key={tab} className={`pdp-tab ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="pdp-tab-content"><p>{getTabText(activeTab)}</p></div>

          <div className="pdp-badges">
            {BADGES.map(b => (
              <div className="pdp-badge" key={b.label}>
                <span className="pdp-badge-icon">{b.icon}</span>
                <div><p className="pdp-badge-label">{b.label}</p><p className="pdp-badge-sub">{b.sub}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="pdp-related">
          <div className="pdp-related-header">
            <h2>You May Also Love</h2>
            <button onClick={() => navigate(`/shop?cat=${product.category}`)}>View all →</button>
          </div>
          <div className="pdp-related-grid">
            {related.map(p => {
              const ep = getEffectivePrice(p); const dp = getDiscountPercent(p);
              return (
                <div key={p.id} className="pdp-related-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="pdp-related-img">
                    {dp>0 && <span className="pdp-related-sale">-{dp}%</span>}
                    <img src={p.image} alt={p.name} />
                  </div>
                  <p className="pdp-related-name">{p.name}</p>
                  <div className="pdp-related-price-row">
                    <span className="pdp-related-price">${ep.toLocaleString()}</span>
                    {dp>0 && <span className="pdp-related-orig">${p.price.toLocaleString()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}