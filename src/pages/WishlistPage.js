import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../App';
import { CartContext } from '../App';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getSizeConfig, isSizeInStock } from '../data/sizeConfig';
import { getEffectivePrice, getDiscountPercent, formatINR } from '../data/products';
import './WishlistPage.css';

function SizePickerModal({ product, onConfirm, onCancel }) {
  const sizeConfig = getSizeConfig(product.category);
  const [selectedSize, setSelectedSize] = React.useState('');

  React.useEffect(() => {
    const first = sizeConfig.sizes.find(s => isSizeInStock(product, s)) || sizeConfig.sizes[0];
    setSelectedSize(first);
  }, [product, sizeConfig]);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
      zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={onCancel}>
      <div style={{
        background:'#fff', borderRadius:16, padding:28, width:'min(360px,100%)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#1a1a1a' }}>Select {sizeConfig.label}</p>
          <button onClick={onCancel} style={{ background:'none', border:'none', fontSize:16, color:'#aaa', cursor:'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize:12, color:'#777', marginBottom:14, fontFamily:'Jost,sans-serif' }}>{product.name}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:22 }}>
          {sizeConfig.sizes.map(s => {
            const inStock = isSizeInStock(product, s);
            return (
              <button key={s} onClick={() => inStock && setSelectedSize(s)} style={{
                padding:'8px 14px', borderRadius:100, fontFamily:'Jost,sans-serif', fontSize:13,
                border: selectedSize===s ? '1.5px solid #1a1a1a' : '1px solid #ddd',
                background: selectedSize===s ? '#1a1a1a' : inStock ? '#fff' : '#f8f8f8',
                color: selectedSize===s ? '#fff' : inStock ? '#333' : '#bbb',
                cursor: inStock ? 'pointer' : 'not-allowed',
                textDecoration: !inStock ? 'line-through' : 'none',
              }}>
                {s}
              </button>
            );
          })}
        </div>
        {sizeConfig.unit && (
          <p style={{ fontSize:10, color:'#aaa', marginBottom:16, fontFamily:'Jost,sans-serif' }}>Sizes in {sizeConfig.unit}</p>
        )}
        <button onClick={() => onConfirm(selectedSize)} style={{
          width:'100%', padding:'13px', background:'#1a1a1a', color:'#fff',
          border:'none', borderRadius:100, fontFamily:'Jost,sans-serif',
          fontSize:12, fontWeight:500, letterSpacing:'0.1em', cursor:'pointer',
        }}>
          ADD TO BAG
        </button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [sizePickerProduct, setSizePickerProduct] = useState(null);

  const handleAddToBag = (product) => {
    setSizePickerProduct(product);
  };

  const handleSizeConfirm = (size) => {
    addToCart({ ...sizePickerProduct, selectedSize: size });
    setSizePickerProduct(null);
  };

  return (
    <div className="page-wrapper wishlist-page">
      {sizePickerProduct && (
        <SizePickerModal
          product={sizePickerProduct}
          onConfirm={handleSizeConfirm}
          onCancel={() => setSizePickerProduct(null)}
        />
      )}

      <div className="wishlist-header">
        <h1 className="wishlist-title">Wishlist</h1>
        <p className="wishlist-sub">
          {wishlist.length === 0 ? 'Your wishlist is empty' : `${wishlist.length} piece${wishlist.length !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="wishlist-empty">
          <Heart size={56} strokeWidth={1} color="#e0ddd8" />
          <p className="we-title">Nothing saved yet</p>
          <p className="we-sub">Heart a product to save it here for later.</p>
          <button className="btn-shop" onClick={() => navigate('/shop')}>Browse the Collection</button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map(product => {
            const effectivePrice = getEffectivePrice(product);
            const discountPct = getDiscountPercent(product);
            const isOnSale = discountPct > 0;
            return (
              <div className="wishlist-card" key={product.id}>
                <div className="wc-img" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {isOnSale && <span className="wc-sale-badge">-{discountPct}% OFF</span>}
                  {product.badge && <span className="wc-badge">{product.badge}</span>}
                </div>
                <div className="wc-info">
                  <p className="wc-cat">{product.category}</p>
                  <p className="wc-name" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</p>
                  <div className="wc-price-row">
                    <span className={`wc-price ${isOnSale ? 'sale' : ''}`}>{formatINR(effectivePrice)}</span>
                    {isOnSale && <span className="wc-orig">{formatINR(product.price)}</span>}
                  </div>
                </div>
                <div className="wc-actions">
                  <button className="wc-add-btn" onClick={() => handleAddToBag(product)}>
                    <ShoppingBag size={14} /> Add to Bag
                  </button>
                  <button className="wc-remove-btn" onClick={() => toggleWishlist(product)} title="Remove from wishlist">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
