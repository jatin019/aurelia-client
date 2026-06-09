// src/pages/CheckoutPage.js
// UPDATED: Full Razorpay integration (UPI, Card, Netbanking) + COD unchanged
//
// Required env var in Netlify (client site):
//   REACT_APP_RAZORPAY_KEY_ID = rzp_live_xxxx  (Key ID only — never the secret)

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { CartContext } from '../App';
import { getEffectivePrice, formatINR } from '../data/products';
import { CheckCircle, Lock, ShieldCheck, Truck, ArrowLeft, AlertCircle } from 'lucide-react';
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

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry',
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, setCart } = useContext(CartContext);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = cart.reduce((s, i) => s + getEffectivePrice(i) * i.qty, 0);
  const shipping  = subtotal >= 500 ? 0 : 99;
  const discount  = appliedCoupon ? Math.round((subtotal * appliedCoupon.percent) / 100) : 0;
  const tax       = Math.round((subtotal - discount) * 0.05);
  const total     = subtotal + shipping + tax - discount;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[+]?[\d\s-]{10,15}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid phone number';
        return '';
      case 'address':
        if (!value.trim()) return 'Street address is required';
        if (value.trim().length < 5) return 'Please enter a complete address';
        return '';
      case 'city':  if (!value.trim()) return 'City is required'; return '';
      case 'state': if (!value.trim()) return 'State is required'; return '';
      case 'zip':
        if (!value.trim()) return 'PIN code is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Enter a valid 6-digit PIN code';
        return '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const fields = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'zip'];
    const newErrors = {};
    let isValid = true;
    fields.forEach(field => {
      const error = validateField(field, form[field]);
      if (error) { newErrors[field] = error; isValid = false; }
    });
    setErrors(newErrors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return isValid;
  };

  // ─── Coupon ────────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const couponRef  = doc(db, 'coupons', code);
      const couponSnap = await getDoc(couponRef);
      if (!couponSnap.exists()) { setCouponError('Invalid coupon code'); setCouponLoading(false); return; }
      const couponData = couponSnap.data();
      if (couponData.active === false) { setCouponError('This coupon has expired'); setCouponLoading(false); return; }
      if (couponData.minOrder && subtotal < couponData.minOrder) {
        setCouponError(`Minimum order of ${formatINR(couponData.minOrder)} required`);
        setCouponLoading(false); return;
      }
      if (couponData.expiresAt) {
        const expiry = couponData.expiresAt.toDate ? couponData.expiresAt.toDate() : new Date(couponData.expiresAt);
        if (new Date() > expiry) { setCouponError('This coupon has expired'); setCouponLoading(false); return; }
      }
      setAppliedCoupon({ code, percent: couponData.discountPercent || couponData.percent || 10, label: couponData.label || `${couponData.discountPercent || couponData.percent || 10}% off` });
      setCouponError('');
    } catch (err) {
      console.error('Coupon lookup error:', err);
      setCouponError('Could not verify coupon. Try again.');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCoupon(''); setCouponError(''); };

  // ─── Build base order data (shared between COD and online) ─────────────────
  const buildOrderData = (extraFields = {}) => ({
    customer: {
      email:     form.email.trim(),
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      phone:     form.phone.trim(),
    },
    shippingAddress: {
      address:   form.address.trim(),
      apartment: form.apartment.trim(),
      city:      form.city.trim(),
      state:     form.state.trim(),
      zip:       form.zip.trim(),
      country:   form.country,
    },
    items: cart.map(i => ({
      id:            i.id,
      name:          i.name,
      price:         getEffectivePrice(i),
      originalPrice: i.price,
      qty:           i.qty,
      image:         i.image,
      category:      i.category || '',
      size:          i.selectedSize || '',
      material:      i.selectedMaterial || '',
    })),
    notes:        form.notes.trim(),
    paymentMethod: form.paymentMethod,
    subtotal,
    shipping,
    tax,
    discount,
    couponCode:   appliedCoupon?.code || '',
    total,
    createdAt:    serverTimestamp(),
    ...extraFields,
  });

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      const firstErr = document.querySelector('.field-error-visible');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);

    try {
      // ── COD: save order directly, no payment gateway ──────────────────────
      if (form.paymentMethod === 'cod') {
        const docRef = await addDoc(collection(db, 'orders'), buildOrderData({ status: 'pending' }));
        setOrderSuccess({ id: docRef.id, total });
        setCart([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setSubmitting(false);
        return;
      }

      // ── Online Payment: create Razorpay order via Netlify Function ─────────
      const res = await fetch('/.netlify/functions/create-razorpay-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:  total,
          receipt: `rcpt_${Date.now()}`,
          notes:   { customer: `${form.firstName} ${form.lastName}`, phone: form.phone },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not initiate payment. Try again.');
      }

      const rzpOrder = await res.json();

      // Map payment method to Razorpay method hint
      const methodMap = { upi: 'upi', card: 'card', netbanking: 'netbanking' };

      const options = {
        key:         process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount:      rzpOrder.amount,
        currency:    rzpOrder.currency,
        order_id:    rzpOrder.id,
        name:        'Kanyamaa Collections',
        description: 'Fine Jewellery Purchase',
        image:       '/logo192.png', // optional: your logo
        prefill: {
          name:    `${form.firstName} ${form.lastName}`,
          email:   form.email,
          contact: form.phone.replace(/\s/g, ''),
        },
        theme:  { color: '#1a1a1a' },
        method: methodMap[form.paymentMethod] || undefined,

        // ── SUCCESS: payment captured ──────────────────────────────────────
        handler: async (response) => {
          try {
            const docRef = await addDoc(collection(db, 'orders'), buildOrderData({
              status: 'paid',
              payment: {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              },
            }));
            setOrderSuccess({ id: docRef.id, total });
            setCart([]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (err) {
            console.error('Order save failed after payment:', err);
            alert('Payment was successful but we could not save your order. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
          setSubmitting(false);
        },

        // ── DISMISS: user closed the payment popup ─────────────────────────
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}. Please try again.`);
        setSubmitting(false);
      });

      rzp.open();
      // NOTE: Don't call setSubmitting(false) here — it's called inside handler/ondismiss

    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'Could not place order. Please try again.');
      setSubmitting(false);
    }
  };

  // ─── Empty cart ────────────────────────────────────────────────────────────
  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <p>Your bag is empty</p>
          <span>Add some beautiful pieces to checkout</span>
          <button className="place-order-btn" style={{ marginTop: 20 }} onClick={() => navigate('/shop')}>
            SHOP NOW
          </button>
        </div>
      </div>
    );
  }

  // ─── Order success screen ──────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="order-success-backdrop" />
        <div className="order-success-modal">
          <CheckCircle size={52} color="#4caf50" strokeWidth={1.5} />
          <h2>Order Placed!</h2>
          <p>Thank you for shopping with Kanyamaa Collections</p>
          <div className="order-id-display">
            Order ID: <strong>#{orderSuccess.id.slice(0, 10).toUpperCase()}</strong>
          </div>
          <div className="order-id-display">
            Total: <strong>{formatINR(orderSuccess.total)}</strong>
          </div>
          <button className="place-order-btn" onClick={() => navigate('/')}>
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    );
  }

  // ─── Main checkout form ────────────────────────────────────────────────────
  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-sub">Complete your order — secure &amp; encrypted</p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-grid" noValidate>

        {/* ── LEFT COLUMN ── */}
        <div className="checkout-left">

          {/* Back button */}
          <button
            type="button"
            style={{ background: 'none', border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={15} /> Back
          </button>

          {/* Contact */}
          <div className="checkout-section">
            <h3 className="checkout-section-title">Contact Information</h3>
            <div className="checkout-field">
              <label>Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@email.com" className={errors.email && touched.email ? 'field-error-visible' : ''} />
              {errors.email && touched.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="checkout-row">
              <div className="checkout-field">
                <label>First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleBlur} placeholder="First name" className={errors.firstName && touched.firstName ? 'field-error-visible' : ''} />
                {errors.firstName && touched.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>
              <div className="checkout-field">
                <label>Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleBlur} placeholder="Last name" className={errors.lastName && touched.lastName ? 'field-error-visible' : ''} />
                {errors.lastName && touched.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
            </div>
            <div className="checkout-field">
              <label>Phone Number *</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} onBlur={handleBlur} placeholder="+91 98765 43210" className={errors.phone && touched.phone ? 'field-error-visible' : ''} />
              {errors.phone && touched.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          {/* Shipping */}
          <div className="checkout-section">
            <h3 className="checkout-section-title">Shipping Address</h3>
            <div className="checkout-field">
              <label>Street Address *</label>
              <input name="address" value={form.address} onChange={handleChange} onBlur={handleBlur} placeholder="House no., Street name" className={errors.address && touched.address ? 'field-error-visible' : ''} />
              {errors.address && touched.address && <span className="field-error">{errors.address}</span>}
            </div>
            <div className="checkout-field">
              <label>Apartment / Suite (optional)</label>
              <input name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apt, suite, floor" />
            </div>
            <div className="checkout-row">
              <div className="checkout-field">
                <label>City *</label>
                <input name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} placeholder="City" className={errors.city && touched.city ? 'field-error-visible' : ''} />
                {errors.city && touched.city && <span className="field-error">{errors.city}</span>}
              </div>
              <div className="checkout-field">
                <label>PIN Code *</label>
                <input name="zip" value={form.zip} onChange={handleChange} onBlur={handleBlur} placeholder="110001" maxLength={6} className={errors.zip && touched.zip ? 'field-error-visible' : ''} />
                {errors.zip && touched.zip && <span className="field-error">{errors.zip}</span>}
              </div>
            </div>
            <div className="checkout-field">
              <label>State *</label>
              <select name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} className={errors.state && touched.state ? 'field-error-visible' : ''}>
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && touched.state && <span className="field-error">{errors.state}</span>}
            </div>
            <div className="checkout-field">
              <label>Order Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Special instructions..." rows={3} />
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-section">
            <h3 className="checkout-section-title">Payment Method</h3>
            <div className="payment-methods">

              <div className={`payment-option ${form.paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'cod' })}>
                <input type="radio" name="paymentMethod" value="cod" checked={form.paymentMethod === 'cod'} onChange={() => setForm({ ...form, paymentMethod: 'cod' })} />
                <div className="payment-option-text">
                  <p className="payment-option-label">Cash on Delivery</p>
                  <p className="payment-option-sub">Pay when your order arrives</p>
                </div>
              </div>

              <div className={`payment-option ${form.paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'upi' })}>
                <input type="radio" name="paymentMethod" value="upi" checked={form.paymentMethod === 'upi'} onChange={() => setForm({ ...form, paymentMethod: 'upi' })} />
                <div className="payment-option-text">
                  <p className="payment-option-label">UPI / GPay / PhonePe</p>
                  <p className="payment-option-sub">Pay instantly via UPI · Powered by Razorpay</p>
                </div>
              </div>

              <div className={`payment-option ${form.paymentMethod === 'card' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'card' })}>
                <input type="radio" name="paymentMethod" value="card" checked={form.paymentMethod === 'card'} onChange={() => setForm({ ...form, paymentMethod: 'card' })} />
                <div className="payment-option-text">
                  <p className="payment-option-label">Credit / Debit Card</p>
                  <p className="payment-option-sub">Visa, Mastercard, RuPay · Powered by Razorpay</p>
                </div>
              </div>

              <div className={`payment-option ${form.paymentMethod === 'netbanking' ? 'selected' : ''}`} onClick={() => setForm({ ...form, paymentMethod: 'netbanking' })}>
                <input type="radio" name="paymentMethod" value="netbanking" checked={form.paymentMethod === 'netbanking'} onChange={() => setForm({ ...form, paymentMethod: 'netbanking' })} />
                <div className="payment-option-text">
                  <p className="payment-option-label">Net Banking</p>
                  <p className="payment-option-sub">All major banks · Powered by Razorpay</p>
                </div>
              </div>

            </div>

            {form.paymentMethod !== 'cod' && (
              <div className="razorpay-badge">
                <Lock size={12} />
                <span>Payments secured by Razorpay. We never store your card details.</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Order Summary ── */}
        <div className="checkout-right">
          <div className="order-summary">
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-items">
              {cart.map((item, i) => (
                <div key={i} className="summary-item">
                  <div className="summary-item-img">
                    <img src={item.image} alt={item.name} />
                    <span className="summary-item-qty">{item.qty}</span>
                  </div>
                  <div className="summary-item-info">
                    <p className="summary-item-name">{item.name}</p>
                    {(item.selectedMaterial || item.selectedSize) && (
                      <p className="summary-item-variant">
                        {item.selectedMaterial}{item.selectedMaterial && item.selectedSize && ' · '}{item.selectedSize && `Size ${item.selectedSize}`}
                      </p>
                    )}
                  </div>
                  <p className="summary-item-price">{formatINR(getEffectivePrice(item) * item.qty)}</p>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="coupon-row">
              {appliedCoupon ? (
                <div className="coupon-applied">
                  <span>🎉 {appliedCoupon.code} — {appliedCoupon.label}</span>
                  <button type="button" className="coupon-remove" onClick={removeCoupon}>Remove</button>
                </div>
              ) : (
                <div className="coupon-input-row">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                  />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="coupon-error"><AlertCircle size={12} /> {couponError}</p>
              )}
            </div>

            <div className="summary-totals">
              <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              {discount > 0 && <div className="summary-row discount"><span>Discount ({appliedCoupon?.code})</span><span>−{formatINR(discount)}</span></div>}
              <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatINR(shipping)}</span></div>
              <div className="summary-row"><span>GST (5%)</span><span>{formatINR(tax)}</span></div>
              <div className="summary-row total"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>

            {shipping > 0 && (
              <p className="free-shipping-note">
                <Truck size={13} /> Add {formatINR(500 - subtotal)} more for free shipping
              </p>
            )}

            <button type="submit" className="place-order-btn" disabled={submitting}>
              {submitting
                ? (form.paymentMethod === 'cod' ? 'Placing Order...' : 'Opening Payment...')
                : form.paymentMethod === 'cod'
                  ? `Place Order · ${formatINR(total)}`
                  : `Pay Now · ${formatINR(total)}`
              }
            </button>

            <div className="checkout-trust">
              <span><Lock size={12} /> SSL Encrypted</span>
              <span><ShieldCheck size={12} /> Secure Checkout</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}