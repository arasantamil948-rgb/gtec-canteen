import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

async function seedAdmin() {
  const hashed = await bcrypt.hash('admin123', 10);
  await query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
    ['Admin', 'admin@gtec.ac.in', hashed, 'admin', true]
  );
  await query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;`,
    ['Admin', 'admin', hashed, 'admin', true]
  );
  console.log('Default admin accounts initialized successfully.');
  const users = await query('SELECT id, name, email, role FROM users;');
  console.log('Users in database:', users.rows);
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('Seed admin error:', err);
  process.exit(1);
});
