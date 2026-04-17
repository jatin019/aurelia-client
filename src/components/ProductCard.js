import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../App';
import { getEffectivePrice, getDiscountPercent } from '../data/products';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const effectivePrice = getEffectivePrice(product);
  const discountPct    = getDiscountPercent(product);
  const isOnSale       = discountPct > 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="product-img-wrap">
        {product.badge && <span className="pc-badge">{product.badge}</span>}
        {isOnSale && <span className="pc-sale-badge">-{discountPct}%</span>}
        <img src={product.image} alt={product.name} loading="lazy" />
        <button className={`add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
          {added ? '✓ Added' : '+ Add to Bag'}
        </button>
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <div className="product-bottom">
          <div className="product-price-row">
            <span className={`product-price ${isOnSale ? 'on-sale' : ''}`}>${effectivePrice.toLocaleString()}</span>
            {isOnSale && <span className="product-orig-price">${product.price.toLocaleString()}</span>}
          </div>
          {product.rating && <span className="product-rating">★ {product.rating}</span>}
        </div>
      </div>
    </div>
  );
}