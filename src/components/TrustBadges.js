import React from 'react';
import { Truck, RotateCcw, Shield, CreditCard } from 'lucide-react';
import './TrustBadges.css';

const BADGES = [
  { icon: Truck, label: 'Free Shipping', sub: 'On orders above ₹999' },
  { icon: RotateCcw, label: 'Easy Returns', sub: '7-day return policy' },
  { icon: Shield, label: 'Authentic', sub: 'Certified jewellery' },
  { icon: CreditCard, label: 'COD Available', sub: 'Pay on delivery' },
];

export default function TrustBadges() {
  return (
    <div className="trust-badges-strip">
      {BADGES.map(({ icon: Icon, label, sub }) => (
        <div className="trust-badge-item" key={label}>
          <Icon size={24} strokeWidth={1.5} className="trust-badge-icon" />
          <div className="trust-badge-text">
            <span className="trust-badge-label">{label}</span>
            <span className="trust-badge-sub">{sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

