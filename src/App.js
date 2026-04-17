import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CollectionsPage from './pages/CollectionsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';

export const CartContext     = React.createContext();
export const WishlistContext = React.createContext();

// ── helpers ──
const loadLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const saveLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export default function App() {
  // ── CART (persisted) ──
  const [cart, setCart]       = useState(() => loadLS('kanyamaa_cart', []));
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => saveLS('kanyamaa_cart', cart), [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      return existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty      = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── WISHLIST (persisted) ──
  const [wishlist, setWishlist] = useState(() => loadLS('kanyamaa_wishlist', []));
  useEffect(() => saveLS('kanyamaa_wishlist', wishlist), [wishlist]);

  const toggleWishlist = (product) => {
    setWishlist(prev =>
      prev.find(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    );
  };
  const inWishlist = (id) => wishlist.some(i => i.id === id);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, cartCount, cartOpen, setCartOpen }}>
      <WishlistContext.Provider value={{ wishlist, toggleWishlist, inWishlist, wishlistCount }}>
        <BrowserRouter>
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/"            element={<HomePage />} />
            <Route path="/shop"        element={<ShopPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/wishlist"    element={<WishlistPage />} />
          </Routes>
          <Footer />
          <CartDrawer />
        </BrowserRouter>
      </WishlistContext.Provider>
    </CartContext.Provider>
  );
}