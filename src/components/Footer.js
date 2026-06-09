// src/components/Footer.js
// UPDATED: Added WhatsApp floating button (bottom-right) + WhatsApp link in contact section
// The WhatsApp number is pulled from Firebase (contactPhone field) — editable from admin

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { Instagram, Facebook, Youtube, Twitter, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import './Footer.css';

const SOCIAL_ICONS = {
  INSTAGRAM: Instagram,
  INSTA:     Instagram,
  FACEBOOK:  Facebook,
  FB:        Facebook,
  YOUTUBE:   Youtube,
  YT:        Youtube,
  TWITTER:   Twitter,
  X:         Twitter,
  TIKTOK:    Youtube,
  PINTEREST: Mail,
  PIN:       Mail,
};

const getIconForLabel = (label) => SOCIAL_ICONS[label.toUpperCase().trim()] || Mail;

const DEFAULT_SOCIALS = [
  { label: 'INSTAGRAM', url: 'https://instagram.com' },
  { label: 'FACEBOOK',  url: 'https://facebook.com'  },
  { label: 'YOUTUBE',   url: 'https://youtube.com'   },
];

const DEFAULT_FOOTER = {
  brandName:      'Kanyamaa Collections',
  tagline:        'Crafting timeless pieces for the modern muse.\nEthical sourcing, masterful artistry, and elegant\ndesign since 1994.',
  contactEmail:   'support@kanyamma.com',
  contactPhone:   '+91 98765 43210',
  contactAddress: '12, Jewellers Lane, New Delhi - 110001',
  copyrightText:  '© 2026 Kanyamma Collections. All rights reserved.',
  whatsappNumber: '',   // NEW — optional dedicated WhatsApp number
  whatsappMessage: 'Hello! I have a question about Kanyamaa Collections.',
  shopLinks: [
    { label: 'New Arrivals',      url: '/shop?section=newArrivals' },
    { label: 'Best Sellers',      url: '/shop?section=bestSellers' },
    { label: 'Bridal Collection', url: '/collections'              },
    { label: 'Fine Jewelry',      url: '/shop'                     },
  ],
};

const DEFAULT_POLICY = `Return Policy\n\nWe want you to love your kanyamma purchase. If you are not completely satisfied, we accept returns within 30 days of delivery.\n\nConditions:\n• Items must be in original, unworn condition\n• Original packaging and certificate must be included\n• Sale items and personalised pieces are non-returnable\n\nHow to Return:\nEmail us at returns@kanyamma.com with your order number and reason.\n\nReturn Address:\nKanyamma Collections\n12, Jewellers Lane, New Delhi - 110001, India\n\nRefunds are processed within 7–10 business days of receiving the returned item.\n\nFor any queries, contact: support@kanyamma.com`;

// Build WhatsApp URL from a phone number string
function buildWhatsAppUrl(phone, message = '') {
  const digits = phone.replace(/[^\d]/g, '');
  // If number doesn't start with country code, assume India (+91)
  const withCode = digits.startsWith('91') ? digits : `91${digits}`;
  const encoded  = encodeURIComponent(message);
  return `https://wa.me/${withCode}${message ? `?text=${encoded}` : ''}`;
}

export default function Footer() {
  const [socials,     setSocials]     = useState(DEFAULT_SOCIALS);
  const [policyOpen,  setPolicyOpen]  = useState(false);
  const [policyText,  setPolicyText]  = useState(DEFAULT_POLICY);
  const [footerData,  setFooterData]  = useState(DEFAULT_FOOTER);
  const [emailInput,  setEmailInput]  = useState('');
  const [subscribed,  setSubscribed]  = useState(false);
  const [wpVisible,   setWpVisible]   = useState(false);  // float btn tooltip

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
          ...(d.brandName       && { brandName:       d.brandName       }),
          ...(d.tagline         && { tagline:         d.tagline         }),
          ...(d.contactEmail    && { contactEmail:    d.contactEmail    }),
          ...(d.contactPhone    && { contactPhone:    d.contactPhone    }),
          ...(d.contactAddress  && { contactAddress:  d.contactAddress  }),
          ...(d.copyrightText   && { copyrightText:   d.copyrightText   }),
          ...(d.whatsappNumber  !== undefined && { whatsappNumber:  d.whatsappNumber  }),
          ...(d.whatsappMessage !== undefined && { whatsappMessage: d.whatsappMessage }),
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

  // Determine which phone number to use for WhatsApp
  const wpPhone   = footerData.whatsappNumber || footerData.contactPhone || '';
  const wpMessage = footerData.whatsappMessage || DEFAULT_FOOTER.whatsappMessage;
  const wpUrl     = wpPhone ? buildWhatsAppUrl(wpPhone, wpMessage) : '#';

  return (
    <>
      <footer className="footer">
        <div className="footer-inner">

          {/* ── BRAND ── */}
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

          {/* ── SHOP LINKS ── */}
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

          {/* ── CONTACT + SUBSCRIBE ── */}
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

              {wpPhone && (
                <a href={wpUrl} target="_blank" rel="noopener noreferrer" className="footer-contact-row footer-whatsapp-row">
                  <MessageCircle size={14} strokeWidth={1.6} color="#25D366" />
                  <span>{footerData.contactPhone} — WhatsApp</span>
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

      {/* ─────────────────────────────────────────────────────────────────────
          WHATSAPP FLOATING BUTTON (bottom-right, always visible)
      ───────────────────────────────────────────────────────────────────── */}
      {wpPhone && (
        <a
          href={wpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float"
          aria-label="Chat on WhatsApp"
          onMouseEnter={() => setWpVisible(true)}
          onMouseLeave={() => setWpVisible(false)}
        >
          {/* WhatsApp SVG icon */}
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#fff">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.417.632 4.737 1.832 6.773L2 30l7.418-1.793A13.925 13.925 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.45 11.45 0 01-5.832-1.594l-.418-.248-4.4 1.063 1.1-4.278-.27-.44A11.5 11.5 0 014.5 16C4.5 9.596 9.596 4.5 16 4.5S27.5 9.596 27.5 16 22.404 27.5 16 27.5zm6.27-8.616c-.344-.172-2.035-1.003-2.35-1.117-.315-.115-.544-.172-.773.172-.23.344-.887 1.117-1.087 1.347-.2.23-.4.258-.744.086-.344-.172-1.453-.536-2.769-1.71-1.023-.912-1.713-2.04-1.913-2.384-.2-.344-.021-.53.15-.701.154-.154.344-.4.516-.6.172-.2.23-.344.344-.572.115-.23.057-.43-.029-.6-.086-.172-.773-1.862-1.059-2.55-.278-.67-.562-.58-.773-.59l-.658-.011c-.23 0-.6.086-.915.43-.315.344-1.2 1.173-1.2 2.862 0 1.69 1.228 3.322 1.4 3.55.172.23 2.418 3.692 5.858 5.178.819.354 1.458.565 1.957.723.822.261 1.57.224 2.162.136.66-.099 2.035-.832 2.322-1.635.287-.803.287-1.491.2-1.635-.086-.143-.315-.23-.658-.4z"/>
          </svg>
          <span className={`whatsapp-tooltip ${wpVisible ? 'visible' : ''}`}>Chat with us</span>
        </a>
      )}

      {/* ─── Policy Modal ─── */}
      {policyOpen && (
        <>
          <div className="policy-backdrop" onClick={() => setPolicyOpen(false)} />
          <div className="policy-modal">
            <div className="policy-modal-header">
              <h3>Return Policy</h3>
              <button onClick={() => setPolicyOpen(false)}>✕</button>
            </div>
            <div className="policy-modal-body">
              {policyText.split('\n').map((line, i) => (
                <React.Fragment key={i}>{line}<br /></React.Fragment>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}