import { Pool } from "@neondatabase/serverless"

// Use the Neon connection string directly
const DATABASE_URL = "postgresql://neondb_owner:npg_e12iLgOrkKHR@ep-shy-mountain-apgzhe1w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

const pool = new Pool({ connectionString: DATABASE_URL })

try {
  console.log("Checking user details including is_active...")

  const result = await pool.query(`
    SELECT id, email, full_name, role, password_hash, is_active
    FROM users
    LIMIT 10
  `)

  console.log("Users in database:")
  result.rows.forEach(row => {
    console.log(`- Email: ${row.email}`)
    console.log(`  Name: ${row.full_name}`)
    console.log(`  Role: ${row.role}`)
    console.log(`  Is Active: ${row.is_active}`)
    console.log(`  Password Hash: ${row.password_hash.substring(0, 20)}...`)
    console.log()
  })

} catch (error) {
  console.error("Error checking users:", error)
} finally {
  await pool.end()
}
