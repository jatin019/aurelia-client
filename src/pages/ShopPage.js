import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { allProducts, getEffectivePrice, getDiscountPercent, formatINR } from '../data/products';
import { CartContext } from '../App';
import { WishlistContext } from '../App';
import { Heart, SlidersHorizontal, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
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

const FALLBACK_SUBCATS = {
  rings:     ['Gold','Silver','Diamond','Rose Gold','Platinum','Gold Plated'],
  necklaces: ['Gold Plated','Sterling Silver','Pearl','Diamond','Chain','Kundan'],
  earrings:  ['Studs','Hoops','Drops','Jhumkas','Pearl','Chandbali'],
  bracelets: ['Gold','Silver','Charm','Tennis','Bangle','Kadas'],
  watches:   ['Analog','Digital','Chronograph','Smart','Automatic','Luxury','Sport'],
  pendants:  ['Gold','Silver','Diamond','Stone'],
  anklets:   ['Gold','Silver','Beaded','Payal'],
  charms:    ['Gold','Silver','Enamel'],
};

const PRICE_RANGES = [
  { id:'u50k',   label:'Under ₹50,000',           min:0,      max:50000     },
  { id:'50-1l',  label:'₹50,000 – ₹1,00,000',     min:50000,  max:100000    },
  { id:'1-2.5l', label:'₹1,00,000 – ₹2,50,000',   min:100000, max:250000    },
  { id:'2.5-5l', label:'₹2,50,000 – ₹5,00,000',   min:250000, max:500000    },
  { id:'5lplus', label:'Above ₹5,00,000',         min:500000, max:Infinity  },
];

export default function ShopPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const initialCat      = searchParams.get('cat') || 'all';

  const [products,   setProducts]   = useState(allProducts);
  const [catRow1,    setCatRow1]    = useState([]);
  const [catRow2,    setCatRow2]    = useState([]);
  const [subCatMap,  setSubCatMap]  = useState({});
  const [saleBanner, setSaleBanner] = useState(null);
  const { addToCart }               = useContext(CartContext);
  const { toggleWishlist, inWishlist } = useContext(WishlistContext);
  const [addedId,    setAddedId]    = useState(null);

  const [activePillCat, setActivePillCat] = useState(initialCat);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [expandedCat,  setExpandedCat]  = useState(null);

  const [appliedSort,     setAppliedSort]     = useState('default');
  const [appliedSubCats,  setAppliedSubCats]  = useState([]);
  const [appliedPrice,    setAppliedPrice]    = useState(null);
  const [appliedSaleOnly, setAppliedSaleOnly] = useState(false);

  const [pendingSort,     setPendingSort]     = useState('default');
  const [pendingSubCats,  setPendingSubCats]  = useState([]);
  const [pendingPrice,    setPendingPrice]    = useState(null);
  const [pendingSaleOnly, setPendingSaleOnly] = useState(false);

  useEffect(() => {
    const c = searchParams.get('cat') || 'all';
    setActivePillCat(c);
  }, [searchParams]);

  useEffect(() => {
    const u1 = onSnapshot(doc(db,'site','categories_row1'), s => { if(s.exists()&&s.data().items) setCatRow1(s.data().items); });
    const u2 = onSnapshot(doc(db,'site','categories_row2'), s => { if(s.exists()&&s.data().items) setCatRow2(s.data().items); });
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db,'site','sub_categories'), snap => {
      if(snap.exists()&&snap.data().map) setSubCatMap(snap.data().map);
    }, ()=>{});
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db,'site','sale_banner'), snap => {
      if(snap.exists()) setSaleBanner(snap.data());
    }, ()=>{});
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db,'products'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      if(snap.empty) { setProducts(allProducts); return; }
      const fp = snap.docs.map(d=>({id:d.id,...d.data()}));
      setProducts([...fp, ...allProducts.filter(d=>!fp.some(f=>f.name?.toLowerCase()===d.name?.toLowerCase()))]);
    }, ()=>{});
    return () => unsub();
  }, []);

  const CATS = useMemo(() => {
    const combined = [...catRow1,...catRow2];
    const base = combined.length>0 ? combined.map(c=>({id:c.id,label:c.label})) : FALLBACK_CATS;
    return [{id:'all',label:'All'},...base];
  }, [catRow1,catRow2]);

  const getSubCats = (catId) =>
    (subCatMap[catId]?.length>0 ? subCatMap[catId] : FALLBACK_SUBCATS[catId]) || [];

  const openPanel = () => {
    setPendingSort(appliedSort);
    setPendingSubCats([...appliedSubCats]);
    setPendingPrice(appliedPrice);
    setPendingSaleOnly(appliedSaleOnly);
    setExpandedCat(activePillCat !== 'all' ? activePillCat : null);
    setPanelOpen(true);
  };

  const applyFilters = () => {
    setAppliedSort(pendingSort);
    setAppliedSubCats([...pendingSubCats]);
    setAppliedPrice(pendingPrice);
    setAppliedSaleOnly(pendingSaleOnly);
    setPanelOpen(false);
  };

  const clearAll = () => {
    setPendingSort('default');
    setPendingSubCats([]);
    setPendingPrice(null);
    setPendingSaleOnly(false);
  };

  const toggleSubCat = (catId, sub) => {
    const key = `${catId}::${sub}`;
    setPendingSubCats(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev,key]);
  };

  // FIXED FILTER LOGIC
  const displayProducts = useMemo(() => {
    let list = [...products];
    
    // 1. Filter by category pill
    if (activePillCat !== 'all') {
      list = list.filter(p => (p.category || '').toLowerCase() === activePillCat.toLowerCase());
    }
    
    // 2. Filter by sub-categories
    if (appliedSubCats.length > 0) {
      list = list.filter(p => {
        const productCat = (p.category || '').toLowerCase();
        // Get sub-category keys that match this product's category
        const relevantKeys = appliedSubCats.filter(k => {
          const [cat] = k.split('::');
          return cat.toLowerCase() === productCat;
        });
        
        // If no sub-cat filter applies to this product's category, include it
        if (relevantKeys.length === 0) {
          // Check if ANY sub-cat filter is for a different category - if so, exclude
          const hasOtherCatFilters = appliedSubCats.some(k => {
            const [cat] = k.split('::');
            return cat.toLowerCase() !== productCat;
          });
          return !hasOtherCatFilters;
        }
        
        // Match this product's sub-category against the filters
        const pSub = (p.subCategory || '').toLowerCase().trim();
        return relevantKeys.some(k => {
          const sub = k.split('::')[1].toLowerCase().trim();
          return pSub === sub;
        });
      });
    }
    
    // 3. Filter by price range
    if (appliedPrice) {
      list = list.filter(p => {
        const ep = getEffectivePrice(p);
        return ep >= appliedPrice.min && ep <= appliedPrice.max;
      });
    }
    
    // 4. Filter by sale only
    if (appliedSaleOnly) {
      list = list.filter(p => getDiscountPercent(p) > 0);
    }
    
    // 5. Sort
    return list.sort((a, b) => {
      if (appliedSort === 'low')  return getEffectivePrice(a) - getEffectivePrice(b);
      if (appliedSort === 'high') return getEffectivePrice(b) - getEffectivePrice(a);
      if (appliedSort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [products, activePillCat, appliedSubCats, appliedPrice, appliedSaleOnly, appliedSort]);

  const handleAdd = (e, product) => {
    e.stopPropagation(); addToCart(product);
    setAddedId(product.id); setTimeout(()=>setAddedId(null),1500);
  };

  const extraFilterCount = appliedSubCats.length + (appliedPrice?1:0) + (appliedSaleOnly?1:0) + (appliedSort!=='default'?1:0);

  const showBanner = saleBanner?.active && saleBanner?.text;

  return (
    <div className="page-wrapper shop-page">

      {showBanner && (
        <div className="shop-sale-banner"
          style={{ background: saleBanner.bgColor||'#7B1C3E', color: saleBanner.textColor||'#fff' }}>
          🏷 {saleBanner.text}
        </div>
      )}

      <div className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <p className="shop-sub">Explore our full collection · {displayProducts.length} pieces</p>
      </div>

      <div className="shop-toolbar">
        <div className="shop-filters">
          {CATS.map(c => (
            <button key={c.id}
              className={`filter-btn ${activePillCat===c.id?'active':''}`}
              onClick={() => setActivePillCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <button className={`filter-open-btn ${extraFilterCount>0?'has-filters':''}`} onClick={openPanel}>
          <SlidersHorizontal size={14} strokeWidth={1.8}/>
          <span>Filter & Sort</span>
          {extraFilterCount>0 && <span className="filter-count-badge">{extraFilterCount}</span>}
        </button>
      </div>

      {(appliedSubCats.length>0 || appliedPrice || appliedSaleOnly) && (
        <div className="active-chips-bar">
          {appliedSubCats.map(k=>(
            <div className="filter-chip" key={k}>
              {k.split('::')[1]}
              <button onClick={()=>setAppliedSubCats(p=>p.filter(x=>x!==k))}><X size={10}/></button>
            </div>
          ))}
          {appliedPrice && (
            <div className="filter-chip">
              {PRICE_RANGES.find(r=>r.id===appliedPrice.id)?.label}
              <button onClick={()=>setAppliedPrice(null)}><X size={10}/></button>
            </div>
          )}
          {appliedSaleOnly && (
            <div className="filter-chip sale-chip">
              On Sale <button onClick={()=>setAppliedSaleOnly(false)}><X size={10}/></button>
            </div>
          )}
          <button className="clear-all-chips" onClick={()=>{setAppliedSubCats([]);setAppliedPrice(null);setAppliedSaleOnly(false);setAppliedSort('default');}}>
            Clear all
          </button>
        </div>
      )}

      {panelOpen && <div className="filter-backdrop" onClick={()=>setPanelOpen(false)}/>}

      <aside className={`filter-panel ${panelOpen?'open':''}`}>
        <div className="fp-header">
          <h3 className="fp-title">Filter & Sort</h3>
          <div className="fp-header-actions">
            <button className="fp-clear" onClick={clearAll}>Clear all</button>
            <button className="fp-close" onClick={()=>setPanelOpen(false)}><X size={17}/></button>
          </div>
        </div>

        <div className="fp-body">

          <div className="fp-section">
            <p className="fp-section-title">Sort By</p>
            {[
              {v:'default',l:'Featured'},
              {v:'low',    l:'Price: Low → High'},
              {v:'high',   l:'Price: High → Low'},
              {v:'name',   l:'Name: A – Z'},
            ].map(opt => (
              <label key={opt.v} className={`fp-radio-row ${pendingSort===opt.v?'checked':''}`}
                onClick={()=>setPendingSort(opt.v)}>
                <span className={`fp-radio ${pendingSort===opt.v?'checked':''}`}/>
                {opt.l}
              </label>
            ))}
          </div>

          <div className="fp-section">
            <p className="fp-section-title">Sub-categories</p>
            <p className="fp-hint">Expand a category to filter</p>
            {CATS.filter(c=>c.id!=='all').map(c => {
              const subs = getSubCats(c.id);
              if (!subs.length) return null;
              const isExpanded = expandedCat === c.id;
              const checkedCount = pendingSubCats.filter(k=>k.startsWith(c.id+'::')).length;
              return (
                <div key={c.id} className="fp-cat-group">
                  <button className="fp-cat-accordion"
                    onClick={()=>setExpandedCat(isExpanded?null:c.id)}>
                    <span className="fp-cat-accordion-label">{c.label}</span>
                    {checkedCount>0 && (
                      <span className="fp-cat-count">{checkedCount}</span>
                    )}
                    {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </button>
                  {isExpanded && (
                    <div className="fp-subcats">
                      {subs.map(sub => {
                        const key = `${c.id}::${sub}`;
                        const checked = pendingSubCats.includes(key);
                        return (
                          <label key={sub} className={`fp-subcat-item ${checked?'checked':''}`}
                            onClick={()=>toggleSubCat(c.id,sub)}>
                            <span className={`fp-checkbox ${checked?'checked':''}`}>
                              {checked && <Check size={9} strokeWidth={3}/>}
                            </span>
                            {sub}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="fp-section">
            <p className="fp-section-title">Price Range</p>
            {PRICE_RANGES.map(r => (
              <label key={r.id} className={`fp-radio-row ${pendingPrice?.id===r.id?'checked':''}`}
                onClick={()=>setPendingPrice(pendingPrice?.id===r.id?null:r)}>
                <span className={`fp-radio ${pendingPrice?.id===r.id?'checked':''}`}/>
                {r.label}
              </label>
            ))}
          </div>

          <div className="fp-section">
            <p className="fp-section-title">Offers</p>
            <label className={`fp-sale-toggle ${pendingSaleOnly?'checked':''}`}
              onClick={()=>setPendingSaleOnly(p=>!p)}>
              <span className={`fp-checkbox ${pendingSaleOnly?'checked':''}`}>
                {pendingSaleOnly && <Check size={9} strokeWidth={3}/>}
              </span>
              On Sale only &nbsp;🏷
            </label>
          </div>
        </div>

        <div className="fp-footer">
          <button className="fp-apply-btn" onClick={applyFilters}>
            Apply
            {(()=>{const c=(pendingSubCats.length+(pendingPrice?1:0)+(pendingSaleOnly?1:0)+(pendingSort!=='default'?1:0)); return c>0?<span className="fp-apply-count">{c} filters</span>:null;})()}
          </button>
        </div>
      </aside>

      {displayProducts.length===0 ? (
        <div className="shop-empty">
          <p>No products match your filters.</p>
          <button onClick={()=>{setAppliedSubCats([]);setAppliedPrice(null);setAppliedSaleOnly(false);setAppliedSort('default');setActivePillCat('all');}}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="shop-grid">
          {displayProducts.map(product => {
            const ep  = getEffectivePrice(product);
            const dp  = getDiscountPercent(product);
            const sale = dp>0;
            const wl   = inWishlist(product.id);
            return (
              <div className="shop-card" key={product.id} onClick={()=>navigate(`/product/${product.id}`)}>
                <div className="shop-card-img">
                  <img src={product.image} alt={product.name} loading="lazy"/>
                  {sale && <span className="shop-sale-badge">-{dp}% OFF</span>}
                  {product.badge && !sale && <span className="shop-badge">{product.badge}</span>}
                  <button className={`shop-wish-btn ${wl?'active':''}`}
                    onClick={e=>{e.stopPropagation();toggleWishlist(product);}}
                    title={wl?'Remove from wishlist':'Add to wishlist'}>
                    <Heart size={14} fill={wl?'#e05c7a':'none'} color={wl?'#e05c7a':'#fff'}/>
                  </button>
                  <button className={`shop-add-btn ${addedId===product.id?'added':''}`}
                    onClick={e=>handleAdd(e,product)}>
                    {addedId===product.id?'✓ Added':'+ Add to Bag'}
                  </button>
                </div>
                <div className="shop-card-info">
                  <p className="shop-card-cat">{product.category}{product.subCategory?` · ${product.subCategory}`:''}</p>
                  <p className="shop-card-name">{product.name}</p>
                  <div className="shop-card-bottom">
                    <div className="shop-card-price-row">
                      <span className={`shop-card-price ${sale?'on-sale':''}`}>{formatINR(ep)}</span>
                      {sale && <span className="shop-card-orig">{formatINR(product.price)}</span>}
                    </div>
                    {product.rating && <span className="shop-card-rating">★ {product.rating}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}