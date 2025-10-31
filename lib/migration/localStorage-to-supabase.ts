import { createClient } from "@/lib/supabase/client"
import {
  employeeOperations,
  clientSupplierOperations,
  extraServiceOperations,
  dataEntryOperations,
  employeeRelatedOperations,
} from "@/lib/database/operations"

export class LocalStorageMigration {
  private supabase = createClient()

  private checkClient() {
    if (!this.supabase) {
      throw new Error("Supabase client not initialized. Check environment variables.")
    }
  }

  // Migrar funcionários
  async migrateFuncionarios() {
    try {
      this.checkClient()

      const funcionariosData = localStorage.getItem("sysathos_funcionarios")
      if (!funcionariosData) {
        console.log("[v0] Nenhum dado de funcionários encontrado no localStorage")
        return { success: true, migrated: 0 }
      }

      const funcionarios = JSON.parse(funcionariosData)
      let migrated = 0

      for (const func of funcionarios) {
        const cpfToUse =
          func.cpf && func.cpf.trim() !== ""
            ? func.cpf
            : `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Verificar se já existe no banco (só se tiver CPF real)
        if (func.cpf && func.cpf.trim() !== "") {
          const existing = await employeeOperations.getByCpf(func.cpf)
          if (existing) {
            console.log(`[v0] Funcionário ${func.nome} já existe no banco`)
            continue
          }
        }

        const employeeData = {
          // Campos básicos existentes
          nome: func.nome,
          cpf: cpfToUse,
          rg: func.rg || null,
          cargo: func.cargo,
          departamento: func.departamento,
          empresa: func.empresa || "GA SERVIÇOS",
          data_admissao: func.dataAdmissao && func.dataAdmissao.trim() !== "" ? func.dataAdmissao : null,
          data_nascimento: func.dataNascimento && func.dataNascimento.trim() !== "" ? func.dataNascimento : null,
          salario: func.salario ? Number.parseFloat(func.salario.replace(/[^\\d,]/g, "").replace(",", ".")) : null,
          telefone: func.telefone || null,
          email: func.email || null,
          endereco: func.endereco || null,
          observacoes: func.observacoes
            ? `${func.observacoes}${func.cpf && func.cpf.trim() === "" ? " (CPF pendente de cadastro)" : ""}`
            : func.cpf && func.cpf.trim() === ""
              ? "CPF pendente de cadastro"
              : null,
          status: func.status || "ativo",
          data_limite: func.dataLimite && func.dataLimite.trim() !== "" ? func.dataLimite : null,

          // Novos campos pessoais
          sexo: func.sexo || null,
          raca_cor: func.racaCor || null,
          nacionalidade: func.nacionalidade || null,
          nome_pai: func.nomePai || null,
          nome_mae: func.nomeMae || null,
          grau_instrucao: func.grauInstrucao || null,
          estado_civil: func.estadoCivil || null,
          nome_conjuge: func.nomeConjuge || null,

          // Novos campos de documentos
          rg_orgao_emissor: func.rgOrgaoEmissor || null,
          rg_uf: func.rgUf || null,
          rg_data_expedicao: func.rgDataExpedicao && func.rgDataExpedicao.trim() !== "" ? func.rgDataExpedicao : null,
          pis: func.pis || null,
          ctps_numero: func.ctpsNumero || null,
          ctps_serie: func.ctpsSerie || null,
          ctps_uf: func.ctpsUf || null,
          cnh_numero: func.cnhNumero || null,
          cnh_categoria: func.cnhCategoria || null,
          cnh_data_vencimento:
            func.cnhDataVencimento && func.cnhDataVencimento.trim() !== "" ? func.cnhDataVencimento : null,

          // Novos campos de endereço
          cep: func.cep || null,

          // Novos campos profissionais
          funcao: func.funcao || null,
          carga_horaria: func.cargaHoraria || null,
          horario_trabalho: func.horarioTrabalho || null,
          reemprego: func.reemprego || false,
          tipo_contrato: func.tipoContrato || null,

          // Vale transporte
          utiliza_vale_transporte: func.utilizaValeTransporte || false,
          quantidade_vale_transporte: func.quantidadeValeTransporte || null,
        }

        const newEmployee = await employeeOperations.create(employeeData)
        console.log(
          `[v0] Funcionário ${func.nome} migrado com sucesso${func.cpf && func.cpf.trim() === "" ? " (com CPF temporário)" : ""}`,
        )
        migrated++

        // Migrar dados relacionados
        await this.migrateEmployeeRelatedData(func, newEmployee.id)
      }

      return { success: true, migrated }
    } catch (error) {
      console.error("[v0] Erro na migração de funcionários:", error)
      return { success: false, error: error.message }
    }
  }

  // Migrar dados relacionados aos funcionários
  private async migrateEmployeeRelatedData(oldEmployee: any, newEmployeeId: string) {
    try {
      // Migrar dependentes
      const dependentesData = localStorage.getItem("sysathos_dependentes")
      if (dependentesData) {
        const dependentes = JSON.parse(dependentesData)
        const employeeDependents = dependentes.filter((dep: any) => dep.funcionarioId === oldEmployee.id)

        for (const dep of employeeDependents) {
          await employeeRelatedOperations.dependents.create({
            employee_id: newEmployeeId,
            nome: dep.nome,
            parentesco: dep.parentesco,
            data_nascimento: dep.dataNascimento && dep.dataNascimento.trim() !== "" ? dep.dataNascimento : null,
            cpf: dep.cpf || null,
          })
        }
      }

      // Migrar histórico
      const historicosData = localStorage.getItem("sysathos_historicos")
      if (historicosData) {
        const historicos = JSON.parse(historicosData)
        const employeeHistory = historicos.filter((hist: any) => hist.funcionarioId === oldEmployee.id)

        for (const hist of employeeHistory) {
          await employeeRelatedOperations.history.create({
            employee_id: newEmployeeId,
            tipo: hist.tipoEvento === "positivo" ? "positivo" : "negativo",
            descricao: hist.descricao || hist.tipoEvento,
            data: hist.dataEvento && hist.dataEvento.trim() !== "" ? hist.dataEvento : null,
          })
        }
      }

      // Migrar avaliações
      const avaliacoesData = localStorage.getItem("sysathos_avaliacoes")
      if (avaliacoesData) {
        const avaliacoes = JSON.parse(avaliacoesData)
        const employeeEvaluations = avaliacoes.filter((av: any) => av.funcionarioId === oldEmployee.id)

        for (const av of employeeEvaluations) {
          await employeeRelatedOperations.evaluations.create({
            employee_id: newEmployeeId,
            pontuacao: av.pontuacao || 0,
            data: av.data && av.data.trim() !== "" ? av.data : null,
            observacoes: av.observacoes || null,
          })
        }
      }

      // Migrar fiscalizações
      const fiscalizacoesData = localStorage.getItem("sysathos_fiscalizacoes")
      if (fiscalizacoesData) {
        const fiscalizacoes = JSON.parse(fiscalizacoesData)
        const employeeInspections = fiscalizacoes.filter((fisc: any) => fisc.funcionarioId === oldEmployee.id)

        for (const fisc of employeeInspections) {
          await employeeRelatedOperations.inspections.create({
            employee_id: newEmployeeId,
            pontuacao: fisc.pontuacao || 0,
            data: fisc.data && fisc.data.trim() !== "" ? fisc.data : null,
            observacoes: fisc.observacoes || null,
          })
        }
      }

      // Migrar sanções
      const sancoesData = localStorage.getItem("sysathos_sancoes")
      if (sancoesData) {
        const sancoes = JSON.parse(sancoesData)
        const employeeSanctions = sancoes.filter((sanc: any) => sanc.funcionarioId === oldEmployee.id)

        for (const sanc of employeeSanctions) {
          await employeeRelatedOperations.sanctions.create({
            employee_id: newEmployeeId,
            tipo: sanc.tipo,
            descricao: sanc.descricao,
            data: sanc.data && sanc.data.trim() !== "" ? sanc.data : null,
          })
        }
      }
    } catch (error) {
      console.error(`[v0] Erro ao migrar dados relacionados do funcionário ${oldEmployee.nome}:`, error)
    }
  }

  // Migrar clientes e fornecedores
  async migrateClientsSuppliers() {
    try {
      this.checkClient()

      const clientsData = localStorage.getItem("clients")
      if (!clientsData) {
        console.log("[v0] Nenhum dado de clientes/fornecedores encontrado no localStorage")
        return { success: true, migrated: 0 }
      }

      const clients = JSON.parse(clientsData)
      let migrated = 0

      for (const client of clients) {
        const clientData = {
          name: client.name,
          fantasy_name: client.fantasyName,
          legal_representative: client.legalRepresentative,
          legal_representative_cpf: client.legalRepresentativeCpf,
          type: client.type,
          document: client.document,
          email: client.email,
          phone: client.phone,
          address: client.address,
          city: client.city,
          state: client.state,
          zip_code: client.zipCode,
          notes: client.notes,
        }

        await clientSupplierOperations.create(clientData)
        console.log(`[v0] Cliente/Fornecedor ${client.name} migrado com sucesso`)
        migrated++
      }

      return { success: true, migrated }
    } catch (error) {
      console.error("[v0] Erro na migração de clientes/fornecedores:", error)
      return { success: false, error: error.message }
    }
  }

  // Migrar serviços extras
  async migrateExtraServices() {
    try {
      this.checkClient()

      const servicesData = localStorage.getItem("extraServices")
      if (!servicesData) {
        console.log("[v0] Nenhum dado de serviços extras encontrado no localStorage")
        return { success: true, migrated: 0 }
      }

      const services = JSON.parse(servicesData)
      let migrated = 0

      for (const service of services) {
        const serviceData = {
          executor_type: service.executorType,
          executor_name: service.executorName,
          service: service.service,
          location: service.location,
          supervisor: service.supervisor,
          date: service.date && service.date.trim() !== "" ? service.date : null,
          hours: service.hours,
          function: service.function,
          pix_key: service.pixKey,
        }

        await extraServiceOperations.create(serviceData)
        console.log(`[v0] Serviço extra de ${service.executorName} migrado com sucesso`)
        migrated++
      }

      return { success: true, migrated }
    } catch (error) {
      console.error("[v0] Erro na migração de serviços extras:", error)
      return { success: false, error: error.message }
    }
  }

  // Migrar dados financeiros
  async migrateDataEntries() {
    try {
      this.checkClient()

      const dataEntriesData = localStorage.getItem("dadosInfo")
      if (!dataEntriesData) {
        console.log("[v0] Nenhum dado financeiro encontrado no localStorage")
        return { success: true, migrated: 0 }
      }

      const entries = JSON.parse(dataEntriesData)
      let migrated = 0

      for (const entry of entries) {
        const entryData = {
          type: entry.type,
          date: entry.date && entry.date.trim() !== "" ? entry.date : null,
          value: entry.value,
          description: entry.description,
        }

        await dataEntryOperations.create(entryData)
        console.log(`[v0] Entrada de dados ${entry.type} migrada com sucesso`)
        migrated++
      }

      return { success: true, migrated }
    } catch (error) {
      console.error("[v0] Erro na migração de dados financeiros:", error)
      return { success: false, error: error.message }
    }
  }

  // Executar migração completa
  async migrateAll() {
    console.log("[v0] Iniciando migração completa do localStorage para Supabase...")

    const results = {
      funcionarios: await this.migrateFuncionarios(),
      clients: await this.migrateClientsSuppliers(),
      extraServices: await this.migrateExtraServices(),
      dataEntries: await this.migrateDataEntries(),
    }

    const totalMigrated = Object.values(results).reduce(
      (sum, result) => sum + (result.success ? result.migrated : 0),
      0,
    )

    console.log(`[v0] Migração concluída. Total de registros migrados: ${totalMigrated}`)

    return {
      success: Object.values(results).every((r) => r.success),
      results,
      totalMigrated,
    }
  }

  // Limpar localStorage após migração bem-sucedida
  async clearLocalStorageAfterMigration() {
    const keysToRemove = [
      "sysathos_funcionarios",
      "sysathos_dependentes",
      "sysathos_documentos",
      "sysathos_historicos",
      "sysathos_avaliacoes",
      "sysathos_fiscalizacoes",
      "sysathos_sancoes",
      "clients",
      "extraServices",
      "dadosInfo",
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      console.log(`[v0] Removido ${key} do localStorage`)
    })

    // Marcar migração como concluída
    localStorage.setItem("migration_completed", new Date().toISOString())
  }

  // Verificar se migração já foi executada
  static isMigrationCompleted(): boolean {
    return localStorage.getItem("migration_completed") !== null
  }
}

// Hook para usar a migração
export function useMigration() {
  const migration = new LocalStorageMigration()

  const runMigration = async () => {
    if (LocalStorageMigration.isMigrationCompleted()) {
      console.log("[v0] Migração já foi executada anteriormente")
      return { success: true, alreadyCompleted: true }
    }

    const result = await migration.migrateAll()

    if (result.success) {
      await migration.clearLocalStorageAfterMigration()
    }

    return result
  }

  return { runMigration, migration }
}
