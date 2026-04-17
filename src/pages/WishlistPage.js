import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../App';
import { CartContext } from '../App';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { getEffectivePrice, getDiscountPercent } from '../data/products';
import './WishlistPage.css';

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  return (
    <div className="page-wrapper wishlist-page">
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
            const discountPct    = getDiscountPercent(product);
            const isOnSale       = discountPct > 0;
            return (
              <div className="wishlist-card" key={product.id}>
                {/* Image */}
                <div className="wc-img" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  {isOnSale && <span className="wc-sale-badge">-{discountPct}% OFF</span>}
                  {product.badge && <span className="wc-badge">{product.badge}</span>}
                </div>

                {/* Info */}
                <div className="wc-info">
                  <p className="wc-cat">{product.category}</p>
                  <p className="wc-name" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</p>
                  <div className="wc-price-row">
                    <span className={`wc-price ${isOnSale ? 'sale' : ''}`}>${effectivePrice.toLocaleString()}</span>
                    {isOnSale && <span className="wc-orig">${product.price.toLocaleString()}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="wc-actions">
                  <button className="wc-add-btn" onClick={() => { addToCart(product); }}>
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