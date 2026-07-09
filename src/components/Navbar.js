import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, X, Heart } from 'lucide-react';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import './Navbar.css';

export default function Navbar() {
  const { cartCount, setCartOpen } = useContext(CartContext);
  const { wishlistCount }          = useContext(WishlistContext);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal,  setSearchVal]  = useState('');
  const searchInputRef              = useRef(null);
  const searchInnerRef              = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const closeOnOutsideClick = (e) => {
      if (searchInnerRef.current && !searchInnerRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchVal('');
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [searchOpen]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      setSearchOpen(false);
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
    if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); }
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* No hero-mode class needed — sticky positioning handles scroll behaviour */}
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={handleHomeClick}>HOME</Link>
          <Link to="/shop"        className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}>SHOP</Link>
          <Link to="/collections" className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`}>COLLECTIONS</Link>
          <Link to="/shop?q=combo" className={`nav-link ${location.pathname === '/shop' && new URLSearchParams(location.search).get('q') === 'combo' ? 'active' : ''}`}>COMBO</Link>
        </div>

        <Link to="/" className="nav-logo" onClick={handleHomeClick}>Kanyamaa Collections</Link>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={16} strokeWidth={1.5} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
            <Heart size={16} strokeWidth={1.5} />
            {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
          </button>
          <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label="Cart">
            <ShoppingBag size={16} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`}>
        <div className="search-inner" ref={searchInnerRef}>
          <Search size={15} color="#999" strokeWidth={1.5} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search jewellery... (press Enter)"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button className="search-close-btn" onClick={() => { setSearchOpen(false); setSearchVal(''); }} aria-label="Close search">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}
