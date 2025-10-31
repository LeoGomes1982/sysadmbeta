"use client"

import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  BarChart3,
  HelpCircle,
  Menu,
  Settings,
  CreditCard,
  CalendarDays,
  Building2,
  Scale,
  Store,
  TrendingUp,
  Cloud,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import type React from "react"

interface MenuItem {
  name: string
  href: string
  items?: MenuItem[]
}

interface MenuGroup {
  title: string
  icon: React.ReactNode
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: "Dashboard",
    icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
    items: [],
  },
  {
    title: "Agenda Geral",
    icon: <CalendarDays className="h-5 w-5 text-green-400" />,
    items: [],
  },
  {
    title: "Drive",
    icon: <Cloud className="h-5 w-5 text-indigo-400" />,
    items: [],
  },
  {
    title: "Leis",
    icon: <Scale className="h-5 w-5 text-amber-400" />,
    items: [],
  },
  {
    title: "DP e RH",
    icon: <Users className="h-5 w-5 text-purple-400" />,
    items: [
      { name: "Funcionários", href: "/basics" },
      { name: "Gestão de Talentos", href: "/hr/talent-management" },
    ],
  },
  {
    title: "Gerência",
    icon: <Building2 className="h-5 w-5 text-orange-400" />,
    items: [
      { name: "Avaliação de desempenho", href: "/management/performance" },
      { name: "Cargos e Salários", href: "/management/positions" },
      { name: "Dados e informações", href: "/management/data-info" },
      { name: "Gráficos", href: "/management/graphics" },
      { name: "Logins", href: "/management/logins" },
    ],
  },
  {
    title: "Operações",
    icon: <FileText className="h-5 w-5 text-cyan-400" />,
    items: [
      { name: "Ata da supervisão", href: "/operations/supervision" },
      { name: "Fiscalizações", href: "/operations/inspections" },
      { name: "Sanções Disciplinares", href: "/operations/sanctions" },
      { name: "Serviços Extras", href: "/operations/extra-services" },
      { name: "Arquivo", href: "/operations/archive" },
    ],
  },
  {
    title: "Comercial",
    icon: <Store className="h-5 w-5 text-red-400" />,
    items: [
      { name: "Clientes e fornecedores", href: "/commercial/clients-suppliers" },
      { name: "Projetos", href: "/commercial/projetos" },
    ],
  },
  {
    title: "Mapeamento",
    icon: <BarChart3 className="h-5 w-5 text-violet-400" />,
    items: [{ name: "Mapeamento e movimentação interna", href: "/mapping/employee" }],
  },
  {
    title: "Financeiro",
    icon: <CreditCard className="h-5 w-5 text-emerald-400" />,
    items: [
      { name: "Fluxo de Caixa", href: "/financial/cash-flow" },
      { name: "Recibos", href: "/receipts" },
    ],
  },
  {
    title: "Utilitários",
    icon: <Settings className="h-5 w-5 text-gray-400" />,
    items: [
      {
        name: "Configurações",
        href: "/utilities/settings",
        items: [
          { name: "Tema de Cores", href: "/utilities/settings/theme" },
          { name: "Logo", href: "/utilities/settings/logo" },
          { name: "Descrição da Empresa", href: "/utilities/settings/company-description" },
        ],
      },
      { name: "Utilitários", href: "/utilities" },
    ],
  },
  {
    title: "Portal Jurídico",
    icon: <Scale className="h-5 w-5 text-pink-400" />,
    items: [],
  },
  {
    title: "Fale Conosco",
    icon: <MessageSquare className="h-5 w-5 text-teal-400" />,
    items: [],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const checkAlerts = () => {
      const alertsStatus = localStorage.getItem("hasActiveAlerts")
      if (alertsStatus) {
        setHasActiveAlerts(JSON.parse(alertsStatus))
      }
    }

    checkAlerts()
    const interval = setInterval(checkAlerts, 5000) // Verifica a cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  const toggleGroup = (path: string) => {
    setCollapsed((prev) => {
      const newState: Record<string, boolean> = {}
      // Fecha todos os outros grupos
      Object.keys(prev).forEach((key) => {
        if (key !== path) {
          newState[key] = false
        }
      })
      // Alterna o grupo atual
      newState[path] = !prev[path]
      return newState
    })
  }

  const isActive = (href: string) => pathname === href

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.items && item.items.length > 0
    const isGroupCollapsed = collapsed[item.href]
    const paddingLeft = `${depth * 16 + 16}px`

    const fontSize = depth === 0 ? "text-sm" : depth === 1 ? "text-xs" : "text-xs"

    return (
      <div key={item.href}>
        <div
          onClick={() => hasChildren && toggleGroup(item.href)}
          className={cn(
            "flex items-center gap-2 py-2 px-4 hover:bg-white/20 cursor-pointer text-white",
            fontSize,
            isActive(item.href) && "bg-white/15 font-medium text-white",
          )}
          style={{ paddingLeft }}
        >
          {hasChildren && (
            <ChevronRight className={cn("h-4 w-4 transition-transform text-white", isGroupCollapsed && "rotate-90")} />
          )}
          <Link href={item.href} className={cn("flex-1 text-white", fontSize)}>
            {item.name}
          </Link>
        </div>
        {hasChildren && isGroupCollapsed && (
          <div className="bg-black/20">{item.items.map((subItem) => renderMenuItem(subItem, depth + 1))}</div>
        )}
      </div>
    )
  }

  const copyPortalLink = async () => {
    const link = `${window.location.origin}/portal-admissao/externo`
    try {
      await navigator.clipboard.writeText(link)
      alert("Link copiado para a área de transferência!")
    } catch (err) {
      console.error("Erro ao copiar link:", err)
      alert("Erro ao copiar link. Tente novamente.")
    }
  }

  return (
    <div
      className={cn(
        "bg-[#2A3F54] text-white transition-all duration-300 h-screen overflow-y-auto flex flex-col scrollbar-hide",
        sidebarOpen ? "w-64" : "w-16",
      )}
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
      }}
    >
      <div className="flex h-14 items-center justify-between px-4 sticky top-0 bg-[#2A3F54] z-10 mb-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2 pl-2">
            <div className="h-10 w-10 rounded-full bg-white overflow-hidden flex items-center justify-center">
              <img src="/images/logo-ga-sidebar.jpeg" alt="Logo GA" className="h-9 w-9 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SysAthos</span>
              <span className="text-xs text-gray-400">Administração</span>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded p-1 hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <nav className="space-y-1 p-2">
          {menuGroups.map((group, index) => (
            <div key={group.title}>
              {group.title === "Portal Jurídico" && <div className="border-t border-white/20 my-4"></div>}

              {group.title === "Dashboard" ? (
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/dashboard") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="text-left text-white">{group.title}</span>
                      {hasActiveAlerts && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                    </div>
                  )}
                </Link>
              ) : group.title === "Agenda Geral" ? (
                <Link
                  href="/agenda"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/agenda") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && <span className="flex-1 text-left text-white">{group.title}</span>}
                </Link>
              ) : group.title === "Drive" ? (
                <Link
                  href="/arquivo-geral"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/arquivo-geral") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && <span className="flex-1 text-left text-white">{group.title}</span>}
                </Link>
              ) : group.title === "Leis" ? (
                <Link
                  href="/laws"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/laws") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && <span className="flex-1 text-left text-white">{group.title}</span>}
                </Link>
              ) : group.title === "Portal Jurídico" ? (
                <Link
                  href="/portal-admissao"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/portal-admissao") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && <span className="flex-1 text-left text-white">{group.title}</span>}
                </Link>
              ) : group.title === "Fale Conosco" ? (
                <Link
                  href="/fale-conosco"
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/20 text-white text-sm",
                    isActive("/fale-conosco") && "bg-white/15 text-white font-medium",
                  )}
                >
                  {group.icon}
                  {sidebarOpen && <span className="flex-1 text-left text-white">{group.title}</span>}
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2 hover:bg-white/30 text-white text-sm",
                      collapsed[group.title] && "bg-white/25 text-white font-medium",
                    )}
                  >
                    {group.icon}
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-white font-medium">{group.title}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform text-white",
                            collapsed[group.title] && "rotate-180",
                          )}
                        />
                      </>
                    )}
                  </button>
                  {collapsed[group.title] && sidebarOpen && (
                    <div className="bg-black/20">{group.items.map((item) => renderMenuItem(item))}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {sidebarOpen && (
        <div className="sticky bottom-0 bg-[#2A3F54] border-t border-white/10">
          <div className="p-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">Ajuda & Suporte</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
