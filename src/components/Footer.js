import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

// Map social labels to icons
const SOCIAL_ICONS = {
  INSTAGRAM: Instagram,
  INSTA: Instagram,
  FACEBOOK: Facebook,
  FB: Facebook,
  YOUTUBE: Youtube,
  YT: Youtube,
  TWITTER: Twitter,
  X: Twitter,
  TIKTOK: Youtube, // fallback
  PINTEREST: Mail, // fallback
  PIN: Mail,
};

const getIconForLabel = (label) => {
  const upper = label.toUpperCase().trim();
  return SOCIAL_ICONS[upper] || Mail;
};

const DEFAULT_SOCIALS = [
  { label:'INSTAGRAM',  url:'#' },
  { label:'FACEBOOK',    url:'#' },
  { label:'YOUTUBE', url:'#' },
];

const DEFAULT_FOOTER = {
  brandName: 'Kanyamaa Collections',
  tagline: 'Crafting timeless pieces for the modern muse.\nEthical sourcing, masterful artistry, and elegant\ndesign since 1994.',
  contactEmail: 'support@kanyamma.com',
  contactPhone: '+91 98765 43210',
  contactAddress: '12, Jewellers Lane, New Delhi - 110001',
  copyrightText: '© 2026 Kanyamma Collections. All rights reserved.',
  shopLinks: [
    { label: 'New Arrivals', url: '/shop' },
    { label: 'Best Sellers', url: '/shop' },
    { label: 'Bridal Collection', url: '/collections' },
    { label: 'Fine Jewelry', url: '/shop' },
  ],
};

const DEFAULT_POLICY = `Return Policy

We want you to love your kanyamma purchase. If you are not completely satisfied, we accept returns within 30 days of delivery.

Conditions:
• Items must be in original, unworn condition
• Original packaging and certificate must be included
• Sale items and personalised pieces are non-returnable

How to Return:
Email us at returns@kanyamma.com with your order number and reason.

Return Address:
Kanyamma Collections
12, Jewellers Lane, New Delhi - 110001, India

Refunds are processed within 7–10 business days of receiving the returned item.

For any queries, contact: support@kanyamma.com`;

export default function Footer() {
  const [socials, setSocials] = useState(DEFAULT_SOCIALS);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyText, setPolicyText] = useState(DEFAULT_POLICY);
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'site', 'footer_socials'), snap => {
      if (snap.exists() && snap.data().links?.length) setSocials(snap.data().links);
    }, () => {});

    const u2 = onSnapshot(doc(db, 'site', 'footer_settings'), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.policyText) setPolicyText(d.policyText);
        setFooterData(prev => ({
          ...prev,
          ...(d.brandName     && { brandName:     d.brandName     }),
          ...(d.tagline       && { tagline:       d.tagline       }),
          ...(d.contactEmail  && { contactEmail:  d.contactEmail  }),
          ...(d.contactPhone  && { contactPhone:  d.contactPhone  }),
          ...(d.contactAddress&& { contactAddress:d.contactAddress}),
          ...(d.copyrightText && { copyrightText: d.copyrightText }),
          ...(d.shopLinks?.length && { shopLinks: d.shopLinks }),
        }));
      }
    }, () => {});
    return () => { u1(); u2(); };
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-inner">
          {/* BRAND */}
          <div className="footer-brand">
            <h2 className="footer-logo">{footerData.brandName}</h2>
            <p className="footer-tagline">
              {footerData.tagline.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </p>
            <div className="footer-socials">
              {socials.map((s, i) => {
                const Icon = getIconForLabel(s.label);
                return (
                  <a key={i} href={s.url || '#'} className="social-icon-link"
                    target={s.url && s.url !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}>
                    <Icon size={18} strokeWidth={1.6} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* SHOP */}
          <div className="footer-col">
            <h4 className="footer-col-title">SHOP</h4>
            <ul>
              {footerData.shopLinks.map((link, i) => (
                <li key={i}>
                  {link.url.startsWith('/')
                    ? <Link to={link.url}>{link.label}</Link>
                    : <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: Contact + Subscribe */}
          <div className="footer-col footer-col-right">
            <button className="return-policy-btn" onClick={() => setPolicyOpen(true)}>
              <span className="rpb-icon">↩</span>
              Return Policy
            </button>

            <div className="footer-contact-block">
              <p className="footer-email-label">Get in touch</p>
              
              <a href={`mailto:${footerData.contactEmail}`} className="footer-contact-row">
                <Mail size={14} strokeWidth={1.6} />
                <span>{footerData.contactEmail}</span>
              </a>
              
              {footerData.contactPhone && (
                <a href={`tel:${footerData.contactPhone}`} className="footer-contact-row">
                  <Phone size={14} strokeWidth={1.6} />
                  <span>{footerData.contactPhone}</span>
                </a>
              )}
              
              {footerData.contactAddress && (
                <div className="footer-contact-row">
                  <MapPin size={14} strokeWidth={1.6} />
                  <span>{footerData.contactAddress}</span>
                </div>
              )}

              <p className="footer-email-label" style={{ marginTop: 16 }}>Subscribe for offers</p>
              <form className="footer-subscribe-form" onSubmit={handleSubscribe}>
                <input type="email" placeholder="your@email.com" value={emailInput}
                  onChange={e => setEmailInput(e.target.value)} className="footer-email-input" />
                <button type="submit" className="footer-subscribe-btn">{subscribed ? '✓' : '→'}</button>
              </form>
              {subscribed && <p className="footer-subscribed-msg">Thanks for subscribing! ✨</p>}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{footerData.copyrightText}</p>
          <div className="footer-bottom-links">
            <button className="footer-policy-link" onClick={() => setPolicyOpen(true)}>Return Policy</button>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {policyOpen && (
        <>
          <div className="policy-backdrop" onClick={() => setPolicyOpen(false)} />
          <div className="policy-popup">
            <div className="policy-popup-header">
              <h3 className="policy-popup-title">Return Policy</h3>
              <button className="policy-popup-close" onClick={() => setPolicyOpen(false)}>✕</button>
            </div>
            <div className="policy-popup-body">
              {policyText.split('\n').map((line, i) => (
                line.trim() === '' ? <br key={i} />
                : line.startsWith('•') ? <p key={i} className="policy-bullet">{line}</p>
                : /^[A-Z].*:$/.test(line.trim()) ? <p key={i} className="policy-section-head">{line}</p>
                : <p key={i} className="policy-line">{line}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}