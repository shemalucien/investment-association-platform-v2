import { Pool } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const equalsIndex = trimmed.indexOf("=")

    if (equalsIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, equalsIndex).trim()
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "")

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"))

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the environment or .env.local")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const migrations = [
  "01-create-tables.sql",
  "02-seed-data.sql",
  "03-social-contributions.sql",
  "04-audit-triggers.sql",
  "05-add-notifications.sql"
]

try {
  console.log("Running database migrations...")

  for (const migration of migrations) {
    console.log(`Running ${migration}...`)
    const sql = fs.readFileSync(path.join(process.cwd(), "scripts", migration), "utf8")
    try {
      await pool.query(sql)
      console.log(`${migration} completed successfully.`)
    } catch (error) {
      console.error(`${migration} failed:`, error.message)
      // Continue with other migrations even if one fails
    }
  }

  console.log("Migration process completed.")
} catch (error) {
  console.error("Migration error:", error)
  process.exit(1)
} finally {
  await pool.end()
}
