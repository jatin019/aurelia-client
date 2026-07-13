import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCircle, AlertCircle, ArrowLeft, Upload, ShieldCheck } from 'lucide-react';
import { db } from '../firebase/config';
import { formatINR } from '../data/products';
import './PaymentPage.css';
import PageSkeleton from '../components/PageSkeleton';

const DEFAULT_UPI_ID = process.env.REACT_APP_UPI_ID || 'kanyamaa@upi';
const DEFAULT_UPI_NAME = process.env.REACT_APP_UPI_NAME || 'KANYAMAA';
const MAX_SCREENSHOT_BYTES = 650 * 1024;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: DEFAULT_UPI_ID,
    upiName: DEFAULT_UPI_NAME,
  });

  useEffect(() => {
    let alive = true;

    const loadOrder = async () => {
      try {
        const [orderSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'pendingOrders', orderId)),
          getDoc(doc(db, 'site', 'payment_settings')),
        ]);
        if (!alive) return;

        if (settingsSnap.exists()) {
          const settings = settingsSnap.data();
          setPaymentSettings({
            upiId: settings.upiId || DEFAULT_UPI_ID,
            upiName: settings.upiName || DEFAULT_UPI_NAME,
          });
        }

        if (!orderSnap.exists()) {
          setError('We could not find this payment order.');
          setLoading(false);
          return;
        }
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } catch (err) {
        console.error(err);
        if (alive) setError('Could not load payment details. Please refresh and try again.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadOrder();
    return () => { alive = false; };
  }, [orderId]);

  const payableAmount = Number(order?.payableAmount || order?.total || 0);
  const upiId = paymentSettings.upiId || DEFAULT_UPI_ID;
  const upiName = paymentSettings.upiName || DEFAULT_UPI_NAME;

  const upiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: upiName,
      am: payableAmount.toFixed(2),
      cu: 'INR',
      tn: `KANYAMAA order ${order?.visibleOrderId || order?.orderNumber || ''}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [order, payableAmount, upiId, upiName]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUrl)}`;

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image screenshot.');
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setError('Screenshot is too large. Please upload a compressed image under 650 KB.');
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setScreenshot(dataUrl);
    setScreenshotName(file.name);
  };

  const submitProof = async (e) => {
    e.preventDefault();
    const cleanUtr = utr.trim().toUpperCase();

    if (!/^[A-Z0-9]{8,30}$/.test(cleanUtr)) {
      setError('Enter a valid UTR/reference number, 8–30 letters or digits.');
      return;
    }
    if (!screenshot) {
      setError('Please upload the payment screenshot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await updateDoc(doc(db, 'pendingOrders', orderId), {
        paymentStatus: 'submitted_for_verification',
        paymentProof: {
          utr: cleanUtr,
          screenshotDataUrl: screenshot,
          screenshotName,
          amountPaid: payableAmount,
          submittedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError('Could not submit payment proof. Please check your connection and try again.');
    }

    setSubmitting(false);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (submitted || order?.paymentStatus === 'submitted_for_verification') {
    return (
      <div className="payment-page">
        <div className="payment-card payment-success">
          <CheckCircle size={42} />
          <h1>Payment submitted</h1>
          <p>Thank you. Your order {order?.visibleOrderId} is waiting for admin verification.</p>
          <button onClick={() => navigate('/')}>Continue shopping</button>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="payment-page">
        <div className="payment-card payment-error-state">
          <AlertCircle size={36} />
          <h1>Payment link unavailable</h1>
          <p>{error}</p>
          <button onClick={() => navigate('/checkout')}><ArrowLeft size={14} /> Back to checkout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-header">
        <p>Secure manual payment</p>
        <h1>Scan QR & submit proof</h1>
        <span>Order {order.visibleOrderId}</span>
      </div>

      <div className="payment-grid">
        <section className="payment-card qr-card">
          <div className="amount-pill">Pay exactly {formatINR(payableAmount)}</div>
          <img src={qrSrc} alt={`UPI QR for ${formatINR(payableAmount)}`} className="payment-qr" />
          <p className="upi-id">UPI ID: <strong>{upiId}</strong></p>
          <a className="upi-open-link" href={upiUrl}>Open UPI app</a>
          <div className="payment-warning">
            <ShieldCheck size={16} />
            Pay only the exact amount shown. Admin will verify this amount before approval.
          </div>
        </section>

        <form className="payment-card proof-card" onSubmit={submitProof}>
          <h2>Upload payment details</h2>
          <p className="proof-sub">After payment, enter your UTR/reference number and upload the payment screenshot.</p>

          <label className="proof-field">
            <span>UTR / Reference Number</span>
            <input value={utr} onChange={e => setUtr(e.target.value)} placeholder="Example: 426812345678" />
          </label>

          <label className="screenshot-upload">
            <Upload size={18} />
            <span>{screenshotName || 'Upload payment screenshot'}</span>
            <input type="file" accept="image/*" onChange={handleScreenshot} />
          </label>

          {screenshot && <img className="screenshot-preview" src={screenshot} alt="Payment screenshot preview" />}
          {error && <p className="payment-error"><AlertCircle size={13} /> {error}</p>}

          <button className="submit-proof-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for verification'}
          </button>
        </form>
      </div>
    </div>
  );
}
