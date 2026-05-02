const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table (unified for all roles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'partner', 'admin', 'super_admin')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        google_id VARCHAR(255),
        facebook_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Customer addresses
    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(50) DEFAULT 'Home',
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Restaurants
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine_types TEXT[] DEFAULT '{}',
        logo_url TEXT,
        cover_image_url TEXT,
        address_line1 VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        phone VARCHAR(20),
        email VARCHAR(255),
        avg_rating DECIMAL(3,2) DEFAULT 0,
        total_ratings INTEGER DEFAULT 0,
        avg_delivery_time INTEGER DEFAULT 30,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        supports_delivery BOOLEAN DEFAULT true,
        supports_takeaway BOOLEAN DEFAULT true,
        supports_dine_in BOOLEAN DEFAULT false,
        total_tables INTEGER DEFAULT 0,
        is_open BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Business hours
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_hours (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        open_time TIME NOT NULL,
        close_time TIME NOT NULL,
        is_closed BOOLEAN DEFAULT false,
        UNIQUE(restaurant_id, day_of_week)
      );
    `);

    // Menu categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Menu items
    await client.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        image_url TEXT,
        is_veg BOOLEAN DEFAULT true,
        is_available BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        spice_level INTEGER DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
        preparation_time INTEGER DEFAULT 20,
        tags TEXT[] DEFAULT '{}',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Item customizations
    await client.query(`
      CREATE TABLE IF NOT EXISTS item_customizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) DEFAULT 'single' CHECK (type IN ('single', 'multiple')),
        is_required BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS customization_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customization_id UUID REFERENCES item_customizations(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        extra_price DECIMAL(10,2) DEFAULT 0,
        is_default BOOLEAN DEFAULT false
      );
    `);

    // Tables for dine-in
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        table_number VARCHAR(20) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 2,
        is_available BOOLEAN DEFAULT true,
        qr_code TEXT,
        UNIQUE(restaurant_id, table_number)
      );
    `);

    // Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
        service_mode VARCHAR(20) NOT NULL CHECK (service_mode IN ('delivery', 'takeaway', 'dine_in')),
        status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
          'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery',
          'delivered', 'cancelled', 'refunded'
        )),
        delivery_address_id UUID REFERENCES addresses(id),
        table_id UUID REFERENCES restaurant_tables(id),
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        estimated_time INTEGER,
        actual_delivery_time TIMESTAMP,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
        stripe_payment_intent_id VARCHAR(255),
        stripe_charge_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Order items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
        item_name VARCHAR(255) NOT NULL,
        item_price DECIMAL(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        customizations JSONB DEFAULT '[]',
        item_total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Reviews
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        reply TEXT,
        reply_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT false,
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

migrate().catch(process.exit);
