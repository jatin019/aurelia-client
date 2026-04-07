import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { allProducts } from '../data/products';
import { CartContext } from '../App';
import './ShopPage.css';

const FALLBACK_CATS = [
  { id: 'rings', label: 'Rings' },
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'bracelets', label: 'Bracelets' },
  { id: 'watches', label: 'Watches' },
  { id: 'pendants', label: 'Pendants' },
  { id: 'anklets', label: 'Anklets' },
  { id: 'charms', label: 'Charms' },
];

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';
  const [active, setActive]     = useState(initialCat);
  const [sort, setSort]         = useState('default');
  const [products, setProducts] = useState(allProducts);
  const [addedId, setAddedId]   = useState(null);
  const { addToCart }           = useContext(CartContext);
  const navigate                = useNavigate();

  const [catRow1, setCatRow1] = useState([]);
  const [catRow2, setCatRow2] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'site', 'categories_row1'), s => {
      if (s.exists() && s.data().items) setCatRow1(s.data().items);
    });
    const u2 = onSnapshot(doc(db, 'site', 'categories_row2'), s => {
      if (s.exists() && s.data().items) setCatRow2(s.data().items);
    });
    return () => { u1(); u2(); };
  }, []);

  const CATS = useMemo(() => {
    const combined = [...catRow1, ...catRow2];
    if (combined.length === 0) {
      return [{ id: 'all', label: 'All' }, ...FALLBACK_CATS];
    }
    return [
      { id: 'all', label: 'All' },
      ...combined.map(c => ({ id: c.id, label: c.label })),
    ];
  }, [catRow1, catRow2]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) { setProducts(allProducts); return; }
      const firebaseProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const merged = [
        ...firebaseProducts,
        ...allProducts.filter(d => !firebaseProducts.some(f =>
          f.name.toLowerCase() === d.name.toLowerCase()
        ))
      ];
      setProducts(merged);
    }, () => {});
    return () => unsub();
  }, []);

  const filtered = products.filter(p =>
    active === 'all' ? true : (p.category || '') === active
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'low')  return a.price - b.price;
    if (sort === 'high') return b.price - a.price;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const handleAdd = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="page-wrapper shop-page">
      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <p className="shop-sub">Explore our full collection of fine jewellery</p>
      </div>

      <div className="shop-toolbar">
        <div className="shop-filters">
          {CATS.map(c => (
            <button
              key={c.id}
              className={`filter-btn ${active === c.id ? 'active' : ''}`}
              onClick={() => setActive(c.id)}
            >{c.label}</button>
          ))}
        </div>
        <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="default">Sort: Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="name">Name: A–Z</option>
        </select>
      </div>

      <div className="shop-grid">
        {sorted.map(product => (
          <div className="shop-card" key={product.id} onClick={() => navigate(`/product/${product.id}`)}>
            <div className="shop-card-img">
              <img src={product.image} alt={product.name} loading="lazy" />
              <button
                className={`shop-add-btn ${addedId === product.id ? 'added' : ''}`}
                onClick={(e) => handleAdd(e, product)}
              >
                {addedId === product.id ? '✓ Added' : '+ Add to Cart'}
              </button>
            </div>
            <div className="shop-card-info">
              <p className="shop-card-name">{product.name}</p>
              <p className="shop-card-price">${product.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}