-- ==============================================================================
-- 🍲 AFOODABLE BITES - COMPLETE SUPABASE DATABASE SETUP & RESTORATION SCRIPT
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Paste & Run
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTION: AUTO-UPDATE updated_at TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DEFINITIONS
-- ==============================================================================

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: menu_items
CREATE TABLE IF NOT EXISTS menu_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  base_price numeric(10,2) NOT NULL,
  category text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  popular boolean DEFAULT false,
  available boolean DEFAULT true,
  image_url text,
  discount_price numeric(10,2),
  discount_start_date timestamptz,
  discount_end_date timestamptz,
  discount_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: variations (for flavor variants or size variations)
CREATE TABLE IF NOT EXISTS variations (
  id text PRIMARY KEY,
  menu_item_id text NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) DEFAULT 0,
  image text,
  created_at timestamptz DEFAULT now()
);

-- Table: add_ons (Extra rice, egg, soup, etc.)
CREATE TABLE IF NOT EXISTS add_ons (
  id text PRIMARY KEY,
  menu_item_id text NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  category text DEFAULT 'Add-ons',
  created_at timestamptz DEFAULT now()
);

-- Table: payment_methods (GCash, Maya, Bank Transfer)
CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow Public to Read All Data (Website Storefront)
DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view menu items" ON menu_items;
CREATE POLICY "Public can view menu items" ON menu_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view variations" ON variations;
CREATE POLICY "Public can view variations" ON variations FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view add_ons" ON add_ons;
CREATE POLICY "Public can view add_ons" ON add_ons FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view payment methods" ON payment_methods;
CREATE POLICY "Public can view payment methods" ON payment_methods FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
CREATE POLICY "Public can view site settings" ON site_settings FOR SELECT TO public USING (true);

-- Allow Public / Admin Full Management (For Admin Dashboard)
DROP POLICY IF EXISTS "Admin manage categories" ON categories;
CREATE POLICY "Admin manage categories" ON categories FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage menu items" ON menu_items;
CREATE POLICY "Admin manage menu items" ON menu_items FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage variations" ON variations;
CREATE POLICY "Admin manage variations" ON variations FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage add_ons" ON add_ons;
CREATE POLICY "Admin manage add_ons" ON add_ons FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage payment methods" ON payment_methods;
CREATE POLICY "Admin manage payment methods" ON payment_methods FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage site settings" ON site_settings;
CREATE POLICY "Admin manage site settings" ON site_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. TRIGGERS FOR AUTO UPDATED_AT
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_menu_items_updated_at ON menu_items;
CREATE TRIGGER trigger_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER trigger_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 6. SEED DATA - CLEAN PREVIOUS RECORDS
-- ==============================================================================

TRUNCATE TABLE variations CASCADE;
TRUNCATE TABLE add_ons CASCADE;
TRUNCATE TABLE menu_items CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE payment_methods CASCADE;
TRUNCATE TABLE site_settings CASCADE;

-- ------------------------------------------------------------------------------
-- 7. INSERT SITE SETTINGS
-- ------------------------------------------------------------------------------
INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'Afoodable Bites', 'text', 'Restaurant name'),
  ('site_logo', '/images/afodable-bites-logo.jpg', 'image', 'Website & brand logo URL'),
  ('site_description', 'Always Serving Hot! Sizzling Plates, Steaks, Hearty Rice Meals & Filipino Soups.', 'text', 'Site tagline and meta description'),
  ('currency', '₱', 'text', 'Currency symbol'),
  ('currency_code', 'PHP', 'text', 'ISO currency code'),
  ('welcome_page_config', '{"tagline":"Always Serving Hot!","buttonText":"ORDER NOW","slideDuration":3500,"autoSlide":true,"slides":[{"id":"slide-1","badge":"🎉 WEEKEND BARKADA PROMO","badgeColor":"bg-red-600 text-white","title":"Barkada Feast Special","subtitle":"Order 3 Sizzling Meals & Get 1 Free Drink + Mushroom Soup!","tagline":"Available every Saturday & Sunday","image":"https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80"},{"id":"slide-2","badge":"⏰ LUNCH RUSH HOUR","badgeColor":"bg-amber-500 text-black","title":"Lunch Sizzler Combo","subtitle":"Sizzling Pork Sisig + Extra Garlic Rice & Cold Drink for only ₱149!","tagline":"11:00 AM to 2:00 PM Daily","image":"https://images.unsplash.com/photo-1558030006-450675393462?w=1200&auto=format&fit=crop&q=80"},{"id":"slide-3","badge":"🎓 STUDENT BUDGET PROMO","badgeColor":"bg-emerald-600 text-white","title":"Budget Bites Meal","subtitle":"Steamed Siomai Rice + Cold House Blend Iced Tea for ₱89 Only!","tagline":"Pang-masa sarap everyday","image":"https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=1200&auto=format&fit=crop&q=80"},{"id":"slide-4","badge":"🎸 RESTO EVENT NIGHT","badgeColor":"bg-purple-600 text-white","title":"Live Acoustic Dinner Nights","subtitle":"Chill and enjoy your hot sizzling favorites with live acoustic music!","tagline":"Every Friday & Saturday • 6:00 PM onwards","image":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80"},{"id":"slide-5","badge":"🍱 PARTY TRAYS & CATERING","badgeColor":"bg-orange-600 text-white","title":"Events & Party Trays","subtitle":"Large pans of Sizzling Sisig, Stir-Fry & Chicken Fillet for your celebrations!","tagline":"Book your orders in advance","image":"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80"}]}', 'text', 'Welcome page promotional slides and display configurations')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ------------------------------------------------------------------------------
