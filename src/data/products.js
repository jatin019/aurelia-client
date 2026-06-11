// data/products.js
// No hardcoded seed products — all products come from Firebase

export const bestSellers = [];
export const newArrivals = [];
export const allProducts = [];

// Helper: Check if product is in active sale
const isProductInActiveSale = (product, activeSale) => {
  if (!activeSale || !activeSale.active) return false;
  if (activeSale.productIds?.length > 0) {
    return activeSale.productIds.includes(String(product.id));
  }
  if (activeSale.categories?.length > 0) {
    return activeSale.categories.includes(product.category);
  }
  return false;
};

const getActiveSale = () => {
  if (typeof window !== 'undefined' && window.__ACTIVE_SALE__) {
    return window.__ACTIVE_SALE__;
  }
  return null;
};

export const getEffectivePrice = (product) => {
  const activeSale = getActiveSale();
  if (activeSale && isProductInActiveSale(product, activeSale)) {
    const discount = activeSale.discountPercent || 0;
    return Math.round(product.price * (1 - discount / 100));
  }
  if (product.salePrice && product.salePrice < product.price) return product.salePrice;
  return product.price;
};

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

export const formatINR = (amount) => {
  return '₹' + Number(amount).toLocaleString('en-IN');
};
