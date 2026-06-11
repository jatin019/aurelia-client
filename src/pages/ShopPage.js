import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { allProducts, getEffectivePrice, getDiscountPercent, formatINR } from '../data/products';
import { getSizeConfig, isSizeInStock } from '../data/sizeConfig';
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

// Price ranges — aligned with CollectionsPage
const PRICE_RANGES = [
  { id:'under99', label:'Under ₹99', min:0, max:99 },
  { id:'r99to199', label:'₹99 – ₹199', min:99, max:199 },
  { id:'r199to299', label:'₹199 – ₹299', min:199, max:299 },
  { id:'r299to399', label:'₹299 – ₹399', min:299, max:399 },
  { id:'above499', label:'₹499 & Above', min:499, max:Infinity }
];

// Inline size picker shown when quick-adding from shop grid
function SizePickerModal({ product, onConfirm, onCancel }) {
  const sizeConfig = getSizeConfig(product.category);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    const first = sizeConfig.sizes.find(s => isSizeInStock(product, s)) || sizeConfig.sizes[0];
    setSelectedSize(first);
  }, [product, sizeConfig]);

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.4)',
      zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }}
      onClick={onCancel}>
      <div style={{
        background:'#fff', borderRadius:16, padding:28, width:'min(360px,100%)',
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
      }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#1a1a1a' }}>Select {sizeConfig.label}</p>
          <button onClick={onCancel} style={{ background:'none', border:'none', fontSize:16, color:'#aaa', cursor:'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize:12, color:'#777', marginBottom:14, fontFamily:'Jost,sans-serif' }}>{product.name}</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:22 }}>
          {sizeConfig.sizes.map(s => {
            const inStock = isSizeInStock(product, s);
            return (
              <button key={s} onClick={() => inStock && setSelectedSize(s)} style={{
                padding:'8px 14px', borderRadius:100, fontFamily:'Jost,sans-serif', fontSize:13,
                border: selectedSize === s ? '1.5px solid #1a1a1a' : '1px solid #ddd',
                background: selectedSize === s ? '#1a1a1a' : inStock ? '#fff' : '#f8f8f8',
                color: selectedSize === s ? '#fff' : inStock ? '#333' : '#bbb',
                cursor: inStock ? 'pointer' : 'not-allowed',
                textDecoration: !inStock ? 'line-through' : 'none',
              }}>
                {s}
              </button>
            );
          })}
        </div>
        {sizeConfig.unit && (
          <p style={{ fontSize:10, color:'#aaa', marginBottom:16, fontFamily:'Jost,sans-serif' }}>
            Sizes in {sizeConfig.unit}
          </p>
        )}
        <button onClick={() => onConfirm(selectedSize)} style={{
          width:'100%', padding:'13px', background:'#1a1a1a', color:'#fff',
          border:'none', borderRadius:100, fontFamily:'Jost,sans-serif',
          fontSize:12, fontWeight:500, letterSpacing:'0.1em', cursor:'pointer',
        }}>
          ADD TO BAG
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const initialCat      = searchParams.get('cat') || 'all';
  const searchQuery     = searchParams.get('q') || '';
  const sectionFilter   = searchParams.get('section') || '';
  const minPriceParam   = Number(searchParams.get('minPrice')) || 0;
  const maxPriceParam   = Number(searchParams.get('maxPrice')) || 0;
  const saleParam       = searchParams.get('sale') === 'true';

  const [products,   setProducts]   = useState(allProducts);
  const [catRow1,    setCatRow1]    = useState([]);
  const [catRow2,    setCatRow2]    = useState([]);
  const [subCatMap,  setSubCatMap]  = useState({});
  const [saleBanner, setSaleBanner] = useState(null);
  const { addToCart }               = useContext(CartContext);
  const { toggleWishlist, inWishlist } = useContext(WishlistContext);

  // Size picker state
  const [sizePickerProduct, setSizePickerProduct] = useState(null);

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

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const c = searchParams.get('cat') || 'all';
    setActivePillCat(c);
  }, [searchParams]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setLocalSearch(q);
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

  // In ShopPage.js — replace the products useEffect:
useEffect(() => {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, snap => {
    if (snap.empty) { setProducts([]); return; }
    const fp = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setProducts(fp);
  }, () => {});
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
    setPendingSort('default'); setPendingSubCats([]); setPendingPrice(null); setPendingSaleOnly(false);
  };

  const toggleSubCat = (catId, sub) => {
    const key = `${catId}::${sub}`;
    setPendingSubCats(prev => prev.includes(key) ? prev.filter(k=>k!==key) : [...prev,key]);
  };

  const displayProducts = useMemo(() => {
    let list = [...products];
    const activeSearchVal = localSearch.trim().toLowerCase();
    if (activeSearchVal) {
      list = list.filter(p => {
        const name = (p.name || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        const subCategory = (p.subCategory || '').toLowerCase();
        return name.includes(activeSearchVal) || category.includes(activeSearchVal) || subCategory.includes(activeSearchVal);
      });
    }
    if (sectionFilter) list = list.filter(p => p.section === sectionFilter);
    if (minPriceParam > 0 || maxPriceParam > 0) {
      list = list.filter(p => {
        const ep = getEffectivePrice(p);
        if (minPriceParam > 0 && maxPriceParam > 0) return ep >= minPriceParam && ep <= maxPriceParam;
        if (minPriceParam > 0) return ep >= minPriceParam;
        if (maxPriceParam > 0) return ep <= maxPriceParam;
        return true;
      });
    }
    if (saleParam) list = list.filter(p => getDiscountPercent(p) > 0);
    if (activePillCat !== 'all') {
      list = list.filter(p => (p.category || '').toLowerCase() === activePillCat.toLowerCase());
    }
    // Replace the sub-category filter block (step 2) with this:
if (appliedSubCats.length > 0) {
  list = list.filter(p => {
    const productCat = (p.category || '').toLowerCase();
    const relevantKeys = appliedSubCats.filter(k => {
      const [cat] = k.split('::');
      return cat.toLowerCase() === productCat;
    });
    if (relevantKeys.length === 0) return true;

    // Support both subCategories array and legacy subCategory string
    const pSubCats = p.subCategories?.length > 0
      ? p.subCategories.map(s => s.toLowerCase().trim())
      : p.subCategory
        ? p.subCategory.split(',').map(s => s.toLowerCase().trim())
        : [];

    return relevantKeys.some(k => {
      const sub = k.split('::')[1].toLowerCase().trim();
      return pSubCats.includes(sub);
    });
  });
}

    if (appliedPrice) {
      list = list.filter(p => { const ep = getEffectivePrice(p); return ep >= appliedPrice.min && ep <= appliedPrice.max; });
    }
    if (appliedSaleOnly) list = list.filter(p => getDiscountPercent(p) > 0);
    return list.sort((a, b) => {
      if (appliedSort === 'low')  return getEffectivePrice(a) - getEffectivePrice(b);
      if (appliedSort === 'high') return getEffectivePrice(b) - getEffectivePrice(a);
      if (appliedSort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [products, activePillCat, appliedSubCats, appliedPrice, appliedSaleOnly, appliedSort, localSearch, sectionFilter, minPriceParam, maxPriceParam, saleParam]);

  // Show size picker before adding to cart
  const handleQuickAdd = (e, product) => {
    e.stopPropagation();
    setSizePickerProduct(product);
  };

  const handleSizeConfirm = (size) => {
    addToCart({ ...sizePickerProduct, selectedSize: size });
    setSizePickerProduct(null);
  };

  const clearSearch = () => {
    setLocalSearch('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  const extraFilterCount = appliedSubCats.length + (appliedPrice?1:0) + (appliedSaleOnly?1:0) + (appliedSort!=='default'?1:0);
  const showBanner = saleBanner?.active && saleBanner?.text;
  const activeSearch = localSearch.trim().toLowerCase();

  const getPageTitle = () => {
    if (sectionFilter === 'newArrivals') return 'New Arrivals';
    if (sectionFilter === 'bestSellers') return 'Best Sellers';
    if (saleParam) return 'On Sale';
    if (minPriceParam > 0 && maxPriceParam > 0) return `₹${minPriceParam.toLocaleString('en-IN')} – ₹${maxPriceParam.toLocaleString('en-IN')}`;
    if (minPriceParam > 0) return `₹${minPriceParam.toLocaleString('en-IN')} & Above`;
    if (maxPriceParam > 0) return `Under ₹${maxPriceParam.toLocaleString('en-IN')}`;
    return 'Shop';
  };

  const getPageSub = () => {
    if (activeSearch) return `Showing results for "${localSearch}" · `;
    if (sectionFilter === 'newArrivals') return 'Fresh additions to our collection · ';
    if (sectionFilter === 'bestSellers') return 'Our most loved pieces · ';
    if (saleParam) return 'Products with active discounts · ';
    if (minPriceParam || maxPriceParam) return 'Filtered by price range · ';
    return 'Explore our full collection · ';
  };

  const hasUrlFilter = sectionFilter || saleParam || minPriceParam > 0 || maxPriceParam > 0;

  return (
    <div className="page-wrapper shop-page">

      {/* Size picker modal */}
      {sizePickerProduct && (
        <SizePickerModal
          product={sizePickerProduct}
          onConfirm={handleSizeConfirm}
          onCancel={() => setSizePickerProduct(null)}
        />
      )}

      {showBanner && (
        <div className="shop-sale-banner"
          style={{ background: saleBanner.bgColor||'#7B1C3E', color: saleBanner.textColor||'#fff', cursor: 'pointer' }}
          onClick={() => navigate('/shop?sale=true')}>
          🏷 {saleBanner.text}
          <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', borderBottom: '1px solid currentColor' }}>SHOP NOW →</span>
        </div>
      )}

      <div className="shop-header">
        <h1 className="shop-title">{getPageTitle()}</h1>
        <p className="shop-sub">{getPageSub()}{displayProducts.length} piece{displayProducts.length !== 1 ? 's' : ''}</p>
      </div>

      {localSearch && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 5vw', background:'#f0ece6', borderBottom:'1px solid #e0ddd8', fontFamily:'Jost, sans-serif', fontSize:13 }}>
          <span style={{ color:'#555' }}>🔍 Searching: <strong>"{localSearch}"</strong></span>
          <button onClick={clearSearch} style={{ background:'none', border:'1px solid #ddd', borderRadius:100, padding:'3px 10px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#888', fontFamily:'Jost, sans-serif' }}>
            <X size={11} /> Clear
          </button>
        </div>
      )}

      {hasUrlFilter && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 5vw', background: saleParam?'#fff0ee':sectionFilter==='bestSellers'?'#fff8f0':sectionFilter==='newArrivals'?'#f0fdf4':'#f5f3ee', borderBottom:'1px solid #e0ddd8', fontFamily:'Jost, sans-serif', fontSize:13 }}>
          <span style={{ color:'#555' }}>
            {saleParam && '🏷 Showing: On Sale products only'}
            {sectionFilter === 'bestSellers' && '⭐ Viewing: Best Sellers'}
            {sectionFilter === 'newArrivals' && '✨ Viewing: New Arrivals'}
            {!saleParam && !sectionFilter && (minPriceParam || maxPriceParam) && `💎 Price: ${minPriceParam > 0 ? `₹${minPriceParam.toLocaleString('en-IN')}` : '₹0'} – ${maxPriceParam > 0 ? `₹${maxPriceParam.toLocaleString('en-IN')}` : '∞'}`}
          </span>
          <button onClick={() => navigate('/shop')} style={{ background:'none', border:'1px solid #ddd', borderRadius:100, padding:'3px 10px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4, color:'#888', fontFamily:'Jost, sans-serif' }}>
            <X size={11} /> Show All
          </button>
        </div>
      )}

      <div className="shop-toolbar">
        <div className="shop-filters">
          {CATS.map(c => (
            <button key={c.id} className={`filter-btn ${activePillCat===c.id?'active':''}`} onClick={() => setActivePillCat(c.id)}>
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
              <label key={opt.v} className={`fp-radio-row ${pendingSort===opt.v?'checked':''}`} onClick={()=>setPendingSort(opt.v)}>
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
                  <button className="fp-cat-accordion" onClick={()=>setExpandedCat(isExpanded?null:c.id)}>
                    <span className="fp-cat-accordion-label">{c.label}</span>
                    {checkedCount>0 && <span className="fp-cat-count">{checkedCount}</span>}
                    {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  </button>
                  {isExpanded && (
                    <div className="fp-subcats">
                      {subs.map(sub => {
                        const key = `${c.id}::${sub}`;
                        const checked = pendingSubCats.includes(key);
                        return (
                          <label key={sub} className={`fp-subcat-item ${checked?'checked':''}`} onClick={()=>toggleSubCat(c.id,sub)}>
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
            <label className={`fp-sale-toggle ${pendingSaleOnly?'checked':''}`} onClick={()=>setPendingSaleOnly(p=>!p)}>
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
          <p>{localSearch ? `No results for "${localSearch}"` : saleParam ? 'No products on sale right now.' : 'No products match your filters.'}</p>
          <button onClick={()=>{setAppliedSubCats([]);setAppliedPrice(null);setAppliedSaleOnly(false);setAppliedSort('default');setActivePillCat('all');clearSearch();navigate('/shop');}}>
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
                  {/* Quick add now opens size picker */}
                  <button className="shop-add-btn"
                    onClick={e => handleQuickAdd(e, product)}>
                    + Add to Bag
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