-- 8. INSERT CATEGORIES
-- ------------------------------------------------------------------------------
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('sizzling-meals', 'Sizzling & Rice Meals', '🍳', 1, true),
  ('filipino-soups', 'Filipino Soups', '🍲', 2, true),
  ('drinks', 'Cold Drinks', '🥤', 3, true),
  ('add-ons', 'Add-ons & Extras', '🍚', 4, true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 9. INSERT MENU ITEMS
-- ------------------------------------------------------------------------------

-- Sizzling & Rice Meals
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  ('sizzling-pork-sisig', 'Sizzling Pork Sisig', 'Crispy and savory minced pork seasoned with onions, chili, calamansi, and topped with fresh egg on a smoking hot plate.', 139.00, 'sizzling-meals', true, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80'),
  ('garlic-pepper-steak', 'Garlic Pepper Steak', 'Juicy and tender beef patties draped in aromatic toasted garlic and black pepper sauce, served with steaming rice.', 149.00, 'sizzling-meals', true, true, 'https://images.unsplash.com/photo-1558030006-450675393462?w=700&auto=format&fit=crop&q=80'),
  ('siomai-rice', 'Siomai Rice', '4 pcs succulent steamed pork & shrimp siomai paired with fragrant garlic rice, chili garlic sauce, and calamansi.', 75.00, 'sizzling-meals', true, true, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=700&auto=format&fit=crop&q=80'),
  ('burger-steak-mushroom', 'Burger Steak w/ Mushroom Sauce', 'Flame-grilled thick beef patty smothered in rich, creamy mushroom gravy and sliced mushrooms with rice.', 129.00, 'sizzling-meals', true, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80'),
  ('pork-stir-fry', 'Pork Stir-Fry', 'Tender pork strips quick-wok tossed with crisp seasonal vegetables in a savory sweet-soy glaze.', 139.00, 'sizzling-meals', false, true, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700&auto=format&fit=crop&q=80'),
  ('chicken-fillet-creamy-white', 'Chicken Fillet w/ Creamy White Sauce', 'Golden crispy chicken breast fillet smothered in velvety rich creamy garlic white sauce.', 135.00, 'sizzling-meals', true, true, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=700&auto=format&fit=crop&q=80'),
  ('sizzling-pork-gravy', 'Sizzling Pork with Gravy', 'Sizzling breaded pork chop served sizzling hot with our chef special savory brown gravy.', 139.00, 'sizzling-meals', false, true, 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=700&auto=format&fit=crop&q=80');

-- Filipino Soups
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  ('chicken-tinola', 'Chicken Tinola', 'Heartwarming home-style ginger chicken soup simmered with green papaya, chayote, and aromatic chili leaves.', 129.00, 'filipino-soups', true, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&auto=format&fit=crop&q=80'),
  ('sinigang-na-bangus', 'Sinigang na Bangus', 'Classic tangy sour tamarind soup featuring fresh Dagupan milkfish belly, kangkong, radish, and tomatoes.', 149.00, 'filipino-soups', true, true, 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=700&auto=format&fit=crop&q=80');

-- Standalone Add-ons
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  ('item-plain-rice', 'Plain Rice', 'Extra cup of fragrant steamed white jasmine rice.', 20.00, 'add-ons', false, true, 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=700&auto=format&fit=crop&q=80'),
  ('item-fried-rice', 'Garlic Fried Rice', 'Fragrant toasted garlic sinangag rice cooked in savory oil.', 25.00, 'add-ons', true, true, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700&auto=format&fit=crop&q=80'),
  ('item-egg', 'Fried Egg', 'Fresh sunny-side up fried egg with a rich golden yolk.', 15.00, 'add-ons', false, true, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=700&auto=format&fit=crop&q=80'),
  ('item-mushroom-soup', 'Mushroom Soup', 'Warm, creamy mushroom soup with savory herbs.', 35.00, 'add-ons', false, true, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=700&auto=format&fit=crop&q=80');

-- Cold Drinks
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  ('drink-icetea', 'House Blend Iced Tea', 'Crisp, sweet, and chilled iced tea infused with fresh calamansi & lemon.', 30.00, 'drinks', true, true, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=700&auto=format&fit=crop&q=80'),
  ('drink-lemonade', 'Fresh Lemonade', 'Zesty and naturally refreshing freshly squeezed cold lemonade.', 35.00, 'drinks', true, true, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=700&auto=format&fit=crop&q=80'),
  ('drink-coke', 'Coca-Cola (Regular)', 'Ice-cold classic Coca-Cola can (330ml).', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=700&auto=format&fit=crop&q=80'),
  ('drink-sprite', 'Sprite', 'Crisp lemon-lime refreshment in a chilled can (330ml).', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=700&auto=format&fit=crop&q=80'),
  ('drink-royal', 'Royal Tru-Orange', 'Sweet and bubbly orange soda in a chilled can (330ml).', 35.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=700&auto=format&fit=crop&q=80'),
  ('drink-coke-zero', 'Coca-Cola Zero Sugar', 'Guilt-free classic cola taste with zero calories (330ml).', 40.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=700&auto=format&fit=crop&q=80'),
  ('drink-sprite-zero', 'Sprite Zero Sugar', 'Refreshing crisp lemon-lime taste with zero sugar (330ml).', 40.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=700&auto=format&fit=crop&q=80'),
  ('drink-royal-zero', 'Royal Zero Sugar', 'Refreshing fruit orange burst with zero added sugar (330ml).', 40.00, 'drinks', false, true, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=700&auto=format&fit=crop&q=80');

-- ------------------------------------------------------------------------------
-- 10. INSERT REUSABLE ADD-ONS FOR ALL SIZZLING & SOUP MEALS
-- ------------------------------------------------------------------------------
INSERT INTO add_ons (id, menu_item_id, name, price, category)
SELECT 
  'addon-plain-rice-' || m.id, 
  m.id, 
  'Plain Rice', 
  20.00, 
  'Add-ons'
FROM menu_items m 
WHERE m.category IN ('sizzling-meals', 'filipino-soups');

INSERT INTO add_ons (id, menu_item_id, name, price, category)
SELECT 
  'addon-fried-rice-' || m.id, 
  m.id, 
  'Garlic Fried Rice', 
  25.00, 
  'Add-ons'
FROM menu_items m 
WHERE m.category IN ('sizzling-meals', 'filipino-soups');

INSERT INTO add_ons (id, menu_item_id, name, price, category)
SELECT 
  'addon-egg-' || m.id, 
  m.id, 
  'Fried Egg (Sunny-side Up)', 
  15.00, 
  'Add-ons'
FROM menu_items m 
WHERE m.category IN ('sizzling-meals', 'filipino-soups');

INSERT INTO add_ons (id, menu_item_id, name, price, category)
SELECT 
  'addon-mushroom-soup-' || m.id, 
  m.id, 
  'Mushroom Soup', 
  35.00, 
  'Add-ons'
FROM menu_items m 
WHERE m.category IN ('sizzling-meals', 'filipino-soups');

-- ------------------------------------------------------------------------------
-- 11. INSERT PAYMENT METHODS (GCash / InstaPay & Cash on Delivery)
-- ------------------------------------------------------------------------------
INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, active, sort_order) VALUES
  ('payment-gcash', 'GCash / InstaPay', '0905 293 1408', 'Afoodable Bites', '/images/payment-qr/gcash-qr-code.jpg', true, 1),
  ('payment-cod', 'Cash on Delivery (COD) / Counter', 'Cash Payment', 'Pay upon delivery / at counter', '', true, 2)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  account_number = EXCLUDED.account_number, 
  account_name = EXCLUDED.account_name, 
  qr_code_url = EXCLUDED.qr_code_url,
  active = EXCLUDED.active;

-- ==============================================================================
-- 12. STORAGE BUCKET FOR ADMIN IMAGE UPLOADS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policy (Allow public reads & uploads for admin)
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public can upload menu images" ON storage.objects;
CREATE POLICY "Public can upload menu images"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public can update menu images" ON storage.objects;
CREATE POLICY "Public can update menu images"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Public can delete menu images" ON storage.objects;
CREATE POLICY "Public can delete menu images"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'menu-images');

-- ==============================================================================
-- ✅ SETUP COMPLETE! Your Afoodable Bites database is now fully populated.
-- ==============================================================================
