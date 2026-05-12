import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CartContext } from '../App';
import { getEffectivePrice, formatINR } from '../data/products';
import { CheckCircle, Lock, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';

import './CheckoutPage.css';

const EMPTY_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  apartment: '',
  city: '',
  state: '',
  zip: '',
  country: 'India',
  notes: '',
  paymentMethod: 'cod',
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, setCart } = useContext(CartContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = cart.reduce((s, i) => s + getEffectivePrice(i) * i.qty, 0);

  // FREE shipping above ₹50,000 otherwise ₹200 shipping
  const shipping = subtotal >= 50000 ? 0 : 200;

  const discount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;

  const tax = Math.round((subtotal - discount) * 0.05);

  const total = subtotal + shipping + tax - discount;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validate = () => {
    const e = {};

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Valid email required';

    if (!form.firstName.trim())
      e.firstName = 'First name required';

    if (!form.lastName.trim())
      e.lastName = 'Last name required';

    if (!form.phone.trim() || form.phone.length < 7)
      e.phone = 'Valid phone required';

    if (!form.address.trim())
      e.address = 'Address required';

    if (!form.city.trim())
      e.city = 'City required';

    if (!form.state.trim())
      e.state = 'State required';

    if (!form.zip.trim())
      e.zip = 'ZIP required';

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === 'WELCOME10') {
      setAppliedCoupon({
        code: 'WELCOME10',
        percent: 10,
      });
    } else if (coupon.trim().toUpperCase() === 'KANYAMAA20') {
      setAppliedCoupon({
        code: 'KANYAMAA20',
        percent: 20,
      });
    } else {
      alert('Invalid coupon code. Try WELCOME10 or KANYAMAA20');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customer: {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        },

        shippingAddress: {
          address: form.address,
          apartment: form.apartment,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },

        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: getEffectivePrice(i),
          originalPrice: i.price,
          qty: i.qty,
          image: i.image,
          category: i.category || '',
          size: i.selectedSize || '',
          material: i.selectedMaterial || '',
        })),

        notes: form.notes,
        paymentMethod: form.paymentMethod,

        subtotal,
        shipping,
        tax,
        discount,

        couponCode: appliedCoupon?.code || '',

        total,
        status: 'pending',

        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      setOrderSuccess({
        id: docRef.id,
        total,
      });

      setCart([]);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

    } catch (err) {
      console.error(err);
      alert('Could not place order. Please try again.');
    }

    setSubmitting(false);
  };

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <p>Your bag is empty</p>
          <span>Add some beautiful pieces to checkout</span>

          <button onClick={() => navigate('/shop')}>
            Browse Collection
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="order-success-backdrop" />

        <div className="order-success-modal">
          <div className="success-icon">
            <CheckCircle size={36} />
          </div>

          <h2>Order Placed!</h2>

          <p>
            Thank you for your purchase.
            We've sent a confirmation to your email.
          </p>

          <div className="order-id-display">
            Order ID:
            <strong>
              #{orderSuccess.id.slice(0, 10).toUpperCase()}
            </strong>
          </div>

          <p style={{ marginBottom: 24 }}>
            Total:
            <strong>{formatINR(orderSuccess.total)}</strong>
          </p>

          <button
            className="place-order-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-sub">
          Complete your order — secure & encrypted
        </p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-grid">

        {/* LEFT SIDE */}
        <div>

          <button
            type="button"
            onClick={() => navigate('/shop')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Jost, sans-serif',
              fontSize: 12,
              color: '#777',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={13} />
            Continue Shopping
          </button>

          {/* CONTACT */}
          <div className="checkout-section">

            <h3>
              <span className="step-num">1</span>
              Contact Information
            </h3>

            <div className="form-row single">
              <div className="checkout-field">
                <label>Email Address</label>

                <input
                  type="email"
                  value={form.email}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="you@example.com"
                />

                {errors.email && (
                  <span className="field-error">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* SHIPPING */}
          <div className="checkout-section">

            <h3>
              <span className="step-num">2</span>
              Shipping Address
            </h3>

          </div>

          {/* PAYMENT */}
          <div className="checkout-section">

            <h3>
              <span className="step-num">3</span>
              Payment Method
            </h3>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="order-summary">

          <h3>Order Summary</h3>

          <div className="summary-items">

            {cart.map(item => (

              <div
                className="summary-item"
                key={item.id + (item.selectedSize || '')}
              >

                <div className="summary-item-img">
                  <img src={item.image} alt={item.name} />

                  <span className="summary-qty-badge">
                    {item.qty}
                  </span>
                </div>

                <div className="summary-item-info">

                  <p className="summary-item-name">
                    {item.name}
                  </p>

                  <p className="summary-item-price">
                    {formatINR(
                      getEffectivePrice(item) * item.qty
                    )}
                  </p>

                </div>

              </div>

            ))}

          </div>

          {/* COUPON */}
          <div className="coupon-row">

            <input
              placeholder="Promo code"
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
            />

            <button
              type="button"
              onClick={handleApplyCoupon}
            >
              Apply
            </button>

          </div>

          {appliedCoupon && (
            <p
              style={{
                fontSize: 11,
                color: '#2d6a4f',
                fontFamily: 'Jost, sans-serif',
                marginBottom: 10,
              }}
            >
              ✓ Coupon "{appliedCoupon.code}" applied —
              {appliedCoupon.percent}% off
            </p>
          )}

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div
              className="summary-row"
              style={{ color: '#2d6a4f' }}
            >
              <span>Discount</span>
              <span>−{formatINR(discount)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>
              {shipping === 0
                ? 'FREE'
                : formatINR(shipping)}
            </span>
          </div>

          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>{formatINR(tax)}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <button
            type="submit"
            className="place-order-btn"
            disabled={submitting}
          >
            <Lock size={14} />

            {submitting
              ? 'Placing Order...'
              : `Place Order · ${formatINR(total)}`}
          </button>

          <div className="checkout-trust">

            <div className="trust-item">
              <ShieldCheck size={16} color="#1a1a1a" />
              <span>Secure</span>
            </div>

            <div className="trust-item">
              <Truck size={16} color="#1a1a1a" />
              <span>Free Ship ₹50,000+</span>
            </div>

            <div className="trust-item">
              <CheckCircle size={16} color="#1a1a1a" />
              <span>30-day Return</span>
            </div>

          </div>

        </div>

      </form>
    </div>
  );
}