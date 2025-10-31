// Database operations for Supabase tables
// Last updated: 2025-01-21

import { createClient } from "@/lib/supabase/client"

export const employeeOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(employee: {
    nome: string
    cpf?: string
    rg?: string
    rg_orgao_emissor?: string
    rg_uf?: string
    rg_data_expedicao?: string
    sexo?: string
    raca?: string
    nome_pai?: string
    nome_mae?: string
    nacionalidade?: string
    grau_instrucao?: string
    estado_civil?: string
    nome_conjuge?: string
    pis?: string
    ctps_numero?: string
    ctps_serie?: string
    ctps_uf?: string
    cnh_numero?: string
    cnh_categoria?: string
    cnh_data_vencimento?: string
    cep?: string
    rua?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    funcao?: string
    carga_horaria?: string
    horario_trabalho?: string
    reemprego?: boolean
    tipo_contrato?: string
    utilizaValeTransporte?: boolean
    quantidade_vale_transporte?: number
    nivel?: string
    departamento?: string
    empresa?: string
    cargo?: string
    data_admissao?: string
    data_nascimento?: string
    salario?: number
    telefone?: string
    email?: string
    endereco?: string
    observacoes?: string
    status?: string
    data_limite?: string
    points?: number
  }) {
    console.log("[v0] employeeOperations.create - Iniciando criação de funcionário")
    console.log("[v0] Dados recebidos:", JSON.stringify(employee, null, 2))

    const supabase = createClient()

    // Validar campos obrigatórios
    if (!employee.nome || !employee.nome.trim()) {
      const error = new Error("Nome é obrigatório")
      console.error("[v0] Erro de validação:", error.message)
      throw error
    }

    if (!employee.data_admissao) {
      const error = new Error("Data de admissão é obrigatória")
      console.error("[v0] Erro de validação:", error.message)
      throw error
    }

    const employeeData = {
      nome: employee.nome,
      cpf: employee.cpf,
      rg: employee.rg,
      rg_orgao_emissor: employee.rg_orgao_emissor,
      rg_uf: employee.rg_uf,
      rg_data_expedicao: employee.rg_data_expedicao,
      sexo: employee.sexo,
      raca: employee.raca,
      nome_pai: employee.nome_pai,
      nome_mae: employee.nome_mae,
      nacionalidade: employee.nacionalidade,
      grau_instrucao: employee.grau_instrucao,
      estado_civil: employee.estado_civil,
      nome_conjuge: employee.nome_conjuge,
      pis: employee.pis,
      ctps_numero: employee.ctps_numero,
      ctps_serie: employee.ctps_serie,
      ctps_uf: employee.ctps_uf,
      cnh_numero: employee.cnh_numero,
      cnh_categoria: employee.cnh_categoria,
      cnh_data_vencimento: employee.cnh_data_vencimento,
      cep: employee.cep,
      rua: employee.rua,
      numero: employee.numero,
      complemento: employee.complemento,
      bairro: employee.bairro,
      cidade: employee.cidade,
      estado: employee.estado,
      funcao: employee.funcao,
      carga_horaria: employee.carga_horaria,
      horario_trabalho: employee.horario_trabalho,
      reemprego: employee.reemprego,
      tipo_contrato: employee.tipo_contrato,
      utiliza_vale_transporte: employee.utilizaValeTransporte, // Converter camelCase para snake_case
      quantidade_vale_transporte: employee.quantidade_vale_transporte,
      nivel: employee.nivel,
      departamento: employee.departamento,
      empresa: employee.empresa || "GA SERVIÇOS",
      cargo: employee.cargo,
      data_admissao: employee.data_admissao,
      data_nascimento: employee.data_nascimento,
      salario: employee.salario,
      telefone: employee.telefone,
      email: employee.email,
      endereco: employee.endereco,
      observacoes: employee.observacoes,
      status: employee.status || "Ativo",
      data_limite: employee.data_limite,
      points: employee.points !== undefined ? employee.points : 10,
    }

    console.log("[v0] Dados formatados para inserção:", JSON.stringify(employeeData, null, 2))

    const { data, error } = await supabase.from("employees").insert(employeeData).select().single()

    if (error) {
      console.error("[v0] Erro do Supabase ao criar funcionário:")
      console.error("[v0] Código:", error.code)
      console.error("[v0] Mensagem:", error.message)
      console.error("[v0] Detalhes:", error.details)
      console.error("[v0] Hint:", error.hint)

      // Criar mensagem de erro mais amigável
      let friendlyMessage = "Erro ao cadastrar funcionário: "

      if (error.code === "23505") {
        friendlyMessage += "Já existe um funcionário com este CPF cadastrado."
      } else if (error.code === "23502") {
        friendlyMessage += "Campo obrigatório não preenchido. Verifique todos os campos marcados com *."
      } else if (error.message.includes("violates")) {
        friendlyMessage += "Dados inválidos. Verifique se todos os campos estão preenchidos corretamente."
      } else {
        friendlyMessage += error.message
      }

      const enhancedError = new Error(friendlyMessage)
      ;(enhancedError as any).originalError = error
      throw enhancedError
    }

    console.log("[v0] Funcionário criado com sucesso:", data.id)
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      nome: string
      cpf?: string
      rg?: string
      rg_orgao_emissor?: string
      rg_uf?: string
      rg_data_expedicao?: string
      sexo?: string
      raca?: string
      nome_pai?: string
      nome_mae?: string
      nacionalidade?: string
      grau_instrucao?: string
      estado_civil?: string
      nome_conjuge?: string
      pis?: string
      ctps_numero?: string
      ctps_serie?: string
      ctps_uf?: string
      cnh_numero?: string
      cnh_categoria?: string
      cnh_data_vencimento?: string
      cep?: string
      rua?: string
      numero?: string
      complemento?: string
      bairro?: string
      cidade?: string
      estado?: string
      funcao?: string
      carga_horaria?: string
      horario_trabalho?: string
      reemprego?: boolean
      tipo_contrato?: string
      utilizaValeTransporte?: boolean
      quantidade_vale_transporte?: number
      nivel?: string
      departamento?: string
      empresa?: string
      cargo?: string
      data_admissao?: string
      data_nascimento?: string
      salario?: number
      telefone?: string
      email?: string
      endereco?: string
      observacoes?: string
      status: string
      data_limite?: string
      points?: number
    }>,
  ) {
    const supabase = createClient()

    const mappedUpdates = { ...updates }
    if ("utilizaValeTransporte" in mappedUpdates) {
      ;(mappedUpdates as any).utiliza_vale_transporte = mappedUpdates.utilizaValeTransporte
      delete (mappedUpdates as any).utilizaValeTransporte
    }

    const { data, error } = await supabase
      .from("employees")
      .update({ ...mappedUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("employees").delete().eq("id", id)
    if (error) throw error
  },

  async getByCpf(cpf: string) {
    const supabase = createClient()
    const { data, error } = await supabase.from("employees").select("*").eq("cpf", cpf).single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },
}

export const clientSupplierOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("clients_suppliers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(clientSupplier: {
    name: string
    fantasy_name: string
    legal_representative: string
    legal_representative_cpf: string
    type: "cliente" | "fornecedor"
    document: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip_code: string
    notes?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("clients_suppliers").insert(clientSupplier).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      name: string
      fantasy_name: string
      legal_representative: string
      legal_representative_cpf: string
      type: "cliente" | "fornecedor"
      document: string
      email: string
      phone: string
      address: string
      city: string
      state: string
      zip_code: string
      notes?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("clients_suppliers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("clients_suppliers").delete().eq("id", id)
    if (error) throw error
  },
}

export const extraServiceOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("extra_services").select("*").order("date", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(service: {
    executor_type: "funcionario" | "externo"
    executor_name: string
    service: string
    location: string
    supervisor: string
    date: string
    hours: "4" | "6" | "8" | "12"
    function: "Guarda" | "Limpeza"
    pix_key: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("extra_services").insert(service).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      executor_type: "funcionario" | "externo"
      executor_name: string
      service: string
      location: string
      supervisor: string
      date: string
      hours: "4" | "6" | "8" | "12"
      function: "Guarda" | "Limpeza"
      pix_key: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("extra_services")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("extra_services").delete().eq("id", id)
    if (error) throw error
  },
}

export const dataEntryOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("data_entries").select("*").order("date", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(entry: {
    type: "rescisao" | "gasto-extra" | "compras-extras" | "servicos-extras" | "uniforme-epi"
    date: string
    value: number
    description?: string
    uniform_item?: string
    client_id?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("data_entries").insert(entry).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      type: "rescisao" | "gasto-extra" | "compras-extras" | "servicos-extras" | "uniforme-epi"
      date: string
      value: number
      description?: string
      uniform_item?: string
      client_id?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("data_entries")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("data_entries").delete().eq("id", id)
    if (error) throw error
  },
}

export const loginOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("login_credentials")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(login: {
    name: string
    login: string
    password: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("login_credentials").insert(login).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      name: string
      login: string
      password: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase.from("login_credentials").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("login_credentials").delete().eq("id", id)

    if (error) throw error
  },
}

export const appointmentOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("appointments").select("*").order("data", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(appointment: {
    titulo: string
    descricao?: string
    data: string
    hora: string
    tipo: string
    responsaveis?: string[]
    prioridade?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("appointments").insert(appointment).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      titulo: string
      descricao?: string
      data: string
      hora: string
      tipo: string
      responsaveis?: string[]
      prioridade?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) throw error
  },
}

export const employeeRelatedOperations = {
  // Dependentes
  dependents: {
    async getByEmployeeId(employeeId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_dependents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(dependent: {
      employee_id: string
      nome: string
      parentesco: string
      data_nascimento?: string
      cpf?: string
    }) {
      const supabase = createClient()
      const { data, error } = await supabase.from("employee_dependents").insert(dependent).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("employee_dependents").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Histórico
  history: {
    async getByEmployeeId(employeeId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_history")
        .select("*")
        .eq("employee_id", employeeId)
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(history: {
      employee_id: string
      tipo: "positivo" | "negativo"
      descricao: string
      data: string
    }) {
      const supabase = createClient()
      const { data, error } = await supabase.from("employee_history").insert(history).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("employee_history").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Avaliações
  evaluations: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_evaluations")
        .select("*, employee:employees(nome)")
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async getByEmployeeId(employeeId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_evaluations")
        .select("*")
        .eq("employee_id", employeeId)
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(evaluation: {
      employee_id: string
      pontuacao: number
      data: string
      observacoes?: string
      responses?: Record<number, number>
    }) {
      const supabase = createClient()
      const { data, error } = await supabase.from("employee_evaluations").insert(evaluation).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("employee_evaluations").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Fiscalizações
  inspections: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_inspections")
        .select("*, employees(nome)")
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async getByEmployeeId(employeeId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_inspections")
        .select("*")
        .eq("employee_id", employeeId)
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(inspection: {
      employee_id: string
      pontuacao: number
      data: string
      observacoes?: string
    }) {
      const supabase = createClient()
      const { data, error } = await supabase.from("employee_inspections").insert(inspection).select().single()

      if (error) throw error
      return data
    },

    async createLocationInspection(inspection: {
      location: string
      pontuacao: number
      data: string
      observacoes?: string
      inspector: string
    }) {
      const supabase = createClient()

      console.log("[v0] Salvando fiscalização de local no Supabase...")
      console.log("[v0] Dados da fiscalização:", inspection)

      // Salvar diretamente na tabela employee_inspections com um campo especial para locais

      const { data, error } = await supabase
        .from("employee_inspections")
        .insert({
          employee_id: null, // Null para fiscalizações de local
          pontuacao: inspection.pontuacao,
          data: inspection.data,
          observacoes: `Local: ${inspection.location}\nInspetor: ${inspection.inspector}\n${inspection.observacoes || ""}`,
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Erro ao salvar fiscalização:", error)
        throw error
      }

      console.log("[v0] Fiscalização de local salva com sucesso!")
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("employee_inspections").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Sanções
  sanctions: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_sanctions")
        .select("*, employees(nome)")
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async getByEmployeeId(employeeId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("employee_sanctions")
        .select("*")
        .eq("employee_id", employeeId)
        .order("data", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(sanction: {
      employee_id: string
      tipo: string
      descricao: string
      data: string
    }) {
      const supabase = createClient()
      const { data, error } = await supabase.from("employee_sanctions").insert(sanction).select().single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("employee_sanctions").delete().eq("id", id)
      if (error) throw error
    },
  },
}

export const projectOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(project: {
    nome: string
    cliente: string
    data_inicio: string
    data_fim?: string
    status: string
    valor?: number
    descricao?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").insert(project).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      nome: string
      cliente: string
      data_inicio: string
      data_fim?: string
      status: string
      valor?: number
      descricao?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) throw error
  },
}

export const positionOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("positions").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(position: {
    nome: string
    nivel: string
    salario_base?: number
    beneficios?: string
    requisitos?: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("positions").insert(position).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      nome: string
      nivel: string
      salario_base?: number
      beneficios?: string
      requisitos?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase.from("positions").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("positions").delete().eq("id", id)

    if (error) throw error
  },
}

export const fileOperations = {
  // Operações para pastas
  folders: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase.from("folders").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(folder: { name: string; parent_id?: string; is_protected?: boolean; password_hash?: string }) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("folders")
        .insert({
          name: folder.name,
          parent_id: folder.parent_id || null,
          is_protected: folder.is_protected || false,
          password_hash: folder.password_hash || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<{ name: string; is_protected: boolean; password_hash: string }>) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("folders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("folders").delete().eq("id", id)
      if (error) throw error
    },
  },

  // Operações para arquivos
  files: {
    async getAll() {
      const supabase = createClient()
      const { data, error } = await supabase.from("files").select("*").order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async getByFolderId(folderId: string) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async getLooseFiles() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .is("folder_id", null)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    },

    async create(file: {
      name: string
      folder_id?: string
      file_type: "texto" | "link" | "upload"
      content?: string
      url?: string
      file_size?: string
      original_filename?: string
    }) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("files")
        .insert({
          name: file.name,
          folder_id: file.folder_id || null,
          file_type: file.file_type,
          content: file.content || null,
          url: file.url || null,
          file_size: file.file_size || null,
          original_filename: file.original_filename || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(
      id: string,
      updates: Partial<{
        name: string
        folder_id?: string
        file_type: "texto" | "link" | "upload"
        content?: string
        url?: string
        file_size?: string
        original_filename?: string
      }>,
    ) {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("files")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id: string) {
      const supabase = createClient()
      const { error } = await supabase.from("files").delete().eq("id", id)
      if (error) throw error
    },
  },
}

export const admissionProgressOperations = {
  async getByUserIdentifier(userIdentifier: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("admission_progress")
      .select("*")
      .eq("user_identifier", userIdentifier)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  async create(progress: {
    user_identifier: string
    step_1_completed?: boolean
    step_2_completed?: boolean
    step_3_completed?: boolean
    step_4_completed?: boolean
    current_step?: number
    progress_percentage?: number
    process_started?: boolean
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("admission_progress").insert(progress).select().single()

    if (error) throw error
    return data
  },

  async update(
    userIdentifier: string,
    updates: Partial<{
      step_1_completed: boolean
      step_2_completed: boolean
      step_3_completed: boolean
      step_4_completed: boolean
      current_step: number
      progress_percentage: number
      process_started: boolean
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("admission_progress")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_identifier", userIdentifier)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async upsert(progress: {
    user_identifier: string
    step_1_completed?: boolean
    step_2_completed?: boolean
    step_3_completed?: boolean
    step_4_completed?: boolean
    current_step?: number
    progress_percentage?: number
    process_started?: boolean
  }) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("admission_progress")
      .upsert(progress, { onConflict: "user_identifier" })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(userIdentifier: string) {
    const supabase = createClient()
    const { error } = await supabase.from("admission_progress").delete().eq("user_identifier", userIdentifier)
    if (error) throw error
  },
}

export const recalculateEmployeePoints = async (employeeId: string) => {
  const supabase = createClient()

  console.log("[v0] Recalculando pontos para funcionário:", employeeId)

  // Get employee base points (10)
  let totalPoints = 10
  console.log("[v0] Pontos base:", totalPoints)

  // Get all history records
  const { data: historyData } = await supabase.from("employee_history").select("*").eq("employee_id", employeeId)

  // Calculate points from history
  if (historyData) {
    console.log("[v0] Históricos encontrados:", historyData.length)
    historyData.forEach((record: any) => {
      if (record.tipo === "positivo") {
        totalPoints += 5
        console.log("[v0] Histórico positivo: +5 pontos")
      } else if (record.tipo === "negativo") {
        totalPoints -= 10
        console.log("[v0] Histórico negativo: -10 pontos")
      }
    })
  }

  // Get all evaluations
  const { data: evaluationsData } = await supabase
    .from("employee_evaluations")
    .select("*")
    .eq("employee_id", employeeId)

  // Calculate points from evaluations (first digit of percentage)
  if (evaluationsData) {
    console.log("[v0] Avaliações encontradas:", evaluationsData.length)
    evaluationsData.forEach((evaluation: any) => {
      const score = evaluation.pontuacao || 0
      const firstDigit = Math.floor(score / 10)
      totalPoints += firstDigit
      console.log(`[v0] Avaliação ${score}%: +${firstDigit} pontos`)
    })
  }

  // Get all inspections
  const { data: inspectionsData } = await supabase
    .from("employee_inspections")
    .select("*")
    .eq("employee_id", employeeId)

  // Calculate points from inspections (first digit of percentage)
  if (inspectionsData) {
    console.log("[v0] Fiscalizações encontradas:", inspectionsData.length)
    inspectionsData.forEach((inspection: any) => {
      const score = inspection.pontuacao || 0
      const firstDigit = Math.floor(score / 10)
      totalPoints += firstDigit
      console.log(`[v0] Fiscalização ${score}%: +${firstDigit} pontos`)
    })
  }

  // Get all sanctions
  const { data: sanctionsData } = await supabase.from("employee_sanctions").select("*").eq("employee_id", employeeId)

  // Calculate points from sanctions
  if (sanctionsData) {
    console.log("[v0] Sanções encontradas:", sanctionsData.length)
    sanctionsData.forEach((sanction: any) => {
      const tipo = sanction.tipo?.toLowerCase() || ""
      console.log("[v0] Tipo de sanção:", tipo)
      if (tipo.includes("advertência") || tipo.includes("advertencia")) {
        totalPoints -= 10
        console.log("[v0] Advertência: -10 pontos")
      } else if (tipo.includes("suspensão de 1 dia") || tipo.includes("suspensao de 1 dia")) {
        totalPoints -= 20
        console.log("[v0] Suspensão 1 dia: -20 pontos")
      } else if (tipo.includes("suspensão de 3 dias") || tipo.includes("suspensao de 3 dias")) {
        totalPoints -= 30
        console.log("[v0] Suspensão 3 dias: -30 pontos")
      } else if (tipo.includes("suspensão de 5 dias") || tipo.includes("suspensao de 5 dias")) {
        totalPoints -= 50
        console.log("[v0] Suspensão 5 dias: -50 pontos")
      }
    })
  }

  // Get employee status
  const { data: employeeData } = await supabase
    .from("employees")
    .select("status, destaque_inicio")
    .eq("id", employeeId)
    .single()

  // Add points for "Destaque" status
  if (employeeData?.status === "Destaque" && employeeData?.destaque_inicio) {
    totalPoints += 10
    console.log("[v0] Status Destaque: +10 pontos")
  }

  console.log("[v0] Total de pontos calculado:", totalPoints)

  // Update employee points in database
  const { error } = await supabase
    .from("employees")
    .update({ points: totalPoints, updated_at: new Date().toISOString() })
    .eq("id", employeeId)

  if (error) {
    console.error("[v0] Erro ao atualizar pontos:", error)
    throw error
  }

  console.log("[v0] Pontos atualizados no banco de dados")

  return totalPoints
}

export const votacaoOperations = {
  async getCandidatosAtivos() {
    const supabase = createClient()
    const hoje = new Date()
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

    const { data, error } = await supabase
      .from("destaques_votacao")
      .select("*, employee:employees(nome, cargo, departamento)")
      .eq("mes_referencia", mesReferencia)
      .eq("ativo", true)
      .order("votos", { ascending: false })

    if (error) throw error
    return data || []
  },

  async adicionarCandidatos(funcionarioIds: string[]) {
    const supabase = createClient()
    const hoje = new Date()
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

    // Desativar votações anteriores do mês
    await supabase.from("destaques_votacao").update({ ativo: false }).eq("mes_referencia", mesReferencia)

    // Criar novos candidatos
    const candidatos = funcionarioIds.map((id) => ({
      employee_id: id,
      mes_referencia: mesReferencia,
      votos: 0,
      ativo: true,
    }))

    const { data, error } = await supabase
      .from("destaques_votacao")
      .insert(candidatos)
      .select("*, employee:employees(nome, cargo, departamento)")

    if (error) throw error
    return data
  },

  async removerCandidato(employeeId: string) {
    const supabase = createClient()
    const hoje = new Date()
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

    // Desativar candidato
    const { error } = await supabase
      .from("destaques_votacao")
      .update({ ativo: false })
      .eq("employee_id", employeeId)
      .eq("mes_referencia", mesReferencia)

    if (error) throw error
  },

  async votar(votacaoId: string, userIdentifier: string) {
    const supabase = createClient()

    // Verificar se já votou
    const { data: votoExistente } = await supabase
      .from("votos_destaque")
      .select("*")
      .eq("user_identifier", userIdentifier)
      .eq("votacao_id", votacaoId)
      .single()

    if (votoExistente) {
      throw new Error("Você já votou neste candidato")
    }

    // Registrar voto
    const { error: votoError } = await supabase
      .from("votos_destaque")
      .insert({ votacao_id: votacaoId, user_identifier: userIdentifier })

    if (votoError) throw votoError

    // Incrementar contador de votos
    const { error: updateError } = await supabase.rpc("increment_votos", { votacao_id: votacaoId })

    if (updateError) {
      // Fallback: incrementar manualmente
      const { data: votacao } = await supabase.from("destaques_votacao").select("votos").eq("id", votacaoId).single()

      if (votacao) {
        await supabase
          .from("destaques_votacao")
          .update({ votos: votacao.votos + 1 })
          .eq("id", votacaoId)
      }
    }
  },

  async verificarVoto(userIdentifier: string) {
    const supabase = createClient()
    const hoje = new Date()
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

    const { data } = await supabase
      .from("votos_destaque")
      .select("votacao_id, destaques_votacao!inner(mes_referencia)")
      .eq("user_identifier", userIdentifier)
      .eq("destaques_votacao.mes_referencia", mesReferencia)
      .single()

    return data?.votacao_id || null
  },

  async finalizarVotacao() {
    const supabase = createClient()
    const hoje = new Date()
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`

    // Buscar vencedor
    const { data: candidatos } = await supabase
      .from("destaques_votacao")
      .select("*")
      .eq("mes_referencia", mesReferencia)
      .eq("ativo", true)
      .order("votos", { ascending: false })
      .limit(1)

    if (!candidatos || candidatos.length === 0) {
      throw new Error("Nenhum candidato encontrado")
    }

    const vencedor = candidatos[0]

    // Atualizar status do funcionário para "Destaque"
    await employeeOperations.update(vencedor.employee_id, {
      status: "Destaque",
    })

    // Desativar votação
    await supabase.from("destaques_votacao").update({ ativo: false }).eq("mes_referencia", mesReferencia)

    return vencedor
  },
}

export const processoJuridicoOperations = {
  async getAtivos() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("processos_juridicos")
      .select("*, funcionario:employees(nome, cpf)")
      .order("ordem", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(processo: {
    funcionario_reclamante_id: string
    reclamadas: any[]
    data_audiencia: string
    hora_audiencia: string
    datas_adicionais?: any[]
    cidade: string
    tipo_audiencia: "presencial" | "distancia"
    link_audiencia?: string
    mensagem: string
    ordem: number
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("processos_juridicos").insert(processo).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("processos_juridicos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("processos_juridicos").delete().eq("id", id)

    if (error) throw error
  },

  async encerrar(id: string, valorFinalizacao: string) {
    const supabase = createClient()

    // Buscar processo
    const { data: processo } = await supabase.from("processos_juridicos").select("*").eq("id", id).single()

    if (!processo) throw new Error("Processo não encontrado")

    // Mover para processos encerrados
    const { error: insertError } = await supabase.from("processos_juridicos_encerrados").insert({
      funcionario_reclamante_id: processo.funcionario_reclamante_id,
      reclamadas: processo.reclamadas,
      data_audiencia: processo.data_audiencia,
      hora_audiencia: processo.hora_audiencia,
      datas_adicionais: processo.datas_adicionais,
      cidade: processo.cidade,
      tipo_audiencia: processo.tipo_audiencia,
      link_audiencia: processo.link_audiencia,
      mensagem: processo.mensagem,
      documentos: processo.documentos,
      valor_finalizacao: valorFinalizacao,
      data_encerramento: new Date().toISOString(),
    })

    if (insertError) throw insertError

    // Remover do ativo
    await this.delete(id)

    // Criar registro em data_entries
    await dataEntryOperations.create({
      type: "processos-juridicos" as any,
      date: new Date().toISOString().split("T")[0],
      value: Number.parseFloat(valorFinalizacao),
      description: `Processo encerrado - ${processo.reclamadas.map((r: any) => r.nome).join(", ")}`,
    })

    return processo
  },
}

export const enqueteOperations = {
  async getAtivas() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("enquetes")
      .select("*, alternativas:enquetes_alternativas(*)")
      .eq("ativa", true)
      .order("created_at", { ascending: false })

    if (error) throw error

    const hoje = new Date().toISOString().split("T")[0]
    const enquetesAtualizadas = []

    for (const enquete of data || []) {
      if (enquete.data_fim && enquete.data_fim < hoje) {
        // Enquete expirada, encerrar automaticamente
        await this.finalizar(enquete.id)
        enquete.ativa = false
      } else {
        enquetesAtualizadas.push(enquete)
      }
    }

    return enquetesAtualizadas
  },

  async create(enquete: { pergunta: string; alternativas: string[]; data_fim?: string }) {
    const supabase = createClient()

    // Criar enquete
    const { data: enqueteData, error: enqueteError } = await supabase
      .from("enquetes")
      .insert({
        pergunta: enquete.pergunta,
        ativa: true,
        data_fim: enquete.data_fim || null,
      })
      .select()
      .single()

    if (enqueteError) throw enqueteError

    // Criar alternativas
    const alternativas = enquete.alternativas.map((texto) => ({
      enquete_id: enqueteData.id,
      texto,
      votos: 0,
    }))

    const { error: alternativasError } = await supabase.from("enquetes_alternativas").insert(alternativas)

    if (alternativasError) throw alternativasError

    return enqueteData
  },

  async votar(enqueteId: string, alternativaId: string, userIdentifier: string) {
    const supabase = createClient()

    // Verificar se já votou
    const { data: votoExistente } = await supabase
      .from("enquetes_votos")
      .select("*")
      .eq("enquete_id", enqueteId)
      .eq("user_identifier", userIdentifier)
      .single()

    if (votoExistente) {
      throw new Error("Você já votou nesta enquete")
    }

    // Registrar voto
    const { error: votoError } = await supabase.from("enquetes_votos").insert({
      enquete_id: enqueteId,
      alternativa_id: alternativaId,
      user_identifier: userIdentifier,
    })

    if (votoError) throw votoError

    // Incrementar contador de votos
    const { data: alternativa } = await supabase
      .from("enquetes_alternativas")
      .select("votos")
      .eq("id", alternativaId)
      .single()

    if (alternativa) {
      await supabase
        .from("enquetes_alternativas")
        .update({ votos: alternativa.votos + 1 })
        .eq("id", alternativaId)
    }
  },

  async verificarVoto(enqueteId: string, userIdentifier: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from("enquetes_votos")
      .select("alternativa_id")
      .eq("enquete_id", enqueteId)
      .eq("user_identifier", userIdentifier)
      .single()

    return data?.alternativa_id || null
  },

  async finalizar(enqueteId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("enquetes")
      .update({ ativa: false, finalizada_em: new Date().toISOString() })
      .eq("id", enqueteId)

    if (error) throw error
  },

  async delete(enqueteId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("enquetes").delete().eq("id", enqueteId)

    if (error) throw error
  },
}

export const declaracaoOperations = {
  async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase.from("declaracoes").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(declaracao: {
    tipo: "sugestao" | "elogio" | "reclamacao" | "denuncia"
    data: string
    eh_colaborador: boolean
    quer_contato: boolean
    eh_anonimo: boolean
    nome?: string
    email?: string
    telefone?: string
    mensagem: string
  }) {
    const supabase = createClient()
    const { data, error } = await supabase.from("declaracoes").insert(declaracao).select().single()

    if (error) throw error
    return data
  },

  async update(
    id: string,
    updates: Partial<{
      status: "pendente" | "em_analise" | "resolvido"
      resposta?: string
      status_investigacao_iniciada?: boolean
      status_coleta_dados?: boolean
      status_resolucao?: boolean
      status_encerrada?: boolean
      resumo_caso?: string
      documentos?: any[]
      encerrado?: boolean
      data_encerramento?: string
    }>,
  ) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("declaracoes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async encerrar(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("declaracoes")
      .update({
        encerrado: true,
        data_encerramento: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async adicionarDocumento(id: string, documento: { nome: string; url: string; tamanho: string }) {
    const supabase = createClient()

    // Buscar documentos atuais
    const { data: declaracao } = await supabase.from("declaracoes").select("documentos").eq("id", id).single()

    const documentosAtuais = declaracao?.documentos || []
    const novosDocumentos = [...documentosAtuais, documento]

    const { data, error } = await supabase
      .from("declaracoes")
      .update({ documentos: novosDocumentos, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removerDocumento(id: string, documentoUrl: string) {
    const supabase = createClient()

    // Buscar documentos atuais
    const { data: declaracao } = await supabase.from("declaracoes").select("documentos").eq("id", id).single()

    const documentosAtuais = declaracao?.documentos || []
    const novosDocumentos = documentosAtuais.filter((doc: any) => doc.url !== documentoUrl)

    const { data, error } = await supabase
      .from("declaracoes")
      .update({ documentos: novosDocumentos, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("declaracoes").delete().eq("id", id)

    if (error) throw error
  },
}

export const processoChecklistOperations = {
  async getByProcessoId(processoId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("processo_checklist")
      .select("*")
      .eq("processo_id", processoId)
      .order("ordem", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(item: { processo_id: string; texto: string; ordem: number }) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("processo_checklist")
      .insert({
        processo_id: item.processo_id,
        texto: item.texto,
        concluido: false,
        ordem: item.ordem,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async toggle(id: string, concluido: boolean) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("processo_checklist")
      .update({ concluido, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("processo_checklist").delete().eq("id", id)

    if (error) throw error
  },

  async reorder(items: { id: string; ordem: number }[]) {
    const supabase = createClient()

    for (const item of items) {
      await supabase.from("processo_checklist").update({ ordem: item.ordem }).eq("id", item.id)
    }
  },
}
