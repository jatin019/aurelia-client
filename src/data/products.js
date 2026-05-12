// Default fallback products — admin can override via Firebase
export const bestSellers = [
  { id: 1,  name: 'Heirloom Watch',         price: 24900, category: 'watches',   section: 'bestSellers', images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80'], image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80' },
  { id: 2,  name: 'Gold Signet Ring',        price: 7400,  category: 'rings',     section: 'bestSellers', images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'], image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80' },
  { id: 3,  name: 'Diamond Tennis Bracelet', price: 29000, category: 'bracelets', section: 'bestSellers', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80'], image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80' },
  { id: 4,  name: 'Platinum Chronograph',    price: 39800, category: 'watches',   section: 'bestSellers', images: ['https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&q=80'], image: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=400&q=80' },
  { id: 5,  name: 'Sapphire Solitaire',      price: 17400, category: 'rings',     section: 'bestSellers', images: ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80'], image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&q=80' },
  { id: 6,  name: 'Cuban Link Chain',        price: 5400,  category: 'necklaces', section: 'bestSellers', images: ['https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=800&q=80'], image: 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8?w=400&q=80' },
  { id: 7,  name: 'Classic Diamond Ring',    price: 15400, category: 'rings',     section: 'bestSellers', images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80'], image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&q=80' },
  { id: 8,  name: 'Pearl Drop Earrings',     price: 3500,  category: 'earrings',  section: 'bestSellers', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80' },
];

export const newArrivals = [
  { id: 9,  name: 'Eternity Pearl Drops',    price: 5400,  category: 'earrings',  section: 'newArrivals', images: ['https://images.unsplash.com/photo-1573408301185-9519f94815b9?w=800&q=80'], image: 'https://images.unsplash.com/photo-1573408301185-9519f94815b9?w=400&q=80' },
  { id: 10, name: 'Onyx Statement Necklace', price: 9100,  category: 'necklaces', section: 'newArrivals', images: ['https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=800&q=80'], image: 'https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=400&q=80' },
  { id: 11, name: 'Vintage Emerald Ring',    price: 34800, category: 'rings',     section: 'newArrivals', images: ['https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800&q=80'], image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=400&q=80' },
  { id: 12, name: 'Minimalist Gold Choker',  price: 7000,  category: 'necklaces', section: 'newArrivals', images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80'], image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80' },
  { id: 13, name: 'Rose Gold Cuff',          price: 4500,  category: 'bracelets', section: 'newArrivals', images: ['https://images.unsplash.com/photo-1576022162916-77c28f32e4e3?w=800&q=80'], image: 'https://images.unsplash.com/photo-1576022162916-77c28f32e4e3?w=400&q=80' },
  { id: 14, name: 'Freshwater Pearl Choker', price: 4000,  category: 'necklaces', section: 'newArrivals', images: ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&q=80'], image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&q=80' },
  { id: 15, name: '18k Gold Bangle',         price: 9900,  category: 'bracelets', section: 'newArrivals', images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80'], image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80' },
  { id: 16, name: 'Moonstone Ring',          price: 6000,  category: 'rings',     section: 'newArrivals', images: ['https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=800&q=80'], image: 'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=400&q=80' },
];

export const allProducts = [...bestSellers, ...newArrivals];

// Helper: Check if product is in active sale
const isProductInActiveSale = (product, activeSale) => {
  if (!activeSale || !activeSale.active) return false;
  
  // Check by specific products list
  if (activeSale.productIds?.length > 0) {
    return activeSale.productIds.includes(String(product.id));
  }
  
  // Check by categories
  if (activeSale.categories?.length > 0) {
    return activeSale.categories.includes(product.category);
  }
  
  return false;
};

// Get sale data from window (set by App.js)
const getActiveSale = () => {
  if (typeof window !== 'undefined' && window.__ACTIVE_SALE__) {
    return window.__ACTIVE_SALE__;
  }
  return null;
};

// Helper: get effective price (with banner sale applied)
export const getEffectivePrice = (product) => {
  const activeSale = getActiveSale();
  
  // Banner-driven sale takes priority
  if (activeSale && isProductInActiveSale(product, activeSale)) {
    const discount = activeSale.discountPercent || 0;
    return Math.round(product.price * (1 - discount / 100));
  }
  
  // Otherwise use product's own sale price
  if (product.salePrice && product.salePrice < product.price) return product.salePrice;
  return product.price;
};

// Helper: get discount percent
export const getDiscountPercent = (product) => {
  const activeSale = getActiveSale();
  
  if (activeSale && isProductInActiveSale(product, activeSale)) {
    return activeSale.discountPercent || 0;
  }
  
  if (product.salePrice && product.salePrice < product.price) {
    return Math.round((1 - product.salePrice / product.price) * 100);
  }
  return 0;
};

// Format INR with commas
export const formatINR = (amount) => {
  return '₹' + Number(amount).toLocaleString('en-IN');
};