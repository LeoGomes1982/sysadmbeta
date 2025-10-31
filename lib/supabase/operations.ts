import { createClient } from "./client"

const supabase = createClient()

// Operações para funcionários
export const employeeOperations = {
  async create(employee: any) {
    const { data, error } = await supabase.from("employees").insert(employee).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("employees")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) throw error
  },
}

// Operações para credenciais de login
export const loginCredentialOperations = {
  async create(credential: any) {
    const { data, error } = await supabase.from("login_credentials").insert(credential).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("login_credentials")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase.from("login_credentials").delete().eq("id", id)

    if (error) throw error
  },
}

// Operações para compromissos
export const appointmentOperations = {
  async create(appointment: any) {
    const { data, error } = await supabase.from("appointments").insert(appointment).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from("appointments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) throw error
  },
}
