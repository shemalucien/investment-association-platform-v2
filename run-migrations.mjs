import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://neondb_owner:npg_0flubPYmSa3q@ep-shy-mountain-apgzhe1w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function runMigrations() {
  const pool = new Pool({ connectionString });
  
  try {
    console.log('Connecting to Neon database...');
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Run first migration - create tables
    console.log('\nRunning migration 01-create-tables.sql...');
    const sql1 = fs.readFileSync(path.join(process.cwd(), 'scripts', '01-create-tables.sql'), 'utf8');
    await client.query(sql1);
    console.log('✓ Tables created successfully');
    
    // Run second migration - seed data
    console.log('\nRunning migration 02-seed-data.sql...');
    const sql2 = fs.readFileSync(path.join(process.cwd(), 'scripts', '02-seed-data.sql'), 'utf8');
    await client.query(sql2);
    console.log('✓ Seed data inserted successfully');

    // Run notification migration
    console.log('\nRunning migration 05-add-notifications.sql...');
    const sql5 = fs.readFileSync(path.join(process.cwd(), 'scripts', '05-add-notifications.sql'), 'utf8');
    await client.query(sql5);
    console.log('✓ Notification table created successfully');
    
    client.release();
    console.log('\n✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
