import React, { useState, useEffect } from 'react';
import { Truck, RotateCcw, Shield, CreditCard } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './TrustBadges.css';

const DEFAULT_BADGES = [
  { iconKey: 'truck',   label: 'Free Shipping',  sub: 'On orders above ₹599' },
  { iconKey: 'returns', label: 'Easy Returns',   sub: '7-day return policy'   },
  { iconKey: 'shield',  label: 'Authentic',      sub: 'Certified jewellery'   },
  { iconKey: 'cod',     label: 'COD Not Available',  sub: 'Pay through UPI '       },
];

const ICON_MAP = {
  truck:   Truck,
  returns: RotateCcw,
  shield:  Shield,
  cod:     CreditCard,
};

// productId is optional — if passed, loads per-product overrides from Firestore
export default function TrustBadges({ productId }) {
  const [badges, setBadges] = useState(DEFAULT_BADGES);

  useEffect(() => {
    if (!productId) return;
    const unsub = onSnapshot(
      doc(db, 'productBadges', String(productId)),
      snap => {
        if (snap.exists() && snap.data().badges?.length) {
          setBadges(snap.data().badges);
        } else {
          setBadges(DEFAULT_BADGES);
        }
      },
      () => setBadges(DEFAULT_BADGES)
    );
    return () => unsub();
  }, [productId]);

  return (
    <div className="trust-badges-strip">
      {badges.map((b, i) => {
        const Icon = ICON_MAP[b.iconKey] || Truck;
        return (
          <div className="trust-badge-item" key={i}>
            <Icon size={24} strokeWidth={1.5} className="trust-badge-icon" />
            <div className="trust-badge-text">
              <span className="trust-badge-label">{b.label}</span>
              <span className="trust-badge-sub">{b.sub}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
