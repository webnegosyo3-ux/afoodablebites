import { MenuItem, Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'sizzling-meals',
    name: 'Sizzling & Rice Meals',
    icon: '🍳',
    sort_order: 1,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'filipino-soups',
    name: 'Filipino Soups',
    icon: '🍲',
    sort_order: 2,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'drinks',
    name: 'Cold Drinks',
    icon: '🥤',
    sort_order: 3,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'add-ons',
    name: 'Add-ons & Extras',
    icon: '🍚',
    sort_order: 4,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Reusable standard add-ons for main meals
const standardMealAddOns = [
  { id: 'addon-plain-rice', name: 'Plain Rice', price: 20, category: 'add-ons' },
  { id: 'addon-fried-rice', name: 'Fried Rice', price: 25, category: 'add-ons' },
  { id: 'addon-egg', name: 'Fried Egg (Sunny-side Up)', price: 15, category: 'add-ons' },
  { id: 'addon-mushroom-soup', name: 'Mushroom Soup', price: 35, category: 'add-ons' }
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // --- Sizzling & Rice Meals ---
  {
    id: 'sizzling-pork-sisig',
    name: 'Sizzling Pork Sisig',
    description: 'Crispy and savory minced pork seasoned with onions, chili, calamansi, and topped with fresh egg on a smoking hot plate.',
    basePrice: 139,
    effectivePrice: 139,
    category: 'sizzling-meals',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'garlic-pepper-steak',
    name: 'Garlic Pepper Steak',
    description: 'Juicy and tender beef patties draped in aromatic toasted garlic and black pepper sauce, served with steaming rice.',
    basePrice: 149,
    effectivePrice: 149,
    category: 'sizzling-meals',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'siomai-rice',
    name: 'Siomai Rice',
    description: '4 pcs succulent steamed pork & shrimp siomai paired with fragrant garlic rice, chili garlic sauce, and calamansi.',
    basePrice: 75,
    effectivePrice: 75,
    category: 'sizzling-meals',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'burger-steak-mushroom',
    name: 'Burger Steak w/ Mushroom Sauce',
    description: 'Flame-grilled thick beef patty smothered in rich, creamy mushroom gravy and sliced mushrooms with rice.',
    basePrice: 129,
    effectivePrice: 129,
    category: 'sizzling-meals',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'pork-stir-fry',
    name: 'Pork Stir-Fry',
    description: 'Tender pork strips quick-wok tossed with crisp seasonal vegetables in a savory sweet-soy glaze.',
    basePrice: 139,
    effectivePrice: 139,
    category: 'sizzling-meals',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'chicken-fillet-creamy-white',
    name: 'Chicken Fillet w/ Creamy White Sauce',
    description: 'Golden crispy chicken breast fillet smothered in velvety rich creamy garlic white sauce.',
    basePrice: 135,
    effectivePrice: 135,
    category: 'sizzling-meals',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'sizzling-pork-gravy',
    name: 'Sizzling Pork with Gravy',
    description: 'Sizzling breaded pork chop served sizzling hot with our chef special savory brown gravy.',
    basePrice: 139,
    effectivePrice: 139,
    category: 'sizzling-meals',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },

  // --- Filipino Soups ---
  {
    id: 'chicken-tinola',
    name: 'Chicken Tinola',
    description: 'Heartwarming home-style ginger chicken soup simmered with green papaya, chayote, and aromatic chili leaves.',
    basePrice: 129,
    effectivePrice: 129,
    category: 'filipino-soups',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },
  {
    id: 'sinigang-na-bangus',
    name: 'Sinigang na Bangus',
    description: 'Classic tangy sour tamarind soup featuring fresh Dagupan milkfish belly, kangkong, radish, and tomatoes.',
    basePrice: 149,
    effectivePrice: 149,
    category: 'filipino-soups',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=700&auto=format&fit=crop&q=80',
    addOns: standardMealAddOns
  },

  // --- Add-ons (Available as Standalone Items Too) ---
  {
    id: 'item-plain-rice',
    name: 'Plain Rice',
    description: 'Extra cup of fragrant steamed white jasmine rice.',
    basePrice: 20,
    effectivePrice: 20,
    category: 'add-ons',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-fried-rice',
    name: 'Garlic Fried Rice',
    description: 'Fragrant toasted garlic sinangag rice cooked in savory oil.',
    basePrice: 25,
    effectivePrice: 25,
    category: 'add-ons',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-egg',
    name: 'Fried Egg',
    description: 'Fresh sunny-side up fried egg with a rich golden yolk.',
    basePrice: 15,
    effectivePrice: 15,
    category: 'add-ons',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'item-mushroom-soup',
    name: 'Mushroom Soup',
    description: 'Warm, creamy mushroom soup with savory herbs.',
    basePrice: 35,
    effectivePrice: 35,
    category: 'add-ons',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&auto=format&fit=crop&q=80'
  },

  // --- Cold Drinks ---
  {
    id: 'drink-icetea',
    name: 'House Blend Iced Tea',
    description: 'Crisp, sweet, and chilled iced tea infused with fresh calamansi & lemon.',
    basePrice: 30,
    effectivePrice: 30,
    category: 'drinks',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-lemonade',
    name: 'Fresh Lemonade',
    description: 'Zesty and naturally refreshing freshly squeezed cold lemonade.',
    basePrice: 35,
    effectivePrice: 35,
    category: 'drinks',
    popular: true,
    available: true,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-coke',
    name: 'Coca-Cola (Regular)',
    description: 'Ice-cold classic Coca-Cola can (330ml).',
    basePrice: 35,
    effectivePrice: 35,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-sprite',
    name: 'Sprite',
    description: 'Crisp lemon-lime refreshment in a chilled can (330ml).',
    basePrice: 35,
    effectivePrice: 35,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-royal',
    name: 'Royal Tru-Orange',
    description: 'Sweet and bubbly orange soda in a chilled can (330ml).',
    basePrice: 35,
    effectivePrice: 35,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-coke-zero',
    name: 'Coca-Cola Zero Sugar',
    description: 'Guilt-free classic cola taste with zero calories (330ml).',
    basePrice: 40,
    effectivePrice: 40,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-sprite-zero',
    name: 'Sprite Zero Sugar',
    description: 'Refreshing crisp lemon-lime taste with zero sugar (330ml).',
    basePrice: 40,
    effectivePrice: 40,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=700&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-royal-zero',
    name: 'Royal Zero Sugar',
    description: 'Refreshing fruit orange burst with zero added sugar (330ml).',
    basePrice: 40,
    effectivePrice: 40,
    category: 'drinks',
    popular: false,
    available: true,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=700&auto=format&fit=crop&q=80'
  }
];
