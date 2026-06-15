import { Pool } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const equalsIndex = trimmed.indexOf("=")
    if (equalsIndex === -1) continue
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

try {
  console.log("Applying penalties migration...")

  const sql = fs.readFileSync(path.join(process.cwd(), "scripts", "06-add-penalties.sql"), "utf8")

  await pool.query(sql)

  console.log("✅ Penalties migration applied successfully.")
} finally {
  await pool.end()
}
