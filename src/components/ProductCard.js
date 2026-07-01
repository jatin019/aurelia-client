import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEffectivePrice, getDiscountPercent, formatINR } from '../data/products';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const effectivePrice = getEffectivePrice(product);
  const discountPct = getDiscountPercent(product);
  const isOnSale = discountPct > 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
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
          {added ? 'Added' : '+ Add to Bag'}
        </button>
      </div>
      <div className="product-info">
        <div className="product-title-row">
          <p className="product-name">{product.name}</p>
          <div className="product-price-row">
            <span className={`product-price ${isOnSale ? 'on-sale' : ''}`}>{formatINR(effectivePrice)}</span>
            {isOnSale && <span className="product-orig-price">{formatINR(product.price)}</span>}
          </div>
        </div>
        <div className="product-bottom">
          {product.rating && <span className="product-rating">★ {product.rating}</span>}
        </div>
      </div>
    </div>
  );
}
