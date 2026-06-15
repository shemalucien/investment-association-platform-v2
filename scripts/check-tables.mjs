import { Pool } from "@neondatabase/serverless"

// Use the Neon connection string directly
const DATABASE_URL = "postgresql://neondb_owner:npg_e12iLgOrkKHR@ep-shy-mountain-apgzhe1w-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
console.log("DATABASE_URL found:", DATABASE_URL.substring(0, 30) + "...")

const pool = new Pool({ connectionString: DATABASE_URL })

try {
  console.log("Checking database tables...")

  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `)

  console.log("Tables in database:")
  if (result.rows.length === 0) {
    console.log("No tables found. Database is empty.")
  } else {
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`)
    })
  }

  // Check if users table exists and has data
  try {
    const usersResult = await pool.query("SELECT COUNT(*) as count FROM users")
    console.log(`\nUsers table has ${usersResult.rows[0].count} records`)
  } catch (error) {
    console.log("\nUsers table does not exist or no access")
  }

  // Check if members table exists and has data
  try {
    const membersResult = await pool.query("SELECT COUNT(*) as count FROM members")
    console.log(`Members table has ${membersResult.rows[0].count} records`)
  } catch (error) {
    console.log("Members table does not exist or no access")
  }

} catch (error) {
  console.error("Error checking database:", error)
} finally {
  await pool.end()
}
