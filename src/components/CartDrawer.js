import React, { useContext } from 'react';
import { CartContext } from '../App';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQty, cartOpen, setCartOpen } = useContext(CartContext);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

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
            <div className="cart-item" key={item.id}>
              <div className="cart-item-img">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">${item.price.toLocaleString()}</p>
                {/* Qty controls */}
                <div className="cart-item-qty-row">
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                </div>
              </div>
              <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <button className="checkout-btn">PROCEED TO CHECKOUT</button>
            <button className="continue-btn" onClick={() => setCartOpen(false)}>Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  );
}