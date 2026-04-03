import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, X, Menu } from 'lucide-react';
import { CartContext } from '../App';
import './Navbar.css';

export default function Navbar() {
  const { cartCount, setCartOpen } = useContext(CartContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState('');
  const [menuOpen, setMenuOpen]     = useState(false);
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/"            className={`nav-link ${location.pathname === '/'            ? 'active' : ''}`}>HOME</Link>
          <Link to="/shop"        className={`nav-link ${location.pathname === '/shop'        ? 'active' : ''}`}>SHOP</Link>
          <Link to="/collections" className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`}>COLLECTIONS</Link>
        </div>

        <Link to="/" className="nav-logo">AURELIA</Link>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setSearchOpen(true)}>
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          <button className="icon-btn hamburger-btn" onClick={() => setMenuOpen(true)}>
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU OVERLAY ── */}
      <div className={`mobile-menu-backdrop ${menuOpen ? 'open' : ''}`} onClick={closeMenu} />
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-logo">AURELIA</span>
          <button className="icon-btn" onClick={closeMenu}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="mobile-nav-links">
          <Link to="/"            className={`mobile-nav-link ${location.pathname === '/'            ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
          <Link to="/shop"        className={`mobile-nav-link ${location.pathname === '/shop'        ? 'active' : ''}`} onClick={closeMenu}>Shop</Link>
          <Link to="/collections" className={`mobile-nav-link ${location.pathname === '/collections' ? 'active' : ''}`} onClick={closeMenu}>Collections</Link>
        </nav>

        <div className="mobile-menu-footer">
          <p className="mobile-menu-tagline">Crafting timeless pieces since 1994</p>
        </div>
      </div>

      {/* ── SEARCH OVERLAY ── */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`}>
        <div className="search-inner">
          <Search size={17} color="#999" strokeWidth={1.5} />
          <input
            autoFocus={searchOpen}
            type="text"
            placeholder="Search jewellery..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
          />
          <button className="icon-btn" onClick={() => { setSearchOpen(false); setSearchVal(''); }}>
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}