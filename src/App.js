import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { db } from './firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CollectionsPage from './pages/CollectionsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';

export const CartContext     = React.createContext();
export const WishlistContext = React.createContext();
export const SaleContext     = React.createContext();

const loadLS = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const saveLS = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export default function App() {
  const [cart, setCart]         = useState(() => loadLS('kanyamaa_cart', []));
  const [cartOpen, setCartOpen] = useState(false);
  const [activeSale, setActiveSale] = useState(null);

  // Load sale banner data globally so getEffectivePrice can use it
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site', 'sale_banner'), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setActiveSale(data);
        // Set globally so products.js helpers can access
        window.__ACTIVE_SALE__ = data;
      } else {
        window.__ACTIVE_SALE__ = null;
      }
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => saveLS('kanyamaa_cart', cart), [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const key = `${product.id}-${product.selectedSize || ''}-${product.selectedMaterial || ''}`;
      const existing = prev.find(i =>
        `${i.id}-${i.selectedSize || ''}-${i.selectedMaterial || ''}` === key
      );
      return existing
        ? prev.map(i =>
            `${i.id}-${i.selectedSize || ''}-${i.selectedMaterial || ''}` === key
              ? { ...i, qty: i.qty + 1 } : i
          )
        : [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true);
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

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
    <SaleContext.Provider value={{ activeSale }}>
      <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, updateQty, cartCount, cartOpen, setCartOpen }}>
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
              <Route path="/checkout"    element={<CheckoutPage />} />
            </Routes>
            <Footer />
            <CartDrawer />
          </BrowserRouter>
        </WishlistContext.Provider>
      </CartContext.Provider>
    </SaleContext.Provider>
  );
}