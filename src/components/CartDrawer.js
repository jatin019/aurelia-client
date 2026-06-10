// CartDrawer.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../App';
import { getEffectivePrice, formatINR } from '../data/products';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQty, cartOpen, setCartOpen } = useContext(CartContext);
  const navigate = useNavigate();
  const total = cart.reduce((s, i) => s + getEffectivePrice(i) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      <div className={`cart-backdrop ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} />
      <div className={`cart-drawer ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3 className="cart-title">Your Bag <span>({count})</span></h3>
          <button className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
        </div>

        <div className="cart-items">
          {cart.length === 0 && (
            <div className="cart-empty">
              <p>Your bag is empty.</p>
              <span>Add some beautiful pieces ✨</span>
            </div>
          )}
          {cart.map(item => (
            <div className="cart-item" key={`${item.id}-${item.selectedSize || ''}`}>
              <div className="cart-item-img">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                {item.selectedSize && (
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 10, color: '#999', marginBottom: 4 }}>
                    Size: {item.selectedSize}
                  </p>
                )}
                <p className="cart-item-price">{formatINR(getEffectivePrice(item))}</p>
                <div className="cart-item-qty-row">
                  {/* FIX: pass full item object */}
                  <button className="qty-btn" onClick={() => updateQty(item, item.qty - 1)}>−</button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item, item.qty + 1)}>+</button>
                </div>
              </div>
              {/* FIX: pass full item object */}
              <button className="cart-item-remove" onClick={() => removeFromCart(item)}>✕</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>PROCEED TO CHECKOUT</button>
            <button className="continue-btn" onClick={() => setCartOpen(false)}>Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  );
}
