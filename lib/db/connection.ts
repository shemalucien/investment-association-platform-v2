import { Pool } from "@neondatabase/serverless"

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("[v0] DATABASE_URL is not defined")
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now()
  try {
    const result = await getPool().query(text, params)
    const duration = Date.now() - start

    console.log("[v0] Executed query", {
      text: text.substring(0, 50),
      duration,
      rows: result.rowCount ?? result.rows.length,
    })

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? result.rows.length,
    }
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  }
}

export async function transaction<T>(
  callback: (client: { query: (text: string, params?: any[]) => Promise<any> }) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query("BEGIN")
    const result = await callback({
      query: (text: string, params?: any[]) => client.query(text, params),
    })
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
