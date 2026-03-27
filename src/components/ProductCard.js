import React, { useContext, useState } from 'react';
import { CartContext } from '../App';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        <button className={`add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
          {added ? '✓ Added' : '+ Add to Cart'}
        </button>
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <p className="product-price">${product.price.toLocaleString()}</p>
      </div>
    </div>
  );
}