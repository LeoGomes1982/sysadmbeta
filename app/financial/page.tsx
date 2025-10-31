import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { TrendingUp, FileText, CreditCard } from "lucide-react"

export default function FinancialPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
          <CardDescription>Gerenciamento financeiro completo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">Acesse relatórios financeiros, gerenciar pagamentos e recebimentos.</p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Card Fluxo de Caixa */}
            <Link href="/financial/cash-flow">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
                  </div>
                  <CardDescription>Registre entradas e saídas, contas a pagar e receber</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Placeholder para futuras funcionalidades */}
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Relatórios</CardTitle>
                </div>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Contas Bancárias</CardTitle>
                </div>
                <CardDescription>Em breve</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
