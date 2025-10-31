import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Starting database initialization...")

    // Lista de todas as tabelas que precisam de políticas
    const tables = [
      "employees",
      "clients",
      "suppliers",
      "banks",
      "cash_flow",
      "extra_services",
      "supervision_records",
      "arquivo_geral",
      "login_credentials",
      "data_entries",
    ]

    for (const table of tables) {
      console.log(`[v0] Processing table: ${table}`)

      // Buscar políticas existentes
      const { data: policies } = await supabaseAdmin.rpc("get_policies", {
        table_name: table,
      })

      // Remover cada política
      if (policies && Array.isArray(policies)) {
        for (const policy of policies) {
          const dropSQL = `DROP POLICY IF EXISTS "${policy.policyname}" ON "${table}"`
          await supabaseAdmin.rpc("exec_sql", { query: dropSQL })
        }
      }

      const createPoliciesSQL = `
        CREATE POLICY "${table}_select_all" ON "${table}" FOR SELECT USING (true);
        CREATE POLICY "${table}_insert_all" ON "${table}" FOR INSERT WITH CHECK (true);
        CREATE POLICY "${table}_update_all" ON "${table}" FOR UPDATE USING (true);
        CREATE POLICY "${table}_delete_all" ON "${table}" FOR DELETE USING (true);
      `

      const { error: policyError } = await supabaseAdmin.rpc("exec_sql", {
        query: createPoliciesSQL,
      })

      if (policyError) {
        console.error(`[v0] Error creating policies for ${table}:`, policyError)
      }
    }

    console.log("[v0] Database initialization completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
    })
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
