// Size + Material configurations per product category
export const SIZE_CONFIG = {
  rings: {
    label: 'Ring Size',
    sizes: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
    unit: 'US',    
    
  },
  necklaces: {
    label: 'Length',
    sizes: ['14"', '16"', '18"', '20"', '22"', '24"'],
    unit: 'inches',    
    
  },
  bracelets: {
    label: 'Bracelet Size',
    sizes: ['XS (6")', 'S (6.5")', 'M (7")', 'L (7.5")', 'XL (8")'],
    unit: 'inches',
    
    
  },
  earrings: {
    label: 'Size',
    sizes: ['Small', 'Medium', 'Large'],
    unit: '',
    
  },
  
  anklets: {
    label: 'Length',
    sizes: ['9"', '10"', '11"'],
    unit: 'inches',
    
  },
  pendants: {
    label: 'Chain Length',
    sizes: ['16"', '18"', '20"', '22"'],
    unit: 'inches',
    
  },
  charms: {
    label: 'Size',
    sizes: ['One Size'],
    unit: '',
    
  },
  default: {
    label: 'Size',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    unit: '',
    
  },
};

export const getSizeConfig = (category) => {
  return SIZE_CONFIG[category?.toLowerCase()] || SIZE_CONFIG.default;
};

export const isSizeInStock = (product, size) => {
  if (!product.sizeStock) return true;
  return product.sizeStock[size] !== false;
};