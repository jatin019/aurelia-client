import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import './Footer.css';

// Fallback social links
const DEFAULT_SOCIALS = [
  { label: 'INSTA',   url: '#' },
  { label: 'PIN',     url: '#' },
  { label: 'TIKTOK',  url: '#' },
];

export default function Footer() {
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'footer_socials'), snap => {
      if (snap.exists() && snap.data().links?.length) {
        setSocials(snap.data().links);
      }
    }, () => {});
    return () => unsub();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h2 className="footer-logo">Kanyamaa Collections</h2>
          <p className="footer-tagline">
            Crafting timeless pieces for the modern muse.<br />
            Ethical sourcing, masterful artistry, and elegant<br />
            design since 1994.
          </p>
          <div className="footer-socials">
            {socials.map((s, i) => (
              <a key={i} href={s.url || '#'} className="social-link"
                target={s.url && s.url !== '#' ? '_blank' : undefined}
                rel="noopener noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">SHOP</h4>
          <ul>
            <li><Link to="/shop">New Arrivals</Link></li>
            <li><Link to="/shop">Best Sellers</Link></li>
            <li><Link to="/collections">Bridal Collection</Link></li>
            <li><Link to="/shop">Fine Jewelry</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 className="footer-col-title">SUPPORT</h4>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Shipping &amp; Returns</a></li>
            <li><a href="#">Ring Sizing</a></li>
            <li><a href="#">Care Guide</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Kanyamaa Collections. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}