import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, X } from 'lucide-react';
import { CartContext } from '../App';
import './Navbar.css';

export default function Navbar() {
  const { cartCount, setCartOpen } = useContext(CartContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState('');
  const [scrolled, setScrolled]     = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  // Detect scroll — become solid once user scrolls past hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    setScrolled(window.scrollY > 60);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // hero-mode = on home page AND not yet scrolled
  const heroMode = isHome && !scrolled;

  return (
    <>
      <nav className={`navbar ${heroMode ? 'hero-mode' : ''}`}>
        <div className="nav-left">
          <Link to="/"            className={`nav-link ${location.pathname === '/'            ? 'active' : ''}`}>HOME</Link>
          <Link to="/shop"        className={`nav-link ${location.pathname === '/shop'        ? 'active' : ''}`}>SHOP</Link>
          <Link to="/collections" className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`}>COLLECTIONS</Link>
        </div>

        <Link to="/" className="nav-logo">AURELIA</Link>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setSearchOpen(true)}>
            <Search size={16} strokeWidth={1.5} />
          </button>
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={16} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      <div className={`search-overlay ${searchOpen ? 'open' : ''}`}>
        <div className="search-inner">
          <Search size={15} color="#999" strokeWidth={1.5} />
          <input
            autoFocus={searchOpen}
            type="text"
            placeholder="Search jewellery..."
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
          />
          <button className="icon-btn" onClick={() => { setSearchOpen(false); setSearchVal(''); }}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}