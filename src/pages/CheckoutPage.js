// CheckoutPage.js — full updated file
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, serverTimestamp, doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { CartContext } from '../App';
import { getEffectivePrice, formatINR } from '../data/products';
import { CheckCircle, Lock, ShieldCheck, Truck, ArrowLeft, AlertCircle } from 'lucide-react';
import './CheckoutPage.css';

const EMPTY_FORM = {
  email: '', firstName: '', lastName: '', phone: '+91 ',
  address: '', apartment: '', city: '', state: '', zip: '',
  country: 'India', notes: '', paymentMethod: 'upi_qr',
};

const cleanText = (value = '') => value.replace(/\s+/g, ' ').trim();
const cleanName = (value = '') => cleanText(value).replace(/\b\w/g, c => c.toUpperCase());
const normalizeEmail = (value = '') => value.trim().toLowerCase();
const getPhoneDigits = (value = '') => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  return digits.slice(0, 10);
};
const formatIndianPhone = (value = '') => {
  const digits = getPhoneDigits(value);
  return digits.length > 5 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : `+91 ${digits}`;
};

const makeDateKey = (date = new Date()) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
};

const makeSecret = () => {
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2, 14);
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
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
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const SHIPPING_THRESHOLD = 599;   // Free delivery above ₹599
  const SHIPPING_COST = 150;        // ₹150 below threshold
  const subtotal = cart.reduce((s, i) => s + getEffectivePrice(i) * i.qty, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const amountToFreeShip = Math.max(0, SHIPPING_THRESHOLD - subtotal);
  const discount = appliedCoupon ? Math.round((subtotal * appliedCoupon.percent) / 100) : 0;
  const tax = Math.round((subtotal - discount) * 0.03);
  const total = subtotal + shipping + tax - discount;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coupons'), snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.active !== false)
        .filter(c => {
          if (!c.expiresAt) return true;
          const expiry = c.expiresAt.toDate ? c.expiresAt.toDate() : new Date(c.expiresAt);
          return new Date() <= expiry;
        })
        .sort((a, b) => (Number(a.minOrder) || 0) - (Number(b.minOrder) || 0));

      setAvailableCoupons(list);
    }, () => {});

    return () => unsub();
  }, []);

  const validateField = (name, value) => {
    const trimmed = cleanText(value);

    switch (name) {
      case 'email':
        {
          const email = normalizeEmail(value);
          if (!email) return 'Email is required';
          if (email.length > 254) return 'Email is too long';
          if (email.includes('..')) return 'Email cannot contain consecutive dots';
          if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email)) return 'Enter a valid email address';
          const [localPart, domain] = email.split('@');
          if (!localPart || !domain || localPart.length > 64) return 'Enter a valid email address';
          if (domain.split('.').some(part => !part || part.startsWith('-') || part.endsWith('-'))) return 'Enter a valid email address';
          return '';
        }
      case 'firstName':
      case 'lastName':
        {
          const label = name === 'firstName' ? 'First name' : 'Last name';
          if (!trimmed) return `${label} is required`;
          if (trimmed.length < 2) return 'Must be at least 2 characters';
          if (trimmed.length > 40) return 'Must be 40 characters or less';
          if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(trimmed)) return 'Use letters only for the name';
          if (/(.)\1{3,}/.test(trimmed.replace(/\s/g, ''))) return 'Please enter a valid name';
          return '';
        }
      case 'phone':
        {
          const digits = getPhoneDigits(value);
          if (!digits) return 'Phone number is required';
          if (digits.length !== 10) return 'Enter a 10-digit mobile number';
          if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a valid Indian mobile number starting with 6, 7, 8, or 9';
          if (/^(\d)\1{9}$/.test(digits)) return 'Enter a valid mobile number';
          return '';
        }
      case 'address':
        if (!trimmed) return 'Street address is required';
        if (trimmed.length < 8) return 'Please enter a complete address';
        if (trimmed.length > 160) return 'Address must be 160 characters or less';
        if (!/[A-Za-z]/.test(trimmed) || !/\d/.test(trimmed)) return 'Include house/building number and street name';
        if (!/^[A-Za-z0-9\s,./#&()'-]+$/.test(trimmed)) return 'Address contains unsupported characters';
        return '';
      case 'apartment':
        if (trimmed.length > 80) return 'Apartment details must be 80 characters or less';
        if (trimmed && !/^[A-Za-z0-9\s,./#&()'-]+$/.test(trimmed)) return 'Apartment details contain unsupported characters';
        return '';
      case 'city':
        if (!trimmed) return 'City is required';
        if (trimmed.length < 2) return 'Enter a valid city';
        if (trimmed.length > 60) return 'City must be 60 characters or less';
        if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(trimmed)) return 'City should contain letters only';
        return '';
      case 'state':
        if (!trimmed) return 'State is required';
        if (!INDIAN_STATES.includes(trimmed)) return 'Select a valid state';
        return '';
      case 'zip':
        if (!trimmed) return 'PIN code is required';
        if (!/^\d{6}$/.test(trimmed)) return 'Enter a valid 6-digit PIN code';
        if (!/^[1-9]/.test(trimmed)) return 'PIN code cannot start with 0';
        if (/^(\d)\1{5}$/.test(trimmed)) return 'Enter a valid PIN code';
        return '';
      case 'notes':
        if (trimmed.length > 250) return 'Order notes must be 250 characters or less';
        return '';
      default: return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'phone') nextValue = formatIndianPhone(value);
    if (name === 'zip') nextValue = value.replace(/\D/g, '').slice(0, 6);
    if (name === 'email') nextValue = value.replace(/\s/g, '').slice(0, 254);
    if (name === 'firstName' || name === 'lastName' || name === 'city') {
      nextValue = value.replace(/[^A-Za-z\s.'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, name === 'city' ? 60 : 40);
    }
    if (name === 'address') nextValue = value.replace(/[^A-Za-z0-9\s,./#&()'-]/g, '').slice(0, 160);
    if (name === 'apartment') nextValue = value.replace(/[^A-Za-z0-9\s,./#&()'-]/g, '').slice(0, 80);
    if (name === 'notes') nextValue = value.slice(0, 250);

    setForm(prev => ({ ...prev, [name]: nextValue }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, nextValue) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let nextValue = cleanText(value);

    if (name === 'phone') nextValue = formatIndianPhone(value);
    if (name === 'email') nextValue = normalizeEmail(value);
    if (name === 'firstName' || name === 'lastName') nextValue = cleanName(value);
    if (name === 'city') nextValue = cleanName(value);

    setForm(prev => ({ ...prev, [name]: nextValue }));
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, nextValue) }));
  };

  const validateAll = () => {
    const fields = ['email','firstName','lastName','phone','address','apartment','city','state','zip','notes'];
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

  const handleApplyCoupon = async (codeOverride = '') => {
    const code = (codeOverride || coupon).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const couponSnap = await getDoc(doc(db, 'coupons', code));

      if (!couponSnap.exists()) {
        setCouponError('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      const couponData = couponSnap.data();

      if (couponData.active === false) {
        setCouponError('This coupon is not active');
        setCouponLoading(false);
        return;
      }

      if (couponData.minOrder && subtotal < Number(couponData.minOrder)) {
        setCouponError(`Minimum order of ${formatINR(couponData.minOrder)} required`);
        setCouponLoading(false);
        return;
      }

      if (couponData.maxUses && couponData.uses >= couponData.maxUses) {
        setCouponError('This coupon usage limit is over');
        setCouponLoading(false);
        return;
      }

      if (couponData.expiresAt) {
        const expiry = couponData.expiresAt.toDate ? couponData.expiresAt.toDate() : new Date(couponData.expiresAt);
        if (new Date() > expiry) {
          setCouponError('This coupon has expired');
          setCouponLoading(false);
          return;
        }
      }

      const percent = Number(couponData.discountPercent || couponData.percent || 10);

      setAppliedCoupon({
        code,
        percent,
        label: couponData.label || `${percent}% off`,
        minOrder: Number(couponData.minOrder) || 0,
      });

      setCoupon(code);
      setCouponError('');
    } catch {
      setCouponError('Could not verify coupon. Try again.');
    }

    setCouponLoading(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCoupon(''); setCouponError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      const firstErrorField = document.querySelector('.field-error-visible');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const sanitizedForm = {
        email: normalizeEmail(form.email),
        firstName: cleanName(form.firstName),
        lastName: cleanName(form.lastName),
        phone: formatIndianPhone(form.phone),
        address: cleanText(form.address),
        apartment: cleanText(form.apartment),
        city: cleanName(form.city),
        state: form.state,
        zip: form.zip.trim(),
        country: form.country,
        notes: cleanText(form.notes),
      };
      const dateKey = makeDateKey();
      const secret = makeSecret();

      const createdOrder = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'orderCounters', dateKey);
        const counterSnap = await transaction.get(counterRef);
        const nextNumber = (Number(counterSnap.data()?.count) || 0) + 1;
        const orderNumber = `${dateKey}_${nextNumber}`;
        const pendingOrderId = `${orderNumber}_${secret}`;
        const orderRef = doc(db, 'pendingOrders', pendingOrderId);

        const orderData = {
          orderNumber,
          visibleOrderId: `#${orderNumber}`,
          customer: {
            email: sanitizedForm.email, firstName: sanitizedForm.firstName,
            lastName: sanitizedForm.lastName, phone: sanitizedForm.phone,
          },
          shippingAddress: {
            address: sanitizedForm.address, apartment: sanitizedForm.apartment,
            city: sanitizedForm.city, state: sanitizedForm.state,
            zip: sanitizedForm.zip, country: sanitizedForm.country,
          },
          items: cart.map(i => ({
            id: i.id, name: i.name, price: getEffectivePrice(i),
            originalPrice: i.price, qty: i.qty, image: i.image,
            category: i.category || '', size: i.selectedSize || '',
          })),
          notes: sanitizedForm.notes,
          paymentMethod: 'upi_qr',
          paymentStatus: 'awaiting_payment',
          subtotal, shipping, tax, discount,
          couponCode: appliedCoupon?.code || '',
          payableAmount: total,
          total,
          status: 'payment_pending',
          createdAt: serverTimestamp(),
        };

        transaction.set(counterRef, { count: nextNumber, updatedAt: serverTimestamp() }, { merge: true });
        transaction.set(orderRef, orderData);

        return { id: pendingOrderId, orderNumber, total };
      });

      setCart([]);
      navigate(`/payment/${createdOrder.id}`, {
        state: { orderNumber: createdOrder.orderNumber, total: createdOrder.total },
        replace: true,
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
          <button onClick={() => navigate('/shop')}>Browse Collection</button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="order-success-backdrop" />
        <div className="order-success-modal">
          <div className="success-icon"><CheckCircle size={36} /></div>
          <h2>Order Placed!</h2>
          <p>Thank you for your purchase. We've sent a confirmation to your email.</p>
          <div className="order-id-display">
            Order ID: <strong>#{orderSuccess.orderNumber || orderSuccess.id}</strong>
          </div>
          <p style={{ marginBottom: 24 }}>Total: <strong>{formatINR(orderSuccess.total)}</strong></p>
          <button className="place-order-btn" onClick={() => navigate('/')}>Continue Shopping</button>
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
        <div>
          <button type="button" onClick={() => navigate('/shop')}
            style={{ background:'none', border:'none', fontFamily:'Jost, sans-serif', fontSize:12, color:'#777', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:16 }}>
            <ArrowLeft size={13} /> Continue Shopping
          </button>

          <div className="checkout-section">
            <h3><span className="step-num">1</span> Contact Information</h3>
            <div className="form-row single">
              <div className="checkout-field">
                <label>Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                  placeholder="you@example.com" className={errors.email && touched.email ? 'input-error' : ''} />
                {errors.email && touched.email && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.email}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="checkout-field">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                  placeholder="+91 98765 43210" inputMode="numeric" className={errors.phone && touched.phone ? 'input-error' : ''} />
                {errors.phone && touched.phone && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3><span className="step-num">2</span> Shipping Address</h3>
            <div className="form-row">
              <div className="checkout-field">
                <label>First Name</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} onBlur={handleBlur}
                  placeholder="John" className={errors.firstName && touched.firstName ? 'input-error' : ''} />
                {errors.firstName && touched.firstName && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.firstName}</span>}
              </div>
              <div className="checkout-field">
                <label>Last Name</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Doe" className={errors.lastName && touched.lastName ? 'input-error' : ''} />
                {errors.lastName && touched.lastName && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.lastName}</span>}
              </div>
            </div>
            <div className="form-row single">
              <div className="checkout-field">
                <label>Street Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} onBlur={handleBlur}
                  placeholder="123, Main Street" className={errors.address && touched.address ? 'input-error' : ''} />
                {errors.address && touched.address && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.address}</span>}
              </div>
            </div>
            <div className="form-row single">
              <div className="checkout-field">
                <label>Apartment, Suite, Floor (optional)</label>
                <input type="text" name="apartment" value={form.apartment} onChange={handleChange} placeholder="Apt 4B, Floor 2" />
              </div>
            </div>
            <div className="form-row triple">
              <div className="checkout-field">
                <label>City</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Mumbai" className={errors.city && touched.city ? 'input-error' : ''} />
                {errors.city && touched.city && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.city}</span>}
              </div>
              <div className="checkout-field">
                <label>State</label>
                <select name="state" value={form.state} onChange={handleChange} onBlur={handleBlur}
                  className={errors.state && touched.state ? 'input-error' : ''}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && touched.state && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.state}</span>}
              </div>
              <div className="checkout-field">
                <label>PIN Code</label>
                <input type="text" name="zip" value={form.zip} onChange={handleChange} onBlur={handleBlur}
                  placeholder="400001" maxLength={6} className={errors.zip && touched.zip ? 'input-error' : ''} />
                {errors.zip && touched.zip && <span className="field-error field-error-visible"><AlertCircle size={12} /> {errors.zip}</span>}
              </div>
            </div>
            <div className="form-row single">
              <div className="checkout-field">
                <label>Order Notes (optional)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  placeholder="Special delivery instructions, gift message..." rows={3} />
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h3><span className="step-num">3</span> Payment Method</h3>
            <div className="payment-methods">
              {[
                { val:'upi_qr', label:'UPI QR Payment', sub:'Scan the QR after placing your order, then upload UTR and screenshot' },
              ].map(pm => (
                <label key={pm.val} className={`payment-option ${form.paymentMethod === pm.val ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, paymentMethod: pm.val })}>
                  <input type="radio" name="paymentMethod" value={pm.val}
                    checked={form.paymentMethod === pm.val}
                    onChange={() => setForm({ ...form, paymentMethod: pm.val })} />
                  <div>
                    <p className="payment-option-label">{pm.label}</p>
                    <p className="payment-option-sub">{pm.sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.map(item => (
              <div className="summary-item" key={`${item.id}-${item.selectedSize || ''}`}>
                <div className="summary-item-img">
                  <img src={item.image} alt={item.name} />
                  <span className="summary-qty-badge">{item.qty}</span>
                </div>
                <div className="summary-item-info">
                  <p className="summary-item-name">{item.name}</p>
                  {item.selectedSize && (
                    <p className="summary-item-meta">Size: {item.selectedSize}</p>
                  )}
                  <p className="summary-item-price">{formatINR(getEffectivePrice(item) * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>

        {/* Free Shipping Progress */}

{amountToFreeShip > 0 && (
  <div className="free-ship-nudge">
    <div className="fsn-bar-bg">
      <div
        className="fsn-bar-fill"
        style={{
          width: `${Math.min(
            100,
            (subtotal / SHIPPING_THRESHOLD) * 100
          )}%`
        }}
      />
    </div>

    <p className="fsn-text">
      Add <strong>{formatINR(amountToFreeShip)}</strong> more for{' '}
      <span className="fsn-free">FREE delivery</span> 🚚
    </p>
  </div>
)}

{subtotal >= SHIPPING_THRESHOLD && (
  <div className="free-ship-achieved">
    🎉 You've unlocked <strong>FREE delivery!</strong>
  </div>
)}

          {!appliedCoupon ? (
            <div className="coupon-section">
              <div className="coupon-row">
                <input placeholder="Promo code" value={coupon}
                  onChange={e => { setCoupon(e.target.value); setCouponError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())} />
                <button type="button" onClick={() => handleApplyCoupon()} disabled={couponLoading}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="coupon-error"><AlertCircle size={12} /> {couponError}</p>}

              {availableCoupons.length > 0 && (
                <div className="available-coupons">
                  <p className="available-coupons-title">Available coupons</p>

                  {availableCoupons.map(c => {
                    const code = c.code || c.id;
                    const minOrder = Number(c.minOrder) || 0;
                    const canUse = subtotal >= minOrder;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`available-coupon ${canUse ? '' : 'locked'}`}
                        onClick={() => canUse && handleApplyCoupon(code)}
                        disabled={!canUse || couponLoading}
                      >
                        <span>
                          <strong>{code}</strong>
                          <small>{c.label || `${c.discountPercent}% off`}</small>
                        </span>
                        <em>
                          {canUse ? 'Apply' : `Shop ${formatINR(minOrder - subtotal)} more`}
                        </em>
                      </button>
                    );
                  })}
                </div>
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
          <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {discount > 0 && (
            <div className="summary-row" style={{ color: '#2d6a4f' }}>
              <span>Discount ({appliedCoupon?.percent}%)</span><span>−{formatINR(discount)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span style={{ color: '#2d6a4f' }}>FREE</span> : formatINR(shipping)}</span>
          </div>
          <div className="summary-row"><span>Tax (3%)</span><span>{formatINR(tax)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatINR(total)}</span></div>

          <button type="submit" className="place-order-btn" disabled={submitting}>
            <Lock size={14} />
            {submitting ? 'Placing Order...' : `Place Order · ${formatINR(total)}`}
          </button>

          <div className="checkout-trust">
            <div className="trust-item"><ShieldCheck size={16} color="#1a1a1a" /><span>Secure</span></div>
            <div className="trust-item"><Truck size={16} color="#1a1a1a" /><span>Free Ship ₹599+</span></div>
            <div className="trust-item"><CheckCircle size={16} color="#1a1a1a" /><span>7-day Return</span></div>
          </div>
        </div>
      </form>
    </div>
  );
}
