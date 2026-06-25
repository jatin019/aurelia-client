import React, { useContext, useState, useEffect } from 'react';
import TrustBadges from '../components/TrustBadges';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import { getSizeConfig, isSizeInStock, getStockForSelection, getStockMessage } from '../data/sizeConfig';
import { getEffectivePrice, getDiscountPercent, formatINR } from '../data/products';
import { Heart } from 'lucide-react';
import './ProductDetailPage.css';

const DEFAULT_CONTENT = {
  details:  (name) => `This exquisite ${name} is handcrafted by our master artisans using ethically sourced materials.`,
  care:     () => `Store in the provided velvet pouch. Clean with a soft cloth. Avoid contact with perfumes.`,
  shipping: () => `Free shipping on orders over ₹999. Ships within 1–2 business days. Easy returns within 7 days.`,
};



export default function ProductDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, inWishlist } = useContext(WishlistContext);

  const [product, setProduct]   = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tabContent, setTabContent] = useState({ details: '', care: '', shipping: '' });
  const [added, setAdded]       = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty]           = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState(null); // null = default images

  // Per-product custom badges from Firestore
  

  useEffect(() => {
    if (product) setWishlisted(inWishlist(product.id));
  }, [product, inWishlist]);

  useEffect(() => {
    setLoading(true); setAdded(false); setQty(1);
    setActiveTab('details'); setActiveMediaIdx(0); setSelectedVariant(null);

    const fetchProduct = async () => {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          const fbp = { id: snap.id, ...snap.data() };
          setProduct(fbp);
          const sc = getSizeConfig(fbp.category);
          const firstAvail = sc.sizes.find(s => isSizeInStock(fbp, s)) || sc.sizes[0];
          setSelectedSize(firstAvail || '');
          try {
            const relSnap = await getDocs(
              query(collection(db, 'products'), where('category', '==', fbp.category))
            );
            setRelated(
              relSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(p => p.id !== id).slice(0, 4)
            );
          } catch {}
        } else setProduct(null);
      } catch { setProduct(null); }
      finally { setLoading(false); }
    };
    fetchProduct();
  }, [id]);

  // Tab descriptions
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'productDescriptions', String(id)), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setTabContent({ details: d.details || '', care: d.care || '', shipping: d.shipping || '' });
      } else setTabContent({ details: '', care: '', shipping: '' });
    }, () => setTabContent({ details: '', care: '', shipping: '' }));
    return () => unsub();
  }, [id]);



  const getTabText = (tab) =>
    tabContent[tab] || (product
      ? (tab === 'details' ? DEFAULT_CONTENT.details(product.name) : DEFAULT_CONTENT[tab]())
      : '');

  if (loading) return <div className="pdp-loading"><div className="pdp-spinner" /></div>;
  if (!product) return (
    <div className="pdp-not-found">
      <h2>Product not found</h2>
      <button onClick={() => navigate('/shop')}>← Back to Shop</button>
    </div>
  );

  // Images: if a variant is selected, show variant images; else show product images
  const defaultImages = product.images?.length ? product.images : [product.image].filter(Boolean);
  const displayImages = selectedVariant?.images?.length ? selectedVariant.images : defaultImages;

  const hasVideo    = Boolean(product.video);
  const effectivePrice = getEffectivePrice(product);
  const discountPct    = getDiscountPercent(product);
  const isOnSale       = discountPct > 0;
  const activeIsVideo  = hasVideo && activeMediaIdx === displayImages.length;
  const sizeConfig     = getSizeConfig(product.category);
  const selectedStock  = getStockForSelection(product, selectedSize);
  const stockMessage   = getStockMessage(selectedStock);

  const handleAdd = () => {
    const stock = getStockForSelection(product, selectedSize);

    if (stock <= 0) {
      alert('This item is currently out of stock.');
      return;
    }

    if (qty > stock) {
      alert(`Only ${stock} item${stock === 1 ? '' : 's'} available in stock.`);
      setQty(stock);
      return;
    }

    addToCart(
      {
        ...product,
        selectedSize,
        selectedVariant: selectedVariant?.name || '',
        stock,
      },
      qty
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const subCats = product.subCategories?.length > 0
    ? product.subCategories
    : product.subCategory
      ? product.subCategory.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  const variants = product.variants || [];

  return (
    <div className="pdp-wrapper">
      <div className="pdp-breadcrumb">
        <button onClick={() => navigate('/')}>Home</button><span>›</span>
        <button onClick={() => navigate('/shop')}>Shop</button><span>›</span>
        <button onClick={() => navigate(`/shop?cat=${product.category}`)}>{product.category}</button><span>›</span>
        <span className="pdp-bc-current">{product.name}</span>
      </div>

      <div className="pdp-grid">
        {/* ── LEFT: Images ── */}
        <div className="pdp-image-section">
          <div className="pdp-image-main">
            {isOnSale && <div className="pdp-sale-badge">-{discountPct}% OFF</div>}
            <div className="pdp-image-badge">{product.category}</div>
            {activeIsVideo ? (
              <video src={product.video} controls autoPlay muted loop playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <img src={displayImages[activeMediaIdx] || displayImages[0]} alt={product.name} />
            )}
          </div>

          {/* Thumbnails */}
          <div className="pdp-thumbs">
            {displayImages.map((src, i) => (
              <div key={i}
                className={`pdp-thumb ${activeMediaIdx === i && !activeIsVideo ? 'active' : ''}`}
                onClick={() => setActiveMediaIdx(i)}>
                <img src={src} alt="" />
              </div>
            ))}
            {hasVideo && (
              <div className={`pdp-thumb pdp-thumb-video ${activeIsVideo ? 'active' : ''}`}
                onClick={() => setActiveMediaIdx(displayImages.length)}>
                <span className="pdp-thumb-play">▶</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Info ── */}
        <div className="pdp-info">
          <div className="pdp-eyebrow">
            <span className="pdp-cat">{(product.category || '').toUpperCase()}</span>
            {subCats.length > 0 && (
              <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {subCats.map(sub => (
                  <span key={sub} style={{
                    fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#888',
                    background: '#f0ece6', padding: '2px 8px', borderRadius: 100,
                  }}>{sub}</span>
                ))}
              </span>
            )}
            <div className="pdp-stars">★★★★★ <span>(124 reviews)</span></div>
          </div>

          <h1 className="pdp-name">{product.name}</h1>

          <div className="pdp-price-row">
            <p className="pdp-price">{formatINR(effectivePrice)}</p>
            {isOnSale && (
              <>
                <p className="pdp-original-price">{formatINR(product.price)}</p>
                <span className="pdp-sale-tag">-{discountPct}% OFF</span>
              </>
            )}
          </div>
          <p className="pdp-price-note">
            or 4 interest-free payments of {formatINR(Math.round(effectivePrice / 4))}
          </p>

          {stockMessage && (
            <p className={`pdp-stock-left ${selectedStock <= 5 ? 'low' : ''}`}>
              {stockMessage}
            </p>
          )}

          {/* ── VARIANTS ── */}
          {variants.length > 0 && (
            <div className="pdp-option-group">
              <p className="pdp-option-label">
                Variant: <strong>{selectedVariant?.name || 'Default'}</strong>
              </p>
              <div className="pdp-variant-swatches">
                {/* Default (original product images) */}
                <button
                  className={`pdp-variant-swatch ${!selectedVariant ? 'active' : ''}`}
                  onClick={() => { setSelectedVariant(null); setActiveMediaIdx(0); }}
                  title="Default"
                >
                  {defaultImages[0] ? (
                    <img src={defaultImages[0]} alt="Default" />
                  ) : (
                    <span style={{ fontSize: 10 }}>Default</span>
                  )}
                </button>

                {/* Each variant */}
                {variants.map((v, i) => (
                  <button
                    key={i}
                    className={`pdp-variant-swatch ${selectedVariant?.name === v.name ? 'active' : ''}`}
                    onClick={() => { setSelectedVariant(v); setActiveMediaIdx(0); }}
                    title={v.name}
                    style={v.color ? { outline: `2px solid ${v.color}` } : {}}
                  >
                    {v.images?.[0] ? (
                      <img src={v.images[0]} alt={v.name} />
                    ) : v.color ? (
                      <span className="pdp-variant-color-dot" style={{ background: v.color }} />
                    ) : (
                      <span style={{ fontSize: 9, padding: '2px 4px' }}>{v.name}</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: '#888', marginTop: 6 }}>
                  Viewing: <strong style={{ color: '#1a1a1a' }}>{selectedVariant.name}</strong>
                  {' '}— <button
                    onClick={() => { setSelectedVariant(null); setActiveMediaIdx(0); }}
                    style={{ background: 'none', border: 'none', color: '#e05c7a', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontSize: 11, padding: 0 }}>
                    Reset
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ── SIZES ── */}
          {product.hasSize !== false ? (
            <div className="pdp-option-group">
              <p className="pdp-option-label">
                {sizeConfig.label}: <strong>{selectedSize}</strong>
                {!isSizeInStock(product, selectedSize) && (
                  <span style={{ color: '#e74c3c', fontSize: 11, marginLeft: 8 }}>· Out of stock</span>
                )}
              </p>
              <div className="pdp-options">
                {[...sizeConfig.sizes, ...(product.customSizes || [])].map(s => {
                  const inStock = isSizeInStock(product, s);
                  return (
                    <button key={s}
                      className={`pdp-size-btn-dynamic ${selectedSize === s ? 'active' : ''} ${!inStock ? 'out-of-stock' : ''}`}
                      onClick={() => setSelectedSize(s)}
                      title={!inStock ? 'Out of stock' : ''}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {sizeConfig.unit && (
                <p style={{ fontSize: 10, color: '#aaa', marginTop: 6, fontFamily: 'Jost, sans-serif' }}>
                  Sizes shown in {sizeConfig.unit}
                </p>
              )}
            </div>
          ) : (
            product.sizeNote && (
              <div className="pdp-option-group">
                <p className="pdp-option-label">{product.sizeNote}</p>
              </div>
            )
          )}

          {/* ── ADD TO CART ── */}
          <div className="pdp-cart-row">
            <div className="pdp-qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => Math.min(selectedStock, q + 1))}>+</button>
            </div>
            <button
              className={`pdp-add-btn ${added ? 'added' : ''}`}
              onClick={handleAdd}
              disabled={selectedStock <= 0}
              style={{ opacity: selectedStock <= 0 ? 0.5 : 1 }}>
              {added ? '✓ Added to Bag'
                : selectedStock <= 0 ? 'OUT OF STOCK'
                : 'ADD TO BAG'}
            </button>
          </div>

          <button className={`pdp-wishlist-btn ${wishlisted ? 'wishlisted' : ''}`}
            onClick={() => { toggleWishlist(product); setWishlisted(w => !w); }}>
            <Heart size={15} fill={wishlisted ? '#e05c7a' : 'none'} color={wishlisted ? '#e05c7a' : 'currentColor'} />
            {wishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
          </button>

          {/* ── TABS ── */}
          <div className="pdp-tabs">
            {['details', 'care', 'shipping'].map(tab => (
              <button key={tab}
                className={`pdp-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="pdp-tab-content"><p>{getTabText(activeTab)}</p></div>

          {/* BADGES */}
            {/* BADGES */}
          <TrustBadges productId={product.id} />

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
            {related.map(p => {
              const ep = getEffectivePrice(p);
              const dp = getDiscountPercent(p);
              return (
                <div key={p.id} className="pdp-related-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="pdp-related-img">
                    {dp > 0 && <span className="pdp-related-sale">-{dp}%</span>}
                    <img src={p.image} alt={p.name} />
                  </div>
                  <p className="pdp-related-name">{p.name}</p>
                  <div className="pdp-related-price-row">
                    <span className="pdp-related-price">{formatINR(ep)}</span>
                    {dp > 0 && <span className="pdp-related-orig">{formatINR(p.price)}</span>}
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