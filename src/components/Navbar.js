import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, X, Heart } from 'lucide-react';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import './Navbar.css';

export default function Navbar() {
  const { cartCount, setCartOpen }      = useContext(CartContext);
  const { wishlistCount }               = useContext(WishlistContext);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchVal,  setSearchVal]      = useState('');
  const [scrolled,   setScrolled]       = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome   = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    setScrolled(window.scrollY > 60);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const heroMode = isHome && !scrolled;

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      setSearchOpen(false);
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
    if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); }
  };

  return (
    <>
      <nav className={`navbar ${heroMode ? 'hero-mode' : ''}`}>
        <div className="nav-left">
          <Link to="/"            className={`nav-link ${location.pathname==='/'?'active':''}`}>HOME</Link>
          <Link to="/shop"        className={`nav-link ${location.pathname==='/shop'?'active':''}`}>SHOP</Link>
          <Link to="/collections" className={`nav-link ${location.pathname==='/collections'?'active':''}`}>COLLECTIONS</Link>
        </div>

        <Link to="/" className="nav-logo">Kanyamaa Collections</Link>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={16} strokeWidth={1.5} />
          </button>

          {/* Wishlist */}
          <button className="icon-btn wishlist-btn" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
            <Heart size={16} strokeWidth={1.5} />
            {wishlistCount > 0 && <span className="cart-badge wishlist-badge">{wishlistCount}</span>}
          </button>

          {/* Cart */}
          <button className="icon-btn cart-btn" onClick={() => setCartOpen(true)} aria-label="Cart">
            <ShoppingBag size={16} strokeWidth={1.5} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </nav>

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`}>
        <div className="search-inner">
          <Search size={15} color="#999" strokeWidth={1.5} />
          <input
            autoFocus={searchOpen}
            type="text"
            placeholder="Search jewellery... (press Enter)"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button className="icon-btn" onClick={() => { setSearchOpen(false); setSearchVal(''); }}>
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}