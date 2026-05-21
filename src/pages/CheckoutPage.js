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
  const shipping = subtotal >= 50000 ? 0 : 200;
  const discount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal + shipping + tax - discount;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Real-time validation on field change
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
      case 'city':
        if (!value.trim()) return 'City is required';
        return '';
      case 'state':
        if (!value.trim()) return 'State is required';
        return '';
      case 'zip':
        if (!value.trim()) return 'PIN code is required';
        if (!/^\d{6}$/.test(value.trim())) return 'Enter a valid 6-digit PIN code';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const fields = ['email', 'firstName', 'lastName', 'phone', 'address', 'city', 'state', 'zip'];
    const newErrors = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    return isValid;
  };

  // Secure coupon validation via Firebase
  const handleApplyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      // Look up coupon in Firebase 'coupons' collection
      const couponRef = doc(db, 'coupons', code);
      const couponSnap = await getDoc(couponRef);

      if (!couponSnap.exists()) {
        setCouponError('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      const couponData = couponSnap.data();

      // Check if coupon is active
      if (couponData.active === false) {
        setCouponError('This coupon has expired');
        setCouponLoading(false);
        return;
      }

      // Check minimum order amount
      if (couponData.minOrder && subtotal < couponData.minOrder) {
        setCouponError(`Minimum order of ${formatINR(couponData.minOrder)} required`);
        setCouponLoading(false);
        return;
      }

      // Check expiry date
      if (couponData.expiresAt) {
        const expiry = couponData.expiresAt.toDate ? couponData.expiresAt.toDate() : new Date(couponData.expiresAt);
        if (new Date() > expiry) {
          setCouponError('This coupon has expired');
          setCouponLoading(false);
          return;
        }
      }

      // Apply coupon
      setAppliedCoupon({
        code: code,
        percent: couponData.discountPercent || couponData.percent || 10,
        label: couponData.label || `${couponData.discountPercent || couponData.percent || 10}% off`,
      });
      setCouponError('');
    } catch (err) {
      console.error('Coupon lookup error:', err);
      setCouponError('Could not verify coupon. Try again.');
    }

    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCoupon('');
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error-visible');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        customer: {
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress: {
          address: form.address.trim(),
          apartment: form.apartment.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
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
        notes: form.notes.trim(),
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

      setOrderSuccess({ id: docRef.id, total });
      setCart([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      alert('Could not place order. Please try again.');
    }

    setSubmitting(false);
  };

  // Empty cart state
  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="checkout-empty">
          <p>Your bag is empty</p>
          <span>Add some beautiful pieces to checkout</span>
          <button onClick={() => navigate('/shop')}>Browse Collection</button>
        </div>
      </div>
    );
  }

  // Success state
  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="order-success-backdrop" />
        <div className="order-success-modal">
          <div className="success-icon">
            <CheckCircle size={36} />
          </div>
          <h2>Order Placed!</h2>
          <p>Thank you for your purchase. We've sent a confirmation to your email.</p>
          <div className="order-id-display">
            Order ID: <strong>#{orderSuccess.id.slice(0, 10).toUpperCase()}</strong>
          </div>
          <p style={{ marginBottom: 24 }}>
            Total: <strong>{formatINR(orderSuccess.total)}</strong>
          </p>
          <button className="place-order-btn" onClick={() => navigate('/')}>
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
        <p className="checkout-sub">Complete your order — secure & encrypted</p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-grid" noValidate>
        {/* LEFT SIDE */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            style={{
              background: 'none', border: 'none', fontFamily: 'Jost, sans-serif',
              fontSize: 12, color: '#777', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
            }}
          >
            <ArrowLeft size={13} /> Continue Shopping
          </button>

          {/* CONTACT INFORMATION */}
          <div className="checkout-section">
            <h3><span className="step-num">1</span> Contact Information</h3>

            <div className="form-row single">
              <div className="checkout-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  className={errors.email && touched.email ? 'input-error' : ''}
                />
                {errors.email && touched.email && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="checkout-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                  className={errors.phone && touched.phone ? 'input-error' : ''}
                />
                {errors.phone && touched.phone && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className="checkout-section">
            <h3><span className="step-num">2</span> Shipping Address</h3>

            <div className="form-row">
              <div className="checkout-field">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="John"
                  className={errors.firstName && touched.firstName ? 'input-error' : ''}
                />
                {errors.firstName && touched.firstName && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.firstName}
                  </span>
                )}
              </div>
              <div className="checkout-field">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Doe"
                  className={errors.lastName && touched.lastName ? 'input-error' : ''}
                />
                {errors.lastName && touched.lastName && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row single">
              <div className="checkout-field">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="123, Main Street"
                  className={errors.address && touched.address ? 'input-error' : ''}
                />
                {errors.address && touched.address && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.address}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row single">
              <div className="checkout-field">
                <label>Apartment, Suite, Floor (optional)</label>
                <input
                  type="text"
                  name="apartment"
                  value={form.apartment}
                  onChange={handleChange}
                  placeholder="Apt 4B, Floor 2"
                />
              </div>
            </div>

            <div className="form-row triple">
              <div className="checkout-field">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Mumbai"
                  className={errors.city && touched.city ? 'input-error' : ''}
                />
                {errors.city && touched.city && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.city}
                  </span>
                )}
              </div>
              <div className="checkout-field">
                <label>State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.state && touched.state ? 'input-error' : ''}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && touched.state && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.state}
                  </span>
                )}
              </div>
              <div className="checkout-field">
                <label>PIN Code</label>
                <input
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="400001"
                  maxLength={6}
                  className={errors.zip && touched.zip ? 'input-error' : ''}
                />
                {errors.zip && touched.zip && (
                  <span className="field-error field-error-visible">
                    <AlertCircle size={12} /> {errors.zip}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row single">
              <div className="checkout-field">
                <label>Order Notes (optional)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Special delivery instructions, gift message..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="checkout-section">
            <h3><span className="step-num">3</span> Payment Method</h3>

            <div className="payment-methods">
              <label
                className={`payment-option ${form.paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, paymentMethod: 'cod' })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={form.paymentMethod === 'cod'}
                  onChange={() => setForm({ ...form, paymentMethod: 'cod' })}
                />
                <div>
                  <p className="payment-option-label">Cash on Delivery</p>
                  <p className="payment-option-sub">Pay when your order arrives</p>
                </div>
              </label>

              <label
                className={`payment-option ${form.paymentMethod === 'upi' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, paymentMethod: 'upi' })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={form.paymentMethod === 'upi'}
                  onChange={() => setForm({ ...form, paymentMethod: 'upi' })}
                />
                <div>
                  <p className="payment-option-label">UPI / GPay / PhonePe</p>
                  <p className="payment-option-sub">Pay instantly via UPI</p>
                </div>
              </label>

              <label
                className={`payment-option ${form.paymentMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, paymentMethod: 'card' })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={form.paymentMethod === 'card'}
                  onChange={() => setForm({ ...form, paymentMethod: 'card' })}
                />
                <div>
                  <p className="payment-option-label">Credit / Debit Card</p>
                  <p className="payment-option-sub">Visa, Mastercard, RuPay</p>
                </div>
              </label>

              <label
                className={`payment-option ${form.paymentMethod === 'netbanking' ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, paymentMethod: 'netbanking' })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={form.paymentMethod === 'netbanking'}
                  onChange={() => setForm({ ...form, paymentMethod: 'netbanking' })}
                />
                <div>
                  <p className="payment-option-label">Net Banking</p>
                  <p className="payment-option-sub">All major banks supported</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — ORDER SUMMARY */}
        <div className="order-summary">
          <h3>Order Summary</h3>

          <div className="summary-items">
            {cart.map(item => (
              <div className="summary-item" key={item.id + (item.selectedSize || '')}>
                <div className="summary-item-img">
                  <img src={item.image} alt={item.name} />
                  <span className="summary-qty-badge">{item.qty}</span>
                </div>
                <div className="summary-item-info">
                  <p className="summary-item-name">{item.name}</p>
                  {(item.selectedSize || item.selectedMaterial) && (
                    <p className="summary-item-meta">
                      {item.selectedMaterial && item.selectedMaterial}
                      {item.selectedMaterial && item.selectedSize && ' · '}
                      {item.selectedSize && `Size: ${item.selectedSize}`}
                    </p>
                  )}
                  <p className="summary-item-price">{formatINR(getEffectivePrice(item) * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* COUPON — Secure via Firebase lookup */}
          {!appliedCoupon ? (
            <div className="coupon-section">
              <div className="coupon-row">
                <input
                  placeholder="Promo code"
                  value={coupon}
                  onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="coupon-error">
                  <AlertCircle size={12} /> {couponError}
                </p>
              )}
            </div>
          ) : (
            <div className="coupon-applied">
              <div className="coupon-applied-info">
                <span className="coupon-applied-badge">✓ {appliedCoupon.code}</span>
                <span className="coupon-applied-text">{appliedCoupon.percent}% off applied</span>
              </div>
              <button type="button" className="coupon-remove-btn" onClick={removeCoupon}>Remove</button>
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="summary-row" style={{ color: '#2d6a4f' }}>
              <span>Discount ({appliedCoupon?.percent}%)</span>
              <span>−{formatINR(discount)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span style={{ color: '#2d6a4f' }}>FREE</span> : formatINR(shipping)}</span>
          </div>

          <div className="summary-row">
            <span>Tax (5%)</span>
            <span>{formatINR(tax)}</span>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <button type="submit" className="place-order-btn" disabled={submitting}>
            <Lock size={14} />
            {submitting ? 'Placing Order...' : `Place Order · ${formatINR(total)}`}
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