import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { allProducts, getEffectivePrice, getDiscountPercent } from '../data/products';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import { Heart } from 'lucide-react';
import './ShopPage.css';

const FALLBACK_CATS = [
  { id:'rings',     label:'Rings'     },
  { id:'necklaces', label:'Necklaces' },
  { id:'earrings',  label:'Earrings'  },
  { id:'bracelets', label:'Bracelets' },
  { id:'watches',   label:'Watches'   },
  { id:'pendants',  label:'Pendants'  },
  { id:'anklets',   label:'Anklets'   },
  { id:'charms',    label:'Charms'    },
];

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const initialCat     = searchParams.get('cat') || 'all';
  const [active, setActive]     = useState(initialCat);
  const [sort, setSort]         = useState('default');
  const [products, setProducts] = useState(allProducts);
  const [addedId, setAddedId]   = useState(null);
  const { addToCart }           = useContext(CartContext);
  const { toggleWishlist, inWishlist } = useContext(WishlistContext);
  const navigate                = useNavigate();
  const [catRow1, setCatRow1]   = useState([]);
  const [catRow2, setCatRow2]   = useState([]);

  // Listen for category changes from admin
  useEffect(() => {
    const u1 = onSnapshot(doc(db,'site','categories_row1'), s => { if (s.exists()&&s.data().items) setCatRow1(s.data().items); });
    const u2 = onSnapshot(doc(db,'site','categories_row2'), s => { if (s.exists()&&s.data().items) setCatRow2(s.data().items); });
    return () => { u1(); u2(); };
  }, []);

  const CATS = useMemo(() => {
    const combined = [...catRow1, ...catRow2];
    if (combined.length === 0) return [{ id:'all', label:'All' }, ...FALLBACK_CATS];
    return [{ id:'all', label:'All' }, ...combined.map(c => ({ id:c.id, label:c.label }))];
  }, [catRow1, catRow2]);

  // Live products from Firebase
  useEffect(() => {
    const q = query(collection(db,'products'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) { setProducts(allProducts); return; }
      const fp = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      const merged = [
        ...fp,
        ...allProducts.filter(d => !fp.some(f => f.name?.toLowerCase() === d.name?.toLowerCase()))
      ];
      setProducts(merged);
    }, () => {});
    return () => unsub();
  }, []);

  const filtered = products.filter(p => active === 'all' ? true : (p.category||'') === active);
  const sorted   = [...filtered].sort((a,b) => {
    if (sort==='low')  return getEffectivePrice(a) - getEffectivePrice(b);
    if (sort==='high') return getEffectivePrice(b) - getEffectivePrice(a);
    if (sort==='name') return a.name.localeCompare(b.name);
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
        <p className="shop-sub">Explore our full collection · {filtered.length} pieces</p>
      </div>

      <div className="shop-toolbar">
        <div className="shop-filters">
          {CATS.map(c => (
            <button key={c.id} className={`filter-btn ${active===c.id?'active':''}`} onClick={() => setActive(c.id)}>
              {c.label}
            </button>
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
        {sorted.map(product => {
          const ep  = getEffectivePrice(product);
          const dp  = getDiscountPercent(product);
          const sale = dp > 0;
          const wl   = inWishlist(product.id);

          return (
            <div className="shop-card" key={product.id} onClick={() => navigate(`/product/${product.id}`)}>
              <div className="shop-card-img">
                <img src={product.image} alt={product.name} loading="lazy" />

                {/* Sale badge — always visible when on sale */}
                {sale && <span className="shop-sale-badge">-{dp}% OFF</span>}
                {product.badge && <span className="shop-badge">{product.badge}</span>}

                {/* Wishlist heart — top-right on mobile, hover on desktop */}
                <button className={`shop-wish-btn ${wl?'active':''}`}
                  onClick={e => { e.stopPropagation(); toggleWishlist(product); }}
                  title={wl ? 'Remove from wishlist' : 'Add to wishlist'}>
                  <Heart size={14} fill={wl?'#e05c7a':'none'} color={wl?'#e05c7a':'#fff'} />
                </button>

                <button
                  className={`shop-add-btn ${addedId===product.id?'added':''}`}
                  onClick={e => handleAdd(e, product)}>
                  {addedId===product.id ? '✓ Added' : '+ Add to Bag'}
                </button>
              </div>

              <div className="shop-card-info">
                <p className="shop-card-cat">{product.category}</p>
                <p className="shop-card-name">{product.name}</p>
                <div className="shop-card-bottom">
                  <div className="shop-card-price-row">
                    <span className={`shop-card-price ${sale?'on-sale':''}`}>${ep.toLocaleString()}</span>
                    {sale && <span className="shop-card-orig">${product.price.toLocaleString()}</span>}
                  </div>
                  {product.rating && (
                    <span className="shop-card-rating">★ {product.rating} <span className="shop-card-rcount">({product.reviewCount})</span></span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}