import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <h2 className="footer-logo">AURELIA</h2>
          <p className="footer-tagline">
            Crafting timeless pieces for the modern muse.<br />
            Ethical sourcing, masterful artistry, and elegant<br />
            design since 1994.
          </p>
          <div className="footer-socials">
            <a href="#" className="social-link">INSTA</a>
            <a href="#" className="social-link">PIN</a>
            <a href="#" className="social-link">TIKTOK</a>
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
        <p>© 2026 Aurelia Jewelry. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}