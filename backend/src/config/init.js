// init.js — Run this once on Render after first deploy
// Command: node src/config/init.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const run = async () => {
  console.log('🔄 Running Crave database initialization...');
  console.log('   Connected to:', process.env.DATABASE_URL?.split('@')[1] || 'database');
  
  try {
    // Run migrate
    console.log('\n📦 Step 1: Running migrations...');
    const { execSync } = require('child_process');
    execSync('node src/config/migrate.js', { stdio: 'inherit' });
    
    // Run seed
    console.log('\n🌱 Step 2: Seeding demo data...');
    execSync('node src/config/seed.js', { stdio: 'inherit' });
    
    console.log('\n✅ Database initialization complete!');
    console.log('\nDemo accounts ready:');
    console.log('  Customer:   customer@crave.com / password123');
    console.log('  Partner:    partner1@crave.com / password123');
    console.log('  Admin:      admin@crave.com / password123');
  } catch (err) {
    console.error('❌ Init failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
