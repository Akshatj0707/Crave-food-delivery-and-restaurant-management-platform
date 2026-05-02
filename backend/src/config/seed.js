const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed users
    const passwordHash = await bcrypt.hash('password123', 12);

    const superAdminResult = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES ('superadmin@crave.com', $1, 'super_admin', 'Super', 'Admin', '9999999999', true)
      ON CONFLICT (email) DO UPDATE SET role = 'super_admin'
      RETURNING id
    `, [passwordHash]);

    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES ('admin@crave.com', $1, 'admin', 'Crave', 'Admin', '9888888888', true)
      ON CONFLICT (email) DO UPDATE SET role = 'admin'
      RETURNING id
    `, [passwordHash]);

    const partner1Result = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES ('partner1@crave.com', $1, 'partner', 'Raj', 'Sharma', '9777777771', true)
      ON CONFLICT (email) DO UPDATE SET role = 'partner'
      RETURNING id
    `, [passwordHash]);

    const partner2Result = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES ('partner2@crave.com', $1, 'partner', 'Priya', 'Patel', '9777777772', true)
      ON CONFLICT (email) DO UPDATE SET role = 'partner'
      RETURNING id
    `, [passwordHash]);

    const customer1Result = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_verified)
      VALUES ('customer@crave.com', $1, 'customer', 'Arjun', 'Verma', '9666666661', true)
      ON CONFLICT (email) DO UPDATE SET role = 'customer'
      RETURNING id
    `, [passwordHash]);

    // Seed Restaurants
    const rest1Result = await client.query(`
      INSERT INTO restaurants (
        owner_id, name, description, cuisine_types, 
        address_line1, city, state, pincode,
        avg_rating, total_ratings, avg_delivery_time, delivery_fee,
        supports_delivery, supports_takeaway, supports_dine_in, total_tables,
        is_verified, is_featured, is_open,
        logo_url, cover_image_url
      ) VALUES (
        $1, 'Spice Garden', 'Authentic North Indian cuisine with aromatic spices', 
        ARRAY['North Indian', 'Mughlai', 'Biryani'],
        'Shop 12, MG Road', 'Mumbai', 'Maharashtra', '400001',
        4.5, 1250, 35, 40.00,
        true, true, true, 12,
        true, true, true,
        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=400&fit=crop'
      ) ON CONFLICT DO NOTHING RETURNING id
    `, [partner1Result.rows[0].id]);

    const rest2Result = await client.query(`
      INSERT INTO restaurants (
        owner_id, name, description, cuisine_types,
        address_line1, city, state, pincode,
        avg_rating, total_ratings, avg_delivery_time, delivery_fee,
        supports_delivery, supports_takeaway, supports_dine_in, total_tables,
        is_verified, is_featured, is_open,
        logo_url, cover_image_url
      ) VALUES (
        $1, 'Pizza Paradise', 'Wood-fired pizzas and Italian classics',
        ARRAY['Italian', 'Pizza', 'Pasta'],
        '45 Linking Road', 'Mumbai', 'Maharashtra', '400050',
        4.3, 890, 25, 30.00,
        true, true, true, 8,
        true, true, true,
        'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop'
      ) ON CONFLICT DO NOTHING RETURNING id
    `, [partner2Result.rows[0].id]);

    const rest3Result = await client.query(`
      INSERT INTO restaurants (
        owner_id, name, description, cuisine_types,
        address_line1, city, state, pincode,
        avg_rating, total_ratings, avg_delivery_time, delivery_fee,
        supports_delivery, supports_takeaway, supports_dine_in, total_tables,
        is_verified, is_featured, is_open,
        logo_url, cover_image_url
      ) VALUES (
        $1, 'Burger Barn', 'Gourmet burgers stacked high',
        ARRAY['American', 'Burgers', 'Fast Food'],
        '22 Hill Road', 'Bandra', 'Maharashtra', '400050',
        4.1, 560, 20, 25.00,
        true, true, false, 0,
        true, false, true,
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=400&fit=crop'
      ) ON CONFLICT DO NOTHING RETURNING id
    `, [partner1Result.rows[0].id]);

    if (rest1Result.rows.length > 0) {
      const r1 = rest1Result.rows[0].id;

      // Menu categories for Spice Garden
      const cat1 = await client.query(`
        INSERT INTO menu_categories (restaurant_id, name, sort_order)
        VALUES ($1, 'Starters', 1) RETURNING id
      `, [r1]);
      const cat2 = await client.query(`
        INSERT INTO menu_categories (restaurant_id, name, sort_order)
        VALUES ($1, 'Main Course', 2) RETURNING id
      `, [r1]);
      const cat3 = await client.query(`
        INSERT INTO menu_categories (restaurant_id, name, sort_order)
        VALUES ($1, 'Biryani', 3) RETURNING id
      `, [r1]);
      const cat4 = await client.query(`
        INSERT INTO menu_categories (restaurant_id, name, sort_order)
        VALUES ($1, 'Breads', 4) RETURNING id
      `, [r1]);

      // Menu items
      await client.query(`
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_veg, is_featured, spice_level, image_url)
        VALUES
          ($1, $2, 'Paneer Tikka', 'Cottage cheese marinated in spices, grilled in tandoor', 280, true, true, 2, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop'),
          ($1, $2, 'Veg Seekh Kebab', 'Mixed vegetable kebabs on skewers', 220, true, false, 1, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop'),
          ($1, $2, 'Chicken Tikka', 'Boneless chicken marinated in yogurt and spices', 320, false, true, 2, 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&h=300&fit=crop'),
          ($1, $3, 'Butter Chicken', 'Tender chicken in rich tomato-butter gravy', 380, false, true, 1, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop'),
          ($1, $3, 'Dal Makhani', 'Black lentils slow-cooked with butter and cream', 280, true, false, 0, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop'),
          ($1, $3, 'Palak Paneer', 'Cottage cheese in smooth spinach gravy', 300, true, false, 1, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&h=300&fit=crop'),
          ($1, $4, 'Veg Dum Biryani', 'Aromatic basmati rice with vegetables', 320, true, true, 2, 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=400&h=300&fit=crop'),
          ($1, $4, 'Chicken Dum Biryani', 'Slow-cooked chicken with fragrant basmati rice', 420, false, true, 2, 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop'),
          ($1, $5, 'Butter Naan', 'Soft leavened bread baked in tandoor with butter', 50, true, false, 0, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop'),
          ($1, $5, 'Garlic Naan', 'Naan topped with garlic and herbs', 60, true, false, 0, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop')
      `, [r1, cat1.rows[0].id, cat2.rows[0].id, cat3.rows[0].id, cat4.rows[0].id]);

      // Tables for Spice Garden
      for (let i = 1; i <= 12; i++) {
        await client.query(`
          INSERT INTO restaurant_tables (restaurant_id, table_number, capacity)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [r1, `T${i}`, i <= 4 ? 2 : i <= 8 ? 4 : 6]);
      }
    }

    if (rest2Result.rows.length > 0) {
      const r2 = rest2Result.rows[0].id;
      const pcat1 = await client.query(`INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Pizzas', 1) RETURNING id`, [r2]);
      const pcat2 = await client.query(`INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Pasta', 2) RETURNING id`, [r2]);
      const pcat3 = await client.query(`INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Sides', 3) RETURNING id`, [r2]);

      await client.query(`
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_veg, is_featured, image_url)
        VALUES
          ($1, $2, 'Margherita', 'Classic tomato, fresh mozzarella, basil', 350, true, true, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop'),
          ($1, $2, 'Pepperoni', 'Loaded with premium pepperoni and mozzarella', 450, false, true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop'),
          ($1, $2, 'Farmhouse', 'Capsicum, onion, mushroom, corn', 400, true, false, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'),
          ($1, $3, 'Pasta Arrabbiata', 'Penne in spicy tomato sauce', 280, true, false, 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=400&h=300&fit=crop'),
          ($1, $3, 'Pasta Alfredo', 'Fettuccine in creamy white sauce', 300, true, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop'),
          ($1, $4, 'Garlic Bread', 'Toasted bread with garlic butter', 120, true, false, 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop'),
          ($1, $4, 'Caesar Salad', 'Crisp romaine, croutons, parmesan', 200, true, false, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop')
      `, [r2, pcat1.rows[0].id, pcat2.rows[0].id, pcat3.rows[0].id]);
    }

    if (rest3Result.rows.length > 0) {
      const r3 = rest3Result.rows[0].id;
      const bcat1 = await client.query(`INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Burgers', 1) RETURNING id`, [r3]);
      const bcat2 = await client.query(`INSERT INTO menu_categories (restaurant_id, name, sort_order) VALUES ($1, 'Sides', 2) RETURNING id`, [r3]);

      await client.query(`
        INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_veg, is_featured, image_url)
        VALUES
          ($1, $2, 'Classic Cheeseburger', 'Beef patty, cheddar, lettuce, tomato', 280, false, true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'),
          ($1, $2, 'Crispy Veg Burger', 'Crispy veggie patty with jalapeños', 220, true, true, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop'),
          ($1, $2, 'Double Stack Burger', 'Double beef patty, bacon, special sauce', 380, false, false, 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400&h=300&fit=crop'),
          ($1, $3, 'French Fries', 'Crispy golden fries with seasoning', 120, true, false, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop'),
          ($1, $3, 'Onion Rings', 'Golden crispy onion rings', 140, true, false, 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop'),
          ($1, $3, 'Milkshake', 'Thick creamy vanilla/chocolate/strawberry', 160, true, false, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop')
      `, [r3, bcat1.rows[0].id, bcat2.rows[0].id]);
    }

    // Business hours for all restaurants
    const restaurants = [
      rest1Result.rows[0]?.id,
      rest2Result.rows[0]?.id,
      rest3Result.rows[0]?.id
    ].filter(Boolean);

    for (const restId of restaurants) {
      for (let day = 0; day <= 6; day++) {
        await client.query(`
          INSERT INTO business_hours (restaurant_id, day_of_week, open_time, close_time, is_closed)
          VALUES ($1, $2, '10:00', '23:00', $3)
          ON CONFLICT (restaurant_id, day_of_week) DO NOTHING
        `, [restId, day, day === 1]); // Closed on Mondays
      }
    }

    // Customer address
    if (customer1Result.rows.length > 0) {
      await client.query(`
        INSERT INTO addresses (user_id, label, address_line1, city, state, pincode, is_default)
        VALUES ($1, 'Home', '101 Palm Street, Bandra West', 'Mumbai', 'Maharashtra', '400050', true)
        ON CONFLICT DO NOTHING
      `, [customer1Result.rows[0].id]);
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded successfully');
    console.log('');
    console.log('Demo Accounts:');
    console.log('  Super Admin: superadmin@crave.com / password123');
    console.log('  Admin:       admin@crave.com / password123');
    console.log('  Partner 1:   partner1@crave.com / password123');
    console.log('  Partner 2:   partner2@crave.com / password123');
    console.log('  Customer:    customer@crave.com / password123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

seed().catch(process.exit);
