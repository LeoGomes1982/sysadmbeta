import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function executeSQL(sql: string) {
  const { data, error } = await supabaseAdmin.rpc("exec_sql", {
    query: sql,
  })

  if (error) {
    console.error("[v0] SQL execution error:", error)
    throw error
  }

  return data
}

export async function disableRLS(tableName: string) {
  return executeSQL(`ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;`)
}

export async function enableRLS(tableName: string) {
  return executeSQL(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`)
}

export async function createPermissivePolicy(tableName: string, operation: string) {
  const policyName = `${tableName}_${operation}_all`
  const sql = `
    DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";
    CREATE POLICY "${policyName}" ON "${tableName}" 
    FOR ${operation.toUpperCase()} 
    ${operation.toLowerCase() === "select" || operation.toLowerCase() === "update" || operation.toLowerCase() === "delete" ? "USING (true)" : ""}
    ${operation.toLowerCase() === "insert" || operation.toLowerCase() === "update" ? "WITH CHECK (true)" : ""};
  `
  return executeSQL(sql)
}
